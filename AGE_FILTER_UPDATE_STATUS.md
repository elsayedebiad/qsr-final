# حالة تحديث فلتر العمر

## ✅ الصفحات المكتملة 100%
1. **sales1** - مكتملة بالكامل ✓
2. **sales2** - مكتملة بالكامل ✓  
3. **sales3** - مكتملة بالكامل ✓
4. **sales4** - مكتملة بالكامل ✓
5. **sales5** - مكتملة بالكامل ✓
6. **sales6** - مكتملة بالكامل ✓

## ⚠️ الصفحات التي تحتاج إكمال
7. **sales7** - State declarations ✓ | يحتاج باقي التحديثات
8. **sales8** - State declarations ✓ | يحتاج باقي التحديثات
9. **sales9** - State declarations ✓ | يحتاج باقي التحديثات
10. **sales10** - State declarations ✓ | يحتاج باقي التحديثات
11. **sales11** - State declarations ✓ | يحتاج باقي التحديthات

## 📋 التحديثات المتبقية لكل صفحة (sales7-11):

### 1. منطق التصفية (matchesAge)
```typescript
// السطر ~550
const matchesAge = !ageFilterEnabled || (() => {
  if (!cv.age) return false
  return cv.age >= minAge && cv.age <= maxAge
})()
```

### 2. getCountForFilter
```typescript
// السطر ~837
case 'age':
  if (!cv.age) return false
  if (filterValue === 'ALL') return true
  return cv.age >= minAge && cv.age <= maxAge
```

### 3. useMemo Dependencies
```typescript
// السطر ~721
}, [cvs, searchTerm, statusFilter, positionFilter, nationalityFilter, minAge, maxAge, ageFilterEnabled, 
```

### 4. useEffect Dependencies  
```typescript
// السطر ~987
}, [searchTerm, statusFilter, nationalityFilter, skillFilters, minAge, maxAge, ageFilterEnabled, 
```

### 5. واجهة الفلتر (UI)
استبدال select القديم بـ checkbox + قائمتين منسدلتين من 18-60

### 6. دالة Reset
```typescript
setMinAge(18)
setMaxAge(60)
setAgeFilterEnabled(false)
```

## 🎯 الحل السريع
انسخ الأجزاء التالية من **sales6.tsx** (الملف المكتمل):
- السطر 550-553 → منطق matchesAge
- السطر 836-839 → case 'age' في getCountForFilter
- السطر 721 → dependencies array
- السطر 987 → useEffect dependencies
- السطور 1645-1706 → واجهة الفلتر
- السطور 2012-2014 → دالة reset

والصقها في نفس المواقع في sales7-11
