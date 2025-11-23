# PowerShell script to update footer WhatsApp button design in all sales pages

$pages = @("sales3", "sales4", "sales5", "sales6", "sales7", "sales8", "sales9", "sales10", "sales11")

Write-Host "Starting batch update of footer WhatsApp buttons..." -ForegroundColor Green

foreach ($page in $pages) {
    $filePath = "c:\Users\ibrah\OneDrive\Desktop\qsr-final\src\app\$page\page.tsx"
    
    if (Test-Path $filePath) {
        Write-Host "Updating $page..." -ForegroundColor Yellow
        
        # Read the file content
        $content = Get-Content $filePath -Raw
        
        # Check if already updated (has gradient styling)
        if ($content -match 'bg-gradient-to-r from-\[#25d366\] to-\[#128c7e\]') {
            Write-Host "  $page already updated, skipping..." -ForegroundColor Cyan
            continue
        }
        
        # Update footer section
        $content = $content -replace '(<h3 className="text-lg font-bold">الاسناد السريع للاستقدام</h3>)', '<h2 className="text-2xl font-bold">الاسناد السريع للاستقدام</h2>'
        $content = $content -replace '(شريكك الأمثل في استقدام العمالة)', 'خدمات استقدام العمالة المنزلية'
        
        # Add MapPin section if not exists
        if ($content -notmatch 'MapPin') {
            $content = $content -replace '(</div>\s+<div className="flex flex-col sm:flex-row)', "</div>`n`n          <div class=`"flex items-center justify-center gap-2 mb-6`">`n            <MapPin className=`"h-5 w-5 text-yellow-400`" />`n            <span className=`"text-lg`">الرياض - المملكة العربية السعودية</span>`n          </div>`n          `n          <div className=`"flex flex-col sm:flex-row"
        }
        
        # Update phone button
        $content = $content -replace '(<a href=\{`tel:\$\{whatsappNumber\}`\} className="flex items-center gap-2 )hover:text-yellow-300 transition-colors(")', '$1bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105$2'
        
        # Update WhatsApp button
        $oldWaPattern = '(<a\s+href=\{`https://wa.me/\$\{whatsappNumber\.replace\([^}]+\)\}`\})\s+className="flex items-center gap-2 hover:text-green-300 transition-colors"'
        $newWaPattern = '$1 `n                  className="flex items-center gap-2 bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#1fb855] hover:to-[#0e6f5c] text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"`n                  target="_blank"`n                  rel="noopener noreferrer"'
        
        $content = $content -replace $oldWaPattern, $newWaPattern
        
        # Update email button
        $content = $content -replace '(<a href="mailto:info@qsr.sa" className="flex items-center gap-2 )hover:text-yellow-300 transition-colors(")', '$1bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105$2'
        
        # Save the updated content
        Set-Content -Path $filePath -Value $content -NoNewline
        
        Write-Host "  ✓ $page updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $page not found!" -ForegroundColor Red
    }
}

Write-Host "`nBatch update completed!" -ForegroundColor Green
Write-Host "Updated pages: $($pages.Count)" -ForegroundColor Cyan
