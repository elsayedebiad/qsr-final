const XLSX = require('xlsx');

// قراءة ملف DUKA.xlsx وحساب القيم
function countLanguageValues() {
  try {
    const workbook = XLSX.readFile('DUKA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // تحويل الشيت إلى JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('\n====================================');
    console.log('إحصائيات فلتر اللغة العربية');
    console.log('====================================\n');
    
    // حساب القيم لعمود "مستوى العربية"
    const arabicLevelCount = {};
    let totalCount = 0;
    
    data.forEach((row) => {
      const arabicLevel = row['مستوى العربية'] || 'غير محدد';
      
      if (!arabicLevelCount[arabicLevel]) {
        arabicLevelCount[arabicLevel] = 0;
      }
      arabicLevelCount[arabicLevel]++;
      totalCount++;
    });
    
    // عرض النتائج مرتبة
    const sortedValues = Object.entries(arabicLevelCount)
      .sort((a, b) => b[1] - a[1]); // ترتيب تنازلي حسب العدد
    
    console.log('📊 عدد كل قيمة في فلتر اللغة العربية:\n');
    sortedValues.forEach(([value, count]) => {
      const percentage = ((count / totalCount) * 100).toFixed(1);
      console.log(`   ${value.padEnd(20, ' ')} : ${count} (${percentage}%)`);
    });
    
    console.log('\n────────────────────────────────────');
    console.log(`   الإجمالي                : ${totalCount}`);
    console.log('────────────────────────────────────\n');
    
    // إحصائيات إضافية
    console.log('📈 إحصائيات إضافية:\n');
    console.log(`   عدد القيم الفريدة: ${Object.keys(arabicLevelCount).length}`);
    console.log(`   القيمة الأكثر شيوعاً: ${sortedValues[0][0]} (${sortedValues[0][1]} مرة)`);
    console.log(`   القيمة الأقل شيوعاً: ${sortedValues[sortedValues.length - 1][0]} (${sortedValues[sortedValues.length - 1][1]} مرة)`);
    
    // التحقق من وجود قيم خاصة
    console.log('\n🔍 القيم الموجودة في البيانات:\n');
    const specialValues = ['ممتاز', 'جيد', 'ضعيف', 'لا', 'نعم', 'مستعدة للتعلم', 'Unkonwn', 'غير محدد'];
    specialValues.forEach(value => {
      if (arabicLevelCount[value]) {
        console.log(`   ✅ ${value}: ${arabicLevelCount[value]}`);
      } else {
        console.log(`   ❌ ${value}: غير موجود`);
      }
    });
    
  } catch (error) {
    console.error('خطأ في قراءة الملف:', error.message);
    console.log('\n💡 تأكد من وجود ملف DUKA.xlsx في المجلد الحالي');
  }
}

countLanguageValues();
