import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تحديث صفحات المبيعات من 2 إلى 11
for (let i = 2; i <= 11; i++) {
  const filePath = path.join(__dirname, '..', 'src', 'app', `sales${i}`, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: sales${i}/page.tsx`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // البحث عن نص الرسالة القديم واستبداله بالجديد
  const oldMessageRegex = /const message = `مرحباً، أريد الاستفسار عن السيرة الذاتية:[\s\S]*?من صفحة: Sales \d+`;/g;
  
  if (oldMessageRegex.test(content)) {
    const newMessage = `const message = \`هلا والله 👋
حبيت أستفسر عن العامل رقم \${cv.referenceCode || 'غير محدد'}
الاسم: \${cv.fullNameArabic || cv.fullName || 'غير محدد'}
الجنسية: \${cv.nationality || 'غير محددة'}
المهنة: \${cv.position || 'غير محددة'}
عنده خبرة \${cv.experience || 'غير محددة'}، وعمره \${cv.age || 'غير محدد'} سنة

هذا رابط سيرته: \${window.location.origin}/cv/\${cv.id}?from=sales${i}

إذا متوفر علمّوني الله يعطيكم العافية 🙏\`;`;
    
    content = content.replace(oldMessageRegex, newMessage);
    
    // كتابة الملف المحدث
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated sales${i}/page.tsx`);
  } else {
    console.log(`⚠️ Message pattern not found in sales${i}/page.tsx`);
  }
}

console.log('\n✅ تم تحديث جميع صفحات المبيعات بنص الرسالة الجديد!');
