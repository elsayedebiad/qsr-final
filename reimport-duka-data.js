const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

// دالة تحويل مستوى اللغة (نفس الدالة في الكود)
function mapLanguageLevel(level) {
  if (!level) return 'NONE';
  
  const normalizedLevel = level.toString().trim().toLowerCase();
  
  // خريطة تحويل القيم العربية
  const arabicLevelMap = {
    'ممتاز': 'YES',
    'جيد': 'WILLING',
    'ضعيف': 'NO',
    'لا': 'NONE',
    'نعم': 'YES',
    'مستعد': 'WILLING',
    'مستعدة': 'WILLING',
    'مستعدة للتعلم': 'WILLING'
  };
  
  // خريطة تحويل القيم الإنجليزية
  const englishLevelMap = {
    'excellent': 'YES',
    'good': 'WILLING',
    'weak': 'NO',
    'poor': 'NO',
    'no': 'NONE',
    'none': 'NONE',
    'yes': 'YES',
    'willing': 'WILLING'
  };
  
  // البحث في القيم العربية أولاً
  if (arabicLevelMap[level]) {
    return arabicLevelMap[level];
  }
  
  // ثم البحث في القيم الإنجليزية
  if (englishLevelMap[normalizedLevel]) {
    return englishLevelMap[normalizedLevel];
  }
  
  // إذا لم توجد قيمة، نعتبرها "لا"
  return 'NONE';
}

// دالة تحويل مستوى المهارة
function mapSkillLevel(level) {
  if (!level) return 'NO';
  const levelMap = {
    'نعم': 'YES',
    'لا': 'NO',
    'مستعد': 'WILLING',
    'مستعدة': 'WILLING',
    'مستعدة للتعلم': 'WILLING'
  };
  return levelMap[level] || 'NO';
}

// دالة تحويل الحالة الاجتماعية
function mapMaritalStatus(status) {
  if (!status) return null;
  const statusMap = {
    'أعزب': 'SINGLE',
    'عزباء': 'SINGLE',
    'متزوج': 'MARRIED',
    'متزوجة': 'MARRIED',
    'مطلق': 'DIVORCED',
    'مطلقة': 'DIVORCED',
    'أرمل': 'WIDOWED',
    'أرملة': 'WIDOWED'
  };
  return statusMap[status] || 'SINGLE';
}

// دالة تحويل التاريخ من Excel
function excelDateToString(excelDate) {
  if (!excelDate) return null;
  if (typeof excelDate === 'string') return excelDate;
  if (excelDate === 'Unkonwn' || excelDate === 'Unknown') return null;
  
  // Excel يستخدم عدد الأيام منذ 1900-01-01
  try {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0]; // إرجاع التاريخ بتنسيق YYYY-MM-DD
  } catch {
    return null;
  }
}

// دالة تحويل الأولوية
function mapPriority(priority) {
  if (!priority) return 'MEDIUM';
  const priorityMap = {
    'منخفض': 'LOW',
    'منخفضة': 'LOW',
    'متوسط': 'MEDIUM',
    'متوسطة': 'MEDIUM',
    'عالي': 'HIGH',
    'عالية': 'HIGH',
    'عاجل': 'URGENT',
    'عاجلة': 'URGENT'
  };
  return priorityMap[priority] || 'MEDIUM';
}

async function reimportData() {
  try {
    console.log('\n🔄 بدء إعادة استيراد البيانات من DUKA.xlsx...\n');
    
    // قراءة ملف Excel
    const workbook = XLSX.readFile('DUKA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 عدد السير الذاتية للاستيراد: ${data.length}\n`);
    
    // حذف البيانات الحالية
    console.log('🗑️ حذف البيانات الحالية...');
    await prisma.cV.deleteMany({});
    console.log('✅ تم حذف البيانات القديمة\n');
    
    // استيراد البيانات الجديدة
    console.log('📥 استيراد البيانات الجديدة...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        const cvData = {
          referenceCode: row['رمز المرجع'] || `AUTO-${Date.now()}`,
          fullName: row['الاسم الكامل'] || 'Unknown',
          fullNameArabic: row['الاسم بالعربية'] || 'غير محدد',
          email: row['البريد الإلكتروني'] || null,
          phone: row['رقم الهاتف'] ? String(row['رقم الهاتف']) : null,
          monthlySalary: row['الراتب الشهري'] ? String(row['الراتب الشهري']) : null,
          contractPeriod: row['فترة العقد'] || null,
          position: row['المنصب'] || null,
          passportNumber: row['رقم جواز السفر'] || null,
          passportIssueDate: excelDateToString(row['تاريخ إصدار الجواز']),
          passportExpiryDate: excelDateToString(row['تاريخ انتهاء الجواز']),
          passportIssuePlace: row['مكان إصدار الجواز'] || null,
          nationality: row['الجنسية'] || null,
          religion: row['الديانة'] || null,
          dateOfBirth: excelDateToString(row['تاريخ الميلاد']),
          placeOfBirth: row['مكان الميلاد'] || null,
          livingTown: row['مكان السكن'] || null,
          maritalStatus: mapMaritalStatus(row['الحالة الاجتماعية']),
          numberOfChildren: parseInt(row['عدد الأطفال']) || 0,
          weight: row['الوزن'] || null,
          height: row['الطول'] || null,
          complexion: row['لون البشرة'] || null,
          age: parseInt(row['العمر']) || null,
          
          // تحويل مستويات اللغة باستخدام الدالة الجديدة
          englishLevel: mapLanguageLevel(row['مستوى الإنجليزية']),
          arabicLevel: mapLanguageLevel(row['مستوى العربية']),
          
          // تحويل المهارات
          babySitting: mapSkillLevel(row['رعاية الأطفال']),
          childrenCare: mapSkillLevel(row['رعاية الأطفال المتقدمة']),
          tutoring: mapSkillLevel(row['التدريس']),
          disabledCare: mapSkillLevel(row['رعاية ذوي الاحتياجات الخاصة']),
          cleaning: mapSkillLevel(row['التنظيف']),
          washing: mapSkillLevel(row['الغسيل']),
          ironing: mapSkillLevel(row['الكي']),
          arabicCooking: mapSkillLevel(row['الطبخ العربي']),
          sewing: mapSkillLevel(row['الخياطة']),
          driving: mapSkillLevel(row['القيادة']),
          
          previousEmployment: row['الخبرة السابقة'] || null,
          experience: row['الخبرة'] || null,
          education: row['التعليم'] || null,
          skills: row['المهارات'] || null,
          summary: row['الملخص'] || null,
          priority: mapPriority(row['الأولوية']),
          notes: row['ملاحظات'] || null,
          videoLink: row['رابط الفيديو'] || null,
          profileImage: row['رابط الصورة الشخصية'] || null,
          cvImageUrl: row['صورة السيرة'] || null,
          status: 'NEW',
          createdById: 1  // معرف المستخدم الافتراضي
        };
        
        await prisma.cV.create({ data: cvData });
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`   تم استيراد ${successCount} سيرة...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ خطأ في استيراد السيرة ${row['رمز المرجع']}: ${error.message}`);
      }
    }
    
    console.log('\n✅ اكتمل الاستيراد!');
    console.log(`   • سير ناجحة: ${successCount}`);
    console.log(`   • أخطاء: ${errorCount}`);
    
    // عرض إحصائيات اللغة بعد الاستيراد
    console.log('\n📊 إحصائيات مستوى اللغة بعد الاستيراد:');
    
    const arabicStats = await prisma.cV.groupBy({
      by: ['arabicLevel'],
      _count: true
    });
    
    console.log('\n   اللغة العربية:');
    arabicStats.forEach(stat => {
      const label = {
        'YES': 'ممتاز',
        'WILLING': 'جيد',
        'NO': 'ضعيف',
        'NONE': 'لا'
      }[stat.arabicLevel] || stat.arabicLevel;
      console.log(`      ${label}: ${stat._count}`);
    });
    
    const englishStats = await prisma.cV.groupBy({
      by: ['englishLevel'],
      _count: true
    });
    
    console.log('\n   اللغة الإنجليزية:');
    englishStats.forEach(stat => {
      const label = {
        'YES': 'ممتاز',
        'WILLING': 'جيد',
        'NO': 'ضعيف',
        'NONE': 'لا'
      }[stat.englishLevel] || stat.englishLevel;
      console.log(`      ${label}: ${stat._count}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reimportData();
