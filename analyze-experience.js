const XLSX = require('xlsx');
const fs = require('fs');

// قراءة وتحليل بيانات الخبرة من ملف DUKA.xlsx
function analyzeExperience() {
  try {
    console.log('\n🔍 تحليل بيانات الخبرة من ملف DUKA.xlsx...\n');
    
    const workbook = XLSX.readFile('DUKA.xlsx');
    console.log('📊 معلومات الملف:');
    console.log('=================');
    console.log(`عدد الأوراق: ${workbook.SheetNames.length}`);
    
    let totalRows = 0;
    let allExperienceValues = [];
    
    // قراءة كل ورقة
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n📄 الورقة ${index + 1}: ${sheetName}`);
      console.log('------------------------');
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`   عدد الصفوف: ${data.length}`);
      totalRows += data.length;
      
      // عرض أسماء الأعمدة المتاحة للخبرة
      if (data.length > 0 && index === 0) {
        console.log('\n   📋 أسماء الأعمدة المتعلقة بالخبرة:');
        const columns = Object.keys(data[0]);
        columns.forEach((col, i) => {
          if (col.includes('خبر') || col.includes('سن') || col.includes('عام') ||
              col.toLowerCase().includes('experience') || col.toLowerCase().includes('year')) {
            console.log(`      ${i+1}. "${col}"`);
          }
        });
        
        console.log('\n   📋 جميع الأعمدة المتاحة:');
        columns.forEach((col, i) => {
          console.log(`      ${i+1}. "${col}"`);
        });
      }
      
      // جمع قيم الخبرة من هذه الورقة
      const experienceValues = data.map(row => {
        // البحث عن أعمدة الخبرة المحتملة
        return row['الخبرة في الخارج'] || 
               row['الخبرة'] || 
               row['سنوات الخبرة'] ||
               row['عدد سنوات الخبرة'] ||
               row['Experience'] || 
               row['Years of Experience'] ||
               row['خبرة'] ||
               'غير محدد'
      });
      
      allExperienceValues = allExperienceValues.concat(experienceValues);
      
      // عرض عينة من البيانات
      if (data.length > 0) {
        console.log(`\n   📝 عينة من بيانات الخبرة (أول 10 صفوف):`);
        for (let i = 0; i < Math.min(10, data.length); i++) {
          const experienceValue = experienceValues[i];
          const name = data[i]['الاسم الكامل'] || 'بدون اسم';
          console.log(`      ${i+1}. ${name} - الخبرة: "${experienceValue}"`);
        }
      }
    });
    
    console.log('\n');
    console.log('====================================');
    console.log('📊 إحصائيات الخبرة');
    console.log('====================================\n');
    
    console.log(`📌 إجمالي الصفوف: ${totalRows}`);
    console.log(`📌 إجمالي القيم المقروءة: ${allExperienceValues.length}\n`);
    
    // حساب القيم الفريدة
    const experienceCount = {};
    const yearsCount = {
      'بدون خبرة': 0,
      '1-2 سنة': 0,
      '3-5 سنوات': 0,
      '6-10 سنوات': 0,
      'أكثر من 10 سنوات': 0,
      'غير واضح': 0
    };
    
    allExperienceValues.forEach(value => {
      const normalizedValue = value ? value.toString().trim() : 'فارغ';
      if (!experienceCount[normalizedValue]) {
        experienceCount[normalizedValue] = 0;
      }
      experienceCount[normalizedValue]++;
      
      // تصنيف حسب السنوات
      const cleanValue = normalizedValue.toLowerCase();
      
      // استخراج الأرقام من النص
      const numbers = cleanValue.match(/\d+/g);
      let years = 0;
      
      if (numbers && numbers.length > 0) {
        years = parseInt(numbers[0]);
      }
      
      // تصنيف السنوات
      if (cleanValue === 'غير محدد' || cleanValue === 'فارغ' || cleanValue === '') {
        yearsCount['غير واضح']++;
      } else if (cleanValue.includes('لا') || cleanValue.includes('no') || years === 0) {
        yearsCount['بدون خبرة']++;
      } else if (years <= 2) {
        yearsCount['1-2 سنة']++;
      } else if (years <= 5) {
        yearsCount['3-5 سنوات']++;
      } else if (years <= 10) {
        yearsCount['6-10 سنوات']++;
      } else if (years > 10) {
        yearsCount['أكثر من 10 سنوات']++;
      } else {
        yearsCount['غير واضح']++;
      }
    });
    
    // عرض النتائج
    const sortedValues = Object.entries(experienceCount)
      .sort((a, b) => b[1] - a[1]);
    
    console.log('📊 عدد كل قيمة في حقل الخبرة:\n');
    // عرض أول 20 قيمة فقط
    sortedValues.slice(0, 20).forEach(([value, count]) => {
      const percentage = ((count / allExperienceValues.length) * 100).toFixed(1);
      console.log(`   "${value}": ${count} (${percentage}%)`);
    });
    
    if (sortedValues.length > 20) {
      console.log(`   ... و ${sortedValues.length - 20} قيم أخرى`);
    }
    
    console.log('\n────────────────────────────────────');
    console.log(`   الإجمالي الكلي: ${allExperienceValues.length}`);
    console.log('────────────────────────────────────\n');
    
    // عرض التصنيف حسب السنوات
    console.log('📊 التصنيف حسب سنوات الخبرة:\n');
    Object.entries(yearsCount).forEach(([category, count]) => {
      const percentage = ((count / totalRows) * 100).toFixed(1);
      console.log(`   ${category}: ${count} (${percentage}%)`);
    });
    
    // عرض كل القيم الفريدة
    console.log('\n📝 عدد القيم الفريدة: ' + Object.keys(experienceCount).length);
    
    // حفظ النتائج في ملف
    const results = {
      totalRows: totalRows,
      totalValues: allExperienceValues.length,
      counts: experienceCount,
      uniqueValues: Object.keys(experienceCount),
      yearCategories: yearsCount,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('experience-analysis.json', JSON.stringify(results, null, 2), 'utf-8');
    console.log('\n💾 تم حفظ النتائج في ملف: experience-analysis.json');
    
  } catch (error) {
    console.error('❌ خطأ في قراءة الملف:', error.message);
    console.error('تفاصيل الخطأ:', error);
  }
}

analyzeExperience();
