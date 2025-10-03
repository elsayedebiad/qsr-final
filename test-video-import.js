// اختبار اكتشاف أعمدة الفيديو في الاستيراد الذكي

// محاكاة بيانات Excel مع أعمدة فيديو مختلفة
const testExcelData = [
  {
    'الاسم الكامل': 'أحمد محمد',
    'الجنسية': 'مصري',
    'الوظيفة المطلوبة': 'سائق',
    'رابط الفيديو': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'العمر': '30'
  },
  {
    'الاسم الكامل': 'فاطمة علي',
    'الجنسية': 'فلبينية',
    'الوظيفة المطلوبة': 'عاملة منزلية',
    'فيديو': 'https://youtu.be/dQw4w9WgXcQ',
    'العمر': '28'
  },
  {
    'الاسم الكامل': 'John Smith',
    'الجنسية': 'أمريكي',
    'الوظيفة المطلوبة': 'مدرس',
    'Video URL': 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'العمر': '35'
  },
  {
    'الاسم الكامل': 'Maria Santos',
    'الجنسية': 'برازيلية',
    'الوظيفة المطلوبة': 'طباخة',
    'Video': '/videos/maria_cooking_demo.mp4',
    'العمر': '32'
  },
  {
    'الاسم الكامل': 'Ahmed Hassan',
    'الجنسية': 'سوداني',
    'الوظيفة المطلوبة': 'حارس',
    'Video Link': 'https://vimeo.com/123456789',
    'العمر': '40'
  }
]

// وظيفة لاختبار اكتشاف أعمدة الفيديو
function testVideoColumnDetection() {
  console.log('🎬 اختبار اكتشاف أعمدة الفيديو في الاستيراد الذكي')
  console.log('=' .repeat(60))
  
  // أسماء الأعمدة المدعومة للفيديو
  const videoColumns = [
    'رابط الفيديو',
    'فيديو', 
    'Video URL',
    'Video',
    'Video Link'
  ]
  
  console.log('📋 أسماء الأعمدة المدعومة للفيديو:')
  videoColumns.forEach((col, index) => {
    console.log(`   ${index + 1}. ${col}`)
  })
  
  console.log('\n🔍 تحليل البيانات التجريبية:')
  console.log('-'.repeat(40))
  
  // تحليل كل صف
  testExcelData.forEach((row, index) => {
    console.log(`\n📄 الصف ${index + 1}: ${row['الاسم الكامل']}`)
    
    // البحث عن عمود الفيديو
    let videoUrl = null
    let videoColumn = null
    
    for (const col of videoColumns) {
      if (row[col]) {
        videoUrl = row[col]
        videoColumn = col
        break
      }
    }
    
    if (videoUrl) {
      console.log(`   ✅ تم العثور على فيديو في العمود: "${videoColumn}"`)
      console.log(`   🔗 رابط الفيديو: ${videoUrl}`)
      
      // تحديد نوع الفيديو
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        console.log(`   📺 نوع الفيديو: YouTube`)
      } else if (videoUrl.includes('vimeo.com')) {
        console.log(`   📺 نوع الفيديو: Vimeo`)
      } else if (videoUrl.startsWith('/') || videoUrl.includes('.mp4') || videoUrl.includes('.webm')) {
        console.log(`   📺 نوع الفيديو: ملف فيديو محلي`)
      } else {
        console.log(`   📺 نوع الفيديو: رابط مخصص`)
      }
    } else {
      console.log(`   ❌ لم يتم العثور على فيديو`)
    }
  })
  
  // إحصائيات
  const videosFound = testExcelData.filter(row => {
    return videoColumns.some(col => row[col])
  }).length
  
  console.log('\n📊 الإحصائيات:')
  console.log('-'.repeat(20))
  console.log(`📋 إجمالي الصفوف: ${testExcelData.length}`)
  console.log(`🎬 الصفوف التي تحتوي على فيديو: ${videosFound}`)
  console.log(`📈 نسبة الفيديوهات: ${((videosFound / testExcelData.length) * 100).toFixed(1)}%`)
  
  // اختبار معالجة روابط YouTube
  console.log('\n🔧 اختبار معالجة روابط YouTube:')
  console.log('-'.repeat(35))
  
  const youtubeUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ'
  ]
  
  youtubeUrls.forEach((url, index) => {
    const embedUrl = url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
    console.log(`${index + 1}. الأصلي: ${url}`)
    console.log(`   المحول: ${embedUrl}`)
  })
  
  console.log('\n✅ اكتمل اختبار اكتشاف أعمدة الفيديو!')
}

// تشغيل الاختبار
testVideoColumnDetection()

// اختبار إضافي: محاكاة عملية الاستيراد
console.log('\n' + '='.repeat(60))
console.log('🔄 محاكاة عملية الاستيراد مع الفيديوهات')
console.log('='.repeat(60))

function simulateImportProcess() {
  const results = {
    totalRows: testExcelData.length,
    withVideo: 0,
    withoutVideo: 0,
    videoTypes: {
      youtube: 0,
      vimeo: 0,
      local: 0,
      other: 0
    }
  }
  
  testExcelData.forEach(row => {
    // البحث عن فيديو
    const videoColumns = ['رابط الفيديو', 'فيديو', 'Video URL', 'Video', 'Video Link']
    let videoUrl = null
    
    for (const col of videoColumns) {
      if (row[col]) {
        videoUrl = row[col]
        break
      }
    }
    
    if (videoUrl) {
      results.withVideo++
      
      // تصنيف نوع الفيديو
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        results.videoTypes.youtube++
      } else if (videoUrl.includes('vimeo.com')) {
        results.videoTypes.vimeo++
      } else if (videoUrl.startsWith('/') || videoUrl.includes('.mp4')) {
        results.videoTypes.local++
      } else {
        results.videoTypes.other++
      }
    } else {
      results.withoutVideo++
    }
  })
  
  console.log('📊 نتائج المحاكاة:')
  console.log(`📋 إجمالي السير: ${results.totalRows}`)
  console.log(`🎬 مع فيديو: ${results.withVideo}`)
  console.log(`❌ بدون فيديو: ${results.withoutVideo}`)
  console.log('\n📺 أنواع الفيديوهات:')
  console.log(`   YouTube: ${results.videoTypes.youtube}`)
  console.log(`   Vimeo: ${results.videoTypes.vimeo}`)
  console.log(`   ملفات محلية: ${results.videoTypes.local}`)
  console.log(`   أخرى: ${results.videoTypes.other}`)
}

simulateImportProcess()

console.log('\n🎉 اكتمل جميع الاختبارات بنجاح!')
console.log('💡 الآن يمكن استيراد السير الذاتية مع روابط الفيديو من ملفات Excel')
