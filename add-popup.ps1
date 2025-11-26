$file = "src\app\sales6\page.tsx"
$content = Get-Content $file -Raw

# Add import
$content = $content -replace "(import FlyingLantern from '@/components/FlyingLantern')", "`$1`nimport PhoneNumberPopup from '@/components/PhoneNumberPopup'"

# Add component
$content = $content -replace "(<FlyingLantern />)", "`$1`n      <PhoneNumberPopup salesPageId=`"sales6`" delaySeconds={8} expiryDays={7} />"

Set-Content $file $content -NoNewline
