const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function importFromDataXlsx() {
  try {
    console.log('📖 قراءة ملف data.xlsx...');
    
    const workbook = XLSX.readFile('data.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 تم العثور على ${data.length} صف`);
    console.log('\n🔍 عينة من البيانات (أول صف):');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\n📋 الأعمدة الموجودة:');
    console.log(Object.keys(data[0] || {}).join(', '));
    
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n📥 بدء الاستيراد...\n');
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // استخراج البيانات من الملف (قم بتعديل أسماء الأعمدة حسب ملفك)
        const cvData = {
          // معلومات أساسية
          fullName: row['الاسم الكامل'] || row['الاسم'] || row['Name'] || `CV-${i + 1}`,
          fullNameArabic: row['الاسم بالعربية'] || row['الاسم الكامل'] || null,
          referenceCode: row['رمز المرجع'] || row['الكود'] || row['Code'] || `REF-${Date.now()}-${i}`,
          
          // الجنسية والديانة
          nationality: row['الجنسية'] || row['Nationality'] || null,
          religion: row['الديانة'] || row['Religion'] || null,
          
          // معلومات شخصية
          age: row['العمر'] ? parseInt(row['العمر']) : (row['Age'] ? parseInt(row['Age']) : null),
          maritalStatus: row['الحالة الاجتماعية'] || row['Marital Status'] || null,
          
          // المستوى التعليمي واللغات
          educationLevel: row['التعليم'] || row['المستوى التعليمي'] || row['Education'] || null,
          arabicLevel: processLanguage(row['مستوى العربية'] || row['العربية'] || row['Arabic']),
          englishLevel: processLanguage(row['مستوى الإنجليزية'] || row['الإنجليزية'] || row['English']),
          
          // الوظيفة والخبرة
          position: row['الوظيفة'] || row['Position'] || row['Job'] || null,
          experience: row['الخبرة'] || row['سنوات الخبرة'] || row['Experience'] || null,
          
          // المهارات
          babySitting: processSkill(row['رعاية الأطفال'] || row['Baby Sitting']),
          childrenCare: processSkill(row['العناية بالأطفال'] || row['Children Care']),
          cleaning: processSkill(row['التنظيف'] || row['Cleaning']),
          arabicCooking: processSkill(row['الطبخ العربي'] || row['Arabic Cooking']),
          driving: processSkill(row['القيادة'] || row['Driving']),
          washing: processSkill(row['الغسيل'] || row['Washing']),
          ironing: processSkill(row['الكي'] || row['Ironing']),
          tutoring: processSkill(row['التدريس'] || row['Tutoring']),
          disabledCare: processSkill(row['رعاية كبار السن'] || row['Disabled Care']),
          sewing: processSkill(row['الخياطة'] || row['Sewing']),
          
          // معلومات إضافية
          height: row['الطول'] ? parseInt(row['الطول']) : (row['Height'] ? parseInt(row['Height']) : null),
          weight: row['الوزن'] ? parseInt(row['الوزن']) : (row['Weight'] ? parseInt(row['Weight']) : null),
          livingTown: row['المنطقة'] || row['المدينة'] || row['City'] || null,
          
          // روابط الصور والفيديو
          cvImageUrl: row['رابط الصورة'] || row['Image URL'] || row['صورة'] || null,
          videoLink: row['رابط الفيديو'] || row['Video Link'] || row['فيديو'] || null,
          
          // الحالة
          status: 'ACTIVE'
        };
        
        // إنشاء السيرة الذاتية
        const result = await prisma.cV.create({
          data: cvData
        });
        
        successCount++;
        console.log(`✅ [${successCount}/${data.length}] تم إدراج: ${cvData.fullName} (${cvData.referenceCode})`);
        
      } catch (error) {
        errorCount++;
        console.log(`❌ خطأ في الصف ${i + 1} (${row['الاسم الكامل'] || row['Name'] || 'غير معروف'}): ${error.message}`);
      }
    }
    
    // عرض الإحصائيات النهائية
    console.log('\n' + '='.repeat(50));
    console.log('📊 إحصائيات الاستيراد:');
    console.log('='.repeat(50));
    console.log(`✅ نجح: ${successCount}`);
    console.log(`❌ فشل: ${errorCount}`);
    console.log(`📝 إجمالي: ${data.length}`);
    
    const totalCVs = await prisma.cV.count();
    console.log(`\n📚 إجمالي السير الذاتية في قاعدة البيانات: ${totalCVs}`);
    
    // إحصائيات اللغات
    console.log('\n📈 إحصائيات اللغة العربية:');
    const arabicStats = await prisma.cV.groupBy({
      by: ['arabicLevel'],
      _count: true
    });
    arabicStats.forEach(stat => {
      console.log(`  ${stat.arabicLevel || 'null'}: ${stat._count}`);
    });
    
    console.log('\n📈 إحصائيات اللغة الإنجليزية:');
    const englishStats = await prisma.cV.groupBy({
      by: ['englishLevel'],
      _count: true
    });
    englishStats.forEach(stat => {
      console.log(`  ${stat.englishLevel || 'null'}: ${stat._count}`);
    });
    
    console.log('\n✅ تم الاستيراد بنجاح!');
    
  } catch (error) {
    console.error('\n❌ خطأ عام:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// دوال مساعدة
function processLanguage(value) {
  if (!value) return null;
  
  const normalized = value.toString().trim().toLowerCase();
  
  // معالجة القيم العربية
  if (normalized === 'لا' || normalized === 'no') return 'NO';
  if (normalized === 'جيد' || normalized === 'good' || normalized === 'مستعدة للتعلم') return 'WILLING';
  if (normalized === 'ممتاز' || normalized === 'نعم' || normalized === 'excellent' || normalized === 'yes') return 'YES';
  if (normalized === 'ضعيف' || normalized === 'weak') return 'WEAK';
  
  return 'NO';
}

function processSkill(value) {
  if (!value) return null;
  
  const normalized = value.toString().trim().toLowerCase();
  
  if (normalized === 'نعم' || normalized === 'yes') return 'YES';
  if (normalized === 'لا' || normalized === 'no') return 'NO';
  if (normalized === 'مستعدة للتعلم' || normalized === 'willing') return 'WILLING';
  
  return null;
}

// تشغيل الاستيراد
console.log('🚀 بدء استيراد البيانات من data.xlsx...\n');
importFromDataXlsx();
