# شرح نظام التوزيع في QSR System 📊

## 🎯 الفكرة الأساسية

النظام يوزع الزوار على **11 صفحة مبيعات** (sales1 - sales11) بطريقة **ذكية ومرجحة** حسب مصدر الزائر.

---

## 🔄 كيف يعمل التوزيع؟

### 1️⃣ **نقطة الدخول: `/sales`**

عندما يزور شخص الرابط `/sales`:
```
https://yoursite.com/sales
         ↓
   يتم التحليل والتوجيه التلقائي
         ↓
https://yoursite.com/sales3 (مثلاً)
```

---

### 2️⃣ **التحليل الذكي للمصدر**

النظام يكتشف **من أين جاء الزائر**:

#### 🔴 زائر من Google:
```javascript
// يبحث عن هذه العلامات في referer:
- google.com
- googleadservices.com
- g.doubleclick.net
- googlesyndication.com
- gclid= (Google Click ID)
```

#### 🟢 زائر من مصادر أخرى:
```
- Facebook
- Instagram
- TikTok
- مباشر (كتب الرابط بنفسه)
- أي مصدر آخر
```

---

### 3️⃣ **التوزيع المرجح (Weighted Distribution)**

#### النظام لديه **جدولين منفصلين**:

**جدول Google:**
```javascript
[
  { path: '/sales1', weight: 9.09 },  // 9.09%
  { path: '/sales2', weight: 9.09 },  // 9.09%
  { path: '/sales3', weight: 9.09 },  // 9.09%
  // ... إلخ
  { path: '/sales11', weight: 9.01 }, // 9.01%
]
// الإجمالي: 100%
```

**جدول المصادر الأخرى:**
```javascript
[
  { path: '/sales1', weight: 9.09 },  // 9.09%
  { path: '/sales2', weight: 9.09 },  // 9.09%
  // ... نفس التوزيع
]
```

---

### 4️⃣ **خوارزمية الاختيار**

```typescript
function pickWeighted(items, random) {
  const total = items.reduce((sum, item) => sum + item.weight, 0) // = 100
  let cursor = random * total  // مثلاً: 0.7234 * 100 = 72.34
  
  for (const item of items) {
    cursor -= item.weight
    if (cursor <= 0) return item
  }
}
```

#### مثال عملي:
```
Random = 0.7234
cursor = 72.34

- sales1: cursor = 72.34 - 9.09 = 63.25 ❌
- sales2: cursor = 63.25 - 9.09 = 54.16 ❌
- sales3: cursor = 54.16 - 9.09 = 45.07 ❌
- sales4: cursor = 45.07 - 9.09 = 35.98 ❌
- sales5: cursor = 35.98 - 9.09 = 26.89 ❌
- sales6: cursor = 26.89 - 9.09 = 17.80 ❌
- sales7: cursor = 17.80 - 9.09 = 8.71 ❌
- sales8: cursor = 8.71 - 9.09 = -0.38 ✅

→ يختار sales8
```

---

### 5️⃣ **الثبات عبر Cookie**

```javascript
// Cookie: td_bucket
// العمر: 7 أيام

// أول زيارة:
random = Math.random()  // مثلاً 0.3456
cookie = "td_bucket=0.3456"
→ يذهب لـ sales4

// الزيارة الثانية (خلال 7 أيام):
random = 0.3456  // نفس القيمة من الكوكي
→ يذهب لـ sales4 مرة أخرى ✅
```

**الفائدة:**
- نفس الزائر يرى دائماً **نفس الصفحة**
- تجربة متسقة
- تتبع أفضل

---

## ⚙️ إدارة قواعد التوزيع

### صفحة `/dashboard/distribution`

يمكن تعديل النسب من لوحة التحكم:

```
┌────────────────────────────────────────────┐
│ الصفحة  │ Google % │ Other % │ الحالة   │
├────────────────────────────────────────────┤
│ sales1  │   15.0   │  10.0   │  نشط     │
│ sales2  │   20.0   │  15.0   │  نشط     │
│ sales3  │   10.0   │  10.0   │  نشط     │
│ sales4  │    5.0   │   5.0   │  نشط     │
│ sales5  │   15.0   │  20.0   │  نشط     │
│ sales6  │   10.0   │  10.0   │  نشط     │
│ sales7  │    0.0   │   0.0   │  معطل   │
│ sales8  │   10.0   │  10.0   │  نشط     │
│ sales9  │    5.0   │   5.0   │  نشط     │
│ sales10 │    5.0   │   7.5   │  نشط     │
│ sales11 │    5.0   │   7.5   │  نشط     │
├────────────────────────────────────────────┤
│ الإجمالي │  100.0   │ 100.0   │          │
└────────────────────────────────────────────┘
```

### مثال: توزيع مخصص

```javascript
// إذا أردت أن sales1 تحصل على زوار Google أكثر:
GOOGLE_WEIGHTED = [
  { path: '/sales1', weight: 25.0 },  // 25% من زوار Google ✅
  { path: '/sales2', weight: 15.0 },
  { path: '/sales3', weight: 10.0 },
  // ... باقي الصفحات تقسم الـ 60% المتبقية
]

// بينما المصادر الأخرى متساوية:
OTHER_WEIGHTED = [
  { path: '/sales1', weight: 9.09 },
  { path: '/sales2', weight: 9.09 },
  // ... توزيع متساوي
]
```

---

## 📊 أمثلة عملية

### مثال 1: زائر من Google Ads
```
1. الزائر يضغط على إعلان Google
2. Referer = "https://googleadservices.com/..."
3. النظام يكتشف: "هذا من Google!" ✅
4. يستخدم جدول GOOGLE_WEIGHTED
5. Random = 0.1234
6. النتيجة: يذهب لـ sales2 (وزنه 9.09%)
7. يسجل الزيارة في قاعدة البيانات
```

### مثال 2: زائر من Facebook
```
1. الزائر يضغط على بوست Facebook
2. Referer = "https://facebook.com/..."
3. النظام يكتشف: "ليس من Google" ✅
4. يستخدم جدول OTHER_WEIGHTED
5. Random = 0.5678
6. النتيجة: يذهب لـ sales6 (وزنه 9.09%)
7. يسجل الزيارة في قاعدة البيانات
```

### مثال 3: زائر مباشر
```
1. الزائر يكتب الرابط في المتصفح
2. Referer = "" (فارغ)
3. النظام: "ليس من Google"
4. يستخدم جدول OTHER_WEIGHTED
5. Random = 0.8901
6. النتيجة: يذهب لـ sales10
```

---

## 🎲 توزيع عشوائي لكن متوازن

### السيناريو: 1000 زائر

```
إذا كانت جميع الأوزان متساوية (9.09%):

sales1:  91 زائر   (9.09%)
sales2:  91 زائر   (9.09%)
sales3:  91 زائر   (9.09%)
sales4:  91 زائر   (9.09%)
sales5:  91 زائر   (9.09%)
sales6:  91 زائر   (9.09%)
sales7:  91 زائر   (9.09%)
sales8:  91 زائر   (9.09%)
sales9:  91 زائر   (9.09%)
sales10: 91 زائر   (9.09%)
sales11: 90 زائر   (9.01%)
────────────────────────────
الإجمالي: 1000 زائر (100%)
```

---

## 🔧 API لإدارة التوزيع

### 1. جلب القواعد
```bash
GET /api/distribution/rules
```

**Response:**
```json
{
  "success": true,
  "rules": [
    {
      "salesPageId": "sales1",
      "googleWeight": 9.09,
      "otherWeight": 9.09,
      "isActive": true
    },
    // ...
  ]
}
```

### 2. تحديث القواعد
```bash
POST /api/distribution/rules
```

**Body:**
```json
{
  "rules": [
    {
      "path": "/sales1",
      "googleWeight": 15.0,
      "otherWeight": 10.0,
      "isActive": true
    }
    // ...
  ]
}
```

---

## 📈 تتبع الزيارات

كل زيارة تُسجل في قاعدة البيانات:

```sql
INSERT INTO Visit (
  ipAddress,
  country,
  city,
  targetPage,      -- الصفحة التي تم توجيهه إليها
  referer,
  utmSource,
  utmMedium,
  utmCampaign,
  isGoogle,        -- هل من Google؟
  userAgent,
  timestamp
) VALUES (...)
```

---

## 🎯 المزايا

### ✅ توزيع عادل
- كل صفحة تحصل على نصيبها حسب الوزن المحدد

### ✅ مرونة كاملة
- يمكن تعديل الأوزان في أي وقت
- تعطيل/تفعيل صفحات معينة

### ✅ تتبع دقيق
- معرفة من أين جاء كل زائر
- إحصائيات مفصلة لكل صفحة

### ✅ ثبات التجربة
- نفس الزائر يرى نفس الصفحة دائماً (خلال 7 أيام)

### ✅ تحكم في مصادر الإعلانات
- توزيع مختلف لـ Google vs مصادر أخرى
- تخصيص النسب حسب أداء كل مصدر

---

## 🚀 حالات استخدام متقدمة

### 1. A/B Testing
```javascript
// أريد اختبار sales1 بقوة:
GOOGLE_WEIGHTED = [
  { path: '/sales1', weight: 50.0 },  // 50% لـ sales1
  { path: '/sales2', weight: 10.0 },
  // ... باقي الصفحات 40%
]
```

### 2. تعطيل صفحة مؤقتاً
```javascript
// sales7 قيد الصيانة:
{ path: '/sales7', weight: 0.0, isActive: false }
// يتم توزيع نصيبها على الصفحات الأخرى تلقائياً
```

### 3. تركيز على موظف معين
```javascript
// موظف sales3 أداؤه ممتاز، نعطيه زوار أكثر:
{ path: '/sales3', weight: 20.0 }  // من 9% إلى 20%
```

---

## 📊 الملخص

```
┌─────────────┐
│   /sales    │  ← نقطة الدخول
└──────┬──────┘
       │
       ↓
   [تحليل المصدر]
       │
    ┌──┴──┐
    │     │
Google?   Other?
    │     │
    ↓     ↓
 جدول G  جدول O
    │     │
    └──┬──┘
       │
       ↓
  [اختيار مرجح]
       │
       ↓
  [حفظ Cookie]
       │
       ↓
 [تسجيل الزيارة]
       │
       ↓
 /sales1 - /sales11
```

---

## 🎓 ملخص تقني

1. **Entry Point**: `/sales`
2. **Detection**: كشف Google vs Other من referer
3. **Selection**: اختيار مرجح باستخدام Math.random()
4. **Persistence**: حفظ القيمة في cookie لمدة 7 أيام
5. **Tracking**: تسجيل الزيارة في DB
6. **Redirect**: إعادة توجيه للصفحة المختارة

---

**النظام يضمن توزيع عادل ومتوازن مع إمكانية التحكم الكامل! 🎯**
