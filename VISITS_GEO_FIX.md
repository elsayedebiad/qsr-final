# إصلاح مشكلة الدولة والمدينة في تتبع الزيارات

## المشكلة
كانت الدولة والمدينة تظهر فارغة (-) في جدول الزيارات المباشرة.

## السبب
- API الخارجي `ipapi.co` كان يفشل أو يستغرق وقت طويل
- عدم وجود timeout للطلب
- عدم معالجة حالات الخطأ بشكل صحيح

## الحل المطبق

### 1. إضافة Timeout (3 ثواني)
```typescript
const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
  signal: AbortSignal.timeout(3000) // 3 seconds timeout
})
```

### 2. التحقق من وجود أخطاء في الاستجابة
```typescript
if (!geoData.error) {
  country = geoData.country_name || null
  city = geoData.city || null
  console.log(`✅ Geo data for ${ipAddress}:`, { country, city })
} else {
  console.log(`⚠️ ipapi.co error for ${ipAddress}:`, geoData.reason)
}
```

### 3. إضافة Logging مفصل
- `✅` عند نجاح الحصول على البيانات
- `⚠️` عند وجود خطأ من API
- `❌` عند فشل الطلب

## كيفية الاختبار

### 1. افتح صفحة مبيعات
قم بزيارة أي صفحة مبيعات (مثل `/sales1`)

### 2. راقب Console في المتصفح
سترى رسائل مثل:
```
✅ Geo data for 197.54.53.55: { country: 'Egypt', city: 'Cairo' }
```

### 3. تحقق من صفحة التقارير
افتح `/dashboard/visits-report` وشاهد الجدول

## حدود API المجاني

**ipapi.co** لديه حدود:
- **1000 طلب/يوم** للـ IP المجاني
- **30,000 طلب/شهر**

إذا تجاوزت الحد، ستحصل على خطأ:
```json
{
  "error": true,
  "reason": "RateLimited"
}
```

## حلول بديلة (إذا نفذ الحد)

### 1. ipgeolocation.io
- 1000 طلب/يوم مجاني
- API key مجاني

### 2. ip-api.com
- 45 طلب/دقيقة مجاني
- لا يتطلب API key

### 3. CloudFlare Workers (الأفضل)
- غير محدود
- يستخدم `request.cf` للحصول على البيانات

## ملاحظات مهمة

1. **IPs المحلية**: لن يتم البحث عن `127.0.0.1` أو `localhost`
2. **الأداء**: الـ timeout 3 ثواني لتجنب تأخير حفظ الزيارة
3. **Fallback**: إذا فشل API، تُحفظ الزيارة بدون بيانات جغرافية

## الملفات المحدثة
- `src/app/api/visits/track/route.ts` - تحسين معالجة الموقع الجغرافي
