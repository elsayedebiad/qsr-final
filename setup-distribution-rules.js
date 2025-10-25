// Script لإعداد قواعد التوزيع: فقط sales1, sales2, sales3 تحصل على زيارات
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupDistributionRules() {
  try {
    console.log('🔧 Setting up distribution rules...\n')

    // تعريف القواعد: فقط sales1, sales2, sales3 نشطة بأوزان متساوية
    const rules = [
      { salesPageId: 'sales1', googleWeight: 33.33, otherWeight: 33.33, isActive: true },
      { salesPageId: 'sales2', googleWeight: 33.33, otherWeight: 33.33, isActive: true },
      { salesPageId: 'sales3', googleWeight: 33.34, otherWeight: 33.34, isActive: true },
      { salesPageId: 'sales4', googleWeight: 0, otherWeight: 0, isActive: true },
      { salesPageId: 'sales5', googleWeight: 0, otherWeight: 0, isActive: true },
      { salesPageId: 'sales6', googleWeight: 0, otherWeight: 0, isActive: true },
      { salesPageId: 'sales7', googleWeight: 0, otherWeight: 0, isActive: true },
      { salesPageId: 'sales8', googleWeight: 0, otherWeight: 0, isActive: true },
      { salesPageId: 'sales9', googleWeight: 0, otherWeight: 0, isActive: true },
      { salesPageId: 'sales10', googleWeight: 0, otherWeight: 0, isActive: true },
      { salesPageId: 'sales11', googleWeight: 0, otherWeight: 0, isActive: true },
    ]

    console.log('📋 Distribution Rules Configuration:')
    console.log('━'.repeat(60))
    
    for (const rule of rules) {
      const updated = await prisma.distributionRule.upsert({
        where: { salesPageId: rule.salesPageId },
        update: {
          googleWeight: rule.googleWeight,
          otherWeight: rule.otherWeight,
          isActive: rule.isActive
        },
        create: {
          salesPageId: rule.salesPageId,
          googleWeight: rule.googleWeight,
          otherWeight: rule.otherWeight,
          isActive: rule.isActive,
          priority: 100,
          autoDistribute: false,
          minCVs: 0,
          dailyLimit: null,
          totalLimit: null,
          maxCVs: null
        }
      })

      const status = rule.googleWeight > 0 || rule.otherWeight > 0 ? '✅ ACTIVE' : '❌ NO TRAFFIC'
      const traffic = rule.googleWeight > 0 
        ? `Google: ${rule.googleWeight}%, Other: ${rule.otherWeight}%`
        : 'NO TRAFFIC (0%)'
      
      console.log(`  ${rule.salesPageId.padEnd(10)} ${status.padEnd(15)} ${traffic}`)
    }

    console.log('━'.repeat(60))
    console.log('\n📊 Summary:')
    console.log(`  ✅ Active pages with traffic: sales1, sales2, sales3 (100% total)`)
    console.log(`  ❌ Pages with NO traffic: sales4-sales11`)
    console.log('\n✅ Distribution rules updated successfully!')
    console.log('\n🎯 Expected behavior:')
    console.log('  - sales1: ~33.33% of traffic')
    console.log('  - sales2: ~33.33% of traffic')
    console.log('  - sales3: ~33.34% of traffic')
    console.log('  - sales4-sales11: 0% traffic (will never receive visits)\n')

  } catch (error) {
    console.error('❌ Error setting up distribution rules:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupDistributionRules()

