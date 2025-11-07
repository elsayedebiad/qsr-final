# تعليمات إعادة التشغيل بعد تحديث Prisma Schema

## الخطوات المطلوبة:

### 1. إيقاف سيرفر Next.js
في Terminal الذي يعمل فيه `npm run dev`، اضغط:
```
Ctrl + C
```

### 2. إعادة توليد Prisma Client
```bash
npx prisma generate
```

### 3. إعادة تشغيل السيرفر
```bash
npm run dev
```

## البديل (إذا كان هناك مشكلة):

### حذف node_modules/.prisma وإعادة التوليد
```bash
# إيقاف السيرفر أولاً (Ctrl + C)

# حذف المجلد القديم
rmdir /s /q node_modules\.prisma

# إعادة التوليد
npx prisma generate

# إعادة التشغيل
npm run dev
```

## لماذا هذا مطلوب؟
- قمنا بتحديث schema.prisma ليجعل `createdById` اختياري (nullable)
- Prisma Client الحالي (في الذاكرة) لا يعرف عن هذا التغيير
- يجب إعادة توليد Prisma Client لتطبيق التغييرات

## ما سيحدث بعد إعادة التشغيل:
✅ API سيعمل بشكل صحيح
✅ العقود القديمة ستظهر كـ "غير معروف"
✅ العقود الجديدة ستحتفظ باسم المنشئ
