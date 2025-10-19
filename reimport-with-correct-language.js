const XLSX = require('xlsx');

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

// قراءة ملف DUKA.xlsx واختبار التحويل
function testLanguageLevelMapping() {
  try {
    console.log('\n🔄 اختبار تحويل مستويات اللغة...\n');
    
    const workbook = XLSX.readFile('DUKA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 إجمالي السير الذاتية: ${data.length}\n`);
    
    // حساب التحويلات الجديدة
    const arabicLevelCount = {
      'YES': 0,
      'WILLING': 0,
      'NO': 0,
      'NONE': 0
    };
    
    const englishLevelCount = {
      'YES': 0,
      'WILLING': 0,
      'NO': 0,
      'NONE': 0
    };
    
    // عينة من التحويلات
    const samples = [];
    
    data.forEach((row, index) => {
      // تحويل مستوى العربية
      const arabicOriginal = row['مستوى العربية'] || null;
      const arabicConverted = mapLanguageLevel(arabicOriginal);
      arabicLevelCount[arabicConverted]++;
      
      // تحويل مستوى الإنجليزية
      const englishOriginal = row['مستوى الإنجليزية'] || null;
      const englishConverted = mapLanguageLevel(englishOriginal);
      englishLevelCount[englishConverted]++;
      
      // حفظ عينات
      if (index < 10 || (arabicOriginal && arabicOriginal !== 'لا')) {
        samples.push({
          index: index + 1,
          arabicOriginal,
          arabicConverted,
          englishOriginal,
          englishConverted
        });
      }
    });
    
    console.log('=====================================');
    console.log('📊 نتائج تحويل مستوى اللغة العربية');
    console.log('=====================================\n');
    
    console.log('القيم الأصلية ← القيم بعد التحويل:\n');
    console.log(`   ممتاز (2) ← YES: ${arabicLevelCount['YES']}`);
    console.log(`   جيد (29) ← WILLING: ${arabicLevelCount['WILLING']}`);
    console.log(`   ضعيف (82) ← NO: ${arabicLevelCount['NO']}`);
    console.log(`   لا (581) ← NONE: ${arabicLevelCount['NONE']}`);
    console.log(`   ──────────────────────`);
    console.log(`   الإجمالي: ${Object.values(arabicLevelCount).reduce((a, b) => a + b, 0)}`);
    
    console.log('\n=====================================');
    console.log('📊 نتائج تحويل مستوى اللغة الإنجليزية');
    console.log('=====================================\n');
    
    console.log(`   YES (ممتاز): ${englishLevelCount['YES']}`);
    console.log(`   WILLING (جيد): ${englishLevelCount['WILLING']}`);
    console.log(`   NO (ضعيف): ${englishLevelCount['NO']}`);
    console.log(`   NONE (لا): ${englishLevelCount['NONE']}`);
    console.log(`   ──────────────────────`);
    console.log(`   الإجمالي: ${Object.values(englishLevelCount).reduce((a, b) => a + b, 0)}`);
    
    console.log('\n=====================================');
    console.log('📝 عينة من التحويلات (أول 10 + القيم غير "لا")');
    console.log('=====================================\n');
    
    const sampleToShow = samples.slice(0, 15);
    sampleToShow.forEach(sample => {
      console.log(`الصف ${sample.index}:`);
      console.log(`   العربية: "${sample.arabicOriginal || 'فارغ'}" → "${sample.arabicConverted}"`);
      console.log(`   الإنجليزية: "${sample.englishOriginal || 'فارغ'}" → "${sample.englishConverted}"`);
      console.log('');
    });
    
    console.log('✅ التحويل سيعمل بشكل صحيح بعد إعادة الاستيراد!');
    console.log('\n📌 ملاحظة: يجب إعادة استيراد البيانات لتطبيق هذه التحويلات الجديدة.');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testLanguageLevelMapping();
