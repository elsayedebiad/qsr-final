import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/lib/auth'
import ActivityTracker from '@/lib/activity-tracker'

const prisma = new PrismaClient()

// POST: إزالة سير ذاتية من صفحة معينة
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cvIds, salesPageId, reason } = body

    if (!cvIds || !Array.isArray(cvIds) || cvIds.length === 0) {
      return NextResponse.json(
        { error: 'معرفات السير الذاتية مطلوبة' },
        { status: 400 }
      )
    }

    if (!salesPageId) {
      return NextResponse.json(
        { error: 'معرف الصفحة مطلوب' },
        { status: 400 }
      )
    }

    // إزالة التوزيعات
    const result = await prisma.cVDistribution.updateMany({
      where: {
        cvId: { in: cvIds },
        salesPageId,
        isActive: true
      },
      data: {
        isActive: false,
        removedAt: new Date(),
        removedBy: user.id,
        notes: reason
      }
    })

    // تسجيل العملية
    await prisma.distributionLog.create({
      data: {
        action: 'BULK_REMOVED',
        salesPageId,
        cvIds,
        userId: user.id,
        count: result.count,
        details: { reason }
      }
    })

    // تحديث الإحصائيات
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.distributionStats.upsert({
      where: {
        salesPageId_date: {
          salesPageId,
          date: today
        }
      },
      update: {
        totalRemoved: { increment: result.count },
        activeCount: await prisma.cVDistribution.count({
          where: {
            salesPageId,
            isActive: true
          }
        })
      },
      create: {
        salesPageId,
        date: today,
        totalRemoved: result.count,
        activeCount: 0
      }
    })

    // تسجيل النشاط
    for (const cvId of cvIds) {
      const cv = await prisma.cV.findUnique({
        where: { id: cvId },
        select: { fullName: true }
      })
      
      await ActivityTracker.logActivity({
        userId: user.id,
        action: 'CV_REMOVED_FROM_PAGE',
        targetType: 'CV',
        targetId: cvId.toString(),
        targetName: cv?.fullName || 'غير معروف',
        description: `تم إزالة السيرة الذاتية من ${salesPageId}`,
        metadata: { salesPageId, reason },
        importance: 'medium'
      })
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `تم إزالة ${result.count} سيرة ذاتية من ${salesPageId}`
    })
  } catch (error) {
    console.error('Distribution remove error:', error)
    return NextResponse.json(
      { error: 'فشل إزالة السير الذاتية' },
      { status: 500 }
    )
  }
}
