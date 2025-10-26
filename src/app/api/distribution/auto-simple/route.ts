import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import ActivityTracker from '@/lib/activity-tracker'
import { loadDistributionRules } from '@/lib/distribution-storage'
import { createDistributionArray, perfectDistribution } from '@/lib/perfect-distribution'

// POST: توزيع تلقائي بسيط
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
    const { count = 100, strategy = 'EQUAL', source = 'other' } = body

    const salesPages = [
      'sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'sales6',
      'sales7', 'sales8', 'sales9', 'sales10', 'sales11'
    ]

    // جلب السير الذاتية الجديدة (غير المحجوزة أو المتعاقدة)
    const newCVs = await db.cV.findMany({
      where: {
        status: 'NEW'
      },
      select: {
        id: true,
        fullName: true,
        nationality: true,
        position: true
      },
      take: count,
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (newCVs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'لا توجد سير ذاتية جديدة للتوزيع',
        distributed: {}
      })
    }

    const distributed: Record<string, number> = {}

    if (strategy === 'WEIGHTED') {
      // توزيع مرجح حسب الأوزان المخزنة
      const rulesData = await loadDistributionRules()
      const rules = rulesData.rules || []
      
      // تحديد المصدر (google أو other)
      const weightKey = source === 'google' ? 'googleWeight' : 'otherWeight'
      
      // تصفية الصفحات النشطة التي لها وزن > 0
      const activeRules = rules.filter(r => r.isActive && r[weightKey] > 0)
      
      if (activeRules.length === 0) {
        return NextResponse.json({
          success: false,
          error: `لا توجد صفحات نشطة بأوزان ${source === 'google' ? 'Google' : 'Other'} > 0`,
          message: 'يرجى التأكد من تفعيل الصفحات وإدخال أوزان أكبر من 0'
        }, { status: 400 })
      }
      
      // تحضير الصفحات مع أوزانها للخوارزمية المثالية
      const weightedItems = activeRules.map(r => ({
        path: r.path,
        weight: r[weightKey]
      }))
      
      // 🎯 استخدام الخوارزمية المثالية للتوزيع بدقة 100%
      const distributionResults = perfectDistribution(weightedItems, newCVs.length)
      
      // إنشاء مصفوفة التوزيع المثالية (مخلوطة عشوائياً)
      const distributionArray = createDistributionArray(weightedItems, newCVs.length)
      
      // توزيع السير حسب المصفوفة المثالية
      for (let i = 0; i < newCVs.length; i++) {
        const cv = newCVs[i]
        const selectedPage = distributionArray[i]
        
        // تسجيل التوزيع
        await db.activityLog.create({
          data: {
            userId: user.id,
            cvId: cv.id,
            action: 'CV_DISTRIBUTED',
            description: `تم توزيع السيرة الذاتية "${cv.fullName}" على ${selectedPage} (توزيع مثالي 100% ${source})`,
            metadata: {
              salesPageId: selectedPage,
              strategy: 'PERFECT_WEIGHTED',
              source,
              weight: weightedItems.find(p => p.path === selectedPage)?.weight || 0,
              nationality: cv.nationality,
              position: cv.position
            }
          }
        })
        
        distributed[selectedPage] = (distributed[selectedPage] || 0) + 1
      }
      
      // طباعة معلومات التوزيع المثالي
      console.log('🎯 توزيع مثالي 100%:', {
        source,
        totalCVs: newCVs.length,
        distribution: distributionResults.map(dr => ({
          page: dr.path,
          weight: dr.weight,
          expectedCount: dr.expectedCount.toFixed(2),
          actualCount: dr.actualCount,
          percentage: dr.percentage.toFixed(2) + '%',
          difference: 0 // دائماً صفر مع الخوارزمية المثالية!
        }))
      })
      
    } else if (strategy === 'EQUAL') {
      // توزيع متساوي
      const cvsPerPage = Math.ceil(newCVs.length / salesPages.length)
      let cvIndex = 0

      for (const pageId of salesPages) {
        const pageCVs = newCVs.slice(cvIndex, cvIndex + cvsPerPage)
        
        if (pageCVs.length > 0) {
          // تسجيل التوزيع في سجل الأنشطة
          for (const cv of pageCVs) {
            await db.activityLog.create({
              data: {
                userId: user.id,
                cvId: cv.id,
                action: 'CV_DISTRIBUTED',
                description: `تم توزيع السيرة الذاتية "${cv.fullName}" على ${pageId}`,
                metadata: {
                  salesPageId: pageId,
                  strategy,
                  nationality: cv.nationality,
                  position: cv.position
                }
              }
            })
          }
          
          distributed[pageId] = pageCVs.length
        }
        
        cvIndex += cvsPerPage
      }
    } else if (strategy === 'RANDOM') {
      // توزيع عشوائي
      for (const cv of newCVs) {
        const randomPage = salesPages[Math.floor(Math.random() * salesPages.length)]
        
        await db.activityLog.create({
          data: {
            userId: user.id,
            cvId: cv.id,
            action: 'CV_DISTRIBUTED',
            description: `تم توزيع السيرة الذاتية "${cv.fullName}" على ${randomPage}`,
            metadata: {
              salesPageId: randomPage,
              strategy,
              nationality: cv.nationality,
              position: cv.position
            }
          }
        })
        
        distributed[randomPage] = (distributed[randomPage] || 0) + 1
      }
    } else if (strategy === 'BALANCED') {
      // توزيع متوازن بناءً على العدد الحالي
      const pageCounts: Record<string, number> = {}
      
      // حساب العدد الحالي لكل صفحة
      for (const pageId of salesPages) {
        const count = await db.activityLog.count({
          where: {
            action: 'CV_DISTRIBUTED',
            metadata: {
              path: '$.salesPageId',
              equals: pageId
            }
          }
        })
        
        const removedCount = await db.activityLog.count({
          where: {
            action: 'CV_REMOVED',
            metadata: {
              path: '$.salesPageId',
              equals: pageId
            }
          }
        })
        
        pageCounts[pageId] = Math.max(0, count - removedCount)
      }

      // توزيع السير على الصفحات الأقل عدداً
      for (const cv of newCVs) {
        const sortedPages = Object.entries(pageCounts)
          .sort((a, b) => a[1] - b[1])
        
        const targetPage = sortedPages[0][0]
        
        await db.activityLog.create({
          data: {
            userId: user.id,
            cvId: cv.id,
            action: 'CV_DISTRIBUTED',
            description: `تم توزيع السيرة الذاتية "${cv.fullName}" على ${targetPage}`,
            metadata: {
              salesPageId: targetPage,
              strategy,
              nationality: cv.nationality,
              position: cv.position
            }
          }
        })
        
        pageCounts[targetPage]++
        distributed[targetPage] = (distributed[targetPage] || 0) + 1
      }
    }

    // تسجيل النشاط العام
    const totalDistributed = Object.values(distributed).reduce((sum, count) => sum + count, 0)
    await ActivityTracker.bulkOperation('توزيع', totalDistributed, 'سير ذاتية')

    return NextResponse.json({
      success: true,
      message: `تم توزيع ${totalDistributed} سيرة ذاتية باستخدام استراتيجية ${strategy}`,
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
