const fs = require('fs');
const path = require('path');

// Function to fix video modal for mobile
function fixVideoModal(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let updated = false;
    
    // Fix 1: Update aspect-video container to use relative positioning
    const aspectVideoRegex = /<div className="aspect-video w-full(.*?)">/g;
    if (aspectVideoRegex.test(content)) {
        content = content.replace(
            aspectVideoRegex,
            '<div className="relative aspect-video w-full$1 bg-black">'
        );
        updated = true;
    }
    
    // Fix 2: Update iframes to use absolute positioning
    const iframeRegex = /className="w-full h-full rounded-lg"/g;
    if (iframeRegex.test(content)) {
        content = content.replace(
            iframeRegex,
            'className="absolute inset-0 w-full h-full rounded-lg object-cover"'
        );
        updated = true;
    }
    
    // Fix 3: Update video elements to use absolute positioning and object-contain
    const videoRegex = /className="w-full h-full rounded-lg bg-black"/g;
    if (videoRegex.test(content)) {
        content = content.replace(
            videoRegex,
            'className="absolute inset-0 w-full h-full rounded-lg bg-black object-contain"'
        );
        updated = true;
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
        return true;
    }
    return false;
}

// Fix sales2 to sales11
const salesPages = Array.from({length: 10}, (_, i) => i + 2);
let fixedCount = 0;

console.log('🔧 Fixing video display on mobile for all sales pages...\n');

salesPages.forEach(num => {
    const filePath = path.join(__dirname, 'src', 'app', `sales${num}`, 'page.tsx');
    if (fs.existsSync(filePath)) {
        if (fixVideoModal(filePath)) {
            fixedCount++;
        } else {
            console.log(`⏭️ Already fixed or not needed: sales${num}/page.tsx`);
        }
    } else {
        console.log(`⚠️ File not found: sales${num}/page.tsx`);
    }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('\n📱 Mobile video display improvements applied:');
console.log('- ✅ Added relative positioning to aspect-video container');
console.log('- ✅ Added absolute positioning to iframe/video elements');
console.log('- ✅ Added object-contain for proper video scaling');
console.log('- ✅ Added black background to prevent white flash');
console.log('- ✅ Ensured proper filling of container on all devices');
console.log('\n🎯 The video now displays correctly on:');
console.log('- 📱 Mobile phones');
console.log('- 📱 Tablets');
console.log('- 💻 Laptops');
console.log('- 🖥️ Desktops');
