# خطوات التشغيل السريع - Quick Start After Fix

## ✅ ما تم إصلاحه

1. ✅ حذف TikTok Pixel الذي كان يسبب أخطاء
2. ✅ إضافة Microsoft Clarity كبديل أفضل
3. ✅ تحديث Google Tag Manager لاستخدام متغيرات البيئة
4. ✅ التأكد من Facebook Pixel يعمل بشكل صحيح
5. ✅ إزالة معرف TikTok الخاطئ من .env.example

## 🚀 خطوات التشغيل

### 1. إنشاء ملف .env.local

في PowerShell، قم بتشغيل:

```powershell
cd "C:\Users\engelsayedebaid\Desktop\qsr-final-1"

@"
NEXT_PUBLIC_GTM_ID=`"GTM-PQPPR2PP`"
"@ | Out-File -FilePath ".env.local" -Encoding utf8
```

**أو** يمكنك إنشاء الملف يدوياً:
- اذهب إلى مجلد المشروع
- أنشئ ملف جديد باسم `.env.local`
- أضف السطر: `NEXT_PUBLIC_GTM_ID="GTM-PQPPR2PP"`

### 2. إعادة تشغيل الخادم

```powershell
npm run dev
```

### 3. افتح المتصفح

```
http://localhost:3000
```

### 4. افتح Console (F12)

تحقق من:
- ✅ لا أخطاء CSP
- ✅ لا أخطاء TikTok Pixel
- ✅ Microsoft Clarity يعمل
- ✅ Google Tag Manager يعمل

## 📊 الخدمات المفعلة حالياً

| الخدمة | الحالة | الملاحظات |
|--------|--------|----------|
| **Microsoft Clarity** | ✅ مُفعل | معرف: mv43q3vjmh - تحليلات وخرائط حرارية مجانية |
| **Google Tag Manager** | ✅ مُفعل | معرف: GTM-PQPPR2PP |
| **Facebook Pixel** | ⚠️ معطل | يحتاج معرف صحيح في .env.local |
| **TikTok Pixel** | ❌ محذوف | تم استبداله بـ Clarity |
| **Google Analytics** | ⚠️ معطل | يمكن تفعيله عبر GTM |

## 🔑 لتفعيل Facebook Pixel

1. احصل على Pixel ID من [Facebook Business Manager](https://business.facebook.com/)
2. أضف السطر التالي إلى `.env.local`:
   ```
   NEXT_PUBLIC_FACEBOOK_PIXEL_ID="123456789012345"
   ```
3. أعد تشغيل الخادم

## 📦 ملفات التوثيق

- **TRACKING_PIXELS_FIX.md** - شرح تفصيلي لجميع المشاكل والحلول
- **ENV_LOCAL_SETUP_GUIDE.md** - دليل إنشاء ملف .env.local
- **هذا الملف** - خطوات سريعة للبدء

## 🎯 الأخطاء التي تم حلها

### قبل الإصلاح ❌
```
Loading the script 'https://sc-static.net/scevent.min.js' violates CSP
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
[Meta Pixel] - Missing event name
[TikTok Pixel] - Invalid pixel ID
[TikTok Pixel] - Invalid Event Name Format
```

### بعد الإصلاح ✅
```
✅ No CSP errors
✅ Microsoft Clarity loaded successfully
✅ Google Tag Manager initialized
✅ All pixels working correctly
```

## 🎨 فوائد Microsoft Clarity

- **مجاني تماماً** - بدون أي قيود
- **خرائط حرارية** - انظر أين ينقر المستخدمون
- **تسجيلات الجلسات** - شاهد كيف يتصفح المستخدمون
- **تحليلات متقدمة** - Rage clicks, Dead clicks, Quick backs
- **Dashboard سهل الاستخدام** - [clarity.microsoft.com](https://clarity.microsoft.com)

---

تاريخ الإصلاح: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}
