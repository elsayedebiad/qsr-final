# 📊 نظام تسجيل الأنشطة الشامل

## 🎯 نظرة عامة

تم إنشاء نظام تسجيل شامل لجميع الأنشطة التي تتم في النظام، يتتبع:
- ✅ دخول وخروج الصفحات
- ✅ مدة البقاء في كل صفحة
- ✅ جميع الإجراءات (CRUD operations)
- ✅ رفع وتحميل الملفات
- ✅ البحث والفلترة
- ✅ النقرات على الأزرار
- ✅ طلبات API
- ✅ كل شيء يحدث في النظام

**⚠️ استثناء مهم:** حساب **DEVELOPER** مستثنى تماماً من التسجيل للحفاظ على الخصوصية.

---

## 📁 الملفات المنشأة

### 1. **Middleware للتسجيل**
```
📄 src/lib/activity-middleware.ts
```
- يحتوي على دوال مساعدة لتسجيل أنواع مختلفة من الأنشطة
- يتعامل مع قاعدة البيانات مباشرة
- **يستثني DEVELOPER تلقائياً**

### 2. **React Hook للتسجيل**
```
📄 src/hooks/useActivityLogger.ts
```
- Hook قابل لإعادة الاستخدام في أي صفحة
- يسجل دخول/خروج الصفحات تلقائياً
- يوفر دوال مساعدة للإجراءات المختلفة

### 3. **API Endpoints**
```
📄 src/app/api/activity-log/page-view/route.ts
📄 src/app/api/activity-log/page-exit/route.ts
📄 src/app/api/activity-log/action/route.ts
```
- معالجات API لاستقبال وحفظ الأنشطة
- **تتحقق من DEVELOPER وتتجاهل التسجيل له**

---

## 🚀 كيفية الاستخدام

### في أي صفحة React

```typescript
import { useActivityLogger } from '@/hooks/useActivityLogger'

export default function MyPage() {
  // تفعيل التسجيل التلقائي
  const { logAction, logFileUpload, logSearch } = useActivityLogger({
    pageName: 'اسم الصفحة',
    autoLogPageView: true // تسجيل دخول الصفحة تلقائياً
  })

  // تسجيل إجراء مخصص
  const handleSomething = async () => {
    await logAction(
      'ACTION_NAME',
      'وصف الإجراء',
      { metadata: 'بيانات إضافية' }
    )
  }

  // تسجيل رفع ملف
  const handleFileUpload = async (file: File) => {
    await logFileUpload(file.name, file.size, file.type)
  }

  // تسجيل بحث
  const handleSearch = async (searchTerm: string, resultsCount: number) => {
    await logSearch(searchTerm, resultsCount)
  }

  return <div>...</div>
}
```

---

## 📝 الأنشطة المسجلة في صفحة phone-numbers

### 1. **دخول الصفحة**
```typescript
// يتم تلقائياً عند دخول الصفحة
{
  action: 'PAGE_VIEW',
  description: 'دخول صفحة: أرقام الهواتف المجمعة',
  pagePath: '/dashboard/phone-numbers'
}
```

### 2. **خروج من الصفحة**
```typescript
// يتم تلقائياً عند إغلاق/مغادرة الصفحة
{
  action: 'PAGE_EXIT',
  description: 'خروج من صفحة: /dashboard/phone-numbers (مدة البقاء: 120 ثانية)',
  metadata: { duration: 120 }
}
```

### 3. **أرشفة رقم**
```typescript
{
  action: 'PHONE_ARCHIVE',
  description: 'أرشفة رقم هاتف #123',
  metadata: { phoneNumberId: 123, isArchived: true }
}
```

### 4. **حذف رقم**
```typescript
{
  action: 'PHONE_DELETE',
  description: 'حذف رقم هاتف #123',
  metadata: { phoneNumberId: 123 }
}
```

### 5. **تصدير Excel**
```typescript
{
  action: 'PHONE_EXPORT',
  description: 'تصدير 50 رقم هاتف إلى Excel',
  metadata: {
    count: 50,
    salesPage: 'sales1',
    fileName: 'phone-numbers-sales1-2025-11-27.xlsx'
  }
}
```

### 6. **فتح واتساب**
```typescript
{
  action: 'WHATSAPP_OPEN',
  description: 'فتح واتساب للرقم: +966501234567',
  metadata: {
    phoneNumberId: 123,
    phoneNumber: '+966501234567'
  }
}
```

---

## 🛡️ الحماية والأمان

### استثناء DEVELOPER

```typescript
// في activity-middleware.ts
if (input.userRole === 'DEVELOPER') {
  console.log('🚫 Activity logging skipped for DEVELOPER account')
  return
}
```

### في API Endpoints

```typescript
// في جميع API endpoints
if (user.role === 'DEVELOPER') {
  return NextResponse.json({
    success: true,
    message: 'Logging disabled for DEVELOPER'
  })
}
```

### في React Hook

```typescript
// في useActivityLogger.ts
if (user.role === 'DEVELOPER') {
  console.log('🚫 Activity logging disabled for DEVELOPER')
  return
}
```

---

## 📊 البيانات المسجلة

لكل نشاط يتم حفظ:

```typescript
{
  userId: number,        // معرف المستخدم
  action: string,        // نوع النشاط
  description: string,   // وصف النشاط
  targetType: string,    // نوع الهدف (CV, USER, SYSTEM)
  targetId: string,      // معرف الهدف
  targetName: string,    // اسم الهدف
  metadata: JSON,        // بيانات إضافية
  ipAddress: string,     // عنوان IP
  userAgent: string,     // معلومات المتصفح
  createdAt: DateTime    // وقت الحدث
}
```

---

## 🔍 عرض الأنشطة

الأنشطة محفوظة في جدول `activity_logs` ويمكن عرضها من:

```
📍 /dashboard/activity-log
```

---

## ⚙️ التخصيص

### إضافة نوع نشاط جديد

في `activity-middleware.ts`:

```typescript
export async function logCustomActivity(
  userId: number,
  userRole: string,
  // ... parameters
) {
  await logActivity({
    userId,
    userRole,
    action: 'CUSTOM_ACTION',
    description: 'وصف مخصص',
    // ...
  })
}
```

في `useActivityLogger.ts`:

```typescript
const logCustomAction = async (data: any) => {
  return logAction('CUSTOM_ACTION', 'وصف', data)
}
```

---

## 📈 أمثلة على الأنشطة المسجلة

### دخول المستخدم
```
✅ تسجيل دخول: أحمد علي
📍 IP: 192.168.1.1
🌐 المتصفح: Chrome (Windows)
⏰ 2025-11-27 18:30:15
```

### إنشاء سيرة ذاتية
```
✅ تم إنشاء سيرة ذاتية جديدة: فاطمة محمد
👤 بواسطة: أحمد علي (ADMIN)
📄 CV ID: 12345
⏰ 2025-11-27 18:35:42
```

### تصدير بيانات
```
✅ تصدير 150 رقم هاتف إلى Excel
📊 الصفحة: sales1
📁 الملف: phone-numbers-sales1-2025-11-27.xlsx
👤 بواسطة: سارة أحمد (SALES)
⏰ 2025-11-27 18:45:20
```

---

## 🎨 مميزات إضافية

### 1. **تتبع مدة البقاء**
- يحسب تلقائياً مدة بقاء المستخدم في كل صفحة
- يرسل البيانات حتى عند إغلاق المتصفح (sendBeacon)

### 2. **معلومات المتصفح**
- نوع المتصفح
- نظام التشغيل
- نوع الجهاز (Mobile/Desktop/Tablet)

### 3. **IP والموقع**
- تسجيل عنوان IP
- محاولة الحصول على الموقع الجغرافي (اختياري)

### 4. **Session Tracking**
- تتبع الجلسات
- ربط الأنشطة المتعلقة ببعضها

---

## ✅ الأنشطة المدعومة

- ✅ دخول/خروج الصفحات
- ✅ تسجيل دخول/خروج
- ✅ إنشاء/تعديل/حذف السير الذاتية
- ✅ إنشاء/تعديل/حذف العقود
- ✅ رفع/تحميل/حذف الملفات
- ✅ البحث والفلترة
- ✅ تصدير البيانات
- ✅ العمليات الجماعية
- ✅ إرسال الإشعارات
- ✅ تغيير الحالات
- ✅ الأخطاء والتحذيرات
- ✅ **كل شيء آخر!**

---

## 🔐 ملاحظات مهمة

1. ⚠️ **حساب DEVELOPER مستثنى تماماً** - لن يتم تسجيل أي نشاط له
2. ✅ النظام لا يؤثر على أداء التطبيق - التسجيل يتم بشكل غير متزامن
3. ✅ في حالة فشل التسجيل، لن يتأثر عمل الوظيفة الأساسية
4. ✅ يتم حفظ نسخة محلية من آخر 50 نشاط في localStorage
5. ✅ البيانات محمية ومشفرة

---

## 🚀 الخطوات التالية

لتطبيق التسجيل على صفحات أخرى:

1. استورد `useActivityLogger`
2. فعل التسجيل التلقائي
3. استخدم `logAction` عند الحاجة
4. **النظام جاهز!** ✨

```typescript
import { useActivityLogger } from '@/hooks/useActivityLogger'

export default function AnyPage() {
  const { logAction } = useActivityLogger({
    pageName: 'صفحتي',
    autoLogPageView: true
  })
  
  // ... باقي الكود
}
```

---

**النظام الآن يسجل كل شيء تلقائياً! 🎉**
