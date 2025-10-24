# 🚀 دليل البدء السريع - نظام QSR

## 📋 الإعداد الأولي (5 دقائق)

### 1. نسخ ملف البيئة
```bash
cp .env.example .env.local
```

### 2. تعديل المتغيرات الأساسية
افتح `.env.local` وقم بتعديل:

```env
# قاعدة البيانات (إلزامي)
DATABASE_URL="postgresql://user:password@localhost:5432/cv_management"

# NextAuth (إلزامي)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret-here"

# Facebook Pixel (اختياري - للإعلانات)
NEXT_PUBLIC_FACEBOOK_PIXEL_ID="123456789"
```

### 3. تثبيت وتشغيل
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

افتح المتصفح على: http://localhost:3000

---

## 🎯 الميزات الجديدة - كيفية الاستخدام

### 📊 تصدير الزيارات إلى Excel

#### الطريقة 1: من الواجهة (الأسهل)
1. اذهب إلى `/dashboard/visits-report`
2. اختر الفلاتر المطلوبة (دولة، صفحة، تاريخ)
3. اضغط على زر **"تصدير Excel"** الأخضر
4. سيتم تحميل ملف Excel تلقائياً

#### الطريقة 2: من API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/visits/export-excel?country=Saudi%20Arabia&limit=1000" \
  --output visits.xlsx
```

#### 📂 ما ستجده في الملف:
- **ورقة 1**: جميع الزيارات (15 عمود)
- **ورقة 2**: إحصائيات المصادر
- **ورقة 3**: ترتيب الدول
- **ورقة 4**: ترتيب الصفحات

---

### 📧 التقارير الأسبوعية التلقائية

#### الإعداد (مرة واحدة):

**1. إنشاء App Password لـ Gmail:**
- اذهب إلى: https://myaccount.google.com/apppasswords
- أنشئ كلمة مرور جديدة
- انسخها

**2. أضف في `.env.local`:**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="paste-app-password-here"
REPORT_EMAIL_RECIPIENTS="admin@company.com,manager@company.com"
CRON_SECRET="create-random-secret-123"
```

**3. التفعيل التلقائي:**
- على Vercel: سيعمل تلقائياً كل يوم اثنين 9 صباحاً
- محلياً: استخدم الاختبار اليدوي

#### اختبار التقرير يدوياً:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/reports/weekly
```

---

### 🔍 Sentry (مراقبة الأخطاء)

#### الإعداد:
1. سجل حساب مجاني: https://sentry.io
2. أنشئ مشروع جديد (Next.js)
3. انسخ DSN
4. أضف في `.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN="https://your-key@o123.ingest.sentry.io/456"
```

#### المزايا:
- ✅ كشف الأخطاء تلقائياً
- ✅ إشعارات فورية بالإيميل
- ✅ تفاصيل كاملة عن الخطأ
- ✅ تتبع الأداء

---

## 📱 كيفية استخدام الميزات الموجودة

### 1️⃣ إضافة سيرة ذاتية
```
/dashboard/add-cv-alqaeid
```

### 2️⃣ استيراد من Excel
```
/dashboard/import-alqaeid
```

### 3️⃣ استيراد ذكي (Google Sheets)
```
/dashboard/google-sheets
```

### 4️⃣ إدارة المستخدمين والصلاحيات
```
/dashboard/users
```

### 5️⃣ مراقبة الزيارات المباشرة
```
/dashboard/visits-report
```

### 6️⃣ نظام التوزيع المرجح
```
/dashboard/distribution
```

### 7️⃣ سجل الأنشطة
```
/dashboard/activity-log
```

### 8️⃣ صفحات المبيعات
```
/sales1 إلى /sales11
```

---

## ⚡ نصائح للأداء

### 1. للإنتاج على Vercel:
```bash
# في vercel.json تأكد من:
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### 2. متغيرات البيئة على Vercel:
- اذهب إلى: Project Settings → Environment Variables
- أضف جميع المتغيرات من `.env.local`
- تأكد من تفعيل `CRON_SECRET` للتقارير

### 3. قاعدة البيانات للإنتاج:
- استخدم Supabase أو Neon.tech
- فعّل Connection Pooling
- ضع `?pgbouncer=true` في نهاية DATABASE_URL

---

## 🐛 حل المشاكل الشائعة

### ❌ "Failed to export visits"
**الحل**: تأكد أنك مسجل دخول كـ ADMIN

### ❌ "CRON_SECRET غير صحيح"
**الحل**: تأكد من إضافة `Authorization: Bearer YOUR_SECRET` في الـ header

### ❌ "Failed to send email"
**الحل**: 
1. تأكد من App Password وليس كلمة المرور العادية
2. تأكد من تفعيل "Less secure app access" (Gmail)
3. جرب SMTP آخر مثل SendGrid

### ❌ التقرير لا يصل
**الحل**:
1. اختبر يدوياً أولاً
2. تحقق من spam folder
3. تحقق من Vercel Logs

---

## 🎨 تخصيص النظام

### تغيير ألوان صفحات المبيعات:
```typescript
// في أي ملف sales/page.tsx
const primaryColor = "from-blue-500 to-blue-600"
const accentColor = "text-blue-500"
```

### إضافة مصدر جديد للتتبع:
```typescript
// في src/app/api/visits/track/route.ts
const source = searchParams.get('utm_source')
// أضف منطق جديد هنا
```

### تعديل جدول التقارير:
```json
// في vercel.json
"crons": [
  {
    "path": "/api/reports/weekly",
    "schedule": "0 9 * * 1"  // غيّر التوقيت هنا
  }
]
```

**أمثلة Cron:**
- `0 9 * * 1` = كل اثنين 9 صباحاً
- `0 18 * * 5` = كل جمعة 6 مساءً
- `0 0 1 * *` = أول يوم من كل شهر

---

## 📞 روابط مفيدة

### التوثيق:
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vercel Cron](https://vercel.com/docs/cron-jobs)

### الخدمات:
- [Sentry](https://sentry.io)
- [Supabase](https://supabase.com)
- [SendGrid](https://sendgrid.com)

### الأدوات:
- [Cron Expression Generator](https://crontab.guru)
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)

---

## ✅ Checklist قبل الإنتاج

- [ ] تم إعداد `.env.local` بالكامل
- [ ] تم اختبار تصدير Excel
- [ ] تم اختبار التقارير الأسبوعية
- [ ] تم إعداد Sentry
- [ ] تم إعداد Facebook Pixel
- [ ] تم فحص جميع الصفحات (38 صفحة)
- [ ] تم إنشاء حساب مدير
- [ ] تم اختبار النظام على الموبايل
- [ ] تم رفع على Vercel/Production
- [ ] تم تفعيل SSL
- [ ] تم فحص سرعة الموقع

---

## 🎉 جاهز للعمل!

النظام الآن جاهز **100%** للاستخدام في الإنتاج.

**للدعم**: راجع `COMPLETE_FEATURES.md` للتفاصيل الكاملة.
