/**
 * سكريبت اختبار نظام التوزيع
 * 
 * الاستخدام:
 * node test-distribution.js
 */

const API_URL = 'http://localhost:3000'

async function testDistributionSystem() {
  console.log('\n🧪 اختبار نظام التوزيع المرجح\n')
  console.log('='.repeat(50))

  try {
    // 1. اختبار جلب القواعد
    console.log('\n📥 1. جلب قواعد التوزيع من API...')
    const rulesRes = await fetch(`${API_URL}/api/distribution/rules`)
    const rulesData = await rulesRes.json()
    
    if (rulesData.success) {
      console.log('✅ تم جلب القواعد بنجاح!')
      console.log(`   عدد الصفحات: ${rulesData.rules.length}`)
      
      // حساب الإجماليات
      const googleTotal = rulesData.rules
        .filter(r => r.isActive)
        .reduce((sum, r) => sum + (r.googleWeight || 0), 0)
      
      const otherTotal = rulesData.rules
        .filter(r => r.isActive)
        .reduce((sum, r) => sum + (r.otherWeight || 0), 0)
      
      console.log(`   إجمالي Google: ${googleTotal.toFixed(2)}%`)
      console.log(`   إجمالي Other: ${otherTotal.toFixed(2)}%`)
      
      if (Math.abs(googleTotal - 100) > 0.1) {
        console.warn('   ⚠️ تحذير: إجمالي Google لا يساوي 100%')
      }
      if (Math.abs(otherTotal - 100) > 0.1) {
        console.warn('   ⚠️ تحذير: إجمالي Other لا يساوي 100%')
      }
      
      // عرض الصفحات النشطة
      console.log('\n📊 الصفحات النشطة:')
      rulesData.rules
        .filter(r => r.isActive)
        .forEach(r => {
          console.log(`   ${r.salesPageId.toUpperCase()}: Google=${r.googleWeight}%, Other=${r.otherWeight}%`)
        })
      
      // عرض الصفحات المعطلة
      const disabled = rulesData.rules.filter(r => !r.isActive)
      if (disabled.length > 0) {
        console.log('\n🚫 الصفحات المعطلة:')
        disabled.forEach(r => {
          console.log(`   ${r.salesPageId.toUpperCase()}`)
        })
      }
    } else {
      console.error('❌ فشل جلب القواعد:', rulesData.error)
      return
    }

    // 2. محاكاة التوزيع
    console.log('\n🎲 2. محاكاة التوزيع (1000 زيارة)...')
    
    const activeRules = rulesData.rules.filter(r => r.isActive)
    const googleCounts = {}
    const otherCounts = {}
    
    // تهيئة العدادات
    activeRules.forEach(r => {
      googleCounts[r.salesPageId] = 0
      otherCounts[r.salesPageId] = 0
    })
    
    // محاكاة 1000 زيارة Google
    for (let i = 0; i < 1000; i++) {
      const selected = weightedRandom(activeRules, 'googleWeight')
      if (selected) googleCounts[selected]++
    }
    
    // محاكاة 1000 زيارة Other
    for (let i = 0; i < 1000; i++) {
      const selected = weightedRandom(activeRules, 'otherWeight')
      if (selected) otherCounts[selected]++
    }
    
    console.log('\n   Google Traffic (1000 زيارة):')
    Object.entries(googleCounts).forEach(([page, count]) => {
      const rule = activeRules.find(r => r.salesPageId === page)
      const expected = rule?.googleWeight || 0
      const actual = (count / 1000 * 100).toFixed(2)
      const diff = Math.abs(actual - expected).toFixed(2)
      const emoji = diff < 2 ? '✅' : diff < 5 ? '⚠️' : '❌'
      console.log(`   ${emoji} ${page.toUpperCase()}: ${count} (${actual}%) - متوقع: ${expected}% - فرق: ${diff}%`)
    })
    
    console.log('\n   Other Traffic (1000 زيارة):')
    Object.entries(otherCounts).forEach(([page, count]) => {
      const rule = activeRules.find(r => r.salesPageId === page)
      const expected = rule?.otherWeight || 0
      const actual = (count / 1000 * 100).toFixed(2)
      const diff = Math.abs(actual - expected).toFixed(2)
      const emoji = diff < 2 ? '✅' : diff < 5 ? '⚠️' : '❌'
      console.log(`   ${emoji} ${page.toUpperCase()}: ${count} (${actual}%) - متوقع: ${expected}% - فرق: ${diff}%`)
    })

    // 3. نتيجة نهائية
    console.log('\n' + '='.repeat(50))
    console.log('✅ اكتمل الاختبار!')
    console.log('\n💡 ملاحظات:')
    console.log('   - النسب الفعلية قد تختلف قليلاً عن المتوقعة (±2%)')
    console.log('   - هذا طبيعي في التوزيع العشوائي')
    console.log('   - كلما زاد عدد الزيارات، كلما اقتربت النسب من المتوقع')
    console.log('\n📝 للاختبار الفعلي:')
    console.log('   1. افتح: http://localhost:3000/sales')
    console.log('   2. لاحظ الصفحة التي يوجهك إليها')
    console.log('   3. احذف كوكي td_bucket وأعد المحاولة')
    console.log('   4. كرر عدة مرات لترى التوزيع\n')

  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error.message)
    console.log('\n💡 تأكد من:')
    console.log('   1. تشغيل الخادم: npm run dev')
    console.log('   2. تنفيذ migration: npx prisma migrate dev')
    console.log('   3. توفر API على: ' + API_URL)
  }
}

// دالة مساعدة للاختيار العشوائي المرجح
function weightedRandom(items, weightKey) {
  const total = items.reduce((sum, item) => sum + (item[weightKey] || 0), 0)
  let random = Math.random() * total
  
  for (const item of items) {
    const weight = item[weightKey] || 0
    if (weight > 0 && random < weight) {
      return item.salesPageId
    }
    random -= weight
  }
  
  return items[0]?.salesPageId
}

// تشغيل الاختبار
testDistributionSystem()
