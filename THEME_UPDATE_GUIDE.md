# دليل تحديث الصفحات للثيم الجديد

## الصفحات التي تم تحديثها

### ✅ تم التحديث:
1. صفحة التعاقدات (contracts)
2. صفحة الحجوزات (booked) - جاري التحديث

### 🔄 قيد التحديث:
3. صفحة التفعيل (activation)
4. صفحة المستخدمين (users)
5. صفحة الرفع الذكي (import-smart)

## القواعد الأساسية للتحديث

### الألوان القديمة → الألوان الجديدة

| القديم | الجديد | الاستخدام |
|--------|--------|-----------|
| `bg-white` | `bg-card` | خلفية البطاقات |
| `bg-gray-50` | `bg-background` | خلفية الصفحة |
| `text-gray-900` | `text-foreground` | النص الرئيسي |
| `text-gray-600` | `text-muted-foreground` | النص الثانوي |
| `text-gray-500` | `text-muted-foreground` | النص الخفيف |
| `border-gray-200` | `border-border` | الحدود |
| `border-gray-300` | `border-border` | الحدود |
| `text-indigo-600` | `text-primary` | اللون الأساسي |
| `bg-indigo-600` | `bg-primary` | خلفية أساسية |
| `text-red-600` | `text-destructive` | لون خطر |
| `bg-red-600` | `bg-destructive` | خلفية خطر |
| `text-green-600` | `text-success` | لون نجاح |
| `bg-green-600` | `bg-success` | خلفية نجاح |

### الـ Classes المساعدة

#### Loading Spinner
```tsx
// قديم
<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>

// جديد
<div className="spinner w-32 h-32"></div>
```

#### Input Fields
```tsx
// قديم
<input className="border border-gray-300 focus:ring-indigo-500" />

// جديد
<input className="form-input" />
// أو
<input className="bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
```

#### Buttons
```tsx
// قديم
<button className="bg-indigo-600 hover:bg-indigo-700 text-white">

// جديد
<button className="btn-primary">
// أو
<button className="bg-primary hover:opacity-90 text-primary-foreground">
```

#### Cards
```tsx
// قديم
<div className="bg-white shadow rounded-lg border border-gray-200">

// جديد
<div className="bg-card border border-border rounded-lg">
```

#### Modals
```tsx
// قديم
<div className="fixed inset-0 bg-black bg-opacity-50">
  <div className="bg-white rounded-lg">

// جديد
<div className="modal-overlay">
  <div className="modal-content">
```

### Search Inputs - إصلاح الأيقونة

```tsx
// قديم
<div className="relative">
  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
  <input className="w-full pr-10" />
</div>

// جديد
<div className="relative">
  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
  <input 
    placeholder="البحث..." 
    className="w-full pr-12 pl-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
  />
</div>
```

**ملاحظة مهمة**: الـ CSS العام في `globals.css` يطبق `padding-right: 3rem !important` تلقائياً على أي input فيه "البحث" في الـ placeholder.

## الخطوات

### 1. استبدال الألوان
- ابحث عن كل `text-gray-900` واستبدلها بـ `text-foreground`
- ابحث عن كل `text-gray-600` و `text-gray-500` واستبدلها بـ `text-muted-foreground`
- ابحث عن كل `bg-white` واستبدلها بـ `bg-card`
- ابحث عن كل `bg-gray-50` واستبدلها بـ `bg-background`
- ابحث عن كل `border-gray-` واستبدلها بـ `border-border`

### 2. استبدال الألوان الملونة
- `indigo` → `primary`
- `red` → `destructive`
- `green` → `success`
- `yellow` → `warning`
- `blue` → `info`

### 3. تحديث Components
- Spinners → استخدم `.spinner`
- Inputs → استخدم `.form-input` أو الـ classes الجديدة
- Buttons → استخدم `.btn-primary`, `.btn-secondary`, إلخ
- Modals → استخدم `.modal-overlay` و `.modal-content`

### 4. إصلاح Search Inputs
- أضف `pointer-events-none z-10` للأيقونة
- استخدم `pr-12` للـ input
- أضف placeholder بكلمة "البحث"

## أمثلة كاملة

### Before (القديم)
```tsx
<div className="min-h-screen bg-gray-50">
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-bold text-gray-900">عنوان</h1>
    <p className="text-gray-600">وصف</p>
    
    <div className="relative">
      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input 
        className="w-full pr-10 border border-gray-300 focus:ring-indigo-500"
        placeholder="البحث..."
      />
    </div>
    
    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
      حفظ
    </button>
  </div>
</div>
```

### After (الجديد)
```tsx
<div className="min-h-screen bg-background">
  <div className="bg-card border border-border rounded-lg p-6">
    <h1 className="text-2xl font-bold text-foreground">عنوان</h1>
    <p className="text-muted-foreground">وصف</p>
    
    <div className="relative">
      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      <input 
        className="w-full pr-12 pl-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="البحث..."
      />
    </div>
    
    <button className="btn-primary">
      حفظ
    </button>
  </div>
</div>
```

## الفائدة

- ✅ تطابق كامل مع الـ dark theme
- ✅ ألوان موحدة في كل الموقع
- ✅ سهولة التعديل في المستقبل
- ✅ دعم light/dark mode تلقائي
- ✅ مظهر احترافي وحديث

تم إعداد هذا الدليل لتسهيل تحديث باقي الصفحات! 🎨

