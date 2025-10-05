# تحديث نظام إعدادات النظام

## المشكلة التي تم حلها
كان حساب المطور يتعطل عند تعطيل النظام، مما يمنع المطور من إعادة تفعيل النظام.

## الحل
تم فصل حالة النظام عن حساب المطور:
- **حساب المطور**: يبقى نشطاً دائماً (`isActive = true`)
- **حالة النظام**: تُحفظ في جدول منفصل `SystemSettings`

## التغييرات

### 1. إضافة جدول SystemSettings
```prisma
model SystemSettings {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("system_settings")
}
```

### 2. تحديث API
- **`/api/developer/toggle-system`**: يحدث `SystemSettings` بدلاً من `user.isActive`
- **`/api/system-status`**: يقرأ من `SystemSettings` بدلاً من `user.isActive`

### 3. تحديث صفحة المطور
- **`/developer-control`**: تجلب حالة النظام من `/api/system-status`

## خطوات التطبيق

### 1. تشغيل Prisma Migration
```bash
npx prisma migrate dev --name add_system_settings
```

### 2. توليد Prisma Client
```bash
npx prisma generate
```

### 3. تهيئة إعدادات النظام
```bash
node scripts/init-system-settings.js
```

## كيفية الاستخدام

### للمطور
1. سجل دخول بحساب المطور
2. اذهب إلى `/developer-control`
3. استخدم زر "تعطيل النظام" أو "تفعيل النظام"
4. **حسابك سيبقى نشطاً دائماً** حتى لو تم تعطيل النظام

### للمستخدمين الآخرين
- عند تعطيل النظام، سيتم توجيههم لصفحة `/payment-required`
- المطور فقط يمكنه الوصول وإعادة تفعيل النظام

## الفوائد
✅ حساب المطور لا يتعطل أبداً
✅ المطور يمكنه دائماً الوصول وإعادة تفعيل النظام
✅ فصل واضح بين حالة النظام وحالة المستخدمين
✅ سهولة إضافة إعدادات نظام أخرى مستقبلاً
