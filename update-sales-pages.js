const fs = require('fs');
const path = require('path');

// قائمة الصفحات التي نريد تحديثها
const pagesToUpdate = [
  'sales2', 'sales3', 'sales4', 'sales5', 
  'sales6', 'sales7', 'sales8', 'sales9', 
  'sales10', 'sales11'
];

// الكود المحدث لفلتر التعليم في getCountForFilter
const updatedEducationCase = `        case 'education':
          const educationLevel = (cv.educationLevel || cv.education || '').toLowerCase().trim()
          // البيانات الفعلية تحتوي على "نعم" أو "لا"
          if (filterValue === 'متعلم') {
            return educationLevel === 'نعم' || educationLevel === 'yes' || 
                   educationLevel === 'متعلم' || educationLevel === 'educated'
          }
          if (filterValue === 'غير متعلم') {
            return educationLevel === 'لا' || educationLevel === 'no' || 
                   educationLevel === '' || educationLevel === 'غير متعلم' || 
                   educationLevel === 'أمي' || educationLevel === 'none'
          }
          return false`;

// الكود المحدث لفلتر الخبرة في getCountForFilter
const experienceCase = `
        case 'experience':
          const exp = (cv.experience || '').trim().toLowerCase()
          const nums = exp.match(/\\d+/g)
          const yrs = nums && nums.length > 0 ? parseInt(nums[0]) : 0
          
          if (filterValue === 'NO_EXPERIENCE') {
            return exp === 'لا يوجد' || exp === '' || exp === 'no' || exp === 'none' || yrs === 0
          }
          if (filterValue === '1-2') return yrs >= 1 && yrs <= 2
          if (filterValue === '3-5') return yrs >= 3 && yrs <= 5
          if (filterValue === '6-10') return yrs >= 6 && yrs <= 10
          if (filterValue === 'MORE_10') return yrs > 10
          return false
          `;

// matchesEducation المحدث
const updatedMatchesEducation = `      // فلتر التعليم - متعلم/غير متعلم
      const matchesEducation = (() => {
        if (educationFilter === 'ALL') return true
        const educationLevel = (cv.educationLevel || cv.education || '').toLowerCase().trim()
        
        // البيانات الفعلية في DUKA.xlsx تحتوي على "نعم" أو "لا"
        if (educationFilter === 'متعلم') {
          // يعتبر متعلم إذا كانت القيمة "نعم"
          return educationLevel === 'نعم' || educationLevel === 'yes' || 
                 educationLevel === 'متعلم' || educationLevel === 'educated'
        } else if (educationFilter === 'غير متعلم') {
          // يعتبر غير متعلم إذا كانت القيمة "لا" أو فارغة
          return educationLevel === 'لا' || educationLevel === 'no' || 
                 educationLevel === '' || educationLevel === 'غير متعلم' || 
                 educationLevel === 'أمي' || educationLevel === 'none'
        }
        return false
      })()`;

// matchesExperience المحدث
const updatedMatchesExperience = `      // فلتر الخبرة - بناءً على البيانات الفعلية من DUKA.xlsx
      const matchesExperience = (() => {
        if (experienceFilter === 'ALL') return true
        
        const experience = (cv.experience || '').trim().toLowerCase()
        
        // استخراج الرقم من النص
        const numbers = experience.match(/\\d+/g)
        const years = numbers && numbers.length > 0 ? parseInt(numbers[0]) : 0
        
        switch (experienceFilter) {
          case 'NO_EXPERIENCE': // بدون خبرة
            return experience === 'لا يوجد' || experience === '' || 
                   experience === 'no' || experience === 'none' || years === 0
          
          case '1-2': // 1-2 سنة
            return years >= 1 && years <= 2
          
          case '3-5': // 3-5 سنوات
            return years >= 3 && years <= 5
          
          case '6-10': // 6-10 سنوات
            return years >= 6 && years <= 10
          
          case 'MORE_10': // أكثر من 10 سنوات
            return years > 10
          
          default:
            return false
        }
      })()`;

// واجهة فلتر الخبرة
const experienceFilterUI = `                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-purple-600 mb-2">
                    <Calendar className="h-4 w-4 ml-2" /> سنوات الخبرة
                  </label>
                  <select
                    className="w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 border border-gray-300"
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                  >
                    <option value="ALL">جميع مستويات الخبرة ({cvs.length})</option>
                    <option value="NO_EXPERIENCE">بدون خبرة ({getCountForFilter('experience', 'NO_EXPERIENCE')})</option>
                    <option value="1-2">1-2 سنة ({getCountForFilter('experience', '1-2')})</option>
                    <option value="3-5">3-5 سنوات ({getCountForFilter('experience', '3-5')})</option>
                    <option value="6-10">6-10 سنوات ({getCountForFilter('experience', '6-10')})</option>
                    <option value="MORE_10">أكثر من 10 سنوات ({getCountForFilter('experience', 'MORE_10')})</option>
                  </select>
                </div>`;

console.log('🚀 بدء تحديث صفحات المبيعات...\n');

// تحليل الصفحات أولاً
pagesToUpdate.forEach(page => {
  const filePath = path.join('src', 'app', page, 'page.tsx');
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`\n📄 تحليل ${page}:`);
    
    // فحص وجود الفلاتر
    const hasExperienceCase = content.includes("case 'experience':");
    const hasUpdatedEducation = content.includes('educationLevel === \'نعم\'');
    const hasExperienceFilter = content.includes('matchesExperience');
    const hasExperienceUI = content.includes('سنوات الخبرة');
    
    console.log(`  - فلتر الخبرة في getCountForFilter: ${hasExperienceCase ? '✅' : '❌'}`);
    console.log(`  - فلتر التعليم محدث: ${hasUpdatedEducation ? '✅' : '❌'}`);
    console.log(`  - matchesExperience موجود: ${hasExperienceFilter ? '✅' : '❌'}`);
    console.log(`  - واجهة فلتر الخبرة: ${hasExperienceUI ? '✅' : '❌'}`);
    
    const needsUpdate = !hasExperienceCase || !hasUpdatedEducation || !hasExperienceFilter || !hasExperienceUI;
    
    if (needsUpdate) {
      console.log(`  ⚠️  ${page} يحتاج إلى تحديث`);
    } else {
      console.log(`  ✅ ${page} محدث بالكامل`);
    }
  } else {
    console.log(`❌ الملف ${filePath} غير موجود`);
  }
});

console.log('\n\n📋 ملخص التحديثات المطلوبة:');
console.log('================================');
console.log('1. إضافة فلتر الخبرة في getCountForFilter');
console.log('2. تحديث فلتر التعليم للتعامل مع "نعم" و"لا"');
console.log('3. إضافة/تحديث matchesExperience');
console.log('4. إضافة واجهة فلتر الخبرة');
console.log('5. إضافة الخبرة في منطق الفلترة الرئيسي');
console.log('6. إضافة الخبرة في dependencies');
console.log('\n⚠️  لتطبيق التحديثات، راجع الكود في sales1/page.tsx ونسخه يدوياً');
