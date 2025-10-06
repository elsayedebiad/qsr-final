import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const targetType = searchParams.get('targetType')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const dateRange = searchParams.get('dateRange')

    // Build where clause
    const where: Prisma.ActivityLogWhereInput = {}

    // Search filter
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { targetName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Action filter
    if (action && action !== 'ALL') {
      where.action = action
    }

    // User filter
    if (userId && userId !== 'ALL') {
      where.userId = parseInt(userId)
    }

    // Target type filter
    if (targetType && targetType !== 'ALL') {
      where.targetType = targetType
    }

    // Date filters
    const now = new Date()
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    } else if (dateRange && dateRange !== 'ALL') {
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)
      
      switch (dateRange) {
        case 'TODAY':
          const startOfDay = new Date(now)
          startOfDay.setHours(0, 0, 0, 0)
          where.createdAt = { gte: startOfDay, lte: endOfDay }
          break
        case 'YESTERDAY':
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          const startOfYesterday = new Date(yesterday)
          startOfYesterday.setHours(0, 0, 0, 0)
          const endOfYesterday = new Date(yesterday)
          endOfYesterday.setHours(23, 59, 59, 999)
          where.createdAt = { gte: startOfYesterday, lte: endOfYesterday }
          break
        case 'WEEK':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          where.createdAt = { gte: weekAgo, lte: endOfDay }
          break
        case 'MONTH':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          where.createdAt = { gte: monthAgo, lte: endOfDay }
          break
        case 'LAST_3_MONTHS':
          const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          where.createdAt = { gte: threeMonthsAgo, lte: endOfDay }
          break
      }
    }

    // Month filter
    if (month && month !== 'ALL') {
      const monthInt = parseInt(month)
      const yearInt = year && year !== 'ALL' ? parseInt(year) : now.getFullYear()
      const startOfMonth = new Date(yearInt, monthInt, 1)
      const endOfMonth = new Date(yearInt, monthInt + 1, 0, 23, 59, 59, 999)
      
      where.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth
      }
    } else if (year && year !== 'ALL') {
      // Year filter only
      const yearInt = parseInt(year)
      const startOfYear = new Date(yearInt, 0, 1)
      const endOfYear = new Date(yearInt, 11, 31, 23, 59, 59, 999)
      
      where.createdAt = {
        gte: startOfYear,
        lte: endOfYear
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count
    const total = await db.activityLog.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Get activities with user info
    const activities = await db.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Calculate CV statistics
    const cvStats = {
      uploaded: await db.activityLog.count({
        where: { action: 'CV_CREATED' }
      }),
      created: await db.activityLog.count({
        where: { action: 'CV_CREATED' }
      }),
      updated: await db.activityLog.count({
        where: { action: 'CV_UPDATED' }
      })
    }

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.id.toString(),
      action: activity.action,
      description: activity.description,
      userId: activity.userId.toString(),
      userName: activity.user.name,
      userEmail: activity.user.email,
      targetType: activity.targetType || 'SYSTEM',
      targetId: activity.targetId || undefined,
      targetName: activity.targetName || undefined,
      metadata: activity.metadata || undefined,
      ipAddress: activity.ipAddress || undefined,
      userAgent: activity.userAgent || undefined,
      createdAt: activity.createdAt.toISOString()
    }))

    return NextResponse.json({
      activities: formattedActivities,
      cvStats,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      totalPages
    })

  } catch (error) {
    console.error('Error fetching activity log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    )
  }
}