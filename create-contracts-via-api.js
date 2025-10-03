// سكريبت لإنشاء تعاقدات تجريبية عبر API
const fetch = require('node-fetch')

async function createContractsViaAPI() {
  try {
    console.log('🔧 إنشاء تعاقدات تجريبية عبر API...\n')

    // بيانات تجريبية للتعاقدات
    const sampleContracts = [
      {
        cvId: 1,
        identityNumber: '123456789',
        contractDate: new Date().toISOString(),
        notes: 'تعاقد تجريبي 1'
      },
      {
        cvId: 2,
        identityNumber: '987654321',
        contractDate: new Date().toISOString(),
        notes: 'تعاقد تجريبي 2'
      },
      {
        cvId: 3,
        identityNumber: '456789123',
        contractDate: new Date().toISOString(),
        notes: 'تعاقد تجريبي 3'
      }
    ]

    console.log('📋 سيتم إنشاء التعاقدات التالية:')
    sampleContracts.forEach((contract, index) => {
      console.log(`${index + 1}. CV ID: ${contract.cvId}, رقم الهوية: ${contract.identityNumber}`)
    })

    let createdCount = 0
    let failedCount = 0

    for (const contractData of sampleContracts) {
      try {
        console.log(`\n🔧 إنشاء تعاقد للسيرة ${contractData.cvId}...`)

        const response = await fetch('http://localhost:3000/api/contracts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // يحتاج token صحيح - هذا مثال فقط
            'Authorization': 'Bearer your-token-here'
          },
          body: JSON.stringify(contractData)
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`   ✅ تم إنشاء التعاقد بنجاح`)
          createdCount++
        } else {
          const error = await response.text()
          console.log(`   ❌ فشل: ${error}`)
          failedCount++
        }

      } catch (error) {
        console.log(`   ❌ خطأ: ${error.message}`)
        failedCount++
      }
    }

    console.log(`\n🎯 النتائج:`)
    console.log(`✅ تم إنشاء: ${createdCount} تعاقد`)
    console.log(`❌ فشل: ${failedCount} تعاقد`)

    if (createdCount > 0) {
      console.log('\n🎉 تم إنشاء التعاقدات بنجاح!')
      console.log('✅ يمكنك الآن زيارة صفحة التعاقدات لرؤيتها')
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

// ملاحظة: هذا السكريبت يحتاج خادم يعمل وtoken صحيح
console.log('⚠️  تأكد من:')
console.log('1. الخادم يعمل على http://localhost:3000')
console.log('2. تسجيل الدخول والحصول على token')
console.log('3. تحديث Authorization header بالtoken الصحيح')
console.log('\nأو استخدم الداشبورد لإنشاء التعاقدات يدوياً')

// createContractsViaAPI()
