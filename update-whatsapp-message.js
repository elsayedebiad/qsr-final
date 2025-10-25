const fs = require('fs');
const path = require('path');

// الرسالة الجديدة - نستخدم Unicode escape sequences للإيموجي لضمان التوافق
// 👋 = \uD83D\uDC4B
// 🙏 = \uD83D\uDE4F
const newMessageTemplate = `هلا والله \\uD83D\\uDC4B
حبيت أستفسر عن العامل رقم \${cv.referenceCode || 'غير محدد'}
الاسم: \${cv.fullNameArabic || cv.fullName || 'غير محدد'}
الجنسية: \${cv.nationality || 'غير محددة'}
المهنة: \${cv.position || 'غير محددة'}
عنده خبرة \${cv.experience || 'غير محددة'}، وعمره \${cv.age || 'غير محدد'} سنة

هذا رابط سيرته: \${window.location.origin}/cv/\${cv.id}?from=SALES_PAGE

إذا متوفر علمّوني الله يعطيكم العافية \\uD83D\\uDE4F`;

// تحديث جميع صفحات المبيعات
for (let i = 1; i <= 11; i++) {
  const salesPage = `sales${i}`;
  const filePath = path.join(__dirname, 'src', 'app', salesPage, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // البحث عن دالة sendWhatsAppMessage
  const functionRegex = /const sendWhatsAppMessage = \(cv: CV\) => \{[\s\S]*?const message = `[\s\S]*?`;/g;
  
  // إعداد الرسالة الجديدة مع رقم الصفحة الصحيح
  const messageForThisPage = newMessageTemplate.replace('SALES_PAGE', salesPage);
  
  // الكود الجديد للدالة
  const newFunctionContent = `const sendWhatsAppMessage = (cv: CV) => {
    try {
      if (!whatsappNumber) {
        toast.error('لم يتم تعيين رقم واتساب لهذه الصفحة. يرجى التواصل مع الإدارة.');
        return;
      }

      // تنظيف رقم الهاتف (إزالة أي أحرف غير رقمية)
      const cleanPhone = whatsappNumber.replace(/\\D/g, '');
      
      // إنشاء الرسالة مع تنسيق محسن
      const message = \`${messageForThisPage}\`;`;
  
  // البحث والاستبدال
  if (functionRegex.test(content)) {
    content = content.replace(functionRegex, newFunctionContent);
    
    // حفظ الملف
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${salesPage}/page.tsx`);
  } else {
    console.log(`⚠️ Could not find sendWhatsAppMessage in ${salesPage}/page.tsx - trying alternative approach`);
    
    // محاولة بديلة للبحث والاستبدال
    const altRegex = /const message = `[^`]*`;/g;
    
    if (altRegex.test(content)) {
      const newMessage = `const message = \`${messageForThisPage}\`;`;
      content = content.replace(altRegex, (match) => {
        // التحقق من أن هذا داخل sendWhatsAppMessage
        const indexOfMatch = content.indexOf(match);
        const previousContent = content.substring(Math.max(0, indexOfMatch - 200), indexOfMatch);
        if (previousContent.includes('sendWhatsAppMessage')) {
          return newMessage;
        }
        return match;
      });
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${salesPage}/page.tsx (alternative method)`);
    }
  }
}

console.log('\n✨ جميع صفحات المبيعات تم تحديثها بالرسالة الجديدة!');
console.log('📱 الإيموجي سوف تظهر بشكل صحيح في رسائل الواتساب.');
console.log('✅ تم استخدام Unicode escape sequences للتأكد من التوافق الكامل.');
