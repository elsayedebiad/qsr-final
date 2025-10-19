const fs = require('fs');
const path = require('path');

// قائمة صفحات المبيعات
const salesPages = [
  'sales1', 'sales3', 'sales4', 'sales5', 
  'sales6', 'sales7', 'sales8', 'sales9', 'sales10', 'sales11'
]; // sales2 تم إصلاحها بالفعل

console.log('\n🔧 بدء إصلاح فلاتر اللغة في جميع صفحات المبيعات...\n');

salesPages.forEach(page => {
  const filePath = path.join('src', 'app', page, 'page.tsx');
  
  try {
    console.log(`📂 معالجة ${page}...`);
    
    // قراءة الملف
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // إصلاح 1: منطق الفلترة الرئيسي للغة العربية
    content = content.replace(
      /const matchesArabicLevel = arabicLevelFilter === 'ALL' \|\| \(\(\) => \{[\s\S]*?return arabicLevel === arabicLevelFilter[\s\S]*?\}\)\(\)/g,
      `const matchesArabicLevel = arabicLevelFilter === 'ALL' || (() => {
        const arabicLevel = cv.arabicLevel ?? cv.languageLevel ?? 'NONE'
        return arabicLevel === arabicLevelFilter
      })()`
    );
    
    // إصلاح 2: منطق الفلترة الرئيسي للغة الإنجليزية  
    content = content.replace(
      /const matchesEnglishLevel = englishLevelFilter === 'ALL' \|\| \(\(\) => \{[\s\S]*?return englishLevel === englishLevelFilter[\s\S]*?\}\)\(\)/g,
      `const matchesEnglishLevel = englishLevelFilter === 'ALL' || (() => {
        const englishLevel = cv.englishLevel ?? 'NONE'
        return englishLevel === englishLevelFilter
      })()`
    );
    
    // إصلاح 3: دالة getCountForFilter للغة العربية
    content = content.replace(
      /case 'arabicLevel':[\s\S]*?return arabicLevel === filterValue/g,
      `case 'arabicLevel':
          const arabicLevel = cv.arabicLevel ?? cv.languageLevel ?? 'NONE'
          return arabicLevel === filterValue`
    );
    
    // إصلاح 4: دالة getCountForFilter للغة الإنجليزية
    content = content.replace(
      /case 'englishLevel':[\s\S]*?return englishLevel === filterValue/g,
      `case 'englishLevel':
          const englishLevel = cv.englishLevel ?? 'NONE'
          return englishLevel === filterValue`
    );
    
    // التحقق من وجود تغييرات
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`   ✅ تم إصلاح ${page}`);
    } else {
      console.log(`   ⏭️ ${page} لا يحتاج لتغييرات`);
    }
    
  } catch (error) {
    console.error(`   ❌ خطأ في معالجة ${page}: ${error.message}`);
  }
});

console.log('\n✨ انتهى إصلاح فلاتر اللغة في جميع الصفحات!');
console.log('\n📌 ملاحظة: يجب إعادة استيراد البيانات من DUKA.xlsx لتطبيق التحويلات الجديدة.');
