# سكريبت لتحديث جميع صفحات المبيعات لإضافة whatsappNumber إلى SimpleImageCarousel

$salesPages = @('sales3', 'sales4', 'sales5', 'sales6', 'sales7', 'sales8', 'sales9', 'sales10', 'sales11')

foreach ($page in $salesPages) {
    $filePath = "src\app\$page\page.tsx"
    
    if (Test-Path $filePath) {
        Write-Host "Updating $page..." -ForegroundColor Yellow
        
        # قراءة المحتوى
        $content = Get-Content $filePath -Raw
        
        # استبدال النمط الأول (Secondary Banner)
        $pattern1 = 'autoPlayInterval={4000}\s+className=""\s+/>'
        $replacement1 = @"
autoPlayInterval={4000}
                className=""
                whatsappNumber={whatsappNumber}
              />
"@
        $content = $content -replace $pattern1, $replacement1
        
        # حفظ التغييرات
        Set-Content -Path $filePath -Value $content -NoNewline
        
        Write-Host "✓ Updated $page successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ File not found: $filePath" -ForegroundColor Red
    }
}

Write-Host "`n✅ All sales pages updated!" -ForegroundColor Cyan
