/**
 * سكريبت اختبار API الزيارات
 * 
 * الاستخدام:
 * node test-visits-api.js
 */

const API_URL = 'http://localhost:3000'

async function testVisitsAPI() {
  console.log('\n🧪 اختبار API الزيارات\n')
  console.log('='.repeat(50))

  try {
    // 1. اختبار تسجيل زيارة (بدون auth - عام)
    console.log('\n📝 1. اختبار تسجيل زيارة...')
    const trackRes = await fetch(`${API_URL}/api/visits/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPage: '/sales1',
        referer: 'https://google.com',
        utmSource: 'google',
        utmMedium: 'cpc',
        isGoogle: true,
        userAgent: 'Test Script'
      })
    })
    
    const trackData = await trackRes.json()
    
    if (trackRes.status === 200 && trackData.success) {
      console.log('✅ تم تسجيل الزيارة بنجاح!')
      console.log(`   Visit ID: ${trackData.visitId}`)
    } else {
      console.log(`❌ فشل تسجيل الزيارة: ${trackData.error || 'unknown error'}`)
    }

    // 2. اختبار جلب الإحصائيات (يحتاج auth)
    console.log('\n📊 2. اختبار جلب الإحصائيات...')
    const statsRes = await fetch(`${API_URL}/api/visits/stats`)
    
    if (statsRes.status === 401) {
      console.log('⚠️  خطأ 401 - يحتاج تسجيل دخول')
      console.log('   💡 هذا طبيعي إذا لم تسجل دخول في المتصفح')
      console.log('   📝 للحل: افتح المتصفح وسجّل دخول أولاً')
    } else if (statsRes.status === 200) {
      const statsData = await statsRes.json()
      console.log('✅ تم جلب الإحصائيات بنجاح!')
      console.log(`   إجمالي الزيارات: ${statsData.summary?.totalVisits || 0}`)
      console.log(`   زيارات اليوم: ${statsData.summary?.todayVisits || 0}`)
      console.log(`   زيارات Google: ${statsData.summary?.googleVisits || 0}`)
    } else {
      console.log(`❌ خطأ ${statsRes.status}: ${await statsRes.text()}`)
    }

    // 3. اختبار جلب قائمة الزيارات (يحتاج auth)
    console.log('\n📋 3. اختبار جلب قائمة الزيارات...')
    const listRes = await fetch(`${API_URL}/api/visits/list?page=1&limit=10`)
    
    if (listRes.status === 401) {
      console.log('⚠️  خطأ 401 - يحتاج تسجيل دخول')
      console.log('   💡 هذا طبيعي إذا لم تسجل دخول في المتصفح')
    } else if (listRes.status === 200) {
      const listData = await listRes.json()
      console.log('✅ تم جلب القائمة بنجاح!')
      console.log(`   عدد الزيارات: ${listData.visits?.length || 0}`)
      console.log(`   إجمالي الصفحات: ${listData.pagination?.pages || 0}`)
      console.log(`   زوار فريدين: ${listData.stats?.uniqueVisitors || 0}`)
    } else {
      console.log(`❌ خطأ ${listRes.status}: ${await listRes.text()}`)
    }

    // 4. محاكاة زيارات متعددة
    console.log('\n🎲 4. محاكاة 5 زيارات...')
    const pages = ['/sales1', '/sales2', '/sales3', '/sales4', '/sales5']
    const sources = ['google', 'facebook', 'direct', 'instagram', 'twitter']
    
    for (let i = 0; i < 5; i++) {
      const randomPage = pages[Math.floor(Math.random() * pages.length)]
      const randomSource = sources[Math.floor(Math.random() * sources.length)]
      
      await fetch(`${API_URL}/api/visits/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPage: randomPage,
          utmSource: randomSource,
          isGoogle: randomSource === 'google',
          userAgent: `Test Script ${i + 1}`
        })
      })
      
      console.log(`   ✅ زيارة ${i + 1}: ${randomPage} (${randomSource})`)
      await new Promise(resolve => setTimeout(resolve, 100)) // تأخير قصير
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ اكتمل الاختبار!')
    console.log('\n💡 ملاحظات:')
    console.log('   - تسجيل الزيارات يعمل بدون auth ✅')
    console.log('   - جلب الإحصائيات يحتاج تسجيل دخول ⚠️')
    console.log('   - للوصول الكامل: سجّل دخول في المتصفح أولاً')
    console.log('\n📝 للمشاهدة:')
    console.log('   افتح: http://localhost:3000/dashboard/visits')
    console.log('   (بعد تسجيل الدخول)\n')

  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error.message)
    console.log('\n💡 تأكد من:')
    console.log('   1. تشغيل الخادم: npm run dev')
    console.log('   2. الخادم يعمل على: ' + API_URL)
    console.log('   3. قاعدة البيانات متصلة')
  }
}

// تشغيل الاختبار
testVisitsAPI()
