# دليل تسجيل الأنشطة - Activity Tracking Guide

## ✅ تم تحديث النظام

### الأنشطة الجديدة المضافة:

#### 1. **رفع الصور والملفات**
```typescript
import ActivityTracker from '@/lib/activity-tracker'

// رفع صورة
ActivityTracker.imageUploaded('profile.jpg', 245678, 'CV')

// رفع ملف
ActivityTracker.fileUploaded('document.pdf', 512000, 'application/pdf')

// حذف ملف
ActivityTracker.fileDeleted('old-file.pdf')
```

#### 2. **إدارة البنرات**
```typescript
// إنشاء بنر
ActivityTracker.bannerCreated('عرض خاص', 'banner-123', 'رئيسي')

// تحديث بنر
ActivityTracker.bannerUpdated('عرض خاص', 'banner-123')

// حذف بنر
ActivityTracker.bannerDeleted('عرض خاص', 'banner-123')

// تفعيل/إلغاء تفعيل
ActivityTracker.bannerActivated('عرض خاص', 'banner-123')
ActivityTracker.bannerDeactivated('عرض خاص', 'banner-123')
```

#### 3. **إدارة المعرض**
```typescript
// إضافة صورة للمعرض
ActivityTracker.galleryImageAdded('sunset.jpg', 'img-456')

// حذف صورة من المعرض
ActivityTracker.galleryImageDeleted('sunset.jpg', 'img-456')

// إعادة ترتيب المعرض
ActivityTracker.galleryReordered(15)
```

---

## 📍 أماكن التطبيق المطلوبة:

### 1. في `src/app/api/upload/route.ts`:
```typescript
import ActivityTracker from '@/lib/activity-tracker'

// عند رفع صورة
ActivityTracker.imageUploaded(file.name, file.size, 'CV')
```

### 2. في `src/app/api/banners/route.ts`:
```typescript
// عند إنشاء بنر
ActivityTracker.bannerCreated(bannerData.title, newBanner.id, 'رئيسي')

// عند تحديث بنر
ActivityTracker.bannerUpdated(bannerData.title, bannerId)

// عند حذف بنر
ActivityTracker.bannerDeleted(banner.title, bannerId)
```

### 3. في `src/app/api/secondary-banners/route.ts`:
```typescript
// مثل البنرات الرئيسية لكن مع نوع 'ثانوي'
ActivityTracker.bannerCreated(bannerData.title, newBanner.id, 'ثانوي')
```

### 4. في `src/app/api/gallery/route.ts`:
```typescript
// عند إضافة صورة
ActivityTracker.galleryImageAdded(image.name, image.id)

// عند حذف صورة
ActivityTracker.galleryImageDeleted(image.name, imageId)

// عند إعادة الترتيب
ActivityTracker.galleryReordered(images.length)
```

---

## 🎨 مميزات العرض الجديدة:

1. **تجميع حسب التاريخ**: الأنشطة مقسمة حسب اليوم
2. **أيقونات مميزة**: لكل نوع نشاط أيقونة خاصة
3. **ألوان مخصصة**: حسب أهمية النشاط
4. **فلاتر متقدمة**: حسب النوع، المستخدم، التاريخ، الأهمية
5. **تحديث تلقائي**: يمكن ضبط فترة التحديث

---

## 🔍 أنواع الأنشطة المدعومة:

### السير الذاتية:
- `CV_CREATED`, `CV_UPDATED`, `CV_DELETED`
- `CV_VIEWED`, `CV_DOWNLOADED`, `CV_SHARED`
- `CV_ARCHIVED`, `CV_RESTORED`
- `CV_IMPORTED`, `CV_EXPORTED`
- `CV_STATUS_CHANGED`

### العقود:
- `CONTRACT_CREATED`, `CONTRACT_UPDATED`, `CONTRACT_DELETED`
- `CONTRACT_SIGNED`, `CONTRACT_CANCELLED`

### المستخدمين:
- `USER_LOGIN`, `USER_LOGOUT`
- `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`
- `USER_PASSWORD_CHANGED`, `USER_ROLE_CHANGED`

### النظام:
- `SYSTEM_BACKUP`, `SYSTEM_RESTORE`
- `SYSTEM_ERROR`, `SYSTEM_WARNING`
- `SYSTEM_UPDATE`, `SYSTEM_MAINTENANCE`

### الرفع والتحميل (جديد):
- `IMAGE_UPLOADED` ⭐
- `FILE_UPLOADED` ⭐
- `FILE_DELETED` ⭐

### البنرات (جديد):
- `BANNER_CREATED` ⭐
- `BANNER_UPDATED` ⭐
- `BANNER_DELETED` ⭐
- `BANNER_ACTIVATED` ⭐
- `BANNER_DEACTIVATED` ⭐

### المعرض (جديد):
- `GALLERY_IMAGE_ADDED` ⭐
- `GALLERY_IMAGE_DELETED` ⭐
- `GALLERY_REORDERED` ⭐

### أخرى:
- `SEARCH_PERFORMED`, `FILTER_APPLIED`
- `REPORT_GENERATED`
- `BULK_DELETE`, `BULK_UPDATE`
- `BULK_DOWNLOAD`, `BULK_ARCHIVE`

---

## 📊 مستويات الأهمية:

- **Critical** (حرج): أخطاء النظام
- **High** (مرتفع): إنشاء/حذف بيانات مهمة
- **Medium** (متوسط): تحديثات ورفع ملفات
- **Low** (منخفض): عرض وبحث

---

## 🚀 الخطوات التالية:

1. ✅ تحديث `activity-tracker.ts` (تم)
2. ⏳ إضافة calls في API routes
3. ⏳ اختبار التسجيل
4. ⏳ تحسين صفحة العرض

---

تاريخ التحديث: {{ الآن }}
