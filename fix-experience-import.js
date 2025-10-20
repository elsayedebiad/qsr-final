// سكريبت لإصلاح وإعادة استيراد بيانات الخبرة من ملف DUKA.xlsx
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function updateExperience() {
  console.log('='.repeat(60));
  console.log('بدء عملية إصلاح بيانات الخبرة');
  console.log('='.repeat(60));

  try {
    // قراءة ملف DUKA.xlsx
    const filePath = path.join(__dirname, 'DUKA.xlsx');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ الملف DUKA.xlsx غير موجود!');
      process.exit(1);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`\n✅ تم قراءة ${data.length} صف من ملف Excel`);

    // تحديث كل سيرة ذاتية
    let updateCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // الحصول على قيمة الخبرة من العمود الصحيح
        const experienceValue = row['الخبرة'] || row['الخبرة السابقة'] || row['الخبرة في الخارج'];
        const referenceCode = row['رمز المرجع'] || row['الكود المرجعي'];
        
        if (!referenceCode) {
          console.log(`⚠️ الصف ${i + 1}: لا يحتوي على رمز مرجعي`);
          continue;
        }

        // تنظيف قيمة الخبرة
        let cleanedExperience = null;
        if (experienceValue) {
          const value = String(experienceValue).trim();
          // عدم حفظ القيم الفارغة المعنوية
          if (value && value !== 'غير محدد' && value !== 'لا يوجد') {
            cleanedExperience = value;
          }
        }

        // تحديث السيرة الذاتية في قاعدة البيانات
        if (cleanedExperience) {
          const updated = await prisma.cV.updateMany({
            where: { 
              referenceCode: String(referenceCode).trim() 
            },
            data: { 
              experience: cleanedExperience 
            }
          });

          if (updated.count > 0) {
            updateCount++;
            console.log(`✅ الصف ${i + 1}: تم تحديث "${referenceCode}" - الخبرة: "${cleanedExperience}"`);
          } else {
            console.log(`⚠️ الصف ${i + 1}: لم يتم العثور على سيرة بالكود "${referenceCode}"`);
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ خطأ في الصف ${i + 1}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('ملخص العملية:');
    console.log('='.repeat(60));
    console.log(`✅ تم تحديث: ${updateCount} سيرة ذاتية`);
    console.log(`❌ أخطاء: ${errorCount} صف`);
    console.log(`📊 إجمالي الصفوف: ${data.length}`);

    // التحقق من النتائج
    console.log('\n' + '='.repeat(60));
    console.log('التحقق من النتائج:');
    console.log('='.repeat(60));

    const cvs = await prisma.cV.findMany({
      select: {
        experience: true
      }
    });

    const categorized = {
      'بدون خبرة': 0,
      '1-2 سنة': 0,
      '3-5 سنوات': 0,
      '6-10 سنوات': 0,
      'أكثر من 10': 0
    };

    cvs.forEach(cv => {
      const exp = (cv.experience || '').trim().toLowerCase();
      
      if (!exp || exp === 'لا يوجد' || exp === 'غير محدد') {
        categorized['بدون خبرة']++;
      } else {
        const nums = exp.match(/\d+/g);
        const yrs = nums && nums.length > 0 ? parseInt(nums[0]) : 0;
        
        if (yrs === 0) {
          categorized['بدون خبرة']++;
        } else if (yrs >= 1 && yrs <= 2) {
          categorized['1-2 سنة']++;
        } else if (yrs >= 3 && yrs <= 5) {
          categorized['3-5 سنوات']++;
        } else if (yrs >= 6 && yrs <= 10) {
          categorized['6-10 سنوات']++;
        } else if (yrs > 10) {
          categorized['أكثر من 10']++;
        } else {
          categorized['بدون خبرة']++;
        }
      }
    });

    console.log('\nالتوزيع الجديد للخبرة:');
    Object.entries(categorized).forEach(([category, count]) => {
      const percentage = ((count / cvs.length) * 100).toFixed(1);
      console.log(`${category}: ${count} (${percentage}%)`);
    });

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
updateExperience().catch(console.error);
