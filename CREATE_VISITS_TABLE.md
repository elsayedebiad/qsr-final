# ✅ إنشاء جدول الزيارات (visits)

## 🔴 المشكلة
```
Error: The table `public.visits` does not exist in the current database
```

## ✅ الحل

### الخطوات بالترتيب:

#### 1️⃣ **أوقف الخادم**
```bash
# في Terminal حيث يعمل npm run dev
# اضغط Ctrl+C
```

#### 2️⃣ **نفّذ db push**
```bash
npx prisma db push
```

**ماذا يفعل؟**
- يقرأ schema.prisma
- يُنشئ جدول `visits` في قاعدة البيانات
- يُحدّث Prisma Client

#### 3️⃣ **تأكد من النجاح**
يجب أن ترى:
```
✔ Your database is now in sync with your Prisma schema
✔ Generated Prisma Client
```

#### 4️⃣ **شغّل الخادم مرة أخرى**
```bash
npm run dev
```

---

## 🧪 اختبار الجدول

### في المتصفح:
```
http://localhost:3000/dashboard/visits
```

**يجب أن يعمل الآن!** ✅

---

## 📊 هيكل جدول visits

```sql
CREATE TABLE visits (
  id              SERIAL PRIMARY KEY,
  ipAddress       TEXT NOT NULL,
  country         TEXT,
  city            TEXT,
  userAgent       TEXT,
  referer         TEXT,
  utmSource       TEXT,
  utmMedium       TEXT,
  utmCampaign     TEXT,
  targetPage      TEXT NOT NULL,
  isGoogle        BOOLEAN NOT NULL DEFAULT false,
  timestamp       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes للأداء
CREATE INDEX idx_visits_timestamp ON visits(timestamp);
CREATE INDEX idx_visits_targetPage ON visits(targetPage);
CREATE INDEX idx_visits_country ON visits(country);
CREATE INDEX idx_visits_utmSource ON visits(utmSource);
```

---

## 🔧 إذا فشل db push

### الخطوة البديلة: إنشاء يدوي

#### 1️⃣ **افتح Prisma Studio**
```bash
npx prisma studio
```

#### 2️⃣ **أو استخدم SQL مباشرة**
افتح أي SQL client واتصل بقاعدة بياناتك، ثم نفّذ:

```sql
-- إنشاء جدول visits
CREATE TABLE IF NOT EXISTS "public"."visits" (
    "id" SERIAL PRIMARY KEY,
    "ipAddress" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "targetPage" TEXT NOT NULL,
    "isGoogle" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS "idx_visits_timestamp" ON "public"."visits"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_visits_targetPage" ON "public"."visits"("targetPage");
CREATE INDEX IF NOT EXISTS "idx_visits_country" ON "public"."visits"("country");
CREATE INDEX IF NOT EXISTS "idx_visits_utmSource" ON "public"."visits"("utmSource");
```

#### 3️⃣ **ثم شغّل generate**
```bash
npx prisma generate
```

---

## 📝 التحقق من وجود الجدول

### طريقة 1: Prisma Studio
```bash
npx prisma studio
# يجب أن ترى جدول Visit في القائمة
```

### طريقة 2: SQL Query
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'visits'
);
-- يجب أن يرجع: true
```

### طريقة 3: في Node.js
```javascript
// في terminal Node.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

prisma.visit.count()
  .then(count => console.log('Visits count:', count))
  .catch(err => console.error('Table not found:', err))
```

---

## 🚀 بعد الإنشاء

### تجربة إضافة زيارة تجريبية:

```bash
# في terminal
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.visit.create({
  data: {
    ipAddress: '192.168.1.1',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    targetPage: '/sales1',
    isGoogle: true
  }
}).then(() => console.log('✅ Visit created!'))
  .catch(err => console.error('❌ Error:', err))
"
```

### ثم تحقق في Dashboard:
```
http://localhost:3000/dashboard/visits
```

---

## ⚠️ ملاحظات مهمة

### 1. الخطأ EPERM
إذا رأيت:
```
EPERM: operation not permitted, rename...
```

**الحل**:
```bash
# أوقف الخادم تماماً
Ctrl+C

# انتظر 5 ثواني

# ثم حاول مرة أخرى
npx prisma generate
```

### 2. Shadow Database Error
إذا رأيت:
```
Migration failed to apply to shadow database
```

**الحل**: استخدم `db push` بدلاً من `migrate`:
```bash
npx prisma db push --accept-data-loss
```

### 3. الجدول موجود لكن Prisma لا يراه
```bash
# حذف generated files وإعادة التوليد
rm -rf node_modules/.prisma
npx prisma generate
```

---

## ✅ الخلاصة

**الترتيب الصحيح**:
```bash
1. أوقف الخادم (Ctrl+C)
2. npx prisma db push
3. npx prisma generate (إذا فشل في الخطوة 2)
4. npm run dev
5. افتح http://localhost:3000/dashboard/visits
```

**يجب أن يعمل الآن بدون أخطاء!** 🎉
