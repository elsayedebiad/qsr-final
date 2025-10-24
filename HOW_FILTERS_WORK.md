# 🔍 شرح شامل: كيف تعمل الفلاتر في صفحة التقارير

## 📌 نظرة عامة

صفحة تقارير الزيارات (`/dashboard/visits-report`) تحتوي على **5 فلاتر** تعمل معاً بشكل متكامل:

1. 🌍 **فلتر الدولة** (Country Filter)
2. 📄 **فلتر الصفحة** (Page Filter)
3. 🎯 **فلتر الحملة** (Campaign Filter)
4. 📅 **فلتر من تاريخ** (Date From)
5. 📅 **فلتر إلى تاريخ** (Date To)

---

## 🔄 رحلة البيانات (من قاعدة البيانات إلى الشاشة)

### **المرحلة 1: جلب البيانات من API** 📡

#### **الكود في `page.tsx`:**
```typescript
const fetchStats = useCallback(async (page: number, resetToFirstPage = false) => {
  try {
    const targetPage = resetToFirstPage ? 1 : page
    // 🔥 هنا يتم طلب البيانات من API
    const res = await fetch(`/api/visits/stats?page=${targetPage}&limit=${itemsPerPageRef.current}`)
    const data = await res.json()
    
    if (data.success) {
      setStats(data)  // ✅ حفظ البيانات في state
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}, [])
```

#### **ماذا يحدث هنا؟**
1. ✅ يرسل طلب لـ `/api/visits/stats`
2. ✅ يطلب صفحة معينة (pagination)
3. ✅ يطلب عدد معين من النتائج (limit)

---

### **المرحلة 2: معالجة البيانات في API** 🛠️

#### **الملف: `/src/app/api/visits/stats/route.ts`**

```typescript
export async function GET(request: NextRequest) {
  // الخطوة 1: جلب آخر 1000 زيارة من قاعدة البيانات
  const visits = await db.visit.findMany({
    where: { isArchived: false },
    orderBy: { id: 'desc' },
    take: 1000
  })
  
  // الخطوة 2: حساب إحصائيات الدول
  const countryStats = visits.reduce((acc, visit) => {
    const country = (visit.country || 'Unknown').trim()
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // الخطوة 3: حساب إحصائيات الصفحات
  const pageStats = visits.reduce((acc, visit) => {
    const cleanPage = visit.targetPage.trim().toLowerCase().replace(/^\/+/, '')
    acc[cleanPage] = (acc[cleanPage] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // الخطوة 4: حساب إحصائيات الحملات
  const campaignStats = visits.reduce((acc, visit) => {
    const campaign = visit.utmCampaign || 'No Campaign'
    acc[campaign] = (acc[campaign] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // الخطوة 5: إرجاع كل البيانات
  return NextResponse.json({
    success: true,
    summary: { totalVisits, todayVisits, weekVisits, ... },
    countryStats,    // 🌍 { "Saudi Arabia": 150, "Egypt": 80, ... }
    pageStats,       // 📄 { "sales1": 50, "sales2": 30, ... }
    campaignStats,   // 🎯 { "spring_sale": 100, "No Campaign": 50, ... }
    recentVisits: [...],  // 📊 آخر 50 زيارة للصفحة الحالية
    pagination: { ... }
  })
}
```

#### **📊 شكل البيانات المُرجعة:**
```json
{
  "success": true,
  "countryStats": {
    "Saudi Arabia": 150,
    "Egypt": 80,
    "United Arab Emirates": 45,
    "Unknown": 10
  },
  "pageStats": {
    "sales1": 50,
    "sales2": 30,
    "sales10": 25
  },
  "campaignStats": {
    "spring_sale": 100,
    "summer_promo": 50,
    "No Campaign": 135
  },
  "recentVisits": [
    {
      "id": 123,
      "country": "Saudi Arabia",
      "targetPage": "sales10",
      "utmCampaign": "spring_sale",
      "timestamp": "2024-10-24T20:00:00Z"
    }
  ]
}
```

---

### **المرحلة 3: بناء قوائم الفلاتر** 📋

#### **الكود في `page.tsx`:**

```typescript
// 1️⃣ قائمة الدول الفريدة
const uniqueCountries = useMemo(() => {
  if (!stats) return []
  const countriesSet = new Set<string>()
  
  // 🔥 نأخذ مفاتيح countryStats من API
  Object.keys(stats.countryStats).forEach(country => {
    const cleanCountry = country.trim()
    if (cleanCountry && cleanCountry !== 'Unknown') {
      countriesSet.add(cleanCountry)
    }
  })
  
  return Array.from(countriesSet).sort()  // ✅ ترتيب أبجدي
}, [stats])

// 2️⃣ قائمة الصفحات الفريدة
const uniquePages = useMemo(() => {
  if (!stats) return []
  const pagesSet = new Set<string>()
  
  Object.keys(stats.pageStats).forEach(page => {
    const cleanPage = page.trim().toLowerCase().replace(/^\/+/, '')
    if (cleanPage) {
      pagesSet.add(cleanPage)
    }
  })
  
  return Array.from(pagesSet).sort()
}, [stats])

// 3️⃣ قائمة الحملات الفريدة
const uniqueCampaigns = useMemo(() => {
  if (!stats) return []
  const campaignsSet = new Set<string>()
  
  Object.keys(stats.campaignStats).forEach(campaign => {
    if (campaign && campaign.trim() !== '') {
      campaignsSet.add(campaign)
    }
  })
  
  return Array.from(campaignsSet).sort()
}, [stats])
```

#### **📝 النتيجة:**
```typescript
uniqueCountries = ["Egypt", "Saudi Arabia", "United Arab Emirates"]
uniquePages = ["sales1", "sales2", "sales10"]
uniqueCampaigns = ["No Campaign", "spring_sale", "summer_promo"]
```

---

### **المرحلة 4: عرض الفلاتر في الواجهة** 🎨

#### **الكود:**
```tsx
{/* فلتر الدولة */}
<select
  value={countryFilter}
  onChange={(e) => setCountryFilter(e.target.value)}
  className="..."
>
  <option value="ALL">🌍 جميع الدول ({stats?.summary.totalVisits || 0})</option>
  {uniqueCountries.map(country => (
    <option key={country} value={country}>
      📍 {country} ({stats?.countryStats[country] || 0})
    </option>
  ))}
</select>
```

#### **📺 ما يظهر للمستخدم:**
```
🌍 جميع الدول (285)
📍 Saudi Arabia (150)
📍 Egypt (80)
📍 United Arab Emirates (45)
```

---

### **المرحلة 5: تطبيق الفلاتر** 🔍

#### **الكود:**
```typescript
const filteredVisits = useMemo(() => {
  if (!stats) return []
  
  const filtered = stats.recentVisits.filter(visit => {
    // 🔥 فلتر الدولة
    if (countryFilter !== 'ALL') {
      const visitCountry = (visit.country || 'Unknown').trim()
      if (visitCountry !== countryFilter) {
        return false  // ❌ لا تطابق - استبعد هذه الزيارة
      }
    }
    
    // 🔥 فلتر الصفحة
    if (pageFilter !== 'ALL') {
      const visitPage = visit.targetPage.trim().toLowerCase().replace(/^\/+/, '')
      if (visitPage !== pageFilter) {
        return false  // ❌ لا تطابق - استبعد
      }
    }
    
    // 🔥 فلتر الحملة
    if (campaignFilter !== 'ALL') {
      const visitCampaign = visit.utmCampaign || 'No Campaign'
      if (visitCampaign !== campaignFilter) {
        return false  // ❌ لا تطابق - استبعد
      }
    }
    
    // 🔥 فلتر التاريخ (من)
    if (dateFrom) {
      const visitDate = new Date(visit.timestamp)
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      if (visitDate < fromDate) return false
    }
    
    // 🔥 فلتر التاريخ (إلى)
    if (dateTo) {
      const visitDate = new Date(visit.timestamp)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      if (visitDate > toDate) return false
    }
    
    return true  // ✅ كل الفلاتر تطابقت - اعرض هذه الزيارة
  })
  
  // ترتيب من الأحدث للأقدم
  return filtered.sort((a, b) => b.id - a.id)
}, [stats, countryFilter, pageFilter, campaignFilter, dateFrom, dateTo])
```

---

## 🎯 مثال عملي كامل

### **السيناريو:**
المستخدم يريد رؤية زيارات من:
- 🌍 الدولة: `Saudi Arabia`
- 📄 الصفحة: `sales10`
- 🎯 الحملة: `spring_sale`
- 📅 من: `2024-10-20`
- 📅 إلى: `2024-10-24`

### **الخطوات:**

#### **1. اختيار الفلاتر:**
```typescript
setCountryFilter("Saudi Arabia")
setPageFilter("sales10")
setCampaignFilter("spring_sale")
setDateFrom("2024-10-20")
setDateTo("2024-10-24")
```

#### **2. تطبيق الفلاتر:**
```typescript
// من 285 زيارة في recentVisits
// يتم الفحص واحدة تلو الأخرى:

Visit #1: 
  ✅ country = "Saudi Arabia" → تطابق
  ✅ targetPage = "sales10" → تطابق
  ✅ utmCampaign = "spring_sale" → تطابق
  ✅ timestamp = "2024-10-22" → بين التاريخين
  ✅ النتيجة: اعرض ✓

Visit #2:
  ✅ country = "Saudi Arabia" → تطابق
  ❌ targetPage = "sales1" → لا تطابق
  ❌ النتيجة: لا تعرض ✗

Visit #3:
  ❌ country = "Egypt" → لا تطابق
  ❌ النتيجة: لا تعرض ✗
```

#### **3. النتيجة النهائية:**
```typescript
filteredVisits = [
  { id: 123, country: "Saudi Arabia", targetPage: "sales10", utmCampaign: "spring_sale", ... },
  { id: 119, country: "Saudi Arabia", targetPage: "sales10", utmCampaign: "spring_sale", ... }
]

// عدد النتائج: 2 زيارة فقط (بدلاً من 285)
```

---

## 🎨 التحسينات الجديدة في التصميم

### **ما تم إضافته:**

#### **1. تصميم محسن:**
```tsx
// خلفية متدرجة
className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30"

// أيقونات متحركة
<div className="p-1.5 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
  <MapPin className="h-4 w-4 text-green-600" />
</div>

// حدود ملونة عند التركيز
focus:border-green-500 focus:ring-2 focus:ring-green-500/20
```

#### **2. رموز تعبيرية (Emojis):**
```tsx
<option value="ALL">🌍 جميع الدول ({stats?.summary.totalVisits})</option>
<option value="Saudi Arabia">📍 Saudi Arabia (150)</option>
```

#### **3. عرض الفلاتر النشطة:**
```tsx
{(countryFilter !== 'ALL' || pageFilter !== 'ALL' || ...) && (
  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
    <Filter className="h-4 w-4" />
    الفلاتر النشطة:
    {countryFilter !== 'ALL' && <span>📍 {countryFilter}</span>}
    {pageFilter !== 'ALL' && <span>🔗 {pageFilter}</span>}
  </div>
)}
```

---

## 🔄 التحديث التلقائي (Auto Refresh)

### **الكود:**
```typescript
useEffect(() => {
  if (autoRefresh) {
    const interval = setInterval(() => {
      fetchStats(currentPageRef.current, false)  // 🔄 تحديث كل 5 ثواني
    }, 5000)
    return () => clearInterval(interval)
  }
}, [autoRefresh, fetchStats])
```

### **الفائدة:**
- ✅ يجلب البيانات الجديدة تلقائياً
- ✅ يحافظ على الفلاتر المختارة
- ✅ يعرض الزيارات الجديدة مباشرة

---

## 📊 ملخص تدفق البيانات

```
┌─────────────────┐
│  قاعدة البيانات   │ (Visit table)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Route     │ (/api/visits/stats)
│  - يجلب 1000    │
│  - يحسب Stats   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   fetchStats()  │ (في المتصفح)
│  - يطلب البيانات │
│  - يحفظ في state│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  useMemo()      │
│  - يبني القوائم  │
│  uniqueCountries│
│  uniquePages    │
│  uniqueCampaigns│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   <select>      │
│  - يعرض القوائم  │
│  - المستخدم يختار│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ filteredVisits  │
│  - يطبق الفلاتر  │
│  - يعرض النتائج  │
└─────────────────┘
```

---

## 🎓 الخلاصة

### **كيف تعمل الفلاتر:**

1. **API يجلب كل البيانات** من قاعدة البيانات
2. **API يحسب الإحصائيات** (countryStats, pageStats, campaignStats)
3. **الفرونت اند يبني القوائم** من الإحصائيات
4. **المستخدم يختار** من القوائم
5. **الفلاتر تطبق** على recentVisits
6. **النتائج تظهر** في الجدول

### **لماذا هذا النظام فعال؟**

✅ **سريع:** البيانات تُحسب مرة واحدة في API
✅ **دقيق:** الفلاتر تعمل على البيانات الفعلية
✅ **مرن:** يمكن إضافة فلاتر جديدة بسهولة
✅ **متجاوب:** يتحدث تلقائياً كل 5 ثواني

---

**آخر تحديث:** 2024-10-24
**الإصدار:** 2.0
