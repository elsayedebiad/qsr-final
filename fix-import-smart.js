// سكريبت لإصلاح مشاكل صفحة الرفع الذكي
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'import-smart', 'page.tsx');

try {
  // قراءة الملف
  let content = fs.readFileSync(filePath, 'utf8');
  
  // البحث عن السطر 218
  const lines = content.split('\n');
  
  // التحقق من وجود setShowDetails في السطر 218
  const lineIndex = 217; // index is 0-based
  if (lines[lineIndex] && lines[lineIndex].includes('setShowDetails(true)')) {
    console.log('✅ تم العثور على setShowDetails في السطر الصحيح');
  }
  
  console.log('محتوى السطور من 215 إلى 220:');
  for (let i = 214; i < 220; i++) {
    if (lines[i]) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
  
} catch (error) {
  console.error('خطأ:', error);
}
