// اختبار إنشاء تعاقد جديد
const fetch = require('node-fetch')

async function testContractCreation() {
  try {
    console.log('🧪 اختبار إنشاء تعاقد جديد...\n')

    // بيانات تجريبية للتعاقد
    const contractData = {
      cvId: 387, // نفس الـ ID من الخطأ
      identityNumber: '30211241501596',
      contractDate: new Date().toISOString(),
      notes: 'تعاقد تجريبي'
    }

    console.log('📋 بيانات التعاقد:')
    console.log(`   CV ID: ${contractData.cvId}`)
    console.log(`   رقم الهوية: ${contractData.identityNumber}`)
    console.log(`   تاريخ التعاقد: ${contractData.contractDate}`)

    console.log('\n🔧 إرسال طلب إنشاء التعاقد...')

    const response = await fetch('http://localhost:3000/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contractData)
    })

    console.log(`📊 Status Code: ${response.status}`)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ تم إنشاء التعاقد بنجاح!')
      console.log(`   Contract ID: ${result.contract.id}`)
      console.log(`   اسم الموظف: ${result.contract.cv.fullName}`)
      console.log(`   رقم الهوية: ${result.contract.identityNumber}`)
    } else {
      const error = await response.json()
      console.log('❌ فشل في إنشاء التعاقد:')
      console.log(`   الخطأ: ${error.error}`)
      console.log(`   التفاصيل: ${error.details || 'غير متوفر'}`)
    }

    // اختبار جلب التعاقدات
    console.log('\n🔍 اختبار جلب التعاقدات...')
    
    const getResponse = await fetch('http://localhost:3000/api/contracts')
    console.log(`📊 Get Status: ${getResponse.status}`)

    if (getResponse.ok) {
      const contracts = await getResponse.json()
      console.log(`✅ تم جلب ${contracts.length} تعاقد`)
      
      if (contracts.length > 0) {
        console.log('\n📋 آخر التعاقدات:')
        contracts.slice(0, 3).forEach((contract, index) => {
          console.log(`   ${index + 1}. ${contract.cv.fullName} - ${contract.identityNumber}`)
        })
      }
    } else {
      const error = await getResponse.json()
      console.log('❌ فشل في جلب التعاقدات:', error.error)
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message)
  }
}

// تشغيل الاختبار
testContractCreation()
