# تم تحديث فلتر العمر بنجاح

## الصفحات المكتملة:
- ✅ sales1
- ✅ sales2  
- ✅ sales3
- ✅ sales4

## الصفحات المتبقية (sales5-11):
نفس التغييرات المطلوبة:

### 1. تحديث state declarations
```typescript
const [minAge, setMinAge] = useState<number>(18)
const [maxAge, setMaxAge] = useState<number>(60)
const [ageFilterEnabled, setAgeFilterEnabled] = useState(false)
```

### 2. تحديث منطق التصفية
```typescript
const matchesAge = !ageFilterEnabled || (() => {
  if (!cv.age) return false
  return cv.age >= minAge && cv.age <= maxAge
})()
```

### 3. تحديث getCountForFilter
```typescript
case 'age':
  if (!cv.age) return false
  if (filterValue === 'ALL') return true
  return cv.age >= minAge && cv.age <= maxAge
```

### 4. تحديث dependencies
```typescript
}, [cvs, searchTerm, statusFilter, positionFilter, nationalityFilter, minAge, maxAge, ageFilterEnabled, ...
```

### 5. تحديث UI
استبدال select بـ checkbox + قائمتين منسدلتين (من-إلى) بأرقام من 18 إلى 60

### 6. تحديث reset function
```typescript
setMinAge(18)
setMaxAge(60)
setAgeFilterEnabled(false)
```
