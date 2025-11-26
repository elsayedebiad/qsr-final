const fs = require('fs');

const file = 'src/app/sales6/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import after FlyingLantern import
content = content.replace(
  "import FlyingLantern from '@/components/FlyingLantern'",
  "import FlyingLantern from '@/components/FlyingLantern'\nimport PhoneNumberPopup from '@/components/PhoneNumberPopup'"
);

// Add component after FlyingLantern component
content = content.replace(
  /(<FlyingLantern \/>)/,
  '$1\n      <PhoneNumberPopup salesPageId="sales6" delaySeconds={8} expiryDays={7} />'
);

fs.writeFileSync(file, content, 'utf8');
console.log('✅ PhoneNumberPopup added successfully!');
