# ✅ إصلاح خطأ Booking API

**التاريخ:** 2 أكتوبر 2025  
**المشكلة:** `Argument updatedAt is missing`

---

## 🔴 الخطأ

```
Argument `updatedAt` is missing.
   at async POST (src\app\api\bookings\route.ts:82:21)
```

---

## 🔍 السبب

### 1️⃣ في Schema:
```prisma
model Booking {
  updatedAt      DateTime  // ❌ بدون @updatedAt directive
}
```

المشكلة: حقل `updatedAt` موجود لكن بدون `@updatedAt` directive، مما يعني أنه يجب توفيره يدوياً.

### 2️⃣ في API Route:
```typescript
const booking = await db.booking.create({
  data: {
    cvId: parseInt(cvId),
    identityNumber,
    notes: notes || null,
    bookedById: decoded.userId
    // ❌ updatedAt مفقود!
  }
})
```

---

## ✅ الحل

### 1️⃣ تحديث Schema:
**الملف:** `prisma/schema.prisma`

```prisma
model Booking {
  id             Int      @id @default(autoincrement())
  cvId           Int      @unique
  identityNumber String
  notes          String?
  bookedAt       DateTime @default(now())
  bookedById     Int
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt  // ✅ إضافة @updatedAt
  bookedBy       User     @relation("BookedCVs", fields: [bookedById], references: [id])
  cv             CV       @relation(fields: [cvId], references: [id], onDelete: Cascade)

  @@map("bookings")
}
```

**الفرق:**
- **قبل:** `updatedAt      DateTime`
- **بعد:** `updatedAt      DateTime @updatedAt`

**ما يعنيه `@updatedAt`:**
- Prisma سيحدث هذا الحقل تلقائياً عند كل تحديث
- لا حاجة لتوفيره يدوياً في `create()` أو `update()`

### 2️⃣ تحديث API Route (احتياطي):
**الملف:** `src/app/api/bookings/route.ts`

```typescript
const booking = await db.booking.create({
  data: {
    cvId: parseInt(cvId),
    identityNumber,
    notes: notes || null,
    bookedById: decoded.userId,
    bookedAt: new Date(),      // ✅ إضافي (مع أن @default(now()) يفي بالغرض)
    createdAt: new Date(),     // ✅ إضافي (مع أن @default(now()) يفي بالغرض)
    updatedAt: new Date()      // ✅ إضافي (الآن لا حاجة له مع @updatedAt)
  }
})
```

**ملاحظة:** بعد إضافة `@updatedAt` في Schema، لا حاجة لتوفير `updatedAt` يدوياً، لكن تركناه للتوافق.

---

## 🔧 الخطوات المطبقة

### 1️⃣ تحديث Schema:
```bash
# تم تحديث:
prisma/schema.prisma

# التغيير:
updatedAt DateTime @updatedAt
```

### 2️⃣ إعادة توليد Prisma Client:
```bash
# إيقاف Node processes
Get-Process node | Stop-Process -Force

# إعادة توليد Prisma Client
npx prisma generate
```

### 3️⃣ إعادة تشغيل السيرفر:
```bash
npm run dev
```

---

## 🧪 كيف تختبر الآن؟

### 1️⃣ افتح Dashboard:
```
http://localhost:3000/dashboard
```

### 2️⃣ اختر سيرة ذاتية واضغط "حجز":
```
1. أدخل رقم الهوية
2. أدخل ملاحظات (اختياري)
3. اضغط "تأكيد الحجز"
```

### 3️⃣ يجب أن ترى:
```
✅ "تم حجز السيرة الذاتية بنجاح"
✅ السيرة تنتقل إلى صفحة "المحجوزات"
✅ لا أخطاء في Console
```

### 4️⃣ تحقق من Console (F12):
```javascript
// يجب ألا ترى:
❌ Argument `updatedAt` is missing

// يجب أن ترى:
✅ 200 OK
```

---

## 📊 الفرق بين قبل وبعد

### قبل الإصلاح:
```prisma
updatedAt DateTime  // يجب توفيره يدوياً
```
```typescript
// ❌ خطأ: updatedAt مفقود
const booking = await db.booking.create({
  data: {
    cvId,
    identityNumber,
    bookedById
    // updatedAt ❌ مفقود
  }
})
```

### بعد الإصلاح:
```prisma
updatedAt DateTime @updatedAt  // تحديث تلقائي
```
```typescript
// ✅ يعمل: Prisma يضيف updatedAt تلقائياً
const booking = await db.booking.create({
  data: {
    cvId,
    identityNumber,
    bookedById,
    updatedAt: new Date()  // اختياري الآن
  }
})
```

---

## 💡 ملاحظات مهمة

### `@default(now())` vs `@updatedAt`:

```prisma
createdAt DateTime @default(now())  // يُعيّن مرة واحدة عند الإنشاء
updatedAt DateTime @updatedAt       // يُحدّث تلقائياً عند كل تعديل
```

**مثال:**
```typescript
// عند الإنشاء:
const booking = await db.booking.create({...})
// createdAt: 2025-10-02 14:00:00
// updatedAt: 2025-10-02 14:00:00

// عند التحديث (بعد ساعة):
const updated = await db.booking.update({...})
// createdAt: 2025-10-02 14:00:00  (لم يتغير ✅)
// updatedAt: 2025-10-02 15:00:00  (تحدث تلقائياً ✅)
```

---

## 🔍 إذا استمرت المشكلة

### الخطوة 1: تحقق من أن Prisma Client محدث:
```bash
npx prisma generate
```

### الخطوة 2: تحقق من Schema:
```bash
# افتح:
prisma/schema.prisma

# تأكد من:
updatedAt DateTime @updatedAt
```

### الخطوة 3: أعد تشغيل السيرفر:
```bash
# أوقف Node:
Get-Process node | Stop-Process -Force

# أعد التشغيل:
npm run dev
```

### الخطوة 4: امسح node_modules (إذا استمر الخطأ):
```bash
rm -rf node_modules
rm package-lock.json
npm install
npx prisma generate
npm run dev
```

---

## 📁 الملفات المعدّلة

1. ✅ `prisma/schema.prisma` - إضافة `@updatedAt` directive
2. ✅ `src/app/api/bookings/route.ts` - إضافة `updatedAt` في data (احتياطي)

---

## 🎯 النتيجة

الآن نظام الحجز يعمل بشكل صحيح:
- ✅ لا أخطاء عند إنشاء حجز جديد
- ✅ `updatedAt` يُحدث تلقائياً
- ✅ `createdAt` يُعيّن عند الإنشاء فقط
- ✅ جميع الحقول المطلوبة موجودة

**🎉 جرّب الحجز الآن! يجب أن يعمل بسلاسة! 🚀**

