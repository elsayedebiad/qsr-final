import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDistributionRules() {
  console.log('🔄 إعادة ضبط قواعد التوزيع إلى 100%...')

  try {
    const salesPages = [
      'sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'sales6',
      'sales7', 'sales8', 'sales9', 'sales10', 'sales11'
    ]

    // القواعد الافتراضية - توزيع متساوي = 100%
    const defaultWeights: Record<string, { google: number, other: number }> = {
      'sales1': { google: 9.09, other: 9.09 },   // ~9%
      'sales2': { google: 9.09, other: 9.09 },   // ~9%
      'sales3': { google: 9.09, other: 9.09 },   // ~9%
      'sales4': { google: 9.09, other: 9.09 },   // ~9%
      'sales5': { google: 9.09, other: 9.09 },   // ~9%
      'sales6': { google: 9.09, other: 9.09 },   // ~9%
      'sales7': { google: 9.09, other: 9.09 },   // ~9%
      'sales8': { google: 9.09, other: 9.09 },   // ~9%
      'sales9': { google: 9.09, other: 9.09 },   // ~9%
      'sales10': { google: 9.09, other: 9.09 },  // ~9%
      'sales11': { google: 9.01, other: 9.01 }   // ~9% (مع تعديل للوصول لـ 100%)
    }

    let updatedCount = 0

    for (const pageId of salesPages) {
      await prisma.distributionRule.upsert({
        where: { salesPageId: pageId },
        update: {
          googleWeight: defaultWeights[pageId].google,
          otherWeight: defaultWeights[pageId].other,
          isActive: true
        },
        create: {
          salesPageId: pageId,
          googleWeight: defaultWeights[pageId].google,
          otherWeight: defaultWeights[pageId].other,
          isActive: true,
          dailyLimit: null,
          totalLimit: null,
          minCVs: 0,
          maxCVs: null,
          priority: salesPages.length - salesPages.indexOf(pageId),
          autoDistribute: false
        }
      })
      updatedCount++
      console.log(`✅ ${pageId}: Google=${defaultWeights[pageId].google}%, Other=${defaultWeights[pageId].other}%`)
    }

    // حساب المجموع للتأكيد
    const allRules = await prisma.distributionRule.findMany({
      where: { isActive: true }
    })
    
    const googleTotal = allRules.reduce((sum, r) => sum + r.googleWeight, 0)
    const otherTotal = allRules.reduce((sum, r) => sum + r.otherWeight, 0)

    console.log(`\n📊 النتيجة النهائية:`)
    console.log(`   - تم تحديث ${updatedCount} صفحة`)
    console.log(`   - إجمالي Google: ${googleTotal.toFixed(2)}%`)
    console.log(`   - إجمالي Other: ${otherTotal.toFixed(2)}%`)
    
    if (Math.abs(googleTotal - 100) < 0.1 && Math.abs(otherTotal - 100) < 0.1) {
      console.log(`\n✅ ممتاز! المجموع = 100% بالضبط`)
    } else {
      console.log(`\n⚠️ تحذير: المجموع ليس 100% بالضبط`)
    }

  } catch (error) {
    console.error('❌ خطأ في إعادة الضبط:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetDistributionRules()
