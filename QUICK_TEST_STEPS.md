# 🚀 خطوات الاختبار السريع

## ✅ تم الإصلاح

النظام الآن يوجه فقط إلى **sales1, sales2, sales3** بنسب متساوية (33% لكل صفحة).

الصفحات **sales4-11** لن تحصل أبداً على أي زيارات (0%).

---

## 🧪 اختبار سريع (خطوة واحدة)

### افتح المتصفح على:
```
http://localhost:3000/test-distribution.html
```

1. اضغط **"مسح الكوكيز"**
2. اضغط **"اختبار 100 مرة"**
3. تحقق من النتائج - يجب أن ترى فقط sales1, sales2, sales3 ✅

---

## 🔍 اختبار يدوي

### الخطوة 1: امسح الكوكيز
```
F12 → Application → Cookies → Delete All
```

### الخطوة 2: افتح صفحة Sales
```
http://localhost:3000/sales
```

### الخطوة 3: تحقق من Console
يجب أن ترى:
```
✅ Rules loaded from public API
📊 Active Distribution Rules:
  Total Active Rules: 3
  Google pages: ["/sales1 (33.33%)", "/sales2 (33.33%)", "/sales3 (33.34%)"]
  🚫 Google Excluded (weight=0): ["/sales4", "/sales5", ..., "/sales11"]
```

### الخطوة 4: تحقق من الصفحة
يجب أن تكون على:
- ✅ `/sales1` أو
- ✅ `/sales2` أو
- ✅ `/sales3`

**ليس** على sales4-11 ❌

---

## 🔧 إذا واجهت مشكلة

### إعادة إعداد القواعد:
```bash
node setup-distribution-rules.js
```

### التحقق من القواعد:
```bash
node verify-distribution-rules.js
```

يجب أن ترى:
```
✅✅✅ SUCCESS! Distribution is correctly configured!
```

---

## 📊 النتيجة المتوقعة

بعد 100 زيارة:
- sales1: ~33 زيارة ✅
- sales2: ~33 زيارة ✅
- sales3: ~34 زيارة ✅
- sales4-11: **0 زيارة** ❌

---

## 📁 ملفات مهمة

- `test-distribution.html` - صفحة الاختبار التفاعلية
- `DISTRIBUTION_FIX_COMPLETE.md` - دليل شامل
- `تعليمات_إصلاح_التوزيع.txt` - تعليمات بالعربية
- `setup-distribution-rules.js` - إعداد القواعد
- `verify-distribution-rules.js` - التحقق من القواعد

---

✅ **جاهز للاختبار الآن!**

