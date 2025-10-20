import { NextRequest, NextResponse } from 'next/server'
import { db, QueryOptimizer, withTransaction } from '@/lib/db-optimized'
import { CacheManager, RateLimiter } from '@/lib/redis'
import { JobQueue, JobType, JobPriority } from '@/lib/job-queue'
import { ImageOptimizer } from '@/lib/image-optimizer'
import { PERFORMANCE_CONFIG } from '@/config/performance.config'
import { CVStatus, Priority } from '@prisma/client'

// Optimized GET endpoint with caching and pagination
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitOk = await RateLimiter.checkLimit(
      `api:cvs:${ip}`,
      PERFORMANCE_CONFIG.rateLimit.endpoints.api.requests,
      PERFORMANCE_CONFIG.rateLimit.endpoints.api.window
    )
    
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    
    // Authentication
    const { validateAuthFromRequest } = await import('@/lib/middleware-auth')
    const authResult = await validateAuthFromRequest(request)
    
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    
    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '50'),
      PERFORMANCE_CONFIG.pagination.maxLimit
    )
    const status = url.searchParams.get('status') as CVStatus | null
    const nationality = url.searchParams.get('nationality')
    const search = url.searchParams.get('search')
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'
    const cursor = url.searchParams.get('cursor')
    
    // Build cache key
    const cacheKey = `cvs:${status || 'all'}:${nationality || 'all'}:${page}:${limit}:${sortBy}:${sortOrder}`
    
    // Try to get from cache
    const cached = await CacheManager.get(cacheKey)
    if (cached) {
      console.log(`Cache hit for CVs query: ${cacheKey}`)
      return NextResponse.json(cached)
    }
    
    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (nationality) where.nationality = nationality
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { fullNameArabic: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { referenceCode: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // Use cursor-based pagination for large datasets
    let result
    if (cursor && PERFORMANCE_CONFIG.pagination.cursorBased) {
      result = await QueryOptimizer.cursorPaginate(db.cV, {
        cursor: parseInt(cursor),
        limit,
        where,
        orderBy: { [sortBy]: sortOrder },
      })
    } else {
      // Use offset-based pagination
      result = await QueryOptimizer.paginate(db.cV, {
        page,
        limit,
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { name: true, email: true },
          },
          contract: true,
          booking: true,
        },
      })
    }
    
    // Cache the result
    await CacheManager.set(cacheKey, result, PERFORMANCE_CONFIG.redis.ttl.cv)
    
    // Add response headers
    const headers = new Headers()
    headers.set('X-Total-Count', String(result.total || 0))
    headers.set('X-Page', String(result.currentPage || page))
    headers.set('X-Cache', 'MISS')
    
    return NextResponse.json(result, { headers })
  } catch (error) {
    console.error('Error fetching CVs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CVs' },
      { status: 500 }
    )
  }
}

// Optimized POST endpoint with image processing and job queue
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitOk = await RateLimiter.checkLimit(
      `api:cvs:create:${ip}`,
      PERFORMANCE_CONFIG.rateLimit.endpoints.api.requests,
      PERFORMANCE_CONFIG.rateLimit.endpoints.api.window
    )
    
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    
    // Authentication
    const { validateAuthFromRequest } = await import('@/lib/middleware-auth')
    const authResult = await validateAuthFromRequest(request)
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    const body = await request.json()
    
    // Validate required fields
    if (!body.fullName) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }
    
    // Use transaction for data consistency
    const cv = await withTransaction(async (tx) => {
      // Create CV
      const newCv = await tx.cV.create({
        data: {
          ...body,
          status: CVStatus.NEW,
          priority: body.priority || Priority.MEDIUM,
          source: 'API',
          createdById: user.id,
          updatedById: user.id,
        },
      })
      
      // Generate reference code
      const referenceCode = `EA-${String(newCv.id).padStart(6, '0')}`
      
      // Update with reference code
      return await tx.cV.update({
        where: { id: newCv.id },
        data: { referenceCode },
        include: {
          createdBy: {
            select: { name: true, email: true },
          },
        },
      })
    })
    
    // Process profile image asynchronously if provided
    if (body.profileImage) {
      // Validate image
      const validation = await ImageOptimizer.validateImage(body.profileImage)
      
      if (!validation.valid) {
        // Log error but don't fail the CV creation
        console.error(`Invalid profile image for CV ${cv.id}: ${validation.error}`)
      } else {
        // Queue image optimization
        await JobQueue.addJob(
          JobType.IMAGE_OPTIMIZE,
          {
            cvId: cv.id,
            imageData: body.profileImage,
            operations: [
              { type: 'resize', options: { width: 400, height: 400 } },
              { type: 'format', options: { format: 'webp' } },
            ],
          },
          { priority: JobPriority.NORMAL }
        )
      }
    }
    
    // Clear cache
    await CacheManager.clearByPattern('cvs:*')
    await CacheManager.clearByPattern('stats:*')
    
    // Queue notification email
    await JobQueue.addJob(
      JobType.SEND_EMAIL,
      {
        to: user.email,
        subject: 'New CV Created',
        template: 'cv-created',
        data: {
          cvId: cv.id,
          fullName: cv.fullName,
          referenceCode: cv.referenceCode,
        },
      },
      { priority: JobPriority.LOW }
    )
    
    // Log activity asynchronously
    JobQueue.addJob(
      JobType.PROCESS_CV,
      {
        action: 'CREATE',
        cvId: cv.id,
        userId: user.id,
        metadata: { fullName: cv.fullName },
      },
      { priority: JobPriority.LOW }
    ).catch(console.error)
    
    return NextResponse.json({ cv }, { status: 201 })
  } catch (error) {
    console.error('Error creating CV:', error)
    return NextResponse.json(
      { error: 'Failed to create CV' },
      { status: 500 }
    )
  }
}

// Bulk operations endpoint
export async function PUT(request: NextRequest) {
  try {
    // Strict rate limiting for bulk operations
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitOk = await RateLimiter.checkLimit(
      `api:cvs:bulk:${ip}`,
      5, // Only 5 bulk operations per minute
      60
    )
    
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for bulk operations' },
        { status: 429 }
      )
    }
    
    // Authentication
    const { validateAuthFromRequest } = await import('@/lib/middleware-auth')
    const authResult = await validateAuthFromRequest(request)
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    const { operation, cvIds, data } = await request.json()
    
    // Validate bulk operation
    if (!cvIds || !Array.isArray(cvIds) || cvIds.length === 0) {
      return NextResponse.json(
        { error: 'CV IDs are required' },
        { status: 400 }
      )
    }
    
    if (cvIds.length > PERFORMANCE_CONFIG.database.maxBatchSize) {
      return NextResponse.json(
        { error: `Cannot process more than ${PERFORMANCE_CONFIG.database.maxBatchSize} CVs at once` },
        { status: 400 }
      )
    }
    
    // Queue bulk operation for background processing
    const jobId = await JobQueue.addJob(
      JobType.PROCESS_CV,
      {
        operation,
        cvIds,
        data,
        userId: user.id,
      },
      { priority: JobPriority.HIGH }
    )
    
    // Clear relevant caches
    await CacheManager.clearByPattern('cvs:*')
    await CacheManager.clearByPattern('stats:*')
    
    return NextResponse.json({
      message: 'Bulk operation queued successfully',
      jobId,
      count: cvIds.length,
    })
  } catch (error) {
    console.error('Error in bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    )
  }
}

// DELETE endpoint with cascade handling
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitOk = await RateLimiter.checkLimit(
      `api:cvs:delete:${ip}`,
      10,
      60
    )
    
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    
    // Authentication
    const { validateAuthFromRequest } = await import('@/lib/middleware-auth')
    const authResult = await validateAuthFromRequest(request)
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const url = new URL(request.url)
    const cvId = url.searchParams.get('id')
    
    if (!cvId) {
      return NextResponse.json(
        { error: 'CV ID is required' },
        { status: 400 }
      )
    }
    
    // Use transaction for cascade delete
    await withTransaction(async (tx) => {
      // Delete related records first
      await tx.booking.deleteMany({ where: { cvId: parseInt(cvId) } })
      await tx.contract.deleteMany({ where: { cvId: parseInt(cvId) } })
      await tx.cVVersion.deleteMany({ where: { cvId: parseInt(cvId) } })
      await tx.activityLog.deleteMany({ where: { cvId: parseInt(cvId) } })
      
      // Delete the CV
      await tx.cV.delete({ where: { id: parseInt(cvId) } })
    })
    
    // Clear caches
    await CacheManager.clearByPattern('cvs:*')
    await CacheManager.clearByPattern('stats:*')
    await CacheManager.del(`cv:${cvId}`)
    
    return NextResponse.json({ message: 'CV deleted successfully' })
  } catch (error) {
    console.error('Error deleting CV:', error)
    return NextResponse.json(
      { error: 'Failed to delete CV' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    // Simple health check
    await db.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}
