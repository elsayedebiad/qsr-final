# إعداد ملف .env.local

## خطوات إنشاء ملف .env.local

قم بإنشاء ملف باسم `.env.local` في جذر المشروع وأضف المحتوى التالي:

```env
# Google Tag Manager
NEXT_PUBLIC_GTM_ID="GTM-PQPPR2PP"

# Facebook Pixel (استبدل بمعرف حقيقي من Facebook Business Manager)
# NEXT_PUBLIC_FACEBOOK_PIXEL_ID="your-facebook-pixel-id-here"

# Google Analytics (اختياري)
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"

# TikTok Pixel (اختياري - احصل على معرف صحيح من TikTok Ads Manager)
# NEXT_PUBLIC_TIKTOK_PIXEL_ID="your-tiktok-pixel-id-here"

# Sentry Error Tracking (اختياري)
# NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

## استخدام PowerShell

```powershell
# انتقل إلى مجلد المشروع
cd "C:\Users\engelsayedebaid\Desktop\qsr-final-1"

# إنشاء الملف
@"
# Google Tag Manager
NEXT_PUBLIC_GTM_ID="GTM-PQPPR2PP"

# Facebook Pixel (استبدل بمعرف حقيقي من Facebook Business Manager)
# NEXT_PUBLIC_FACEBOOK_PIXEL_ID="your-facebook-pixel-id-here"

# Google Analytics (اختياري)
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"

# TikTok Pixel (اختياري - احصل على معرف صحيح من TikTok Ads Manager)
# NEXT_PUBLIC_TIKTOK_PIXEL_ID="your-tiktok-pixel-id-here"

# Sentry Error Tracking (اختياري)
# NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
"@ | Out-File -FilePath ".env.local" -Encoding utf8
```

## ملاحظات هامة

1. الملف `.env.local` **لن يتم رفعه على Git** لأنه موجود في `.gitignore`
2. هذا الملف يحتوي على **إعدادات محلية فقط**
3. **GTM مُفعل بالفعل** - باقي الخدمات معطلة (مُعلقة بـ `#`)
4. لتفعيل Facebook Pixel أو خدمات أخرى، احذف علامة `#` وأضف المعرف الصحيح
