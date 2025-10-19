const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function simpleImport() {
  try {
    console.log('📖 قراءة ملف DUKA.xlsx...');
    
    const workbook = XLSX.readFile('DUKA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 تم العثور على ${data.length} صف`);
    
    // إدراج أول 10 صفوف كاختبار
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      
      try {
        const arabicRaw = row['مستوى العربية'] || row['العربية'];
        const englishRaw = row['مستوى الإنجليزية'] || row['الإنجليزية'];
        
        console.log(`الصف ${i + 1}:`);
        console.log(`  الاسم: ${row['الاسم الكامل']}`);
        console.log(`  العربية (خام): ${arabicRaw}`);
        console.log(`  الإنجليزية (خام): ${englishRaw}`);
        
        const arabicLevel = processLanguage(arabicRaw);
        const englishLevel = processLanguage(englishRaw);
        
        console.log(`  العربية (معالج): ${arabicLevel}`);
        console.log(`  الإنجليزية (معالج): ${englishLevel}`);
        
        const cvData = {
          fullName: row['الاسم الكامل'] || `CV-${i + 1}`,
          fullNameArabic: row['الاسم بالعربية'] || null,
          referenceCode: row['رمز المرجع'] || null,
          nationality: row['الجنسية'] || null,
          religion: row['الديانة'] || null,
          age: parseInt(row['العمر']) || null,
          arabicLevel: arabicLevel,
          englishLevel: englishLevel,
          educationLevel: row['التعليم'] || null,
          babySitting: processSkill(row['رعاية الأطفال']),
          cleaning: processSkill(row['التنظيف']),
          driving: processSkill(row['القيادة']),
          status: 'ACTIVE'
        };
        
        const result = await prisma.cV.create({
          data: cvData
        });
        
        console.log(`✅ تم إدراج السيرة الذاتية رقم ${result.id}`);
        console.log('---');
        
      } catch (error) {
        console.log(`❌ خطأ في الصف ${i + 1}: ${error.message}`);
      }
    }
    
    // التحقق من النتائج
    const count = await prisma.cV.count();
    console.log(`\n📊 إجمالي السير الذاتية: ${count}`);
    
    const arabicStats = await prisma.cV.groupBy({
      by: ['arabicLevel'],
      _count: true
    });
    
    console.log('\n📈 إحصائيات اللغة العربية:');
    arabicStats.forEach(stat => {
      console.log(`  ${stat.arabicLevel}: ${stat._count}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function processLanguage(value) {
  if (!value) return null;
  
  const normalized = value.toString().trim();
  
  if (normalized === 'لا') return 'NO';
  if (normalized === 'جيد') return 'WILLING';
  if (normalized === 'ممتاز') return 'YES';
  
  return 'NO';
}

function processSkill(value) {
  if (!value) return null;
  
  const normalized = value.toString().trim();
  
  if (normalized === 'نعم') return 'YES';
  if (normalized === 'لا') return 'NO';
  if (normalized === 'مستعدة للتعلم') return 'WILLING';
  
  return null;
}

simpleImport();