const XLSX = require('xlsx');
const fs = require('fs');

// قراءة وتحليل بيانات التعليم من ملف DUKA.xlsx
function analyzeEducation() {
  try {
    console.log('\n🔍 تحليل بيانات التعليم من ملف DUKA.xlsx...\n');
    
    const workbook = XLSX.readFile('DUKA.xlsx');
    console.log('📊 معلومات الملف:');
    console.log('=================');
    console.log(`عدد الأوراق: ${workbook.SheetNames.length}`);
    console.log(`أسماء الأوراق: ${workbook.SheetNames.join(', ')}`);
    
    let totalRows = 0;
    let allEducationValues = [];
    let allEducationLevelValues = [];
    
    // قراءة كل ورقة
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n📄 الورقة ${index + 1}: ${sheetName}`);
      console.log('------------------------');
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`   عدد الصفوف: ${data.length}`);
      totalRows += data.length;
      
      // جمع قيم التعليم من هذه الورقة
      const educationValues = data.map(row => {
        // البحث عن أعمدة التعليم المحتملة
        return row['التعليم'] || 
               row['المستوى التعليمي'] || 
               row['الدرجة العلمية'] || 
               row['المؤهل العلمي'] || 
               row['Education'] || 
               row['Education Level'] || 
               'غير محدد'
      });
      
      allEducationValues = allEducationValues.concat(educationValues);
      
      // عرض أسماء الأعمدة المتاحة
      if (data.length > 0 && index === 0) {
        console.log('\n   📋 أسماء الأعمدة المتاحة:');
        const columns = Object.keys(data[0]);
        columns.forEach((col, i) => {
          if (col.includes('تعليم') || col.includes('درج') || col.includes('مؤهل') || 
              col.toLowerCase().includes('education') || col.toLowerCase().includes('level')) {
            console.log(`      ${i+1}. "${col}"`);
          }
        });
      }
      
      // عرض عينة من البيانات
      if (data.length > 0) {
        console.log(`\n   📝 عينة من بيانات التعليم (أول 5 صفوف):`);
        for (let i = 0; i < Math.min(5, data.length); i++) {
          const educationValue = educationValues[i];
          const name = data[i]['الاسم الكامل'] || 'بدون اسم';
          console.log(`      ${i+1}. ${name} - التعليم: "${educationValue}"`);
        }
      }
    });
    
    console.log('\n');
    console.log('====================================');
    console.log('📊 إحصائيات المستوى التعليمي');
    console.log('====================================\n');
    
    console.log(`📌 إجمالي الصفوف: ${totalRows}`);
    console.log(`📌 إجمالي القيم المقروءة: ${allEducationValues.length}\n`);
    
    // حساب القيم الفريدة
    const educationCount = {};
    allEducationValues.forEach(value => {
      const normalizedValue = value ? value.toString().trim() : 'فارغ';
      if (!educationCount[normalizedValue]) {
        educationCount[normalizedValue] = 0;
      }
      educationCount[normalizedValue]++;
    });
    
    // عرض النتائج
    const sortedValues = Object.entries(educationCount)
      .sort((a, b) => b[1] - a[1]);
    
    console.log('📊 عدد كل قيمة في حقل التعليم:\n');
    sortedValues.forEach(([value, count]) => {
      const percentage = ((count / allEducationValues.length) * 100).toFixed(1);
      console.log(`   "${value}".padEnd(30, ' ') : ${count.toString().padEnd(4, ' ')} (${percentage}%)`);
    });
    
    console.log('\n────────────────────────────────────');
    console.log(`   الإجمالي الكلي          : ${allEducationValues.length}`);
    console.log('────────────────────────────────────\n');
    
    // تحليل القيم لتصنيفها
    console.log('🔍 تصنيف القيم:\n');
    
    let educated = 0;
    let notEducated = 0;
    let unknown = 0;
    
    allEducationValues.forEach(value => {
      const normalized = value ? value.toString().trim().toLowerCase() : '';
      
      // قيم المتعلمين
      if (normalized.includes('ثانوي') || normalized.includes('جامع') || 
          normalized.includes('بكالوريوس') || normalized.includes('ماجستير') ||
          normalized.includes('دكتوراه') || normalized.includes('دبلوم') ||
          normalized.includes('متوسط') || normalized.includes('ابتدائ') ||
          normalized.includes('اعدادي') || normalized.includes('معهد') ||
          normalized.includes('secondary') || normalized.includes('university') ||
          normalized.includes('bachelor') || normalized.includes('master') ||
          normalized.includes('phd') || normalized.includes('diploma') ||
          normalized.includes('primary') || normalized.includes('college') ||
          normalized.includes('educated') || normalized === 'متعلم' ||
          normalized.includes('school') || normalized.includes('grade')) {
        educated++;
      }
      // قيم غير المتعلمين  
      else if (normalized === 'غير متعلم' || normalized === 'غير متعلمة' ||
               normalized === 'أمي' || normalized === 'أمية' ||
               normalized === 'لا' || normalized === 'no' ||
               normalized === 'none' || normalized === 'uneducated' ||
               normalized === 'illiterate' || normalized === '') {
        notEducated++;
      }
      // قيم غير معروفة
      else {
        unknown++;
      }
    });
    
    console.log(`   متعلم: ${educated} (${((educated/totalRows)*100).toFixed(1)}%)`);
    console.log(`   غير متعلم: ${notEducated} (${((notEducated/totalRows)*100).toFixed(1)}%)`);
    console.log(`   غير واضح: ${unknown} (${((unknown/totalRows)*100).toFixed(1)}%)`);
    
    // عرض كل القيم الفريدة الموجودة
    console.log('\n📝 جميع القيم الفريدة الموجودة في البيانات:');
    console.log('──────────────────────────────────────────');
    Object.keys(educationCount).forEach(value => {
      console.log(`   • "${value}": ${educationCount[value]}`);
    });
    
    // حفظ النتائج في ملف
    const results = {
      totalRows: totalRows,
      totalValues: allEducationValues.length,
      counts: educationCount,
      uniqueValues: Object.keys(educationCount),
      classification: {
        educated: educated,
        notEducated: notEducated,
        unknown: unknown
      },
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('education-analysis.json', JSON.stringify(results, null, 2), 'utf-8');
    console.log('\n💾 تم حفظ النتائج في ملف: education-analysis.json');
    
  } catch (error) {
    console.error('❌ خطأ في قراءة الملف:', error.message);
    console.error('تفاصيل الخطأ:', error);
  }
}

analyzeEducation();
