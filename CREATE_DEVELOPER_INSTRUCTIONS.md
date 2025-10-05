# 🔧 تعليمات إنشاء حساب المطور

## ⚠️ المشكلة

السكريبت `npm run create-developer` يتطلب اتصال بقاعدة البيانات PostgreSQL.

---

## ✅ الحل البديل (استخدام API)

### الطريقة 1: عبر المتصفح

1. **شغّل السيرفر:**
   ```bash
   npm run dev
   ```

2. **افتح المتصفح واذهب إلى:**
   ```
   http://localhost:3000/api/create-developer
   ```

3. **ستحصل على رسالة JSON تحتوي على:**
   ```json
   {
     "success": true,
     "message": "تم إنشاء حساب المطور بنجاح",
     "developer": {
       "email": "developer@system.local",
       "password": "Dev@2025!Secure",
       "isActive": true
     }
   }
   ```

### الطريقة 2: عبر cURL

```bash
curl -X POST http://localhost:3000/api/create-developer
```

### الطريقة 3: عبر PowerShell

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/create-developer" -Method POST
```

---

## 📝 معلومات تسجيل الدخول

بعد إنشاء الحساب:

```
📧 البريد الإلكتروني: developer@system.local
🔑 كلمة المرور: Dev@2025!Secure
```

---

## 🚀 الخطوات التالية

1. **شغّل السيرفر:**
   ```bash
   npm run dev
   ```

2. **أنشئ حساب المطور:**
   - اذهب إلى: `http://localhost:3000/api/create-developer`

3. **سجل الدخول:**
   - اذهب إلى: `http://localhost:3000/login`
   - أدخل: `developer@system.local` / `Dev@2025!Secure`

4. **اذهب للوحة التحكم:**
   - `http://localhost:3000/developer-control`

---

## 🔧 إصلاح مشكلة قاعدة البيانات (اختياري)

إذا أردت استخدام السكريبت المباشر:

1. **تأكد من تشغيل PostgreSQL**

2. **حدّث ملف `.env`:**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cv_management"
   ```

3. **شغّل migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **جرب السكريبت مرة أخرى:**
   ```bash
   npm run create-developer
   ```

---

## ✨ النتيجة

بعد إنشاء الحساب، ستتمكن من:

- ✅ تسجيل الدخول كمطور
- ✅ الوصول للوحة التحكم
- ✅ تعطيل/تفعيل النظام
- ✅ التحكم الكامل في النظام

---

## 📞 ملاحظة

الطريقة الأسهل هي استخدام **API endpoint** عبر المتصفح!
