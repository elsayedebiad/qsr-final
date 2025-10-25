// Script للتحقق من قواعد التوزيع المحفوظة
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyDistributionRules() {
  try {
    console.log('🔍 Verifying distribution rules...\n')

    const rules = await prisma.distributionRule.findMany({
      orderBy: { salesPageId: 'asc' }
    })

    if (rules.length === 0) {
      console.log('❌ No rules found in database!')
      console.log('   Run: node setup-distribution-rules.js\n')
      return
    }

    console.log(`✅ Found ${rules.length} rules in database\n`)
    console.log('📊 Current Distribution:')
    console.log('━'.repeat(80))
    console.log('Page      │ Active │ Google Weight │ Other Weight │ Status')
    console.log('━'.repeat(80))

    let activeCount = 0
    let googleTotal = 0
    let otherTotal = 0

    for (const rule of rules) {
      const hasTraffic = rule.googleWeight > 0 || rule.otherWeight > 0
      const status = hasTraffic ? '✅ RECEIVES TRAFFIC' : '❌ NO TRAFFIC'
      
      if (hasTraffic) {
        activeCount++
        googleTotal += rule.googleWeight
        otherTotal += rule.otherWeight
      }

      const activeIcon = rule.isActive ? '✅' : '❌'
      
      console.log(
        `${rule.salesPageId.padEnd(10)}│ ${activeIcon.padEnd(7)}│ ${rule.googleWeight.toFixed(2).padStart(13)}% │ ${rule.otherWeight.toFixed(2).padStart(12)}% │ ${status}`
      )
    }

    console.log('━'.repeat(80))
    console.log('\n📈 Summary:')
    console.log(`  Total pages: ${rules.length}`)
    console.log(`  Active pages (with traffic): ${activeCount}`)
    console.log(`  Inactive pages (no traffic): ${rules.length - activeCount}`)
    console.log(`  Total Google weight: ${googleTotal.toFixed(2)}%`)
    console.log(`  Total Other weight: ${otherTotal.toFixed(2)}%`)

    // التحقق من الدقة
    console.log('\n🎯 Verification:')
    
    const activePagesNames = rules
      .filter(r => r.googleWeight > 0 || r.otherWeight > 0)
      .map(r => r.salesPageId)
      .join(', ')
    
    const inactivePagesNames = rules
      .filter(r => r.googleWeight === 0 && r.otherWeight === 0)
      .map(r => r.salesPageId)
      .join(', ')

    console.log(`  ✅ Pages with traffic: ${activePagesNames}`)
    console.log(`  ❌ Pages without traffic: ${inactivePagesNames}`)

    // التحقق من التوزيع المتوقع
    const expectedActive = ['sales1', 'sales2', 'sales3']
    const actualActive = rules
      .filter(r => r.googleWeight > 0 || r.otherWeight > 0)
      .map(r => r.salesPageId)

    const isCorrect = 
      actualActive.length === expectedActive.length &&
      actualActive.every(page => expectedActive.includes(page))

    if (isCorrect) {
      console.log('\n✅✅✅ SUCCESS! Distribution is correctly configured!')
      console.log('  ✅ Only sales1, sales2, sales3 will receive traffic')
      console.log('  ✅ sales4-11 will receive 0% traffic')
    } else {
      console.log('\n⚠️⚠️⚠️ WARNING! Distribution might not be correct!')
      console.log(`  Expected: ${expectedActive.join(', ')}`)
      console.log(`  Actual: ${actualActive.join(', ')}`)
    }

    console.log('\n📝 Next steps:')
    console.log('  1. Clear browser cookies (td_bucket, td_rules_version)')
    console.log('  2. Open http://localhost:3000/test-distribution.html')
    console.log('  3. Test the distribution')
    console.log('  4. Or directly visit http://localhost:3000/sales\n')

  } catch (error) {
    console.error('❌ Error verifying distribution rules:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDistributionRules()

