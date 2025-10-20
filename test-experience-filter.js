// سكريبت لاختبار فلتر الخبرة في صفحات المبيعات
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testExperienceFilter() {
  console.log('='.repeat(60));
  console.log('اختبار فلتر الخبرة');
  console.log('='.repeat(60));

  try {
    const cvs = await prisma.cV.findMany({
      select: {
        experience: true,
        fullName: true,
        referenceCode: true
      }
    });

    console.log(`\nإجمالي عدد السير: ${cvs.length}`);

    // محاكاة دالة getCountForFilter من صفحة sales1
    function getCountForFilter(filterType, filterValue) {
      return cvs.filter(cv => {
        if (filterType === 'experience') {
          const exp = (cv.experience || '').trim().toLowerCase();
          const nums = exp.match(/\d+/g);
          const yrs = nums && nums.length > 0 ? parseInt(nums[0]) : 0;
          
          if (filterValue === 'NO_EXPERIENCE') {
            return exp === 'لا يوجد' || exp === '' || exp === 'no' || exp === 'none' || yrs === 0;
          }
          if (filterValue === '1-2') return yrs >= 1 && yrs <= 2;
          if (filterValue === '3-5') return yrs >= 3 && yrs <= 5;
          if (filterValue === '6-10') return yrs >= 6 && yrs <= 10;
          if (filterValue === 'MORE_10') return yrs > 10;
          return false;
        }
        return false;
      }).length;
    }

    // اختبار كل قيمة في الفلتر
    console.log('\n' + '='.repeat(60));
    console.log('نتائج الفلتر (كما ستظهر في الصفحة):');
    console.log('='.repeat(60));
    
    const filterValues = [
      { value: 'ALL', label: 'جميع الخبرات' },
      { value: 'NO_EXPERIENCE', label: 'بدون خبرة' },
      { value: '1-2', label: '1-2 سنة' },
      { value: '3-5', label: '3-5 سنوات' },
      { value: '6-10', label: '6-10 سنوات' },
      { value: 'MORE_10', label: 'أكثر من 10 سنوات' }
    ];

    filterValues.forEach(filter => {
      if (filter.value === 'ALL') {
        console.log(`${filter.label}: (${cvs.length})`);
      } else {
        const count = getCountForFilter('experience', filter.value);
        console.log(`${filter.label}: (${count})`);
      }
    });

    // عرض نماذج من البيانات بخبرة
    console.log('\n' + '='.repeat(60));
    console.log('نماذج من السير بخبرة:');
    console.log('='.repeat(60));
    
    const cvsWithExperience = cvs.filter(cv => 
      cv.experience && 
      cv.experience.trim() !== '' && 
      cv.experience.trim().toLowerCase() !== 'لا يوجد' && 
      cv.experience.trim().toLowerCase() !== 'غير محدد'
    );
    
    cvsWithExperience.slice(0, 10).forEach(cv => {
      console.log(`- ${cv.fullName} (${cv.referenceCode}): "${cv.experience}"`);
    });

  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExperienceFilter();
