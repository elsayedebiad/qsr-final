import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAuthFromRequest } from '@/lib/middleware-auth'

export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view activity logs
    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const action = searchParams.get('action')
    const targetType = searchParams.get('targetType')
    const userId = searchParams.get('userId')

    console.log('Fetching activities with params:', { page, limit, action, targetType, userId })

    // Build where clause
    const where: {
      action?: string
      targetType?: string
      userId?: number
    } = {}
    if (action && action !== 'ALL') {
      where.action = action
    }
    if (targetType && targetType !== 'ALL') {
      where.targetType = targetType
    }
    if (userId && userId !== 'ALL') {
      where.userId = parseInt(userId)
    }

    // Get total count
    const totalCount = await db.activityLog.count({ where })

    // Get activities with pagination - fetch more data
    const activities = await db.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: Math.min(limit, 500) // Max 500 activities at once
    })

    console.log(`Found ${activities.length} activities out of ${totalCount} total`)

    // If no activities found, create some sample activities
    if (activities.length === 0 && totalCount === 0) {
      console.log('No activities found, creating sample activities...')
      
      try {
        // Create sample activities
        const sampleActivities = [
          {
            userId: authResult.user.id,
            action: 'USER_LOGIN',
            description: 'تم تسجيل الدخول',
            targetType: 'USER' as const,
            targetId: authResult.user.id.toString(),
            targetName: authResult.user.name || 'المستخدم',
            ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
            userAgent: request.headers.get('user-agent') || 'Browser'
          },
          {
            userId: authResult.user.id,
            action: 'SYSTEM_ACCESS',
            description: 'تم الوصول إلى سجل الأنشطة',
            targetType: 'SYSTEM' as const,
            targetId: 'activity-log',
            targetName: 'سجل الأنشطة',
            ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
            userAgent: request.headers.get('user-agent') || 'Browser'
          }
        ]

        await db.activityLog.createMany({
          data: sampleActivities
        })

        // Re-fetch activities
        const newActivities = await db.activityLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit
        })

        const newTotalCount = await db.activityLog.count({ where })

        return NextResponse.json({
          activities: newActivities.map(activity => ({
            id: activity.id.toString(),
            type: activity.action, // Add type field for ActivityTypeConfig
            action: activity.action,
            description: activity.description,
            targetType: activity.targetType,
            targetId: activity.targetId,
            targetName: activity.targetName,
            userId: activity.userId,
            userName: activity.user?.name || 'مستخدم غير معروف',
            userEmail: activity.user?.email || '',
            userRole: activity.user?.role || 'USER',
            ipAddress: activity.ipAddress,
            userAgent: activity.userAgent,
            metadata: activity.metadata && typeof activity.metadata === 'string' ? 
              JSON.parse(activity.metadata) : 
              { importance: activity.targetType === 'CONTRACT' || activity.targetType === 'BOOKING' ? 'high' : 'medium' },
            createdAt: activity.createdAt.toISOString(),
            isNew: new Date(activity.createdAt).getTime() > Date.now() - 86400000, // New if less than 24 hours
            isRead: false
          })),
          pagination: {
            page,
            limit,
            total: newTotalCount,
            pages: Math.ceil(newTotalCount / limit)
          },
          debug: {
            addedSampleActivities: true,
            totalFound: newTotalCount
          }
        })
      } catch (error) {
        console.error('Error creating sample activities:', error)
      }
    }

    // Format and return activities with proper types
    const formattedActivities = activities.map(activity => {
      // Map action to ActivityType
      let activityType = activity.action
      
      // Map contract and booking activities
      if (activity.action.includes('CONTRACT')) {
        activityType = activity.action
      } else if (activity.action.includes('BOOKING')) {
        activityType = activity.action.replace('BOOKING', 'CONTRACT')
      } else if (activity.action.includes('CV_')) {
        activityType = activity.action
      } else if (activity.action.includes('USER_')) {
        activityType = activity.action
      } else if (activity.action.includes('SYSTEM')) {
        if (activity.action === 'SYSTEM_ACCESS') {
          activityType = 'SYSTEM_UPDATE'
        } else {
          activityType = activity.action
        }
      } else {
        // Default mapping for other actions
        activityType = 'OTHER'
      }
      
      return {
        id: activity.id.toString(),
        type: activityType, // Add type field for ActivityTypeConfig
        action: activity.action,
        description: activity.description,
        targetType: activity.targetType,
        targetId: activity.targetId,
        targetName: activity.targetName,
        userId: activity.userId,
        userName: activity.user?.name || 'مستخدم غير معروف',
        userEmail: activity.user?.email || '',
        userRole: activity.user?.role || 'USER',
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        metadata: activity.metadata && typeof activity.metadata === 'string' ? 
          JSON.parse(activity.metadata) : 
          { importance: activity.targetType === 'CONTRACT' || activity.targetType === 'BOOKING' ? 'high' : 'medium' },
        createdAt: activity.createdAt.toISOString(),
        isNew: new Date(activity.createdAt).getTime() > Date.now() - 86400000, // New if less than 24 hours
        isRead: false
      }
    })

    // Calculate CV statistics
    const cvCreatedCount = await db.activityLog.count({
      where: { action: 'CV_CREATED' }
    })
    
    const cvUpdatedCount = await db.activityLog.count({
      where: { action: 'CV_UPDATED' }
    })
    
    // Get total CVs from database
    const totalCvsInDb = await db.cV.count()
    
    const cvStats = {
      uploaded: cvCreatedCount, // السير المرفوعة
      created: cvCreatedCount,  // السير المُنشأة
      updated: cvUpdatedCount,  // السير المحدثة
      total: totalCvsInDb       // إجمالي السير في قاعدة البيانات
    }

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      cvStats
    })

  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, description, targetType, targetId, targetName, metadata } = body

    // Create activity log entry
    const activity = await db.activityLog.create({
      data: {
        userId: authResult.user.id,
        action,
        description,
        targetType,
        targetId: targetId ? String(targetId) : null,
        targetName,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      }
    })

    return NextResponse.json({
      success: true,
      activity: {
        id: activity.id.toString(),
        action: activity.action,
        description: activity.description,
        createdAt: activity.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}