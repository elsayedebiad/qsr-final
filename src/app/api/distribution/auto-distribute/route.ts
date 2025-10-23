import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/lib/auth'
import ActivityTracker from '@/lib/activity-tracker'

const prisma = new PrismaClient()

// POST: توزيع تلقائي للسير الذاتية
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
    const { count = 100, strategy = 'EQUAL' } = body

    // جلب القواعد النشطة
    const activeRules = await prisma.distributionRule.findMany({
      where: {
        isActive: true,
        autoDistribute: true
      },
      orderBy: { priority: 'desc' }
    })

    if (activeRules.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد صفحات مفعلة للتوزيع التلقائي' },
        { status: 400 }
      )
    }

    // جلب السير الغير موزعة
    const unassignedCVs = await prisma.cV.findMany({
      where: {
        status: 'NEW',
        distributions: {
          none: { isActive: true }
        }
      },
      select: {
        id: true,
        nationality: true,
        position: true
      },
      take: count
    })

    if (unassignedCVs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'لا توجد سير ذاتية جديدة للتوزيع',
        distributed: {}
      })
    }

    const distributed: Record<string, number> = {}

    if (strategy === 'EQUAL') {
      // توزيع متساوي
      const cvsPerPage = Math.ceil(unassignedCVs.length / activeRules.length)
      let cvIndex = 0

      for (const rule of activeRules) {
        const pageCVs = unassignedCVs.slice(cvIndex, cvIndex + cvsPerPage)
        
        if (pageCVs.length > 0) {
          // التحقق من الحدود
          const currentCount = await prisma.cVDistribution.count({
            where: {
              salesPageId: rule.salesPageId,
              isActive: true
            }
          })

          let toAssign = pageCVs
          
          if (rule.totalLimit && currentCount + pageCVs.length > rule.totalLimit) {
            toAssign = pageCVs.slice(0, rule.totalLimit - currentCount)
          }

          if (toAssign.length > 0) {
            await prisma.cVDistribution.createMany({
              data: toAssign.map(cv => ({
                cvId: cv.id,
                salesPageId: rule.salesPageId,
                assignedBy: user.id,
                notes: 'توزيع تلقائي'
              }))
            })

            distributed[rule.salesPageId] = toAssign.length
          }
        }
        
        cvIndex += cvsPerPage
      }
    } else if (strategy === 'PRIORITY') {
      // توزيع حسب الأولوية
      for (const cv of unassignedCVs) {
        for (const rule of activeRules) {
          // فحص الشروط الخاصة
          if (rule.nationality && cv.nationality !== rule.nationality) continue
          if (rule.position && !cv.position?.includes(rule.position)) continue

          // التحقق من الحدود
          const currentCount = await prisma.cVDistribution.count({
            where: {
              salesPageId: rule.salesPageId,
              isActive: true
            }
          })

          if (rule.totalLimit && currentCount >= rule.totalLimit) continue

          if (rule.dailyLimit) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            const todayCount = await prisma.cVDistribution.count({
              where: {
                salesPageId: rule.salesPageId,
                assignedAt: { gte: today },
                isActive: true
              }
            })

            if (todayCount >= rule.dailyLimit) continue
          }

          // توزيع السيرة
          await prisma.cVDistribution.create({
            data: {
              cvId: cv.id,
              salesPageId: rule.salesPageId,
              assignedBy: user.id,
              notes: 'توزيع تلقائي'
            }
          })

          distributed[rule.salesPageId] = (distributed[rule.salesPageId] || 0) + 1
          assigned = true
          break
        }
      }
    } else if (strategy === 'BALANCED') {
      // توزيع متوازن حسب الحمل الحالي
      const pageCounts = await Promise.all(
        activeRules.map(async (rule) => ({
          salesPageId: rule.salesPageId,
          rule,
          count: await prisma.cVDistribution.count({
            where: {
              salesPageId: rule.salesPageId,
              isActive: true
            }
          })
        }))
      )

      for (const cv of unassignedCVs) {
        // ترتيب الصفحات حسب الحمل الأقل
        pageCounts.sort((a, b) => a.count - b.count)
        
        for (const pageData of pageCounts) {
          const rule = pageData.rule

          // فحص الشروط
          if (rule.nationality && cv.nationality !== rule.nationality) continue
          if (rule.position && !cv.position?.includes(rule.position)) continue
          if (rule.totalLimit && pageData.count >= rule.totalLimit) continue

          // التحقق من الحد اليومي
          if (rule.dailyLimit) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            const todayCount = await prisma.cVDistribution.count({
              where: {
                salesPageId: rule.salesPageId,
                assignedAt: { gte: today },
                isActive: true
              }
            })

            if (todayCount >= rule.dailyLimit) continue
          }

          // توزيع السيرة
          await prisma.cVDistribution.create({
            data: {
              cvId: cv.id,
              salesPageId: rule.salesPageId,
              assignedBy: user.id,
              notes: 'توزيع تلقائي متوازن'
            }
          })

          pageData.count++
          distributed[rule.salesPageId] = (distributed[rule.salesPageId] || 0) + 1
          break
        }
      }
    }

    // تسجيل العملية
    const totalDistributed = Object.values(distributed).reduce((sum, count) => sum + count, 0)
    
    await prisma.distributionLog.create({
      data: {
        action: 'AUTO_DISTRIBUTION',
        salesPageId: 'ALL',
        cvIds: unassignedCVs.slice(0, totalDistributed).map(cv => cv.id),
        userId: user.id,
        count: totalDistributed,
        details: { strategy, distributed }
      }
    })

    // تحديث الإحصائيات
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const [pageId, count] of Object.entries(distributed)) {
      await prisma.distributionStats.upsert({
        where: {
          salesPageId_date: {
            salesPageId: pageId,
            date: today
          }
        },
        update: {
          totalAssigned: { increment: count },
          activeCount: await prisma.cVDistribution.count({
            where: {
              salesPageId: pageId,
              isActive: true
            }
          })
        },
        create: {
          salesPageId: pageId,
          date: today,
          totalAssigned: count,
          activeCount: count
        }
      })
    }

    // تسجيل النشاط
    await ActivityTracker.logActivity({
      userId: user.id,
      action: 'CV_DISTRIBUTED',
      targetType: 'SYSTEM',
      targetId: 'AUTO_DISTRIBUTION',
      targetName: 'توزيع تلقائي',
      description: `تم توزيع ${totalDistributed} سيرة ذاتية تلقائياً باستخدام استراتيجية ${strategy}`,
      metadata: { strategy, distributed },
      importance: 'high'
    })

    return NextResponse.json({
      success: true,
      message: `تم توزيع ${totalDistributed} سيرة ذاتية تلقائياً`,
      distributed,
      strategy
    })
  } catch (error) {
    console.error('Auto distribution error:', error)
    return NextResponse.json(
      { error: 'فشل التوزيع التلقائي' },
      { status: 500 }
    )
  }
}
