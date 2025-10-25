const fs = require('fs');
const path = require('path');

// النص الجديد للرسالة
const newMessageTemplate = `هلا والله 👋
حبيت أستفسر عن العامل رقم \${cv.referenceCode || 'غير محدد'}
الاسم: \${cv.fullNameArabic || cv.fullName || 'غير محدد'}
الجنسية: \${cv.nationality || 'غير محددة'}
المهنة: \${cv.position || 'غير محددة'}
عنده خبرة \${cv.experience || 'غير محددة'}، وعمره \${cv.age || 'غير محدد'} سنة

هذا رابط سيرته: \${window.location.origin}/cv/\${cv.id}?from=sales{PAGE_NUMBER}

إذا متوفر علمّوني الله يعطيكم العافية 🙏`;

// تحديث جميع صفحات المبيعات
for (let i = 1; i <= 11; i++) {
  const filePath = path.join(__dirname, '..', 'src', 'app', `sales${i}`, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: sales${i}/page.tsx`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // البحث عن دالة sendWhatsAppMessage
  const functionRegex = /const sendWhatsAppMessage = \(cv: CV\) => \{[\s\S]*?const message = `[\s\S]*?`;/g;
  
  if (functionRegex.test(content)) {
    // استبدال نص الرسالة
    content = content.replace(functionRegex, (match) => {
      // استبدال الجزء الخاص بالرسالة فقط
      const messageStart = match.indexOf('const message = `');
      const beforeMessage = match.substring(0, messageStart);
      
      // استبدال PAGE_NUMBER برقم الصفحة الصحيح
      const newMessage = newMessageTemplate.replace('{PAGE_NUMBER}', i.toString());
      
      return beforeMessage + `const message = \`${newMessage}\`;`;
    });
    
    // كتابة الملف المحدث
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated sales${i}/page.tsx`);
  } else {
    console.log(`⚠️ sendWhatsAppMessage not found in sales${i}/page.tsx`);
  }
}

console.log('\n✅ تم تحديث جميع صفحات المبيعات بنص الرسالة الجديد!');
