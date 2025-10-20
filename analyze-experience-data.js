const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeExperience() {
  console.log('='.repeat(60));
  console.log('تحليل بيانات الخبرة من قاعدة البيانات');
  console.log('='.repeat(60));

  try {
    // جلب جميع السير الذاتية
    const cvs = await prisma.cV.findMany({
      select: {
        previousEmployment: true,
        experience: true
      }
    });

    console.log(`\nإجمالي عدد السير: ${cvs.length}`);

    // تحليل قيم الخبرة
    const experienceValues = {};
    const categorized = {
      'بدون خبرة': 0,
      '1-2 سنة': 0,
      '3-5 سنوات': 0,
      '6-10 سنوات': 0,
      'أكثر من 10': 0,
      'غير محدد': 0
    };

    cvs.forEach(cv => {
      const expValue = cv.experience || cv.previousEmployment || '';
      const exp = typeof expValue === 'string' ? expValue.trim().toLowerCase() : String(expValue).trim().toLowerCase();
      
      // عد القيم الفريدة
      if (experienceValues[exp]) {
        experienceValues[exp]++;
      } else {
        experienceValues[exp] = 1;
      }

      // التصنيف حسب الفلترات
      if (!exp || exp === '' || exp === 'لا يوجد' || exp === 'لايوجد' || 
          exp === 'غير محدد' || exp === 'غيرمحدد' || exp === 'no' || 
          exp === 'none' || exp === 'null' || exp === 'undefined' || 
          exp === '0' || exp.includes('لا') || exp.includes('غير')) {
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
          categorized['غير محدد']++;
        }
      }
    });

    // عرض القيم الفريدة
    console.log('\n' + '='.repeat(60));
    console.log('القيم الفريدة وعددها:');
    console.log('='.repeat(60));
    
    const sortedValues = Object.entries(experienceValues).sort((a, b) => b[1] - a[1]);
    sortedValues.forEach(([value, count]) => {
      const percentage = ((count / cvs.length) * 100).toFixed(1);
      const display = value === '' ? '[فارغ]' : value;
      console.log(`${display}: ${count} (${percentage}%)`);
    });

    // عرض التصنيفات
    console.log('\n' + '='.repeat(60));
    console.log('التصنيف حسب الفلترات:');
    console.log('='.repeat(60));
    
    Object.entries(categorized).forEach(([category, count]) => {
      const percentage = ((count / cvs.length) * 100).toFixed(1);
      console.log(`${category}: ${count} (${percentage}%)`);
    });

    // نماذج من البيانات
    console.log('\n' + '='.repeat(60));
    console.log('نماذج من البيانات:');
    console.log('='.repeat(60));
    
    const samples = cvs.slice(0, 10);
    samples.forEach((cv, index) => {
      const exp = cv.experience || cv.previousEmployment || '[فارغ]';
      console.log(`${index + 1}. experience: ${cv.experience || '[null]'}, previousEmployment: ${cv.previousEmployment || '[null]'}`);
    });

  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeExperience();
