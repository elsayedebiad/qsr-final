const XLSX = require('xlsx');

// محاكاة عملية الاستيراد لاختبار معالجة البيانات
function testImportProcess() {
  try {
    console.log('🔍 اختبار عملية معالجة البيانات من ملف DUKA.xlsx...\n');
    
    // قراءة الملف
    const workbook = XLSX.readFile('DUKA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // تحويل إلى JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 تم العثور على ${data.length} صف في الملف\n`);
    
    // اختبار معالجة أول 3 صفوف
    for (let i = 0; i < Math.min(3, data.length); i++) {
      const row = data[i];
      console.log(`🔸 الصف ${i + 1}:`);
      console.log(`   الاسم: ${row['الاسم الكامل'] || 'غير محدد'}`);
      
      // اختبار معالجة اللغة الإنجليزية
      const englishRaw = row['مستوى الإنجليزية'] || row['الإنجليزية'] || row['English'] || row['English Level'];
      console.log(`   مستوى الإنجليزية (خام): "${englishRaw}"`);
      
      const englishProcessed = processLanguageLevel(englishRaw);
      console.log(`   مستوى الإنجليزية (معالج): ${englishProcessed}`);
      
      // اختبار معالجة اللغة العربية
      const arabicRaw = row['مستوى العربية'] || row['العربية'] || row['Arabic'] || row['Arabic Level'];
      console.log(`   مستوى العربية (خام): "${arabicRaw}"`);
      
      const arabicProcessed = processLanguageLevel(arabicRaw);
      console.log(`   مستوى العربية (معالج): ${arabicProcessed}`);
      
      // اختبار معالجة المستوى التعليمي
      const educationRaw = row['الدرجة العلمية'] || row['التعليم'];
      console.log(`   المستوى التعليمي (خام): "${educationRaw}"`);
      
      const educationProcessed = processEducationLevel(educationRaw);
      console.log(`   المستوى التعليمي (معالج): ${educationProcessed}`);
      
      console.log('   ─────────────────────────────────────\n');
    }
    
    // إحصائيات شاملة
    console.log('📈 إحصائيات شاملة:');
    console.log('==================');
    
    const languageStats = {
      english: { YES: 0, NO: 0, WILLING: 0, undefined: 0 },
      arabic: { YES: 0, NO: 0, WILLING: 0, undefined: 0 }
    };
    
    const educationStats = {
      متعلم: 0,
      'غير متعلم': 0,
      undefined: 0
    };
    
    data.forEach(row => {
      // إحصائيات الإنجليزية
      const englishRaw = row['مستوى الإنجليزية'] || row['الإنجليزية'] || row['English'] || row['English Level'];
      const englishProcessed = processLanguageLevel(englishRaw);
      languageStats.english[englishProcessed || 'undefined']++;
      
      // إحصائيات العربية
      const arabicRaw = row['مستوى العربية'] || row['العربية'] || row['Arabic'] || row['Arabic Level'];
      const arabicProcessed = processLanguageLevel(arabicRaw);
      languageStats.arabic[arabicProcessed || 'undefined']++;
      
      // إحصائيات التعليم
      const educationRaw = row['الدرجة العلمية'] || row['التعليم'];
      const educationProcessed = processEducationLevel(educationRaw);
      educationStats[educationProcessed || 'undefined']++;
    });
    
    console.log('\n🌍 مستويات الإنجليزية:');
    console.log(`   ممتاز (YES): ${languageStats.english.YES}`);
    console.log(`   جيد (WILLING): ${languageStats.english.WILLING}`);
    console.log(`   ضعيف (NO): ${languageStats.english.NO}`);
    console.log(`   غير محدد: ${languageStats.english.undefined}`);
    
    console.log('\n🇸🇦 مستويات العربية:');
    console.log(`   ممتاز (YES): ${languageStats.arabic.YES}`);
    console.log(`   جيد (WILLING): ${languageStats.arabic.WILLING}`);
    console.log(`   ضعيف (NO): ${languageStats.arabic.NO}`);
    console.log(`   غير محدد: ${languageStats.arabic.undefined}`);
    
    console.log('\n🎓 المستويات التعليمية:');
    console.log(`   متعلم: ${educationStats.متعلم}`);
    console.log(`   غير متعلم: ${educationStats['غير متعلم']}`);
    console.log(`   غير محدد: ${educationStats.undefined}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

// دالة معالجة مستوى اللغة (نسخة من الكود الأصلي)
function processLanguageLevel(rawValue) {
  if (!rawValue) return undefined;
  
  const normalized = rawValue.toString().trim();
  
  if (normalized === 'لا' || normalized === 'غير متاح') return 'NO';
  if (normalized === 'ضعيف') return 'NO';
  if (normalized === 'متوسط' || normalized === 'مقبول') return 'WILLING';
  if (normalized === 'نعم' || normalized === 'ممتاز') return 'YES';
  if (normalized === 'جيد') return 'WILLING';
  
  return 'NO'; // افتراضي
}

// دالة معالجة المستوى التعليمي
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

testImportProcess();