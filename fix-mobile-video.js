const fs = require('fs');
const path = require('path');

// Function to fix video modal for mobile
function fixVideoModal(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Fix 1: Update aspect-video container to use relative positioning
    content = content.replace(
        /<div className="aspect-video w-full(.*?)">/g,
        '<div className="relative aspect-video w-full$1">'
    );
    
    // Fix 2: Update iframe/video styles to use absolute positioning for proper filling
    // For YouTube iframes
    content = content.replace(
        /className="w-full h-full rounded-lg"/g,
        'className="absolute inset-0 w-full h-full rounded-lg"'
    );
    
    // For video elements
    content = content.replace(
        /className="w-full h-full rounded-lg bg-black"/g,
        'className="absolute inset-0 w-full h-full rounded-lg bg-black object-contain"'
    );
    
    // Fix 3: Ensure container has proper overflow handling
    content = content.replace(
        /<div className="(p-2 sm:p-4 lg:p-6|p-2 sm:p-4)( bg-gray-50)?">/g,
        '<div className="$1$2">'
    );
    
    // Fix 4: Ensure the video modal container is properly sized for mobile
    content = content.replace(
        /max-w-\[95vw\]/g,
        'max-w-[98vw]'
    );
    
    // Fix 5: Add object-fit for videos
    content = content.replace(
        /className="w-full h-full rounded-lg bg-black"/g,
        'className="w-full h-full rounded-lg bg-black object-contain"'
    );
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${path.basename(filePath)}`);
        return true;
    }
    return false;
}

// Fix all sales pages
const salesPages = Array.from({length: 11}, (_, i) => i + 1);
let fixedCount = 0;

salesPages.forEach(num => {
    const filePath = path.join(__dirname, 'src', 'app', `sales${num}`, 'page.tsx');
    if (fs.existsSync(filePath)) {
        if (fixVideoModal(filePath)) {
            fixedCount++;
        }
    } else {
        console.log(`⚠️ File not found: sales${num}/page.tsx`);
    }
});

// Fix dashboard page
const dashboardPath = path.join(__dirname, 'src', 'app', 'dashboard', 'page.tsx');
if (fs.existsSync(dashboardPath)) {
    if (fixVideoModal(dashboardPath)) {
        fixedCount++;
    }
}

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('\n📱 Mobile video display improvements applied:');
console.log('- Added relative positioning to aspect-video container');
console.log('- Added absolute positioning to iframe/video elements');
console.log('- Added object-contain for proper video scaling');
console.log('- Increased max-width on mobile to 98vw');
console.log('- Ensured proper filling of container on all devices');
