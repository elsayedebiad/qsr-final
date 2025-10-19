const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'DUKA.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('==============================================');
console.log('تحليل ملف DUKA.xlsx');
console.log('==============================================');
console.log('إجمالي عدد الصفوف:', data.length);

// تحليل قيم اللغة العربية
const arabicCounts = {};
const arabicColumnNames = ['العربية', 'مستوى العربية', 'Arabic', 'Arabic Level', 'عربي', 'عربية'];

data.forEach((row, index) => {
  let arabicValue = null;
  
  // البحث عن عمود اللغة العربية
  for (const colName of arabicColumnNames) {
    if (row[colName] !== undefined && row[colName] !== null) {
      arabicValue = String(row[colName]).trim();
      break;
    }
  }
  
  // إذا لم نجد قيمة أو كانت فارغة
  if (arabicValue === '' || arabicValue === null) {
    arabicValue = 'فارغ/غير محدد';
  }
  
  arabicCounts[arabicValue] = (arabicCounts[arabicValue] || 0) + 1;
});

console.log('\n==============================================');
console.log('توزيع قيم اللغة العربية في الملف:');
console.log('==============================================');

// ترتيب وعرض النتائج
const sortedArabic = Object.entries(arabicCounts).sort((a, b) => b[1] - a[1]);
let totalArabic = 0;

sortedArabic.forEach(([value, count]) => {
  console.log(`  ${value}: ${count} سيرة ذاتية`);
  totalArabic += count;
});

console.log('----------------------------------------------');
console.log('المجموع الكلي:', totalArabic);

// تحليل التحويلات المتوقعة
console.log('\n==============================================');
console.log('التحويلات المتوقعة لقاعدة البيانات:');
console.log('==============================================');

const conversions = {
  'ممتاز': 'YES',
  'جيد': 'WILLING',
  'ضعيف': 'null (في قاعدة البيانات)',
  'لا': 'NO'
};

for (const [arabic, db] of Object.entries(conversions)) {
  const count = arabicCounts[arabic] || 0;
  console.log(`  ${arabic} → ${db}: ${count} سيرة`);
}

// تحليل قيم اللغة الإنجليزية أيضاً
console.log('\n==============================================');
console.log('توزيع قيم اللغة الإنجليزية في الملف:');
console.log('==============================================');

const englishCounts = {};
const englishColumnNames = ['الإنجليزية', 'مستوى الإنجليزية', 'English', 'English Level', 'انجليزي', 'انجليزية'];

data.forEach((row) => {
  let englishValue = null;
  
  for (const colName of englishColumnNames) {
    if (row[colName] !== undefined && row[colName] !== null) {
      englishValue = String(row[colName]).trim();
      break;
    }
  }
  
  if (englishValue === '' || englishValue === null) {
    englishValue = 'فارغ/غير محدد';
  }
  
  englishCounts[englishValue] = (englishCounts[englishValue] || 0) + 1;
});

const sortedEnglish = Object.entries(englishCounts).sort((a, b) => b[1] - a[1]);
let totalEnglish = 0;

sortedEnglish.forEach(([value, count]) => {
  console.log(`  ${value}: ${count} سيرة ذاتية`);
  totalEnglish += count;
});

console.log('----------------------------------------------');
console.log('المجموع الكلي:', totalEnglish);

// عرض نماذج من البيانات
console.log('\n==============================================');
console.log('نماذج من أول 5 صفوف:');
console.log('==============================================');

for (let i = 0; i < Math.min(5, data.length); i++) {
  const row = data[i];
  let arabicVal = null;
  let englishVal = null;
  
  // إيجاد قيم اللغات
  for (const colName of arabicColumnNames) {
    if (row[colName] !== undefined && row[colName] !== null) {
      arabicVal = row[colName];
      break;
    }
  }
  
  for (const colName of englishColumnNames) {
    if (row[colName] !== undefined && row[colName] !== null) {
      englishVal = row[colName];
      break;
    }
  }
  
  console.log(`الصف ${i + 1}: العربية = "${arabicVal || 'غير موجود'}", الإنجليزية = "${englishVal || 'غير موجود'}"`);
}
