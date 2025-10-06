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
    const limit = parseInt(searchParams.get('limit') || '20')
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

    // Get activities with pagination
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
      take: limit
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
            action: activity.action,
            description: activity.description,
            targetType: activity.targetType,
            targetId: activity.targetId,
            targetName: activity.targetName,
            userId: activity.userId,
            userName: activity.user?.name || 'مستخدم غير معروف',
            userEmail: activity.user?.email || '',
            ipAddress: activity.ipAddress,
            userAgent: activity.userAgent,
            metadata: activity.metadata && typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : null,
            createdAt: activity.createdAt.toISOString()
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

    // Format and return activities
    const formattedActivities = activities.map(activity => ({
      id: activity.id.toString(),
      action: activity.action,
      description: activity.description,
      targetType: activity.targetType,
      targetId: activity.targetId,
      targetName: activity.targetName,
      userId: activity.userId,
      userName: activity.user?.name || 'مستخدم غير معروف',
      userEmail: activity.user?.email || '',
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      metadata: activity.metadata && typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : null,
      createdAt: activity.createdAt.toISOString()
    }))

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
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
        targetId,
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