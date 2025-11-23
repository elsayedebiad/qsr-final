# Script to update header and footer logos and fix mobile responsiveness
# Updates sales2 through sales11

$sales Pages = 2..11

foreach ($num in $salesPages) {
    $filePath = "src\app\sales$num\page.tsx"
    
    if (Test-Path $filePath) {
        Write-Host "Updating $filePath..."
        
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Update 1: Make header logo clickable
        $content = $content -replace '(\s+){/\* الشعار \*/}\s+<div className="flex items-center gap-3">\s+<img\s+src="/logo-2\.png"\s+alt="الاسناد السريع"\s+className="h-16 w-auto object-contain"\s+/>\s+<div className="hidden md:block">\s+<h1 className="text-xl font-bold text-\[#1e3a8a\]">الاسناد السريع</h1>\s+<p className="text-sm text-gray-600">للاستقدام</p>\s+</div>\s+</div>', '$1{/* الشعار */}
                <a 
                  href="https://qsr.sa/offers1-2" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img 
                    src="/logo-2.png" 
                    alt="الاسناد السريع" 
                    className="h-16 w-auto object-contain"
                  />
                  <div className="hidden md:block">
                    <h1 className="text-xl font-bold text-[#1e3a8a]">الاسناد السريع</h1>
                    <p className="text-sm text-gray-600">للاستقدام</p>
                  </div>
                </a>'
        
        # Update 2: Make footer logo clickable and fix mobile view
        $content = $content -replace '(\s+)<div className="flex items-center justify-center gap-3 mb-4">\s+<img src="/logo-2\.png" alt="الاسناد السريع" className="h-12 w-auto object-contain bg-white rounded-lg p-2" />\s+<div>\s+<h2 className="text-2xl font-bold">الاسناد السريع للاستقدام</h2>\s+<p className="text-sm text-blue-200">خدمات استقدام العمالة المنزلية</p>\s+</div>\s+</div>', '$1<a 
            href="https://qsr.sa/offers1-2" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src="/logo-2.png" alt="الاسناد السريع" className="h-10 sm:h-12 w-auto object-contain bg-white rounded-lg p-2" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">الاسناد السريع للاستقدام</h2>
              <p className="text-xs sm:text-sm text-blue-200">خدمات استقدام العمالة المنزلية</p>
            </div>
          </a>'
        
        # Update 3: Fix footer location mobile view
        $content = $content -replace '(\s+)<div className="flex items-center justify-center gap-2 mb-6">\s+<MapPin className="h-5 w-5 text-yellow-400" />\s+<span className="text-lg">الرياض - المملكة العربية السعودية</span>\s+</div>', '$1<div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-6">
            <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-400" />
            <span className="text-sm sm:text-lg">الرياض - المملكة العربية السعودية</span>
          </div>'
        
        # Update 4: Fix footer buttons mobile view
        $content = $content -replace '<div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">', '<div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6">'
        
        # Update 5: Fix phone button mobile
        $content = $content -replace '<a href="\$\{`tel:\$\{whatsappNumber\}`\}" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">\s+<Phone className="h-5 w-5" />\s+<span className="font-semibold" dir="ltr">\{whatsappNumber\}</span>', '<a href={`tel:${whatsappNumber}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto justify-center">
                  <Phone className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="font-semibold text-sm sm:text-base" dir="ltr">{whatsappNumber}</span>'
        
        # Update 6: Fix WhatsApp button mobile
        $content = $content -replace 'className="flex items-center gap-2 bg-gradient-to-r from-\[#25d366\] to-\[#128c7e\] hover:from-\[#1fb855\] hover:to-\[#0e6f5c\] text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"', 'className="flex items-center gap-2 bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#1fb855] hover:to-[#0e6f5c] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto justify-center"'
        
        # Update 7: Fix WhatsApp SVG icon size
        $content = $content -replace '(<svg className=")h-5 w-5(" fill="currentColor" viewBox="0 0 24 24">[\s\S]*?</svg>\s+<span className="font-semibold">واتساب</span>)', '$1h-4 sm:h-5 w-4 sm:w-5$2
                  <span className="font-semibold text-sm sm:text-base">واتساب</span>'
        
        # Update 8: Fix email button mobile
        $content = $content -replace '<a href="mailto:info@qsr\.sa" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">\s+<Mail className="h-5 w-5" />\s+<span className="font-semibold" dir="ltr">info@qsr\.sa</span>', '<a href="mailto:info@qsr.sa" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto justify-center">
              <Mail className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="font-semibold text-sm sm:text-base" dir="ltr">info@qsr.sa</span>'
        
        # Save the file
        [System.IO.File]::WriteAllText((Resolve-Path $filePath), $content, [System.Text.UTF8Encoding]::new($false))
        
        Write-Host "✓ Updated $filePath successfully"
    } else {
        Write-Host "✗ File not found: $filePath"
    }
}

Write-Host "`nAll files have been updated!"
