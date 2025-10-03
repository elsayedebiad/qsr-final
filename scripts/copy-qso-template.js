const fs = require('fs')
const path = require('path')

// مسار مجلد qso template
const sourceDir = path.join(__dirname, '..', 'qso template')
// مسار الوجهة الجديد
const destDir = path.join(__dirname, '..', 'src', 'components', 'cv-templates', 'qso')

try {
  // إنشاء مجلد الوجهة
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
    console.log('📁 تم إنشاء مجلد qso template')
  }

  // قراءة محتويات المجلد المصدر
  const files = fs.readdirSync(sourceDir)
  console.log('📋 الملفات الموجودة:', files)

  // نسخ كل ملف
  files.forEach(file => {
    if (!file.startsWith('.')) { // تجاهل ملفات النظام
      const sourcePath = path.join(sourceDir, file)
      const destPath = path.join(destDir, file)
      
      try {
        fs.copyFileSync(sourcePath, destPath)
        console.log(`✅ تم نسخ: ${file}`)
      } catch (error) {
        console.log(`❌ فشل نسخ: ${file} - ${error.message}`)
      }
    }
  })

  console.log('🎉 تم نسخ قالب QSO بنجاح!')
  
} catch (error) {
  console.error('❌ خطأ في نسخ قالب QSO:', error.message)
}
