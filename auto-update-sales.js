const fs = require('fs');
const path = require('path');

// قائمة الصفحات التي نريد تحديثها
const pagesToUpdate = [
  'sales2', 'sales3', 'sales4', 'sales5', 
  'sales6', 'sales7', 'sales8', 'sales9', 
  'sales10', 'sales11'
];

console.log('🚀 بدء التحديث التلقائي لصفحات المبيعات...\n');

pagesToUpdate.forEach(page => {
  const filePath = path.join('src', 'app', page, 'page.tsx');
  
  if (fs.existsSync(filePath)) {
    console.log(`📝 تحديث ${page}...`);
    
    let content = fs.readFileSync(filePath, 'utf-8');
    let updates = 0;
    
    // 1. تحديث فلتر التعليم في getCountForFilter
    const oldEducationCase = /case 'education':\s*[\s\S]*?return false/;
    const newEducationCase = `case 'education':
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
    
    if (oldEducationCase.test(content)) {
      content = content.replace(oldEducationCase, newEducationCase);
      updates++;
      console.log(`  ✅ تحديث فلتر التعليم في getCountForFilter`);
    }
    
    // 2. إضافة فلتر الخبرة في getCountForFilter
    if (!content.includes("case 'experience':")) {
      // البحث عن case 'skill': وإضافة experience قبله
      const skillCaseRegex = /(\s+)(case 'skill':)/;
      if (skillCaseRegex.test(content)) {
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
          
        case 'skill':`;
        
        content = content.replace(skillCaseRegex, experienceCase);
        updates++;
        console.log(`  ✅ إضافة فلتر الخبرة في getCountForFilter`);
      }
    }
    
    // 3. تحديث matchesEducation
    const oldMatchesEducation = /\/\/ فلتر التعليم[\s\S]*?return false\s*\}\)\(\)/;
    const newMatchesEducation = `// فلتر التعليم - متعلم/غير متعلم
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
    
    if (oldMatchesEducation.test(content)) {
      content = content.replace(oldMatchesEducation, newMatchesEducation);
      updates++;
      console.log(`  ✅ تحديث matchesEducation`);
    }
    
    // 4. تحديث matchesExperience
    const oldMatchesExperience = /\/\/ فلتر الخبرة[\s\S]*?return false\s*\}\s*\}\)\(\)/;
    const newMatchesExperience = `// فلتر الخبرة - بناءً على البيانات الفعلية من DUKA.xlsx
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
    
    if (oldMatchesExperience.test(content)) {
      content = content.replace(oldMatchesExperience, newMatchesExperience);
      updates++;
      console.log(`  ✅ تحديث matchesExperience`);
    }
    
    // 5. إضافة matchesExperience في الفلترة الرئيسية
    if (!content.includes('matchesEducation && matchesExperience')) {
      content = content.replace(
        /matchesEducation &&\s*\n\s*matchesContractPeriod/g,
        'matchesEducation && matchesExperience &&\n             matchesContractPeriod'
      );
      updates++;
      console.log(`  ✅ إضافة matchesExperience في الفلترة الرئيسية`);
    }
    
    // 6. إضافة experienceFilter في dependencies
    if (!content.includes('experienceFilter,')) {
      content = content.replace(
        /educationFilter,\s*\n\s*contractPeriodFilter/g,
        'educationFilter,\n      experienceFilter, contractPeriodFilter'
      );
      updates++;
      console.log(`  ✅ إضافة experienceFilter في dependencies`);
    }
    
    // 7. إضافة واجهة فلتر الخبرة
    if (!content.includes('سنوات الخبرة')) {
      // البحث عن نهاية فلتر التعليم وإضافة فلتر الخبرة بعده
      const educationUIRegex = /(غير متعلم[^<]*<\/option>\s*<\/select>\s*<\/div>)/;
      
      if (educationUIRegex.test(content)) {
        const experienceUI = `$1
                
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
        
        content = content.replace(educationUIRegex, experienceUI);
        updates++;
        console.log(`  ✅ إضافة واجهة فلتر الخبرة`);
      }
    }
    
    // 8. إضافة Calendar في imports إذا لم يكن موجوداً
    if (!content.includes('Calendar')) {
      content = content.replace(
        'Globe,',
        'Globe,\n  Calendar,'
      );
      updates++;
      console.log(`  ✅ إضافة Calendar import`);
    }
    
    // 9. إضافة experienceFilter في reset button
    if (!content.includes("setExperienceFilter('ALL')")) {
      content = content.replace(
        "setEducationFilter\\('ALL'\\)\\s*\n\\s*setSearchTerm",
        "setEducationFilter('ALL')\n                    setExperienceFilter('ALL')\n                    setSearchTerm"
      );
      updates++;
      console.log(`  ✅ إضافة experienceFilter في زر إعادة التعيين`);
    }
    
    // حفظ الملف المحدث
    if (updates > 0) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✨ تم تحديث ${page} بنجاح (${updates} تحديثات)\n`);
    } else {
      console.log(`  ℹ️  ${page} محدث بالفعل\n`);
    }
    
  } else {
    console.log(`❌ الملف ${filePath} غير موجود\n`);
  }
});

console.log('✅ انتهى التحديث!');
