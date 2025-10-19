const XLSX = require('xlsx');
const fs = require('fs');

// قراءة ملف DUKA.xlsx بشكل تفصيلي
function readExcelDetailed() {
  try {
    console.log('\n🔍 قراءة ملف DUKA.xlsx بشكل تفصيلي...\n');
    
    const workbook = XLSX.readFile('DUKA.xlsx');
    console.log('📊 معلومات الملف:');
    console.log('=================');
    console.log(`عدد الأوراق (Sheets): ${workbook.SheetNames.length}`);
    console.log(`أسماء الأوراق: ${workbook.SheetNames.join(', ')}`);
    
    let totalRows = 0;
    let allArabicValues = [];
    
    // قراءة كل ورقة
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n📄 الورقة ${index + 1}: ${sheetName}`);
      console.log('------------------------');
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`   عدد الصفوف: ${data.length}`);
      totalRows += data.length;
      
      // جمع قيم مستوى العربية من هذه الورقة
      const arabicValues = data.map(row => row['مستوى العربية'] || 'غير محدد');
      allArabicValues = allArabicValues.concat(arabicValues);
      
      // عرض عينة من البيانات
      if (data.length > 0) {
        console.log(`   عينة من البيانات (أول 3 صفوف):`);
        for (let i = 0; i < Math.min(3, data.length); i++) {
          const arabicLevel = data[i]['مستوى العربية'] || 'غير محدد';
          const name = data[i]['الاسم الكامل'] || 'بدون اسم';
          console.log(`      ${i+1}. ${name} - مستوى العربية: ${arabicLevel}`);
        }
      }
    });
    
    console.log('\n');
    console.log('====================================');
    console.log('📊 إحصائيات مستوى اللغة العربية');
    console.log('====================================\n');
    
    console.log(`📌 إجمالي الصفوف في كل الأوراق: ${totalRows}`);
    console.log(`📌 إجمالي القيم المقروءة: ${allArabicValues.length}\n`);
    
    // حساب القيم
    const arabicLevelCount = {};
    allArabicValues.forEach(value => {
      if (!arabicLevelCount[value]) {
        arabicLevelCount[value] = 0;
      }
      arabicLevelCount[value]++;
    });
    
    // عرض النتائج
    const sortedValues = Object.entries(arabicLevelCount)
      .sort((a, b) => b[1] - a[1]);
    
    console.log('📊 عدد كل قيمة في فلتر اللغة العربية:\n');
    sortedValues.forEach(([value, count]) => {
      const percentage = ((count / allArabicValues.length) * 100).toFixed(1);
      console.log(`   ${value.padEnd(20, ' ')} : ${count.toString().padEnd(4, ' ')} (${percentage}%)`);
    });
    
    console.log('\n────────────────────────────────────');
    console.log(`   الإجمالي الكلي          : ${allArabicValues.length}`);
    console.log('────────────────────────────────────\n');
    
    // التحقق من القيم المحتملة
    console.log('🔍 البحث عن القيم المحتملة:\n');
    const possibleValues = ['ممتاز', 'جيد', 'ضعيف', 'لا', 'نعم', 'مستعدة للتعلم', 'Unkonwn', 'غير محدد', 'YES', 'NO', 'GOOD', 'EXCELLENT', 'WEAK'];
    possibleValues.forEach(value => {
      const count = arabicLevelCount[value] || 0;
      if (count > 0) {
        console.log(`   ✅ "${value}": ${count}`);
      }
    });
    
    // عرض كل القيم الفريدة الموجودة
    console.log('\n📝 جميع القيم الفريدة الموجودة في البيانات:');
    console.log('──────────────────────────────────────────');
    Object.keys(arabicLevelCount).forEach(value => {
      console.log(`   • "${value}": ${arabicLevelCount[value]}`);
    });
    
    // حفظ النتائج في ملف
    const results = {
      totalRows: totalRows,
      totalValues: allArabicValues.length,
      counts: arabicLevelCount,
      uniqueValues: Object.keys(arabicLevelCount),
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('arabic-level-analysis.json', JSON.stringify(results, null, 2), 'utf-8');
    console.log('\n💾 تم حفظ النتائج في ملف: arabic-level-analysis.json');
    
  } catch (error) {
    console.error('❌ خطأ في قراءة الملف:', error.message);
    console.error('تفاصيل الخطأ:', error);
  }
}

readExcelDetailed();
