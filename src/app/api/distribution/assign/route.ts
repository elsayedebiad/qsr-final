import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import ActivityTracker from '@/lib/activity-tracker'
import { db } from '@/lib/db'

// POST: توزيع سير ذاتية على صفحة معينة
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
    const { cvIds, salesPageId, notes } = body

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

    // التحقق من القواعد
    const rule = await db.distributionRule.findUnique({
      where: { salesPageId }
    })

    if (rule && !rule.isActive) {
      return NextResponse.json(
        { error: 'صفحة المبيعات غير نشطة للتوزيع' },
        { status: 400 }
      )
    }

    // التحقق من الحد اليومي
    if (rule?.dailyLimit) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayCount = await db.cVDistribution.count({
        where: {
          salesPageId,
          assignedAt: { gte: today },
          isActive: true
        }
      })

      if (todayCount + cvIds.length > rule.dailyLimit) {
        return NextResponse.json(
          { error: `تجاوز الحد اليومي (${rule.dailyLimit})` },
          { status: 400 }
        )
      }
    }

    // التحقق من الحد الكلي
    if (rule?.totalLimit) {
      const currentCount = await db.cVDistribution.count({
        where: {
          salesPageId,
          isActive: true
        }
      })

      if (currentCount + cvIds.length > rule.totalLimit) {
        return NextResponse.json(
          { error: `تجاوز الحد الكلي (${rule.totalLimit})` },
          { status: 400 }
        )
      }
    }

    // إلغاء أي توزيعات سابقة نشطة لنفس السير
    await db.cVDistribution.updateMany({
      where: {
        cvId: { in: cvIds },
        isActive: true
      },
      data: {
        isActive: false,
        removedAt: new Date(),
        removedBy: user.id
      }
    })

    // إنشاء توزيعات جديدة
    const distributions = await db.cVDistribution.createMany({
      data: cvIds.map(cvId => ({
        cvId,
        salesPageId,
        assignedBy: user.id,
        notes,
        isActive: true
      }))
    })

    // تسجيل العملية
    await db.distributionLog.create({
      data: {
        action: 'BULK_ASSIGNED',
        salesPageId,
        cvIds,
        userId: user.id,
        count: cvIds.length,
        details: { notes }
      }
    })

    // تحديث الإحصائيات
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await db.distributionStats.upsert({
      where: {
        salesPageId_date: {
          salesPageId,
          date: today
        }
      },
      update: {
        totalAssigned: { increment: cvIds.length },
        activeCount: await db.cVDistribution.count({
          where: {
            salesPageId,
            isActive: true
          }
        })
      },
      create: {
        salesPageId,
        date: today,
        totalAssigned: cvIds.length,
        activeCount: cvIds.length
      }
    })

    // تسجيل النشاط
    await ActivityTracker.bulkOperation('توزيع', cvIds.length, 'سير ذاتية')

    return NextResponse.json({
      success: true,
      count: distributions.count,
      message: `تم توزيع ${cvIds.length} سيرة ذاتية على ${salesPageId}`
    })
  } catch (error) {
    console.error('Distribution assign error:', error)
    return NextResponse.json(
      { error: 'فشل توزيع السير الذاتية' },
      { status: 500 }
    )
  }
}
