# ⚠️ حل مشكلة استهلاك الذاكرة على Vercel

## المشكلة 🚨
```
Serverless Functions are limited to 2048 mb of memory for personal accounts (Hobby plan).
```

## الأسباب الرئيسية

### 1. **Puppeteer** 🔴 (استهلاك: 800MB - 2GB+)
**الملف:** `src/app/api/cv/[id]/alqaeid-image/route.ts`

Puppeteer يستخدم Chrome headless كامل لإنشاء صور من HTML، وهذا يستهلك ذاكرة ضخمة جداً!

### 2. **File System Operations** 🟡
**الملفات المتأثرة:**
- `src/app/api/upload/image/route.ts` - حفظ الصور
- `src/app/api/uploads/[...path]/route.ts` - قراءة الصور
- `src/app/api/banners/route.ts` - حفظ البنرات

**المشكلة:** Vercel Serverless Functions ليس لها file system دائم، الملفات تختفي بعد كل deployment!

### 3. **Google Sheets Sync** 🟢
**الملف:** `src/app/api/google-sheets/sync/route.ts`

يجلب كل البيانات دفعة واحدة في الذاكرة.

---

## الحلول 🔧

### ✅ الحل 1: تقليل Memory Requirements (تم تطبيقه)
غيرت `vercel.json` من 3008 MB إلى 1024 MB

### ❌ الحل 2: إزالة أو استبدال Puppeteer

**الخيارات البديلة:**

#### **أ) استخدام Client-Side Rendering** (موصى به ⭐)
```typescript
// في الـ Frontend (React Component)
import html2canvas from 'html2canvas'
import jspdf from 'jspdf'

const generateImage = async () => {
  const element = document.getElementById('cv-template')
  const canvas = await html2canvas(element)
  const image = canvas.toDataURL('image/png')
  return image
}
```

**المزايا:**
- ✅ لا يستهلك ذاكرة على السيرفر
- ✅ أسرع
- ✅ مجاني تماماً

**العيوب:**
- ⚠️ يحتاج متصفح المستخدم
- ⚠️ قد لا يعمل مع بعض الصور

#### **ب) استخدام External API Service**
```typescript
// استخدام API مثل:
// - https://htmlcsstoimage.com/
// - https://api2pdf.com/
// - https://pdfshift.io/

const response = await fetch('https://hcti.io/v1/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('user_id:api_key').toString('base64')
  },
  body: JSON.stringify({
    html: htmlTemplate,
    css: cssStyles
  })
})

const { url } = await response.json()
```

**المزايا:**
- ✅ لا يستهلك ذاكرة على السيرفر
- ✅ جودة عالية

**العيوب:**
- ⚠️ مدفوع (لكن رخيص)
- ⚠️ يحتاج API key

#### **ج) استخدام Vercel Edge Functions**
```typescript
// في vercel.json
"functions": {
  "src/app/api/cv/[id]/alqaeid-image/route.ts": {
    "runtime": "edge"
  }
}
```

**المزايا:**
- ✅ أسرع
- ✅ أرخص

**العيوب:**
- ⚠️ لا يدعم Puppeteer
- ⚠️ محدود في الـ APIs المتاحة

### ✅ الحل 3: استخدام Cloud Storage للصور

بدلاً من حفظ الصور في `public/uploads/`, استخدم:

#### **Vercel Blob Storage** (موصى به ⭐)
```bash
npm install @vercel/blob
```

```typescript
import { put, list, del } from '@vercel/blob'

// رفع صورة
const blob = await put('cv-images/image.jpg', file, {
  access: 'public',
})

// الحصول على URL
console.log(blob.url) // https://xxxxx.public.blob.vercel-storage.com/...
```

#### **Cloudinary** (بديل ممتاز)
```bash
npm install cloudinary
```

```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const result = await cloudinary.uploader.upload(file, {
  folder: 'cv-images'
})

console.log(result.secure_url)
```

### ⚡ الحل 4: تحسين Google Sheets Sync

```typescript
// بدلاً من جلب كل البيانات دفعة واحدة:
const sheetData = await googleSheetsService.getAllData()

// استخدم pagination:
const batchSize = 100
for (let i = 0; i < totalRows; i += batchSize) {
  const batch = await googleSheetsService.getDataRange(i, i + batchSize)
  await processBatch(batch)
}
```

---

## 📋 خطة العمل الموصى بها

### المرحلة 1: التغييرات الفورية (تمت ✅)
- [x] تقليل memory من 3008 MB إلى 1024 MB
- [x] إنشاء ملف التوثيق

### المرحلة 2: التغييرات المتوسطة (موصى به)
- [ ] استخدام Vercel Blob Storage للصور والبنرات
- [ ] نقل image generation إلى client-side (html2canvas)
- [ ] حذف أو تعطيل `/api/cv/[id]/alqaeid-image` route

### المرحلة 3: التغييرات طويلة المدى
- [ ] استخدام external API لـ image generation (إذا لزم الأمر)
- [ ] تحسين Google Sheets sync مع pagination
- [ ] إضافة caching للبيانات الثقيلة

---

## 🧪 الاختبار

بعد التغييرات، راقب استهلاك الذاكرة في Vercel Dashboard:

1. اذهب إلى: https://vercel.com/your-project/analytics
2. اختر "Functions"
3. راقب "Memory Usage"

الهدف: **< 512 MB** لكل request

---

## 📚 موارد إضافية

- [Vercel Functions Limits](https://vercel.com/docs/functions/serverless-functions/runtimes#limits)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Next.js Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)

---

## ⚠️ ملاحظات مهمة

1. **Puppeteer لا يعمل على Hobby Plan** - استخدم Pro plan أو بديل
2. **File system مؤقت** - استخدم cloud storage دائماً
3. **Edge Functions أسرع** - لكن محدودة في الـ APIs
4. **Client-side هو الأفضل** - لـ image/PDF generation إذا ممكن

---

تم التحديث: 4 أكتوبر 2025

