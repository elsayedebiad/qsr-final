# 🔧 حل مشكلة الاتصال بقاعدة البيانات

## ❌ المشكلة:
التطبيق لا يستطيع الاتصال بقاعدة بيانات Neon PostgreSQL

## ✅ الحل (خطوات سريعة):

### 1️⃣ أوقف السيرفر الحالي:
في Terminal الحالي، اضغط على:
```
Ctrl + C
```

### 2️⃣ احذف Prisma Client القديم:
```powershell
Remove-Item -Path "node_modules\.prisma" -Recurse -Force
```

### 3️⃣ أعد توليد Prisma Client:
```powershell
$env:DATABASE_URL='postgresql://neondb_owner:npg_LdQHjZ0kBR3v@ep-red-hill-adxo3mpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
npx prisma generate
```

### 4️⃣ ابدأ السيرفر من جديد:
```powershell
$env:DATABASE_URL='postgresql://neondb_owner:npg_LdQHjZ0kBR3v@ep-red-hill-adxo3mpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
npm run dev
```

---

## 🚀 الطريقة السريعة (كل الأوامر مع بعض):

افتح PowerShell جديد في مجلد المشروع وشغل:

```powershell
# أوقف أي process يستخدم المشروع
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# انتقل لمجلد المشروع
cd C:\Users\engel\OneDrive\Desktop\engelsayedebaid

# احذف Prisma Client القديم
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

# اضبط متغير البيئة
$env:DATABASE_URL='postgresql://neondb_owner:npg_LdQHjZ0kBR3v@ep-red-hill-adxo3mpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

# أعد توليد Prisma Client
npx prisma generate

# ابدأ السيرفر
npm run dev
```

---

## ✅ بعد ذلك:

1. افتح المتصفح: http://localhost:3000/login
2. سجل دخول باستخدام:
   ```
   Email: admin@alqaeid.com
   Password: Admin@123456
   ```

---

## 📝 ملاحظة:

ملف `.env.local` تم إنشاؤه بالفعل ويحتوي على:
- ✅ DATABASE_URL (Neon PostgreSQL)
- ✅ GOOGLE_SHEETS_ID
- ✅ GOOGLE_CLIENT_EMAIL
- ✅ GOOGLE_PRIVATE_KEY
- ✅ NEXTAUTH_URL
- ✅ NEXTAUTH_SECRET
- ✅ JWT_SECRET

---

## 🆘 إذا استمرت المشكلة:

### تحقق من اتصال الإنترنت:
```powershell
Test-NetConnection ep-red-hill-adxo3mpm-pooler.c-2.us-east-1.aws.neon.tech -Port 5432
```

### تحقق من أن Neon Database يعمل:
اذهب إلى: https://console.neon.tech/
تأكد من أن database "neondb" active

### اختبر الاتصال مباشرة:
```powershell
$env:DATABASE_URL='postgresql://neondb_owner:npg_LdQHjZ0kBR3v@ep-red-hill-adxo3mpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
npx prisma db pull
```

---

## ⚠️ مهم:

عند تشغيل `npm run dev`، تأكد من ضبط `DATABASE_URL` في نفس جلسة PowerShell!

أو يمكنك تشغيل:
```powershell
dotenv -e .env.local -- npm run dev
```

بعد تثبيت:
```powershell
npm install -g dotenv-cli
```

---

**✨ بعد اتباع هذه الخطوات، التطبيق سيتصل بـ Neon PostgreSQL بنجاح!**

