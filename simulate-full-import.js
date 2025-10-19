const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// محاكاة عملية الرفع الكاملة
async function simulateFullImport() {
  try {
    console.log('🚀 بدء محاكاة عملية الرفع الكاملة...\n');
    
    // قراءة الملف
    const workbook = XLSX.readFile('DUKA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 تم العثور على ${data.length} صف في الملف\n`);
    
    // معالجة أول 5 صفوف كمثال
    const processedData = [];
    
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      
      const processedRow = {
        fullName: row['الاسم الكامل'] || 'غير محدد',
        fullNameArabic: row['الاسم بالعربية'] || null,
        referenceCode: row['رمز المرجع'] || null,
        nationality: row['الجنسية'] || null,
        religion: row['الديانة'] || null,
        age: parseInt(row['العمر']) || null,
        
        // معالجة اللغة الإنجليزية
        englishLevel: processLanguageLevel(
          row['مستوى الإنجليزية'] || row['الإنجليزية'] || row['English'] || row['English Level']
        ),
        
        // معالجة اللغة العربية
        arabicLevel: processLanguageLevel(
          row['مستوى العربية'] || row['العربية'] || row['Arabic'] || row['Arabic Level']
        ),
        
        // معالجة المستوى التعليمي
        educationLevel: row['الدرجة العلمية'] || row['التعليم'] || row['المؤهل العلمي'] || row['Education'] || null,
        
        // معالجة المهارات
        babySitting: normalizeSkillLevel(row['رعاية الأطفال']),
        cleaning: normalizeSkillLevel(row['التنظيف']),
        washing: normalizeSkillLevel(row['الغسيل']),
        ironing: normalizeSkillLevel(row['الكي']),
        arabicCooking: normalizeSkillLevel(row['الطبخ العربي']),
        sewing: normalizeSkillLevel(row['الخياطة']),
        driving: normalizeSkillLevel(row['القيادة']),
      };
      
      processedData.push(processedRow);
      
      console.log(`✅ الصف ${i + 1}: ${processedRow.fullName}`);
      console.log(`   🌍 الإنجليزية: ${processedRow.englishLevel || 'غير محدد'}`);
      console.log(`   🇸🇦 العربية: ${processedRow.arabicLevel || 'غير محدد'}`);
      console.log(`   🎓 التعليم: ${processedRow.educationLevel || 'غير محدد'}`);
      console.log(`   🧹 التنظيف: ${processedRow.cleaning || 'غير محدد'}`);
      console.log(`   👶 رعاية الأطفال: ${processedRow.babySitting || 'غير محدد'}`);
      console.log('   ─────────────────────────────────────\n');
    }
    
    // إحصائيات شاملة للملف كاملاً
    console.log('📈 إحصائيات شاملة للملف كاملاً:');
    console.log('=====================================\n');
    
    const stats = {
      english: { YES: 0, NO: 0, WILLING: 0, undefined: 0 },
      arabic: { YES: 0, NO: 0, WILLING: 0, undefined: 0 },
      education: { متعلم: 0, 'غير متعلم': 0, undefined: 0 },
      skills: {
        babySitting: { YES: 0, NO: 0, WILLING: 0, undefined: 0 },
        cleaning: { YES: 0, NO: 0, WILLING: 0, undefined: 0 },
        driving: { YES: 0, NO: 0, WILLING: 0, undefined: 0 }
      }
    };
    
    data.forEach(row => {
      // إحصائيات اللغة
      const englishLevel = processLanguageLevel(
        row['مستوى الإنجليزية'] || row['الإنجليزية'] || row['English'] || row['English Level']
      );
      stats.english[englishLevel || 'undefined']++;
      
      const arabicLevel = processLanguageLevel(
        row['مستوى العربية'] || row['العربية'] || row['Arabic'] || row['Arabic Level']
      );
      stats.arabic[arabicLevel || 'undefined']++;
      
      // إحصائيات التعليم
      const educationRaw = row['الدرجة العلمية'] || row['التعليم'] || row['المؤهل العلمي'] || row['Education'];
      const educationProcessed = processEducationLevel(educationRaw);
      stats.education[educationProcessed || 'undefined']++;
      
      // إحصائيات المهارات
      const babySitting = normalizeSkillLevel(row['رعاية الأطفال']);
      stats.skills.babySitting[babySitting || 'undefined']++;
      
      const cleaning = normalizeSkillLevel(row['التنظيف']);
      stats.skills.cleaning[cleaning || 'undefined']++;
      
      const driving = normalizeSkillLevel(row['القيادة']);
      stats.skills.driving[driving || 'undefined']++;
    });
    
    console.log('🌍 مستويات الإنجليزية:');
    console.log(`   ممتاز (YES): ${stats.english.YES}`);
    console.log(`   جيد (WILLING): ${stats.english.WILLING}`);
    console.log(`   ضعيف (NO): ${stats.english.NO}`);
    console.log(`   غير محدد: ${stats.english.undefined}\n`);
    
    console.log('🇸🇦 مستويات العربية:');
    console.log(`   ممتاز (YES): ${stats.arabic.YES}`);
    console.log(`   جيد (WILLING): ${stats.arabic.WILLING}`);
    console.log(`   ضعيف (NO): ${stats.arabic.NO}`);
    console.log(`   غير محدد: ${stats.arabic.undefined}\n`);
    
    console.log('🎓 المستويات التعليمية:');
    console.log(`   متعلم: ${stats.education.متعلم}`);
    console.log(`   غير متعلم: ${stats.education['غير متعلم']}`);
    console.log(`   غير محدد: ${stats.education.undefined}\n`);
    
    console.log('🧹 مهارة التنظيف:');
    console.log(`   ممتاز (YES): ${stats.skills.cleaning.YES}`);
    console.log(`   جيد (WILLING): ${stats.skills.cleaning.WILLING}`);
    console.log(`   ضعيف (NO): ${stats.skills.cleaning.NO}`);
    console.log(`   غير محدد: ${stats.skills.cleaning.undefined}\n`);
    
    console.log('👶 مهارة رعاية الأطفال:');
    console.log(`   ممتاز (YES): ${stats.skills.babySitting.YES}`);
    console.log(`   جيد (WILLING): ${stats.skills.babySitting.WILLING}`);
    console.log(`   ضعيف (NO): ${stats.skills.babySitting.NO}`);
    console.log(`   غير محدد: ${stats.skills.babySitting.undefined}\n`);
    
    console.log('🚗 مهارة القيادة:');
    console.log(`   ممتاز (YES): ${stats.skills.driving.YES}`);
    console.log(`   جيد (WILLING): ${stats.skills.driving.WILLING}`);
    console.log(`   ضعيف (NO): ${stats.skills.driving.NO}`);
    console.log(`   غير محدد: ${stats.skills.driving.undefined}\n`);
    
    console.log('✅ انتهت المحاكاة بنجاح!');
    console.log('\n💡 لتطبيق هذه النتائج على النظام:');
    console.log('   1. اذهب إلى صفحة الرفع الذكي: /dashboard/import-smart');
    console.log('   2. ارفع ملف DUKA.xlsx');
    console.log('   3. ستظهر هذه الإحصائيات في فلاتر صفحات Sales');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// دوال المعالجة (نسخة من الكود الأصلي)
function processLanguageLevel(rawValue) {
  if (!rawValue) return undefined;
  
  const normalized = rawValue.toString().trim();
  
  if (normalized === 'لا' || normalized === 'غير متاح') return 'NO';
  if (normalized === 'ضعيف') return 'NO';
  if (normalized === 'متوسط' || normalized === 'مقبول') return 'WILLING';
  if (normalized === 'نعم' || normalized === 'ممتاز') return 'YES';
  if (normalized === 'جيد') return 'WILLING';
  
  return 'NO';
}

function processEducationLevel(rawValue) {
  if (!rawValue) return undefined;
  
  const normalized = rawValue.toString().toLowerCase().trim();
  
  if (normalized === '' || 
      normalized.includes('غير متعلم') || 
      normalized.includes('أمي') ||
      normalized.includes('لا يقرأ') ||
      normalized.includes('لا يكتب')) {
    return 'غير متعلم';
  }
  
  return 'متعلم';
}

function normalizeSkillLevel(value) {
  if (!value) return undefined;
  
  const s = value.toString().toLowerCase().trim();
  
  if (['yes', 'نعم', 'y', 'ممتاز'].includes(s)) return 'YES';
  if (['no', 'لا', 'n', 'ضعيف', 'غير متاح'].includes(s)) return 'NO';
  if (['willing', 'مستعد', 'مستعدة', 'متوسط', 'مقبول', 'جيد', 'مستعدة للتعلم'].includes(s)) return 'WILLING';
  
  return undefined;
}

simulateFullImport();