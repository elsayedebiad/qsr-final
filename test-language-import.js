const XLSX = require('xlsx');

// قراءة ملف DUKA.xlsx لفحص أسماء الأعمدة
function checkExcelColumns() {
  try {
    const workbook = XLSX.readFile('DUKA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // تحويل الشيت إلى JSON للحصول على أسماء الأعمدة
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length > 0) {
      console.log('أسماء الأعمدة في ملف DUKA.xlsx:');
      console.log('=====================================');
      
      const headers = data[0];
      headers.forEach((header, index) => {
        console.log(`${index + 1}. ${header}`);
      });
      
      console.log('\n');
      console.log('البحث عن أعمدة اللغة:');
      console.log('===================');
      
      const languageColumns = headers.filter(header => {
        const h = header.toString().toLowerCase();
        return h.includes('عربي') || h.includes('انجليزي') || h.includes('english') || h.includes('arabic') || h.includes('لغة');
      });
      
      if (languageColumns.length > 0) {
        console.log('تم العثور على أعمدة اللغة:');
        languageColumns.forEach(col => {
          console.log(`- ${col}`);
        });
      } else {
        console.log('❌ لم يتم العثور على أعمدة اللغة');
      }
      
      // فحص عينة من البيانات
      console.log('\n');
      console.log('عينة من البيانات (أول 3 صفوف):');
      console.log('===============================');
      
      for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
        console.log(`\nالصف ${i}:`);
        const row = data[i];
        headers.forEach((header, index) => {
          if (row[index]) {
            console.log(`  ${header}: ${row[index]}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('خطأ في قراءة الملف:', error.message);
    console.log('\n💡 تأكد من وجود ملف DUKA.xlsx في المجلد الحالي');
  }
}

checkExcelColumns();