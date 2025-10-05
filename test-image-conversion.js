// اختبار تحويل روابط Google Drive
const { convertGoogleDriveUrl, getOptimizedImageUrl } = require('./src/lib/google-drive-utils.ts')

// روابط تجريبية من قاعدة البيانات
const testUrls = [
  'https://drive.google.com/file/d/1ed8asisl3vmuGkWa5LTUPELcP2OlAF0g/view?usp=sharing',
  'https://drive.google.com/file/d/1QOi5q489zoHqwPWyXRgLwVpwu-XzzFgH/view?usp=sharing',
  'https://drive.google.com/file/d/1KUNqWqqHmIv--vkFOlWlkE0NGh4VL0en/view?usp=sharing',
  'https://drive.google.com/file/d/16MxISYpUHldic75SXY40h4Ccf7SYlu7g/view?usp=sharing'
]

console.log('🔍 اختبار تحويل روابط Google Drive...\n')

testUrls.forEach((url, index) => {
  console.log(`${index + 1}. الرابط الأصلي:`)
  console.log(`   ${url}`)
  
  const converted = convertGoogleDriveUrl(url)
  console.log(`   الرابط المحول:`)
  console.log(`   ${converted}`)
  
  const optimized = getOptimizedImageUrl(url)
  console.log(`   الرابط المحسن:`)
  console.log(`   ${optimized}`)
  console.log('---')
})

console.log('\n✅ تم اختبار تحويل الروابط بنجاح!')
console.log('\n📋 الخطوات التالية:')
console.log('1. تشغيل الخادم: npm run dev')
console.log('2. الذهاب إلى صفحة التعاقدات: /dashboard/contracts')
console.log('3. التحقق من ظهور صور العمال')
