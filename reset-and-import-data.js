const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

// إعادة تعيين البيانات وإعادة الاستيراد
async function resetAndImportData() {
  try {
    console.log('🔄 بدء عملية إعادة تعيين البيانات...\n');
    
    // 1. حذف جميع السير الذاتية الموجودة
    console.log('🗑️ حذف البيانات القديمة...');
    const deleteResult = await prisma.cV.deleteMany({});
    console.log(`✅ تم حذف ${deleteResult.count} سيرة ذاتية قديمة\n`);
    
    // 2. قراءة ملف Excel
    console.log('📖 قراءة ملف DUKA.xlsx...');
    const workbook = XLSX.readFile('DUKA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 تم العثور على ${data.length} صف في الملف\n`);
    
    // 3. معالجة البيانات وإدراجها
    console.log('⚙️ معالجة البيانات وإدراجها...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // معالجة البيانات الأساسية
        const processedData = {
          fullName: row['الاسم الكامل'] || `CV-${i + 1}`,
          fullNameArabic: row['الاسم بالعربية'] || null,
          referenceCode: row['رمز المرجع'] || null,
          email: row['البريد الإلكتروني'] || null,
          phone: row['رقم الهاتف'] || null,
          monthlySalary: row['الراتب الشهري'] || null,
          contractPeriod: row['فترة العقد'] || null,
          position: row['المنصب'] || null,
          passportNumber: row['رقم جواز السفر'] || null,
          nationality: row['الجنسية'] || null,
          religion: row['الديانة'] || null,
          age: parseInt(row['العمر']) || null,
          numberOfChildren: parseInt(row['عدد الأطفال']) || null,
          weight: row['الوزن'] || null,
          height: row['الطول'] || null,
          complexion: row['لون البشرة'] || null,
          
          // معالجة اللغة الإنجليزية
          englishLevel: processLanguageLevel(
            row['مستوى الإنجليزية'] || row['الإنجليزية'] || row['English'] || row['English Level']
          ),
          
          // معالجة اللغة العربية
          arabicLevel: processLanguageLevel(
            row['مستوى العربية'] || row['العربية'] || row['Arabic'] || row['Arabic Level']
          ),
          
          // معالجة المستوى التعليمي
          educationLevel: row['الدرجة العلمية'] || row['التعليم'] || null,
          education: row['التعليم'] || null,
          
          // معالجة المهارات
          babySitting: normalizeSkillLevel(row['رعاية الأطفال']),
          childrenCare: normalizeSkillLevel(row['رعاية الأطفال المتقدمة']),
          tutoring: normalizeSkillLevel(row['التدريس']),
          disabledCare: normalizeSkillLevel(row['رعاية ذوي الاحتياجات الخاصة']),
          cleaning: normalizeSkillLevel(row['التنظيف']),
          washing: normalizeSkillLevel(row['الغسيل']),
          ironing: normalizeSkillLevel(row['الكي']),
          arabicCooking: normalizeSkillLevel(row['الطبخ العربي']),
          sewing: normalizeSkillLevel(row['الخياطة']),
          driving: normalizeSkillLevel(row['القيادة']),
          
          // بيانات إضافية
          experience: row['الخبرة السابقة'] || null,
          skills: row['المهارات'] || null,
          summary: row['الملخص'] || null,
          notes: row['ملاحظات'] || null,
          profileImage: row['رابط الصورة الشخصية'] || null,
          cvImageUrl: row['صورة السيرة'] || null,
          videoLink: row['رابط الفيديو'] || null,
          
          // حالة السيرة الذاتية
          status: 'ACTIVE',
          priority: normalizePriority(row['الأولوية']),
          source: 'EXCEL_IMPORT'
        };
        
        // إدراج البيانات في قاعدة البيانات
        await prisma.cV.create({
          data: processedData
        });
        
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`✅ تم إدراج ${successCount} سيرة ذاتية...`);
        }
        
      } catch (error) {
        errorCount++;
        console.log(`❌ خطأ في الصف ${i + 1}: ${error.message}`);
      }
    }
    
    console.log('\n📈 نتائج الاستيراد:');
    console.log(`✅ تم إدراج ${successCount} سيرة ذاتية بنجاح`);
    console.log(`❌ فشل في إدراج ${errorCount} سيرة ذاتية`);
    
    // 4. التحقق من النتائج
    console.log('\n🔍 التحقق من النتائج...');
    
    const totalCVs = await prisma.cV.count();
    console.log(`📊 إجمالي السير الذاتية في قاعدة البيانات: ${totalCVs}`);
    
    // إحصائيات اللغة
    const arabicStats = await prisma.cV.groupBy({
      by: ['arabicLevel'],
      _count: true,
      where: {
        arabicLevel: {
          not: null
        }
      }
    });
    
    const englishStats = await prisma.cV.groupBy({
      by: ['englishLevel'],
      _count: true,
      where: {
        englishLevel: {
          not: null
        }
      }
    });
    
    console.log('\n📈 إحصائيات اللغة العربية:');
    arabicStats.forEach(stat => {
      console.log(`   ${stat.arabicLevel}: ${stat._count}`);
    });
    
    console.log('\n📈 إحصائيات اللغة الإنجليزية:');
    englishStats.forEach(stat => {
      console.log(`   ${stat.englishLevel}: ${stat._count}`);
    });
    
    console.log('\n✅ تمت عملية إعادة التعيين والاستيراد بنجاح!');
    console.log('\n💡 الآن يمكنك اختبار الفلاتر في صفحات Sales');
    
  } catch (error) {
    console.error('❌ خطأ في عملية إعادة التعيين:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// دوال المعالجة
function processLanguageLevel(rawValue) {
  if (!rawValue) return null;
  
  const normalized = rawValue.toString().trim();
  
  if (normalized === 'لا' || normalized === 'غير متاح') return 'NO';
  if (normalized === 'ضعيف') return 'NO';
  if (normalized === 'متوسط' || normalized === 'مقبول') return 'WILLING';
  if (normalized === 'نعم' || normalized === 'ممتاز') return 'YES';
  if (normalized === 'جيد') return 'WILLING';
  
  return 'NO';
}

function normalizeSkillLevel(value) {
  if (!value) return null;
  
  const s = value.toString().toLowerCase().trim();
  
  if (['yes', 'نعم', 'y', 'ممتاز'].includes(s)) return 'YES';
  if (['no', 'لا', 'n', 'ضعيف', 'غير متاح'].includes(s)) return 'NO';
  if (['willing', 'مستعد', 'مستعدة', 'متوسط', 'مقبول', 'جيد', 'مستعدة للتعلم'].includes(s)) return 'WILLING';
  
  return null;
}

function normalizePriority(value) {
  if (!value) return 'MEDIUM';
  
  const s = value.toString().toLowerCase().trim();
  
  if (['high', 'عالي', 'عالية', 'urgent', 'عاجل'].includes(s)) return 'HIGH';
  if (['low', 'منخفض', 'منخفضة'].includes(s)) return 'LOW';
  
  return 'MEDIUM';
}

resetAndImportData();