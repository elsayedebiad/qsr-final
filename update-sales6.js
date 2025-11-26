const fs = require('fs');

const file = 'src/app/sales6/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import after FlyingLantern import
content = content.replace(
  "import FlyingLantern from '@/components/FlyingLantern'",
  "import FlyingLantern from '@/components/FlyingLantern'\nimport PhoneNumberPopup from '@/components/PhoneNumberPopup'"
);

// 2. تصغير حجم اللوجو من h-16 إلى h-12
content = content.replace(
  'className="h-16 w-auto object-contain"',
  'className="h-12 w-auto object-contain"'
);

// 3. Add component after FlyingLantern component
content = content.replace(
  /(<FlyingLantern \/>)/,
  '$1\n      <PhoneNumberPopup salesPageId="sales6" delaySeconds={8} expiryDays={7} />'
);

fs.writeFileSync(file, content, 'utf8');
console.log('✅ تم تصغير اللوجو وإضافة PhoneNumberPopup بنجاح!');
