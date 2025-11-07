# تتبع الموظف المنشئ للعقود

## التغييرات المنفذة

### 1. تحديث قاعدة البيانات (schema.prisma)
- إضافة حقل `createdById` في جدول `Contract`
- إضافة علاقة `createdBy` مع جدول `User`
- إضافة علاقة `createdContracts` في جدول `User`

```prisma
model Contract {
  id                Int       @id @default(autoincrement())
  cvId              Int       @unique
  identityNumber    String
  contractStartDate DateTime  @default(now())
  contractEndDate   DateTime?
  createdById       Int       // حقل جديد
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  cv                CV        @relation(fields: [cvId], references: [id], onDelete: Cascade)
  createdBy         User      @relation("ContractCreatedBy", fields: [createdById], references: [id]) // علاقة جديدة
}
```

### 2. تحديث APIs
#### `/api/contracts` (GET)
- إضافة معلومات `createdBy` عند جلب العقود
- يتم إرجاع: id, name, email, role

#### `/api/contracts` (POST)
- إضافة مصادقة المستخدم باستخدام `validateAuthFromRequest`
- حفظ `createdById` عند إنشاء عقد جديد

#### `/api/bookings/[id]/contract` (POST)
- إضافة `createdById` عند تحويل حجز إلى عقد

### 3. تحديث صفحة التعاقدات (`/dashboard/contracts`)
#### واجهة TypeScript
- إضافة `createdBy` في واجهة `Contract`

#### State Management
- إضافة `employeeFilter` لتصفية العقود حسب الموظف
- إضافة `uniqueEmployees` لقائمة الموظفين الفريدة

#### UI Updates
- عمود جديد "الموظف المنشئ" في الجدول يعرض:
  - أيقونة مستخدم
  - اسم الموظف
  - دور الموظف (أدمن، أبوريشن، خدمة عملاء، مبيعات)
  
- فلتر جديد للموظفين:
  - قائمة منسدلة تعرض جميع الموظفين
  - زر لإلغاء الفلتر

#### منطق الفلترة
- البحث يشمل الآن اسم الموظف
- إمكانية الفلترة حسب موظف معين

## الملفات المعدلة
1. `prisma/schema.prisma` - تحديث البنية
2. `prisma/migrations/20250107_add_contract_creator/migration.sql` - Migration جديد
3. `src/app/api/contracts/route.ts` - تحديث GET و POST
4. `src/app/api/bookings/[id]/contract/route.ts` - تحديث POST
5. `src/app/dashboard/contracts/page.tsx` - واجهة المستخدم

## الملفات الإضافية
- `update-old-contracts.js` - سكريبت لتحديث العقود القديمة (اختياري)

## كيفية الاستخدام

### للمستخدمين
1. افتح صفحة التعاقدات `/dashboard/contracts`
2. ستجد عمود "الموظف المنشئ" يعرض من أنشأ كل عقد
3. استخدم قائمة الفلتر لعرض عقود موظف معين
4. البحث يعمل الآن على اسم الموظف أيضاً

### للمطورين
```bash
# تطبيق التغييرات على قاعدة البيانات
npx prisma db push

# إعادة توليد Prisma Client
npx prisma generate

# (اختياري) تحديث العقود القديمة إذا كانت موجودة
node update-old-contracts.js
```

## الميزات
✅ تتبع من أنشأ كل عقد  
✅ فلترة العقود حسب الموظف  
✅ البحث بواسطة اسم الموظف  
✅ عرض دور الموظف (أدمن، أبوريشن، خدمة عملاء، مبيعات)  
✅ واجهة مستخدم محسنة  
✅ أداء محسن مع العلاقات  

## ملاحظات
- جميع العقود الجديدة ستحتوي على معلومات الموظف المنشئ تلقائياً
- العقود القديمة (إن وجدت) سيتم ربطها بأول مستخدم أدمن في النظام
- الحقل `createdById` مطلوب (NOT NULL) لضمان تتبع كامل
