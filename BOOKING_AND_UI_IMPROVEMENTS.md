# ✅ نظام الحجوزات والحذف + تحسينات واجهة المستخدم

## 📅 التاريخ: 2 أكتوبر 2025

---

## 🎯 ملخص التحديثات

تم إضافة نظام حجز متكامل مع إمكانية الحذف للأدمن فقط، بالإضافة إلى تحسينات شاملة على واجهة المستخدم.

---

## 🔧 1. نظام الحجوزات الجديد

### ✨ المزايا الجديدة:

#### 1. مودال الحجز في Dashboard
- **الموقع**: `/dashboard` - عند الضغط على أيقونة 🔖 "حجز"
- **الحقول المطلوبة**:
  - ✅ **رقم الهوية** (إلزامي)
  - 📝 **ملاحظات** (اختياري) - لتسجيل تاريخ المقابلة أو متطلبات خاصة

#### 2. API Endpoint للحجز
```typescript
POST /api/bookings
Headers: Authorization: Bearer {token}
Body: {
  cvId: string,
  identityNumber: string,
  notes?: string
}
```

**الوظيفة**:
- إنشاء حجز جديد في جدول `bookings`
- تغيير حالة السيرة إلى `BOOKED`
- تسجيل العملية في `ActivityLog`
- إخفاء السيرة من Dashboard وإظهارها فقط في صفحة المحجوزات

#### 3. Schema Updates
```prisma
model Booking {
  id             Int      @id @default(autoincrement())
  cvId           Int      @unique
  identityNumber String   // رقم الهوية المطلوب
  notes          String?  // ملاحظات اختيارية
  bookedAt       DateTime @default(now())
  bookedById     Int
  createdAt      DateTime @default(now())
  updatedAt      DateTime
  
  bookedBy User @relation("BookedCVs", fields: [bookedById], references: [id])
  cv       CV   @relation(fields: [cvId], references: [id], onDelete: Cascade)
  
  @@map("bookings")
}
```

---

## 🗑️ 2. نظام الحذف (للأدمن فقط)

### 🔒 صلاحيات الحذف

**الحذف متاح فقط لـ `ADMIN` (الأدمن العام)**

### API Endpoints

#### أ) حذف حجز
```typescript
DELETE /api/bookings/[id]
Headers: Authorization: Bearer {token}
```

**التحقق من الصلاحية**:
```typescript
const user = await db.user.findUnique({ where: { id: decoded.userId } })
if (!user || user.role !== 'ADMIN') {
  return NextResponse.json({ 
    error: 'غير مصرح - هذه العملية متاحة للأدمن العام فقط' 
  }, { status: 403 })
}
```

**الوظيفة**:
- حذف الحجز من جدول `bookings`
- إعادة حالة السيرة إلى `NEW`
- تسجيل عملية الحذف في `ActivityLog`
- إعادة السيرة إلى Dashboard الرئيسية

#### ب) حذف عقد
```typescript
DELETE /api/contracts/[id]
Headers: Authorization: Bearer {token}
```

**الوظيفة**:
- حذف العقد من جدول `contracts`
- إعادة حالة السيرة إلى `NEW`
- تسجيل عملية الحذف في `ActivityLog`
- إعادة السيرة إلى Dashboard الرئيسية

---

## 🎨 3. تحسينات واجهة المستخدم

### ✅ تحسين شكل الـ Checkboxes

#### الميزات الجديدة:
1. **علامة صح واضحة** ✓ بيضاء اللون
2. **تأثيرات تفاعلية**:
   - Hover: تغيير لون الحدود + تكبير خفيف (`scale-110`)
   - Focus: حلقة ضوئية زرقاء
   - Checked: خلفية زرقاء مع علامة صح
3. **تحسين تجربة المستخدم**:
   - `cursor: pointer` على الـ label بالكامل
   - Transitions سلسة
   - دعم RTL كامل

#### CSS المخصص:
```css
/* Custom Checkbox Styling */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  position: relative;
  flex-shrink: 0;
}

input[type="checkbox"]:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
  background-image: url("data:image/svg+xml,..."); /* علامة صح */
}
```

#### في الكود:
```tsx
<label className="flex items-center cursor-pointer group">
  <input
    type="checkbox"
    className="w-5 h-5 text-primary bg-input border-2 border-muted-foreground/30 rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary hover:scale-110 group-hover:border-primary checked:bg-primary checked:border-primary"
    checked={selectedCvs.includes(cv.id)}
    onChange={() => toggleCvSelection(cv.id)}
  />
</label>
```

### 📋 تحسين المودالات (Modals)

#### 1. مودال الحجز
```tsx
{/* Header بتصميم احترافي */}
<div className="bg-gradient-to-r from-warning to-warning/80 p-6 text-white">
  <div className="flex items-center gap-4">
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
      <Bookmark className="h-7 w-7" />
    </div>
    <div className="flex-1">
      <h3 className="text-2xl font-bold mb-1">حجز السيرة الذاتية</h3>
      <p className="text-white/90 text-sm">إدخال بيانات الحجز</p>
    </div>
    <button onClick={closeBookingModal}>
      <X className="h-6 w-6" />
    </button>
  </div>
</div>

{/* محتوى المودال */}
<div className="p-6">
  {/* معلومات السيرة */}
  <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-6">
    {/* ... */}
  </div>
  
  {/* حقل رقم الهوية */}
  <input
    type="text"
    required
    placeholder="أدخل رقم الهوية"
    dir="ltr"
  />
  
  {/* حقل الملاحظات */}
  <textarea
    placeholder="أضف ملاحظات..."
    rows={3}
    dir="rtl"
  />
  
  {/* تنبيه */}
  <div className="bg-info/10 border border-info/30 rounded-lg p-3">
    <p>📋 ملاحظة: عند التأكيد سيتم:</p>
    <ul>
      <li>• حجز السيرة الذاتية</li>
      <li>• تحويل الحالة إلى "محجوز"</li>
      <li>• نقل السيرة إلى صفحة المحجوزات</li>
    </ul>
  </div>
</div>
```

#### 2. مودال الحذف الجماعي (Bulk Delete)
- **تصميم محسّن**: ألوان أكثر احترافية
- **أيقونات معبرة**: `AlertTriangle`, `Trash2`, `CheckCircle`
- **زر إغلاق**: في الـ header بدلاً من المحتوى
- **تنبيهات واضحة**: "هذا الإجراء لا يمكن التراجع عنه"

```tsx
{/* Header */}
<div className="bg-gradient-to-r from-destructive to-destructive/80 p-6 text-white">
  <div className="flex items-center gap-4">
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
      <Trash2 className="h-7 w-7" />
    </div>
    <div className="flex-1">
      <h3 className="text-2xl font-bold mb-1">حذف السير المحددة</h3>
      <p className="text-white/90 text-sm">
        عدد السير: <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{selectedCvs.length}</span>
      </p>
    </div>
    <button onClick={() => setShowBulkOperationModal(false)}>
      <X className="h-6 w-6" />
    </button>
  </div>
</div>

{/* Content */}
<div className="p-6">
  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
    <div className="flex items-start gap-4">
      <div className="bg-destructive/20 rounded-full p-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h4 className="font-bold text-lg mb-2">
          تحذير: عملية حذف نهائية
        </h4>
        <p>سيتم حذف {selectedCvs.length} سيرة ذاتية نهائياً</p>
        <p className="text-sm text-muted-foreground mt-2">
          ⚠️ هذا الإجراء لا يمكن التراجع عنه
        </p>
      </div>
    </div>
  </div>
</div>
```

#### 3. مودال الحذف الفردي (في صفحة المحجوزات)
```tsx
{/* Header */}
<div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
  <h4 className="font-medium text-foreground mb-2">معلومات الحجز:</h4>
  <div className="text-sm space-y-1">
    <p><span className="font-medium">الاسم:</span> {booking.cv.fullName}</p>
    <p><span className="font-medium">رقم الهوية:</span> {booking.identityNumber}</p>
  </div>
</div>

{/* تحذير */}
<div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
  <p><strong>تحذير:</strong> عند الحذف سيتم:</p>
  <ul className="text-xs mt-1 space-y-1">
    <li>• حذف الحجز نهائياً</li>
    <li>• إعادة السيرة إلى قائمة "الجديد"</li>
    <li>• تسجيل العملية في سجل الأنشطة</li>
  </ul>
</div>
```

---

## 🔄 4. دورة حياة السيرة الذاتية المحدّثة

```
┌─────────────────────────────────────────────────┐
│                    NEW (جديد)                    │
│            - تظهر في Dashboard                   │
│            - يمكن: حجز، تعاقد، رفض               │
└─────────────────────────────────────────────────┘
              │         │         │
        ┌─────┘         │         └─────┐
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌────────────┐
│    BOOKED    │ │    HIRED    │ │  REJECTED  │
│    محجوز     │ │   متعاقد    │ │   مرفوض    │
└──────────────┘ └─────────────┘ └────────────┘
        │               │               │
        │  ┌───────────►│               │
        │  │ تعاقد       │  إعادة ◄──────┘
        │  │             ▼
        │  │      ┌─────────────┐
        │  │      │  RETURNED   │
        │  │      │    معاد     │
        │  │      └─────────────┘
        │  │             │
        │  └─────────────┘ إعادة تعاقد
        │
        │  🗑️ حذف (أدمن فقط)
        ▼
    ┌─────────┐
    │   NEW   │ ◄── إعادة إلى البداية
    └─────────┘
```

---

## 🎯 5. الصلاحيات والتحكم

### الحجز
- ✅ `ADMIN` (أدمن عام)
- ✅ `SUB_ADMIN` (أدمن فرعي)
- ❌ `USER` (مستخدم عادي)

### الحذف
- ✅ `ADMIN` فقط (أدمن عام)
- ❌ `SUB_ADMIN` (أدمن فرعي)
- ❌ `USER` (مستخدم عادي)

### التعاقد
- ✅ `ADMIN` (أدمن عام)
- ✅ `SUB_ADMIN` (أدمن فرعي)
- ❌ `USER` (مستخدم عادي)

---

## 📱 6. صفحة المحجوزات

### المزايا:
1. **عرض الحجوزات**: جميع السير المحجوزة مع بياناتها
2. **معلومات الحجز**:
   - رقم الهوية
   - الملاحظات
   - تاريخ الحجز
   - اسم المستخدم الذي قام بالحجز
3. **الإجراءات المتاحة**:
   - 📝 **تعاقد**: تحويل الحجز إلى عقد
   - 👁️ **عرض السيرة**: الانتقال لصفحة التفاصيل
   - 🗑️ **حذف** (أدمن فقط): حذف الحجز وإعادة السيرة

### زر الحذف:
```tsx
{userRole === 'ADMIN' && (
  <button
    onClick={() => openDeleteModal(booking)}
    className="text-destructive hover:opacity-80"
    title="حذف الحجز (أدمن فقط)"
  >
    <Trash2 className="h-4 w-4" />
  </button>
)}
```

---

## 🔍 7. الفلاتر والبحث

### في Dashboard:
```typescript
// إخفاء السير المحجوزة والمتعاقدة
let filtered = cvs.filter(cv => 
  cv.status !== CVStatus.HIRED &&   // المتعاقدة
  cv.status !== CVStatus.BOOKED     // المحجوزة
)
```

### في صفحة المحجوزات:
```typescript
// تظهر فقط السير بحالة BOOKED
const bookings = await db.booking.findMany({
  where: {
    cv: { status: 'BOOKED' }
  }
})
```

---

## 📝 8. Activity Logging

### عند الحجز:
```typescript
await db.activityLog.create({
  data: {
    userId: decoded.userId,
    cvId: cvId,
    action: 'CV_BOOKED',
    description: `تم حجز السيرة الذاتية ${cv.fullName} برقم هوية ${identityNumber}`,
    metadata: {
      identityNumber,
      notes,
      bookedAt: new Date().toISOString()
    }
  }
})
```

### عند الحذف:
```typescript
await db.activityLog.create({
  data: {
    userId: decoded.userId,
    cvId: booking.cvId,
    action: 'BOOKING_DELETED',
    description: `تم حذف حجز السيرة الذاتية ${booking.cv.fullName}`,
    metadata: {
      bookingId: booking.id,
      identityNumber: booking.identityNumber,
      deletedAt: new Date().toISOString()
    }
  }
})
```

---

## 🎨 9. تحسينات الـ UI الإضافية

### Checkboxes:
- ✅ علامة صح بيضاء واضحة
- ✅ تأثيرات hover وfocus
- ✅ تكبير خفيف عند hover (`scale-110`)
- ✅ حلقة ضوئية عند focus

### Modals:
- ✅ Header بتدرج لوني جذاب
- ✅ أيقونات كبيرة معبرة
- ✅ زر إغلاق (X) في الـ header
- ✅ تنبيهات ملونة بحدود وخلفيات
- ✅ Backdrop blur للخلفية

### Tables:
- ✅ تمييز الصف المحدد: `bg-primary/10 ring-2 ring-primary/20`
- ✅ تأثير hover سلس
- ✅ حدود يسرى بألوان الدول

---

## 🚀 10. كيفية الاستخدام

### حجز سيرة ذاتية:
1. اذهب إلى Dashboard الرئيسية (`/dashboard`)
2. اضغط على أيقونة 🔖 "حجز" بجانب السيرة
3. أدخل **رقم الهوية** (إلزامي)
4. أضف **ملاحظات** إن وجدت (اختياري)
5. اضغط "تأكيد الحجز"
6. ستنتقل السيرة إلى صفحة المحجوزات

### عرض المحجوزات:
1. اذهب إلى صفحة المحجوزات (`/dashboard/booked`)
2. شاهد جميع السير المحجوزة مع بياناتها
3. يمكنك:
   - التعاقد مع السيرة
   - عرض تفاصيل السيرة
   - حذف الحجز (أدمن فقط)

### حذف حجز (أدمن فقط):
1. في صفحة المحجوزات
2. اضغط على أيقونة 🗑️ "حذف"
3. ستظهر رسالة تأكيد
4. اضغط "تأكيد الحذف"
5. ستعود السيرة إلى Dashboard الرئيسية

---

## ✅ الخلاصة

### ما تم إنجازه:
1. ✅ نظام حجز متكامل مع رقم هوية وملاحظات
2. ✅ نقل السير المحجوزة إلى صفحة منفصلة
3. ✅ إمكانية حذف الحجوزات (أدمن فقط)
4. ✅ إمكانية حذف العقود (أدمن فقط)
5. ✅ تحسين شكل Checkboxes بعلامة صح واضحة
6. ✅ تحسين شكل المودالات بتصميم احترافي
7. ✅ تسجيل جميع العمليات في ActivityLog
8. ✅ صلاحيات محكمة (ADMIN فقط للحذف)

### النتيجة النهائية:
**نظام إدارة سير ذاتية متكامل وآمن مع واجهة مستخدم حديثة واحترافية!** 🎉✨

---

**آخر تحديث**: 2 أكتوبر 2025
**الإصدار**: 2.0.0

