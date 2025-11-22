# دليل تتبع نقرات الحجز والاستفسار

## ✅ ما تم إنجازه:

### 1. **صفحة التتبع** (`/dashboard/booking-clicks`)

#### المميزات:
- 📊 **إحصائيات شاملة** لكل صفحة سيلز
- ✅ **تتبع الرسائل المرسلة** vs غير المرسلة
- 📈 **معدل التحويل** (Conversion Rate)
- 👥 **عدد المستخدمين الفريدين**
- 🔍 **فلاتر متقدمة** (صفحة، حالة الرسالة، بحث)
- 📥 **تصدير البيانات** بصيغة JSON

---

### 2. **API Endpoint** (`/api/booking-clicks`)

#### GET - جلب النقرات:
```typescript
const response = await fetch('/api/booking-clicks', {
  headers: { Authorization: `Bearer ${token}` }
})
const data = await response.json()
// { clicks: [...] }
```

#### POST - تسجيل نقرة:
```typescript
await fetch('/api/booking-clicks', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  },
  body: JSON.stringify({
    salesPageId: 'sales1',
    cvId: '123',
    cvName: 'محمد أحمد',
    action: 'BOOKING_CLICK',
    messageSent: true // أو false
  })
})
```

---

### 3. **قاعدة البيانات** (Prisma Schema)

```prisma
model BookingClick {
  id          Int      @id @default(autoincrement())
  salesPageId String   // sales1, sales2, etc
  cvId        String?  // معرف السيرة
  cvName      String?  // اسم السيرة
  action      String   @default("BOOKING_CLICK")
  userAgent   String?  // معلومات المتصفح
  ipAddress   String?  // عنوان IP
  deviceType  String?  // MOBILE or DESKTOP
  messageSent Boolean  @default(false) // هل تم الإرسال؟
  createdAt   DateTime @default(now())
}
```

---

## 🚀 خطوات التفعيل:

### 1. تشغيل Migration:
```bash
# في الترمنال
cd c:\Users\engelsayedebaid\Desktop\qsr-final\qsr-final

# تشغيل migration
npx prisma migrate dev --name add_booking_clicks

# أو تطبيق مباشرة على production
npx prisma migrate deploy

# توليد Prisma Client
npx prisma generate
```

---

### 2. إضافة Tracking في صفحات السيلز:

#### في كل صفحة سيلز (مثل `sales1/page.tsx`):

```typescript
// عند الضغط على زر "حجز" أو "استفسار"
const handleBookingClick = async (cv: CV, messageSent: boolean) => {
  try {
    await fetch('/api/booking-clicks', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        salesPageId: 'sales1', // غير حسب الصفحة
        cvId: cv.id,
        cvName: cv.fullName,
        action: 'BOOKING_CLICK',
        messageSent: messageSent
      })
    })
  } catch (error) {
    console.error('Error tracking click:', error)
  }
}

// مثال على زر WhatsApp:
const handleWhatsAppClick = (cv: CV) => {
  // تسجيل النقرة
  handleBookingClick(cv, true) // true لأنه سيرسل رسالة
  
  // فتح WhatsApp
  const message = `مرحباً، أريد الاستفسار عن ${cv.fullName}`
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`)
}

// مثال على زر "عرض فقط":
const handleViewClick = (cv: CV) => {
  // تسجيل النقرة بدون رسالة
  handleBookingClick(cv, false) // false لأنه فقط عرض
}
```

---

## 📊 مثال التكامل الكامل:

```typescript
// في sales1/page.tsx
const handleCVAction = async (cv: CV, actionType: 'view' | 'whatsapp' | 'phone') => {
  const messageSent = actionType !== 'view'
  
  // 1. تسجيل النقرة
  try {
    await fetch('/api/booking-clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salesPageId: 'sales1',
        cvId: cv.id,
        cvName: cv.fullName || cv.fullNameArabic,
        action: actionType === 'whatsapp' ? 'WHATSAPP_SENT' : 
                actionType === 'phone' ? 'PHONE_CALL' : 'BOOKING_CLICK',
        messageSent: messageSent
      })
    })
  } catch (error) {
    console.error('Tracking error:', error)
  }
  
  // 2. تنفيذ الإجراء
  if (actionType === 'whatsapp') {
    const msg = `مرحباً، أريد الاستفسار عن السيرة الذاتية:\nالاسم: ${cv.fullName}`
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`)
  } else if (actionType === 'phone') {
    window.open(`tel:${phoneNumber}`)
  } else {
    // فقط عرض
    setSelectedCV(cv)
  }
}
```

---

## 📈 البيانات المعروضة في الصفحة:

### 1. **إحصائيات عامة:**
- إجمالي النقرات
- عدد الرسائل المرسلة
- عدد النقرات بدون رسالة
- معدل التحويل الكلي

### 2. **إحصائيات لكل صفحة:**
```
┌──────────────────────────────────┐
│ sales1                   75.5%   │
├──────────────────────────────────┤
│ إجمالي النقرات         120      │
│ ✓ رسائل مرسلة           90      │
│ ✗ بدون رسالة            30      │
│ 👥 مستخدمين فريدين      45      │
└──────────────────────────────────┘
```

### 3. **جدول تفصيلي:**
| الصفحة | السيرة | الحالة | الجهاز | التاريخ |
|--------|--------|--------|--------|---------|
| sales1 | محمد أحمد | ✓ تم الإرسال | Mobile | 22/11/2025 14:30 |
| sales2 | أحمد علي | ✗ لم يرسل | Desktop | 22/11/2025 14:25 |

---

## 🎯 حالات الاستخدام:

### حالة 1: المستخدم ضغط زر WhatsApp
```typescript
messageSent: true  // لأنه سيرسل رسالة واتساب
```

### حالة 2: المستخدم ضغط "عرض السيرة"
```typescript
messageSent: false  // فقط عرض بدون رسالة
```

### حالة 3: المستخدم ضغط زر الاتصال
```typescript
messageSent: true  // لأنه سيتصل
```

---

## 📱 معلومات يتم تسجيلها تلقائياً:

1. ✅ **userAgent** - نوع المتصفح
2. ✅ **ipAddress** - عنوان IP
3. ✅ **deviceType** - Mobile or Desktop
4. ✅ **createdAt** - تاريخ ووقت النقرة

---

## 🔒 ملاحظات الأمان:

- الـ API محمي بـ Authentication
- يمكن الوصول فقط للـ Admin
- البيانات محفوظة بشكل آمن في قاعدة البيانات

---

## 📊 التقارير المتاحة:

1. **أفضل الصفحات أداءً** (أعلى conversion rate)
2. **الصفحات التي تحتاج تحسين** (أقل conversion rate)
3. **عدد المستخدمين الفريدين** لكل صفحة
4. **النقرات حسب الوقت** (يومي، أسبوعي، شهري)

---

## ✅ الحالة:
- ✅ الصفحة جاهزة
- ✅ API جاهز
- ✅ Schema محدّث
- ⏳ يحتاج تشغيل migration
- ⏳ يحتاج إضافة tracking في صفحات السيلز

---

**التحديث التالي:** إضافة رسوم بيانية وتحليلات متقدمة 📈
