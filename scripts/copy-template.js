const fs = require('fs')
const path = require('path')

// مسار القالب المُنشأ
const sourcePath = path.join(__dirname, '..', 'قالب_السير_الذاتية_الكامل.xlsx')
// مسار الوجهة في مجلد templates
const destPath = path.join(__dirname, '..', 'public', 'templates', 'cv-template-complete.xlsx')

try {
  // التأكد من وجود مجلد templates
  const templatesDir = path.dirname(destPath)
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true })
    console.log('📁 تم إنشاء مجلد templates')
  }

  // نسخ الملف
  fs.copyFileSync(sourcePath, destPath)
  console.log('✅ تم نسخ القالب بنجاح!')
  console.log(`📍 من: ${sourcePath}`)
  console.log(`📍 إلى: ${destPath}`)
  
  // التحقق من حجم الملف
  const stats = fs.statSync(destPath)
  console.log(`📊 حجم الملف: ${Math.round(stats.size / 1024)} KB`)
  
} catch (error) {
  console.error('❌ خطأ في نسخ القالب:', error.message)
}
