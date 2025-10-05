# 🚀 دليل رفع المشروع على Netlify

## الخطوات بالتفصيل:

---

## 1️⃣ **إنشاء حساب على Netlify**

### أ) افتح الرابط:
👉 **https://app.netlify.com/signup**

### ب) اختر طريقة التسجيل:
- ✅ **GitHub** (الأفضل - ربط تلقائي)
- أو Email

### ج) اربط حساب GitHub:
- سيطلب منك Netlify صلاحيات GitHub
- **اضغط "Authorize Netlify"**

---

## 2️⃣ **رفع المشروع على Netlify**

### أ) من Netlify Dashboard:
1. **اضغط "Add new site"**
2. **اختر "Import an existing project"**
3. **اختر "Deploy with GitHub"**
4. **ابحث عن:** `qsr-final`
5. **اختر Repository**

### ب) إعدادات Build:

**Netlify سيكتشف Next.js تلقائياً، لكن تأكد من:**

```
Build command: npm run build
Publish directory: .next
```

✅ **لا تغير شيء آخر!** netlify.toml موجود بالفعل

---

## 3️⃣ **إضافة Environment Variables**

### ⚠️ **مهم جداً!** أضف المتغيرات التالية:

في Netlify Dashboard:
1. **اذهب إلى: Site settings → Environment variables**
2. **اضغط "Add a variable"**

**أضف هذه المتغيرات:**

```bash
# Database
DATABASE_URL = "your-neon-database-url"

# Authentication
JWT_SECRET = "your-jwt-secret"
NEXTAUTH_SECRET = "your-nextauth-secret"
NEXTAUTH_URL = "https://your-site.netlify.app"

# Google Drive (إذا كنت تستخدمه)
GOOGLE_DRIVE_FOLDER_ID = "your-folder-id"

# أي متغيرات أخرى من ملف .env
```

---

## 4️⃣ **Deploy!**

### اضغط "Deploy site"

**Netlify سيبدأ Build:**
```
⏳ Installing dependencies...
⏳ Running Prisma generate...
⏳ Building Next.js...
✅ Deploy successful!
```

**مدة البناء:** 3-5 دقائق

---

## 5️⃣ **تحديث NEXTAUTH_URL**

بعد Deploy الأول:

1. **انسخ URL الموقع** (مثل: `https://qsr-final.netlify.app`)
2. **ارجع لـ Environment Variables**
3. **عدّل `NEXTAUTH_URL`** إلى URL الجديد
4. **اضغط "Save"**
5. **Redeploy** (Netlify سيعيد Deploy تلقائياً)

---

## 6️⃣ **Custom Domain (اختياري)**

إذا كان عندك دومين:

1. **اذهب إلى: Domain settings**
2. **اضغط "Add custom domain"**
3. **أدخل الدومين** (مثل: `qsr.sa`)
4. **اتبع التعليمات** لتحديث DNS

---

## 📊 **الفرق بين Netlify و Vercel:**

| الميزة | Netlify | Vercel |
|--------|---------|--------|
| Memory Limit | ✅ لا يوجد مشكلة | ❌ 2 GB فقط |
| Build Time | ⚡ سريع | ⚡ سريع |
| Functions | ✅ غير محدودة | ⚠️ محدودة |
| Free Tier | ✅ سخي | ⚠️ محدود |
| Next.js Support | ✅ كامل | ✅ كامل |

---

## ✅ **بعد Deploy:**

### تحقق من:
1. ✅ الصفحة الرئيسية تعمل
2. ✅ Login يعمل
3. ✅ Dashboard يعمل
4. ✅ البنرات تظهر (بعد تشغيل SQL على Neon)
5. ✅ الـ APIs تعمل

---

## 🔧 **إذا حدثت مشاكل:**

### Build Error:
1. **اذهب إلى: Deploys → Failed deploy → View logs**
2. **ابحث عن السطر الأحمر**
3. **أرسل الـ error**

### Runtime Error:
1. **اذهب إلى: Functions → Error logs**
2. **شوف آخر error**
3. **أرسل الـ error**

---

## 🎉 **نصائح:**

1. ✅ **Automatic Deploys:** كل Push على GitHub → Deploy تلقائي
2. ✅ **Deploy Previews:** كل PR → Preview link
3. ✅ **Rollbacks:** لو في مشكلة → Rollback بكبسة زر
4. ✅ **Analytics:** متابعة الزوار مجاناً

---

## 🚀 **بعد ما تخلص:**

**الموقع سيكون جاهز على:**
```
https://qsr-final.netlify.app
```

**أو Domain مخصص:**
```
https://qsr.sa
```

---

## 📞 **لو محتاج مساعدة:**

1. **Netlify Docs:** https://docs.netlify.com
2. **Community Forum:** https://answers.netlify.com
3. **Support:** https://app.netlify.com/support

---

**الآن روح على Netlify وابدأ Deploy! 🎊**

