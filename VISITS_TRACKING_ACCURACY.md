# 📊 دقة تتبع الزيارات - دليل شامل

## ✅ التحديثات المطبقة

### 1. **فلتر الحملة الإعلانية**
تم إضافة فلتر جديد في صفحة تقارير الزيارات (`/dashboard/visits-report`) يسمح بفلترة الزيارات حسب الحملة.

#### المزايا:
- ✅ عرض جميع الحملات الإعلانية الموجودة في النظام
- ✅ عدد الزيارات لكل حملة
- ✅ فلترة مباشرة عند الاختيار
- ✅ دعم التصدير والأرشفة بناءً على الحملة

#### الاستخدام:
```typescript
// في الواجهة
campaignFilter: 'ALL' | 'campaign_name'

// في API
filters: {
  campaign: campaignFilter !== 'ALL' ? campaignFilter : undefined
}
```

---

## 🎯 نظام التصنيف الدقيق للمصادر

### **الأولوية في التصنيف**

النظام يتبع أولويات محددة لضمان دقة 100%:

#### **الأولوية 1: معرفات الإعلانات** (أعلى دقة)
```typescript
if (visit.gclid) → 'Google Ads'
if (visit.fbclid) → 'Facebook Ads'
if (visit.msclkid) → 'Microsoft Ads'
if (visit.ttclid) → 'TikTok Ads'
```

**لماذا؟** هذه معرفات فريدة تُضاف تلقائياً من منصات الإعلانات ولا يمكن تزويرها.

#### **الأولوية 2: UTM Source**
```typescript
if (visit.utmSource) → استخدام القيمة كما هي
```

**لماذا؟** UTM parameters تُضاف يدوياً في روابط الحملات الإعلانية.

**⚠️ تحذير:** إذا كان لديك حملة من تويتر، **يجب** إضافة `?utm_source=twitter` للرابط، وإلا سيظهر كـ Direct.

#### **الأولوية 3: Google Flag**
```typescript
if (visit.isGoogle) → 'Google Organic'
```

**لماذا؟** يُحدد تلقائياً بناءً على `gclid` أو `referer`.

#### **الأولوية 4: Referer Analysis**
```typescript
if (referer.includes('twitter') || referer.includes('t.co')) → 'Twitter'
if (referer.includes('facebook')) → 'Facebook'
// ... إلخ
```

**لماذا؟** آخر طريقة للتحديد بناءً على URL المصدر.

---

## 🔍 كيف تتحقق من دقة البيانات؟

### **1. فحص السجلات (Logs)**

عند ظهور زيارة من Twitter، سيظهر في console:

```javascript
⚠️ Twitter Visit Detected: {
  utmSource: 'twitter',  // أو null
  referer: 'https://t.co/xyz',  // أو null
  utmCampaign: 'campaign_name',  // أو null
  id: 123
}
```

### **2. مراجعة قاعدة البيانات**

```sql
-- جميع الزيارات من Twitter
SELECT * FROM "Visit" 
WHERE "utmSource" ILIKE '%twitter%' 
   OR "referer" ILIKE '%twitter%' 
   OR "referer" ILIKE '%t.co%';
```

### **3. فلتر في الداشبورد**

افتح `/dashboard/visits-report` واختر فلتر المصدر أو الحملة.

---

## 🚫 لماذا يظهر Twitter وأنا لم أعمل إعلانات؟

### **السيناريوهات المحتملة:**

#### **1. روابط مشاركة عبر تويتر**
إذا شارك أحد رابط موقعك على تويتر، سيُسجل كـ Twitter:
```
User clicks → https://t.co/xyz → yoursite.com
Referer: t.co → Classified as Twitter
```

**الحل:** هذا طبيعي وليس إعلان، بل زيارة عضوية من تويتر.

#### **2. UTM Parameters خاطئة**
إذا أضفت `?utm_source=twitter` بالخطأ في حملة أخرى:
```
facebook_ad?utm_source=twitter → يظهر كـ Twitter ❌
```

**الحل:** راجع روابط الحملات الإعلانية.

#### **3. Bot/Crawler من تويتر**
أحياناً Twitter bot يزحف للموقع:
```
User-Agent: Twitterbot
Referer: twitter.com
```

**الحل:** طبيعي، يحدث عند معاينة الروابط.

#### **4. Direct Share Links**
بعض المستخدمين ينسخون الروابط من تويتر مباشرة:
```
Copy from Twitter → Paste in browser
Still has t.co domain → Classified as Twitter
```

---

## 📝 أفضل الممارسات

### **1. استخدم UTM Parameters دائماً**

لكل حملة إعلانية:
```
Facebook Ad:
https://yoursite.com/sales?utm_source=facebook&utm_campaign=spring_sale

Instagram Ad:
https://yoursite.com/sales?utm_source=instagram&utm_campaign=spring_sale

TikTok Ad:
https://yoursite.com/sales?utm_source=tiktok&utm_campaign=spring_sale
```

### **2. تسمية موحدة للمصادر**

استخدم أسماء صغيرة بدون مسافات:
- ✅ `facebook`, `instagram`, `tiktok`
- ❌ `Facebook`, `Face Book`, `FB`

### **3. أدوات مساعدة**

استخدم [Campaign URL Builder](https://ga-dev-tools.web.app/campaign-url-builder/):
- اختر المصدر (Source)
- اختر الوسيط (Medium): cpc, social, email
- اسم الحملة (Campaign)

---

## 🔧 كيفية إصلاح البيانات الخاطئة

### **إذا كانت الزيارات مصنفة خطأ:**

#### **1. تحديد المشكلة**
```sql
-- ابحث عن الزيارات المشتبه بها
SELECT 
  id, 
  "utmSource", 
  "referer", 
  "utmCampaign",
  "targetPage"
FROM "Visit" 
WHERE "utmSource" = 'twitter'
ORDER BY "timestamp" DESC
LIMIT 20;
```

#### **2. تحديث البيانات (إذا لزم)**
```sql
-- تحديث مصدر معين
UPDATE "Visit" 
SET "utmSource" = 'facebook' 
WHERE id IN (1, 2, 3);

-- أو حذف UTM خاطئ
UPDATE "Visit" 
SET "utmSource" = NULL 
WHERE "utmSource" = 'wrong_source';
```

#### **3. إعادة الحساب**
أعد فتح صفحة `/dashboard/visits-report` وستتحدث الإحصائيات تلقائياً.

---

## 📊 التقارير المتاحة

### **1. تقرير المصادر**
عرض جميع المصادر مع العدد:
```
Google: 150
Facebook: 80
Instagram: 45
Direct: 30
Twitter: 5  ← تحقق من هذا
```

### **2. تقرير الحملات**
عرض جميع الحملات مع العدد:
```
spring_sale: 100
summer_promo: 50
No Campaign: 130
```

### **3. فلترة متقدمة**
- حسب الدولة
- حسب الصفحة
- حسب الحملة
- حسب التاريخ

---

## ⚙️ الإعدادات المتقدمة

### **تفعيل/تعطيل Logging**

في `/api/visits/stats/route.ts`:
```typescript
// تفعيل (للتشخيص)
if (source === 'Twitter') {
  console.log('⚠️ Twitter Visit Detected:', {...})
}

// تعطيل (في الإنتاج)
// حذف أو تعليق الكود أعلاه
```

### **إضافة مصادر جديدة**

إذا أضفت منصة جديدة (مثل LinkedIn):
```typescript
// في sourceStats
else if (refLower.includes('linkedin')) source = 'LinkedIn'

// في visitStats للصفحات
else if (sourceLower.includes('linkedin')) {
  sources.other++  // أو أضف linkedin: 0 في البداية
}
```

---

## 🎓 الخلاصة

### ✅ **ما تم تطبيقه:**
1. فلتر الحملة في صفحة التقارير
2. نظام تصنيف دقيق بأولويات واضحة
3. logging للتشخيص
4. توثيق شامل

### 📌 **نقاط مهمة:**
- ظهور Twitter **ليس دائماً** إعلان
- قد يكون مشاركة عضوية أو bot
- راجع البيانات قبل الاستنتاج
- استخدم UTM parameters دائماً

### 🚀 **الخطوات التالية:**
1. افحص logs في console
2. راجع قاعدة البيانات
3. حدد مصدر الزيارات
4. صحح UTM parameters إن لزم

---

**آخر تحديث:** 2024
**الإصدار:** 2.0

**ملاحظة:** يمكنك حذف logging بعد التأكد من دقة البيانات في الإنتاج.
