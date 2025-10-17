# ✅ دليل فلتر الوظيفة - السائقين ونقل الخدمات

## 📋 ملخص التحديثات

تم إضافة **فلتر الوظيفة** الذي يسمح بتصنيف السير الذاتية إلى:
1. **🚗 سائقين**: من لديهم "سائق" في حقل الوظيفة أو مهارة القيادة = YES
2. **🏠 نقل خدمات**: أي شخص ليس سائق

---

## ✅ ما تم عمله

### 1️⃣ تحديث Smart Import API
**الملف**: `src/app/api/cvs/import-smart/route.ts`

تم إضافة قراءة عمود **"الوظيفة"** من ملف System.csv:

```typescript
interface ExcelRow {
  // ... existing fields
  'الوظيفة'?: string  // ✅ إضافة جديدة
}

// في دالة processExcelRow:
position: cleanStringValue(row['الوظيفة المطلوبة'] || row['المنصب'] || row['الوظيفة']), // ✅ إضافة "الوظيفة"
```

### 2️⃣ تحديث صفحة Sales1
**الملف**: `src/app/sales1/page.tsx`

#### أ) إضافة State للفلتر:
```typescript
const [positionFilter, setPositionFilter] = useState<string>('ALL') // فلتر الوظيفة: سائق، خدمات
```

#### ب) إضافة منطق الفلتر:
```typescript
// فلتر الوظيفة - تصنيف حسب الوظيفة (سائق، خدمات)
const matchesPosition = positionFilter === 'ALL' || (() => {
  const position = cv.position?.toLowerCase() || ''
  switch (positionFilter) {
    case 'DRIVER':
      // السائقين: من لديهم مهارة القيادة أو وظيفتهم سائق
      return position.includes('سائق') || position.includes('driver') || position.includes('قيادة') || cv.driving === SkillLevel.YES
    case 'SERVICES':
      // الخدمات: أي شخص ليس سائق
      const isDriver = position.includes('سائق') || position.includes('driver') || position.includes('قيادة') || cv.driving === SkillLevel.YES
      return !isDriver
    default:
      return true
  }
})()

// فلتر الجنسية - يتم تجاهله عند اختيار سائق أو خدمات
const matchesNationality = (positionFilter === 'DRIVER' || positionFilter === 'SERVICES')
  ? true
  : matchesNationalityFilter(cv.nationality, nationalityFilter)
```

#### ج) إضافة الأزرار في UI:
```typescript
{/* أزرار فلتر الوظيفة - السائقين ونقل الخدمات */}
<div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
  {/* زر السائقين */}
  <div onClick={() => {...}} className="...">
    <h3 className="text-white font-bold text-2xl mb-3">🚗 سائقين</h3>
    <span className="text-white font-bold text-4xl">
      {cvs.filter(cv => {
        const position = cv.position?.toLowerCase() || ''
        return position.includes('سائق') || position.includes('driver') || position.includes('قيادة') || cv.driving === 'YES'
      }).length}
    </span>
  </div>

  {/* زر نقل الخدمات */}
  <div onClick={() => {...}} className="...">
    <h3 className="text-white font-bold text-2xl mb-3">🏠 نقل خدمات</h3>
    <span className="text-white font-bold text-4xl">
      {cvs.filter(cv => {
        const position = cv.position?.toLowerCase() || ''
        const isDriver = position.includes('سائق') || position.includes('driver') || position.includes('قيادة') || cv.driving === 'YES'
        return !isDriver
      }).length}
    </span>
  </div>
</div>
```

---

## 🔄 كيفية تطبيق نفس التغييرات على صفحات Sales الأخرى

لتطبيق هذا الفلتر على **sales2, sales3, ... sales11**، اتبع الخطوات التالية:

### 1. إضافة State:
ابحث عن:
```typescript
const [nationalityFilter, setNationalityFilter] = useState<string>('ALL')
```

أضف بعدها مباشرة:
```typescript
const [positionFilter, setPositionFilter] = useState<string>('ALL') // فلتر الوظيفة: سائق، خدمات
```

### 2. تحديث useMemo للـFilters:
ابحث عن:
```typescript
const matchesStatus = statusFilter === 'ALL' || cv.status === statusFilter
const matchesNationality = matchesNationalityFilter(cv.nationality, nationalityFilter)
```

استبدلها بـ:
```typescript
const matchesStatus = statusFilter === 'ALL' || cv.status === statusFilter

// فلتر الوظيفة - تصنيف حسب الوظيفة (سائق، خدمات)
const matchesPosition = positionFilter === 'ALL' || (() => {
  const position = cv.position?.toLowerCase() || ''
  switch (positionFilter) {
    case 'DRIVER':
      return position.includes('سائق') || position.includes('driver') || position.includes('قيادة') || cv.driving === SkillLevel.YES
    case 'SERVICES':
      const isDriver = position.includes('سائق') || position.includes('driver') || position.includes('قيادة') || cv.driving === SkillLevel.YES
      return !isDriver
    default:
      return true
  }
})()

// فلتر الجنسية - يتم تجاهله عند اختيار سائق أو خدمات
const matchesNationality = (positionFilter === 'DRIVER' || positionFilter === 'SERVICES')
  ? true
  : matchesNationalityFilter(cv.nationality, nationalityFilter)
```

### 3. تحديث شرط الإرجاع:
ابحث عن:
```typescript
return matchesSearch && matchesStatus && matchesNationality && ...
```

استبدل `matchesNationality` بـ:
```typescript
return matchesSearch && matchesStatus && matchesPosition && matchesNationality && ...
```

### 4. تحديث Dependencies Array:
ابحث عن:
```typescript
}, [cvs, searchTerm, statusFilter, nationalityFilter, maritalStatusFilter, ...])
```

أضف `positionFilter` بعد `statusFilter`:
```typescript
}, [cvs, searchTerm, statusFilter, positionFilter, nationalityFilter, maritalStatusFilter, ...])
```

### 5. إضافة الأزرار في UI:
ابحث عن النص:
```typescript
<p className="text-xl font-bold text-[#1e3a8a]">اضغط على الجنسية المطلوبة 👇</p>
```

استبدلها وأضف أزرار الوظيفة قبل أزرار الجنسيات (انظر الكود الكامل في sales1/page.tsx سطر 1158-1242)

---

## 📊 كيف يعمل الفلتر؟

### السائقين (DRIVER):
- أي CV يحتوي حقل `position` على: "سائق" أو "driver" أو "قيادة"
- **أو** لديه مهارة `driving` = "YES"

### نقل الخدمات (SERVICES):
- أي CV **لا ينطبق عليه** شروط السائقين
- أي شخص ليس لديه مهارة القيادة أو وظيفته ليست سائق

### تجاهل فلتر الجنسية:
- عند اختيار "سائقين" أو "نقل خدمات"، يتم **تجاهل** فلتر الجنسية تلقائياً
- يعرض **جميع الجنسيات** حسب الوظيفة فقط

---

## 🎯 الاستخدام

1. **رفع ملف System.csv** من خلال Smart Import
2. تأكد أن الملف يحتوي على عمود **"الوظيفة"**
3. الملف سيتم قراءته وتخزين الوظيفة في قاعدة البيانات
4. في صفحة Sales، اضغط على:
   - **🚗 سائقين** لعرض السائقين فقط
   - **🏠 نقل خدمات** لعرض غير السائقين

---

## 📝 ملاحظات هامة

1. ✅ تم تحديث `import-smart API` ليقرأ عمود "الوظيفة"
2. ✅ تم تحديث صفحة `sales1`
3. ⚠️ **يجب** تطبيق نفس التغييرات على `sales2` إلى `sales11`
4. 💡 عند اختيار فلتر الوظيفة، فلتر الجنسية يُعطَّل تلقائياً
5. 💡 العد في الأزرار **ديناميكي** ويتحدث فوراً مع تغيير البيانات

---

## 🎨 التصميم

- **زر السائقين**: خلفية زرقاء (blue-600 to blue-800)
- **زر نقل الخدمات**: خلفية خضراء (green-600 to green-800)
- كلا الزرين لهما **تأثيرات hover** و**انيميشن scale**
- عند التحديد: **ring effect** و**scale-105**

---

## 🚀 تم بنجاح!
الآن النظام يقرأ عمود "الوظيفة" من ملف System.csv ويعرض فلتر احترافي للسائقين ونقل الخدمات في صفحة sales1.

