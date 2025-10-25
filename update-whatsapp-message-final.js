const fs = require('fs');
const path = require('path');

// الرسالة الجديدة بالإيموجي الفعلية
const newMessageTemplate = `هلا والله 
حبيت أستفسر عن العامل رقم \${cv.referenceCode || 'غير محدد'}
الاسم: \${cv.fullNameArabic || cv.fullName || 'غير محدد'}
الجنسية: \${cv.nationality || 'غير محددة'}
المهنة: \${cv.position || 'غير محددة'}
عنده خبرة \${cv.experience || 'غير محددة'}، وعمره \${cv.age || 'غير محدد'} سنة

هذا رابط سيرته: \${window.location.origin}/cv/\${cv.id}?from=SALES_PAGE

إذا متوفر علمّوني الله يعطيكم العافية `;

// تحديث صفحات المبيعات من 2 إلى 11
for (let i = 2; i <= 11; i++) {
  const salesPage = `sales${i}`;
  const filePath = path.join(__dirname, 'src', 'app', salesPage, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // البحث عن دالة sendWhatsAppMessage ونص الرسالة
  const messagePattern = /const message = `[\s\S]*?`;/;
  
  if (messagePattern.test(content)) {
    // إعداد الرسالة الجديدة مع رقم الصفحة الصحيح
    const messageForThisPage = newMessageTemplate.replace('SALES_PAGE', salesPage);
    
    // استبدال الرسالة القديمة بالجديدة
    content = content.replace(messagePattern, (match, offset) => {
      // التحقق من أن هذا داخل sendWhatsAppMessage
      const beforeMatch = content.substring(Math.max(0, offset - 500), offset);
      if (beforeMatch.includes('sendWhatsAppMessage')) {
        return `const message = \`${messageForThisPage}\`;`;
      }
      return match;
    });
    
    // حفظ الملف
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${salesPage}/page.tsx`);
  } else {
    console.log(`⚠️ Could not find message template in ${salesPage}/page.tsx`);
  }
}

console.log('\n✨ تم تحديث جميع صفحات المبيعات!');
console.log('👋 🙏 الإيموجي الآن يجب أن تظهر بشكل صحيح في رسائل الواتساب.');
console.log('\n💡 نصيحة: تأكد من اختبار رسالة واتساب من إحدى الصفحات للتأكد من ظهور الإيموجي بشكل صحيح.');
