// اختبار API التعاقدات مع تسجيل دخول تجريبي
const fetch = require('node-fetch')

async function testContractsAPI() {
  try {
    console.log('🔍 اختبار API التعاقدات...\n')

    // محاولة 1: بدون token
    console.log('1️⃣ محاولة الوصول بدون token...')
    try {
      const response1 = await fetch('http://localhost:3000/api/contracts')
      console.log(`   📊 Status: ${response1.status}`)
      
      if (response1.status === 401) {
        console.log('   ❌ يحتاج تسجيل دخول (كما متوقع)')
      }
    } catch (error) {
      console.log(`   ❌ خطأ في الاتصال: ${error.message}`)
    }

    // محاولة 2: تسجيل دخول تجريبي
    console.log('\n2️⃣ محاولة تسجيل دخول تجريبي...')
    try {
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@example.com', // بيانات تجريبية
          password: 'admin123'
        })
      })

      console.log(`   📊 Login Status: ${loginResponse.status}`)
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        console.log('   ✅ تم تسجيل الدخول بنجاح')
        
        // محاولة الوصول للتعاقدات مع token
        console.log('\n3️⃣ محاولة الوصول للتعاقدات مع token...')
        const contractsResponse = await fetch('http://localhost:3000/api/contracts', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        })

        console.log(`   📊 Contracts Status: ${contractsResponse.status}`)
        
        if (contractsResponse.ok) {
          const contracts = await contractsResponse.json()
          console.log(`   ✅ تم جلب ${contracts.length} تعاقد`)
          
          contracts.forEach((contract, index) => {
            console.log(`   ${index + 1}. ${contract.cv.fullName} - ${contract.identityNumber}`)
          })
        } else {
          const error = await contractsResponse.text()
          console.log(`   ❌ فشل في جلب التعاقدات: ${error}`)
        }
      } else {
        console.log('   ❌ فشل في تسجيل الدخول')
      }
    } catch (error) {
      console.log(`   ❌ خطأ في تسجيل الدخول: ${error.message}`)
    }

    console.log('\n💡 الحلول المقترحة:')
    console.log('1. تأكد من تسجيل الدخول في المتصفح')
    console.log('2. تحقق من بيانات المستخدم الصحيحة')
    console.log('3. أو قم بإنشاء مستخدم جديد من صفحة التسجيل')

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

testContractsAPI()
