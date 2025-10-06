# 🔄 دليل تحديث روابط Google Drive للصور

## المشكلة المكتشفة

الصور في قاعدة البيانات محفوظة كروابط محلية:
```
❌ /uploads/images/1759789138697_w2uwdd_url.png
```

لكن الصور الفعلية موجودة على Google Drive:
```
✅ https://drive.google.com/file/d/1X9EvjAffKrfiGZb_3EHQ2JtV2qbIEZXe/view?usp=drive_link
```

---

## 🛠️ الحلول المتاحة

### الحل 1: تحديث يدوي (سيرة واحدة)

```bash
node update-google-drive-urls.js
# اختر: 1
# أدخل ID السيرة الذاتية
# أدخل رابط Google Drive الكامل
```

### الحل 2: تحديث جماعي من ملف CSV

#### خطوة 1: أنشئ ملف `image-urls.csv`:
```csv
cvId,googleDriveUrl
1,https://drive.google.com/file/d/1X9EvjAffKrfiGZb_3EHQ2JtV2qbIEZXe/view?usp=drive_link
2,https://drive.google.com/file/d/1c0lTZNiBvcH8oh-eJB3yIVVF0dkiedSsq/view?usp=drive_link
3,https://drive.google.com/file/d/1OUikCeiBI4DFSQzEwIYcHb27-ItauBDe/view?usp=drive_link
```

#### خطوة 2: قم بتشغيل الأداة:
```bash
node update-google-drive-urls.js
# اختر: 2
# أدخل مسار الملف: image-urls.csv
```

### الحل 3: عرض السير الذاتية التي تحتاج تحديث

```bash
node update-google-drive-urls.js
# اختر: 3
```

---

## 📝 كيفية الحصول على روابط Google Drive

### من Google Sheets:
1. افتح Google Sheet الأصلي
2. ابحث عن عمود الصور الشخصية
3. انسخ الروابط

### من Google Drive:
1. افتح Google Drive
2. انقر بزر الماوس الأيمن على الصورة
3. اختر "Get link" / "الحصول على رابط"
4. تأكد من أن الرابط "Anyone with the link can view"

---

## 🔍 صيغ روابط Google Drive المدعومة

النظام يدعم جميع صيغ Google Drive:

```
✅ https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
✅ https://drive.google.com/file/d/FILE_ID/view?usp=sharing
✅ https://drive.google.com/open?id=FILE_ID
✅ https://drive.google.com/uc?id=FILE_ID
```

سيتم تحويلها تلقائياً إلى:
```
https://drive.google.com/thumbnail?id=FILE_ID&sz=w2000
```

---

## 🧪 اختبار التحديث

بعد تحديث رابط واحد، اختبر:

1. افتح الداشبورد
2. ابحث عن السيرة الذاتية المحدثة
3. يجب أن تظهر الصورة من Google Drive

---

## 💡 نصائح مهمة

### 1. تأكد من صلاحيات الوصول
الصور على Google Drive يجب أن تكون:
- ✅ Public (Anyone with link can view)
- ❌ ليست Private/Restricted

### 2. احتفظ بنسخة احتياطية
قبل التحديث الجماعي، خذ backup:
```bash
# في أداة قاعدة البيانات
pg_dump database_name > backup.sql
```

### 3. تحديث تدريجي
ابدأ بـ 5-10 سير ذاتية للتأكد من عمل الحل

---

## 🚀 بعد التحديث

بمجرد تحديث روابط Google Drive:
1. ✅ الصور ستظهر تلقائياً
2. ✅ لا حاجة لإعادة تشغيل السيرفر
3. ✅ يعمل في الداشبورد وصفحات السيلز
4. ✅ التحويل التلقائي لروابط Google Drive

---

## 🔄 التحديث التلقائي من Google Sheets

إذا كان لديك Google Sheet بالبيانات الأصلية:

### خيار A: استيراد جديد
استخدم نظام Smart Import مع روابط Google Drive الصحيحة

### خيار B: تحديث مباشر من Sheet
يمكن إنشاء سكريبت يقرأ من Google Sheet ويحدث قاعدة البيانات مباشرة

---

## ❓ الأسئلة الشائعة

### Q: هل يمكن استخدام روابط مختلطة؟
**A:** نعم! النظام يدعم:
- روابط Google Drive ✅
- روابط محلية `/uploads/...` ✅
- روابط خارجية أخرى ✅

### Q: ماذا لو كان بعض الصور محلية والبعض على Drive؟
**A:** لا مشكلة! حدّث فقط التي على Google Drive

### Q: هل التحديث يؤثر على البيانات الأخرى؟
**A:** لا، يتم تحديث حقل `profileImage` فقط

---

## 📞 الدعم

إذا واجهت مشكلة:
1. تحقق من صلاحيات Google Drive
2. تأكد من صيغة الرابط صحيحة
3. جرب رابط واحد أولاً
4. تحقق من Console للأخطاء

---

**بعد التحديث، الصور ستظهر فوراً! 🎉**

