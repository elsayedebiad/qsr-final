# تحديث جميع صفحات السيلز لإضافة تتبع النقرات

$salesPages = @("sales1", "sales2", "sales3", "sales4", "sales5", "sales6", "sales7", "sales8", "sales10", "sales11", "transfer-services")

foreach ($page in $salesPages) {
    $filePath = "src\app\$page\page.tsx"
    
    if (Test-Path $filePath) {
        Write-Host "تحديث $page..." -ForegroundColor Green
        
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # البحث عن دالة sendWhatsAppMessage واستبدالها
        $oldPattern = "(?s)(const sendWhatsAppMessage = )\(cv: CV\) => \{\s*try \{(.*?)if \(!whatsappNumber\) \{.*?\}\s*)"
        $newPattern = "`$1async (cv: CV) => {`n    try {`$2if (!whatsappNumber) {`n        toast.error('لم يتم تعيين رقم واتساب لهذه الصفحة. يرجى التواصل مع الإدارة.');`n        return;`n      }`n`n      // تسجيل النقرة في قاعدة البيانات`n      const { trackBookingClick } = await import('@/lib/booking-tracker')`n      await trackBookingClick(salesPageId, cv)`n`n      "
        
        $content = $content -replace $oldPattern, $newPattern
        
        $content | Set-Content $filePath -Encoding UTF8 -NoNewline
        
        Write-Host "تم تحديث $page ✓" -ForegroundColor Cyan
    } else {
        Write-Host "الملف $filePath غير موجود" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ تم الانتهاء من تحديث جميع الصفحات!" -ForegroundColor Magenta
