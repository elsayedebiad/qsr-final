# 🔍 دليل استكشاف أخطاء رفع البنرات

## 📋 خطوات التشخيص:

### الخطوة 1️⃣: تحقق من SQL على Neon

**افتح Neon Console واذهب إلى SQL Editor:**

```sql
-- تحقق من نوع عمود imageUrl
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'banners' 
  AND column_name = 'imageUrl';
```

**النتيجة المطلوبة:**
```
column_name | data_type | character_maximum_length
imageUrl    | text      | NULL (يعني unlimited)
```

**إذا كانت النتيجة:**
```
imageUrl | character varying | 255
```

**شغّل هذا فوراً:**
```sql
ALTER TABLE banners ALTER COLUMN "imageUrl" TYPE TEXT;
```

---

### الخطوة 2️⃣: تحقق من حجم الصورة

**الحد الأقصى حالياً: 5 MB**

لتقليل حجم الصورة:
1. استخدم أداة ضغط مثل: https://tinypng.com
2. أو قلل الأبعاد (Width × Height)
3. أو غيّر الصيغة إلى JPEG بجودة 80%

---

### الخطوة 3️⃣: تحقق من رسالة الخطأ

بعد التحديث الأخير، ستظهر رسالة خطأ تفصيلية:

#### ❌ **"الصورة كبيرة جداً لقاعدة البيانات"**
**الحل:** شغّل SQL على Neon (الخطوة 1)

#### ❌ **"فشل الاتصال بقاعدة البيانات"**
**الحل:** 
- تحقق من `DATABASE_URL` في Environment Variables
- تأكد من أن قاعدة البيانات شغالة على Neon

#### ❌ **"الصورة كبيرة جداً. الحد الأقصى 5 ميجابايت"**
**الحل:** قلل حجم الصورة (الخطوة 2)

---

### الخطوة 4️⃣: تحقق من Vercel Logs

1. اذهب إلى: **Vercel Dashboard → Your Project**
2. اضغط **Functions** → **Error Logs**
3. ابحث عن logs البنر - ستجد:
   ```
   🔄 محاولة حفظ البنر في قاعدة البيانات...
   📊 حجم البيانات: XXX KB
   📍 صفحة: sales1, جهاز: DESKTOP
   ❌ خطأ في حفظ البنر: ...
   ```

---

### الخطوة 5️⃣: جرب بنر صغير

**جرب رفع صورة صغيرة جداً (< 100 KB):**
- إذا نجحت → المشكلة في حجم الصورة
- إذا فشلت → المشكلة في قاعدة البيانات (SQL)

---

## 🎯 الحلول السريعة:

### ✅ الحل 1: شغّل SQL (الأهم!)
```sql
ALTER TABLE banners ALTER COLUMN "imageUrl" TYPE TEXT;
```

### ✅ الحل 2: ضغط الصورة
- استخدم TinyPNG أو Squoosh
- الحد الأقصى: 5 MB

### ✅ الحل 3: أعد Deploy
بعد تشغيل SQL:
```bash
git add .
git commit -m "Fix banner upload"
git push origin main
```

---

## 📞 لو لسه المشكلة موجودة:

1. **صور Vercel Logs** وأرسلها
2. **صور نتيجة SQL Query** (الخطوة 1)
3. **حجم الصورة** اللي بترفعها

---

## 🚨 ملحوظة مهمة:

**بعد تشغيل SQL على Neon، لا تحتاج `prisma migrate`!**

لأن:
- ✅ Neon = Production Database
- ✅ SQL تم تشغيله مباشرة
- ✅ Schema.prisma محدّث بالفعل (`@db.Text`)

**فقط Push الكود على Git وخلاص!** 🎉

