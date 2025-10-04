# ⚙️ Vercel Environment Variables Setup

## 🔑 Required Environment Variables

To deploy this app on Vercel, you need to add the following environment variables:

### 1. DATABASE_URL (Required)

```
postgresql://neondb_owner:npg_LdQHjZ0kBR3v@ep-red-hill-adxo3mpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 2. JWT_SECRET (Optional - has default)

```
your-super-secret-jwt-key-change-this-in-production-2024
```

### 3. NEXTAUTH_SECRET (Optional - has default)

```
your-nextauth-secret-key-2024
```

---

## 📝 Steps to Add Environment Variables in Vercel:

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Select Your Project**
   - Click on your project name

3. **Go to Settings**
   - Click on "Settings" tab

4. **Navigate to Environment Variables**
   - Click on "Environment Variables" in the left sidebar

5. **Add DATABASE_URL**
   - Name: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_LdQHjZ0kBR3v@ep-red-hill-adxo3mpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - Environment: Select all (Production, Preview, Development)

6. **Save**
   - Click "Save" button

7. **Redeploy**
   - Go to "Deployments" tab
   - Click "..." on the latest deployment
   - Click "Redeploy"

---

## ✅ Database is Already Set Up!

The database schema has been pushed to Neon PostgreSQL:
- ✅ All tables created
- ✅ Schema synchronized
- ✅ Ready to use

---

## 🗄️ Database Details:

- **Provider**: Neon PostgreSQL
- **Host**: ep-red-hill-adxo3mpm-pooler.c-2.us-east-1.aws.neon.tech
- **Database**: neondb
- **SSL**: Required
- **Connection Pooling**: Enabled

---

## 📚 Tables Created:

1. User - مستخدمين النظام
2. CV - السير الذاتية
3. Session - جلسات المستخدمين
4. Booking - الحجوزات
5. Contract - العقود
6. SalesPageConfig - إعدادات صفحات المبيعات
7. Banner - البنرات الإعلانية
8. Activity - سجل النشاطات

---

## ⚠️ Important Notes:

### Images Storage:
- ❌ Images are NOT stored in PostgreSQL
- ✅ Only image paths are stored in database
- 📁 Actual images need external storage (Vercel Blob, AWS S3, etc.)

### Current Setup:
- Local: Images in `public/uploads/` and `public/banners/`
- Vercel: Need to migrate to external storage

### Recommendation:
Use **Vercel Blob Storage** for images:
```bash
npm install @vercel/blob
```

Then update upload endpoints to use blob storage instead of local filesystem.

---

## 🚀 After Adding Environment Variables:

1. The app will automatically connect to Neon PostgreSQL
2. All data will be stored in the cloud
3. Multiple instances can share the same database
4. Data persists between deployments

---

## 📞 Support:

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Ensure DATABASE_URL is accessible from Vercel servers
4. Check Neon database status

---

**✅ Database is ready! Just add the environment variable in Vercel and redeploy!**

