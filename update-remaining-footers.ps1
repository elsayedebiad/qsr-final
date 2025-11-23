# PowerShell script to update footer WhatsApp buttons in sales6-11

$pages = @("sales6", "sales7", "sales8", "sales9", "sales10", "sales11")

$oldPattern = @'
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
            {whatsappNumber && (
              <>
                <a href={`tel:${whatsappNumber}`} className="flex items-center gap-2 hover:text-yellow-300 transition-colors">
                  <Phone className="h-5 w-5" />
                  <span className="font-semibold" dir="ltr">{whatsappNumber}</span>
                </a>
                <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 hover:text-green-300 transition-colors">
'@

$newPattern = @'
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
            {whatsappNumber && (
              <>
                <a href={`tel:${whatsappNumber}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                  <Phone className="h-5 w-5" />
                  <span className="font-semibold" dir="ltr">{whatsappNumber}</span>
                </a>
                <a 
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} 
                  className="flex items-center gap-2 bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#1fb855] hover:to-[#0e6f5c] text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  target="_blank"
                  rel="noopener noreferrer"
                >
'@

$oldEmailPattern = '            <a href="mailto:info@qsr.sa" className="flex items-center gap-2 hover:text-yellow-300 transition-colors">'
$newEmailPattern = '            <a href="mailto:info@qsr.sa" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">'

Write-Host "Starting footer updates for sales6-11..." -ForegroundColor Green

foreach ($page in $pages) {
    $filePath = "c:\Users\ibrah\OneDrive\Desktop\qsr-final\src\app\$page\page.tsx"
    
    if (Test-Path $filePath) {
        Write-Host "Processing $page..." -ForegroundColor Yellow
        
        $content = Get-Content $filePath -Raw
        
        # Check if already updated
        if ($content -match 'bg-gradient-to-r from-\[#25d366\] to-\[#128c7e\]') {
            Write-Host "  $page already updated, skipping..." -ForegroundColor Cyan
            continue
        }
        
        # Update WhatsApp button
        $content = $content -replace [regex]::Escape($oldPattern), $newPattern
        
        # Update email button
        $content = $content -replace [regex]::Escape($oldEmailPattern), $newEmailPattern
        
        # Save file
        Set-Content -Path $filePath -Value $content -NoNewline
        
        Write-Host "  ✓ $page updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $page not found!" -ForegroundColor Red
    }
}

Write-Host "`nAll remaining pages updated!" -ForegroundColor Green
