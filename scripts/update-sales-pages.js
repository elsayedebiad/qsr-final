const fs = require('fs')
const path = require('path')

// قائمة صفحات Sales المراد تحديثها
const salesPages = ['sales2', 'sales3', 'sales4', 'sales5']

// دالة لتحديث صفحة واحدة
function updateSalesPage(pageName) {
  const filePath = path.join(__dirname, '..', 'src', 'app', pageName, 'page.tsx')
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ الملف غير موجود: ${pageName}/page.tsx`)
      return
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let updated = false

    // تحديث روابط المشاركة
    if (content.includes('/gallery/cv/')) {
      content = content.replace(/\/gallery\/cv\//g, '/cv/')
      updated = true
      console.log(`✅ تم تحديث روابط المشاركة في ${pageName}`)
    }

    // حفظ الملف إذا تم التحديث
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`💾 تم حفظ التحديثات في ${pageName}`)
    } else {
      console.log(`ℹ️  لا توجد تحديثات مطلوبة في ${pageName}`)
    }

  } catch (error) {
    console.error(`❌ خطأ في تحديث ${pageName}:`, error.message)
  }
}

// تحديث جميع صفحات Sales
console.log('🚀 بدء تحديث صفحات Sales...')
salesPages.forEach(updateSalesPage)

// تحديث صفحة Gallery الرئيسية أيضاً
console.log('\n📋 تحديث صفحة Gallery الرئيسية...')
updateSalesPage('gallery')

console.log('\n🎉 تم الانتهاء من تحديث جميع الصفحات!')
console.log('\n📝 الملخص:')
console.log('- تم تحديث روابط المشاركة من /gallery/cv/[id] إلى /cv/[id]')
console.log('- الآن جميع الروابط تشير إلى الصفحة العامة الجديدة بقالب QSO')
console.log('- المستخدمون يمكنهم مشاهدة السير الذاتية بدون تسجيل دخول')
