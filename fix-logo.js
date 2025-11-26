const fs = require('fs');
const path = require('path');

// قائمة ملفات الصفحات (ما عدا sales6)
const salesPages = [
  'src/app/sales1/page.tsx',
  'src/app/sales2/page.tsx',
  'src/app/sales3/page.tsx',
  'src/app/sales4/page.tsx',
  'src/app/sales5/page.tsx',
  'src/app/sales7/page.tsx',
  'src/app/sales8/page.tsx',
  'src/app/sales9/page.tsx',
];

salesPages.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // استرجاع h-16 في الهيدر فقط (السطر الذي يحتوي على logo-2.png)
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      // إذا كان السطر يحتوي على logo-2.png و h-12
      if (line.includes('logo-2.png') && line.includes('h-12 w-auto object-contain') && !line.includes('bg-white')) {
        return line.replace('h-12 w-auto object-contain', 'h-16 w-auto object-contain');
      }
      return line;
    });
    
    content = updatedLines.join('\n');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ تم إصلاح ${file}`);
  }
});

console.log('✅ تم إعادة حجم اللوجو الأصلي لجميع الصفحات ما عدا sales6!');
