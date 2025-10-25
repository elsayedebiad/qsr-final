import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// النص الجديد للرسالة
const getNewMessage = (pageNum) => `      // إنشاء الرسالة مع تنسيق محسن
      const message = \`هلا والله 👋
حبيت أستفسر عن العامل رقم \${cv.referenceCode || 'غير محدد'}
الاسم: \${cv.fullNameArabic || cv.fullName || 'غير محدد'}
الجنسية: \${cv.nationality || 'غير محددة'}
المهنة: \${cv.position || 'غير محددة'}
عنده خبرة \${cv.experience || 'غير محددة'}، وعمره \${cv.age || 'غير محدد'} سنة

هذا رابط سيرته: \${window.location.origin}/cv/\${cv.id}?from=sales${pageNum}

إذا متوفر علمّوني الله يعطيكم العافية 🙏\`;`;

// تحديث صفحات المبيعات من 3 إلى 11
for (let i = 3; i <= 11; i++) {
  const filePath = path.join(__dirname, '..', 'src', 'app', \`sales\${i}\`, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(\`❌ File not found: sales\${i}/page.tsx\`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // البحث عن نص الرسالة القديم واستبداله بالجديد
  // نبحث عن السطر الذي يحتوي على "إنشاء الرسالة مع تنسيق محسن" حتى نهاية تعريف الرسالة
  const messagePattern = /(\s*)\/\/ إنشاء الرسالة مع تنسيق محسن[\s\S]*?const message = \`[\s\S]*?من صفحة: Sales \d+\`;/g;
  
  if (messagePattern.test(content)) {
    content = content.replace(messagePattern, getNewMessage(i));
    
    // كتابة الملف المحدث
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(\`✅ Updated sales\${i}/page.tsx\`);
  } else {
    console.log(\`⚠️  Message pattern not found in sales\${i}/page.tsx - trying alternative method\`);
    
    // محاولة أخرى بنمط مختلف
    const altPattern = /const message = \`مرحباً[\s\S]*?من صفحة: Sales \d+\`;/g;
    if (altPattern.test(content)) {
      const newMessage = \`const message = \`هلا والله 👋
حبيت أستفسر عن العامل رقم \${cv.referenceCode || 'غير محدد'}
الاسم: \${cv.fullNameArabic || cv.fullName || 'غير محدد'}
الجنسية: \${cv.nationality || 'غير محددة'}
المهنة: \${cv.position || 'غير محددة'}
عنده خبرة \${cv.experience || 'غير محددة'}، وعمره \${cv.age || 'غير محدد'} سنة

هذا رابط سيرته: \${window.location.origin}/cv/\${cv.id}?from=sales\${i}

إذا متوفر علمّوني الله يعطيكم العافية 🙏\`;\`;
      
      content = content.replace(altPattern, newMessage);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(\`✅ Updated sales\${i}/page.tsx (alt method)\`);
    } else {
      console.log(\`❌ Could not find message pattern in sales\${i}/page.tsx\`);
    }
  }
}

console.log('\\n✅ تم الانتهاء من تحديث جميع صفحات المبيعات!');
