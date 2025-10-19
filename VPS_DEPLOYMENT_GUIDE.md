# دليل نشر التطبيق على VPS

## المشاكل الشائعة وحلولها

### 1. مشكلة عدم ظهور البيانات في الفلاتر

**السبب:** قاعدة البيانات فارغة أو غير متصلة بشكل صحيح

**الحلول:**

#### أ) التأكد من إعدادات قاعدة البيانات

1. إنشاء ملف `.env` في جذر المشروع:
```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/cv_management"

# NextAuth Configuration  
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-very-secure-secret-key-minimum-32-characters"

# Application Settings
NODE_ENV="production"
PORT=3000
```

#### ب) إعداد قاعدة البيانات PostgreSQL

```bash
# تسجيل الدخول لـ PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة البيانات
CREATE DATABASE cv_management;

# إنشاء مستخدم
CREATE USER cv_user WITH PASSWORD 'secure_password';

# منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE cv_management TO cv_user;

# الخروج
\q
```

#### ج) تشغيل Migration

```bash
# تشغيل Prisma migrations
npx prisma migrate deploy

# إنشاء Prisma client
npx prisma generate

# (اختياري) إضافة بيانات تجريبية
npx prisma db seed
```

### 2. مشكلة صفحة upload-statistics

**السبب:** مشاكل في API أو الصلاحيات

**الحلول:**

#### أ) التحقق من logs الخادم

```bash
# عرض logs التطبيق
pm2 logs your-app-name

# أو إذا كنت تستخدم systemd
journalctl -u your-app-service -f
```

#### ب) التحقق من صلاحيات المستخدم

```bash
# إنشاء حساب مدير من خلال script
npm run create-developer
```

#### ج) إصلاح مشاكل API

تأكد من أن API endpoint يعمل:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     https://yourdomain.com/api/upload-statistics
```

### 3. إعداد Nginx (إذا كنت تستخدمه)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. إعداد PM2 للإنتاج

```bash
# تثبيت PM2
npm install -g pm2

# إنشاء ملف ecosystem
```

إنشاء ملف `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'cv-management',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

```bash
# تشغيل التطبيق
pm2 start ecosystem.config.js

# حفظ التكوين
pm2 save

# تشغيل تلقائي عند إعادة التشغيل
pm2 startup
```

### 5. سكريبت نشر شامل

إنشاء ملف `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 بدء عملية النشر..."

# تحديث الكود
git pull origin main

# تثبيت التبعيات
npm ci

# بناء التطبيق
npm run build

# تشغيل migrations
npx prisma migrate deploy
npx prisma generate

# إعادة تشغيل التطبيق
pm2 restart cv-management

echo "✅ تم النشر بنجاح!"
```

### 6. فحص صحة التطبيق

```bash
# فحص حالة قاعدة البيانات
npx prisma db seed --preview-feature

# فحص الاتصال
curl -f http://localhost:3000/api/health || exit 1

# فحص logs
pm2 logs cv-management --lines 50
```

### 7. إصلاح مشاكل الذاكرة

إذا كان التطبيق يتوقف بسبب نفاد الذاكرة:

```bash
# زيادة حد الذاكرة لـ Node.js
export NODE_OPTIONS="--max-old-space-size=2048"

# أو في PM2
pm2 start npm --name "cv-management" -- start --node-args="--max-old-space-size=2048"
```

### 8. إعداد النسخ الاحتياطي

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"

# نسخ احتياطي لقاعدة البيانات
pg_dump -h localhost -U cv_user cv_management > $BACKUP_DIR/db_backup_$DATE.sql

# نسخ احتياطي للملفات
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /path/to/your/app/public/uploads

echo "✅ تم إنشاء النسخة الاحتياطية: $DATE"
```

### 9. مراقبة التطبيق

```bash
# إعداد مراقبة مع PM2
pm2 install pm2-logrotate

# تكوين تدوير السجلات
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 10. استكشاف الأخطاء

#### أ) فحص السجلات
```bash
# سجلات التطبيق
pm2 logs cv-management

# سجلات قاعدة البيانات
sudo tail -f /var/log/postgresql/postgresql-*.log

# سجلات Nginx
sudo tail -f /var/log/nginx/error.log
```

#### ب) فحص الاتصالات
```bash
# فحص المنافذ المفتوحة
netstat -tlnp | grep :3000

# فحص عمليات Node.js
ps aux | grep node
```

#### ج) فحص استخدام الموارد
```bash
# استخدام الذاكرة والمعالج
htop

# مساحة القرص
df -h

# استخدام قاعدة البيانات
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('cv_management'));"
```

## خطوات النشر السريع

1. **رفع الكود:**
```bash
git push origin main
```

2. **على الخادم:**
```bash
cd /path/to/your/app
git pull origin main
npm ci
npm run build
npx prisma migrate deploy
pm2 restart cv-management
```

3. **فحص الحالة:**
```bash
pm2 status
curl -f https://yourdomain.com/api/health
```

## نصائح مهمة

- ✅ **استخدم HTTPS دائماً في الإنتاج**
- ✅ **احتفظ بنسخ احتياطية منتظمة**
- ✅ **راقب استخدام الموارد**
- ✅ **استخدم متغيرات البيئة للإعدادات الحساسة**
- ✅ **فعل تدوير السجلات**
- ✅ **استخدم CDN للملفات الثابتة**

## اتصل للدعم

إذا استمرت المشاكل، تحقق من:
1. سجلات الخادم
2. إعدادات قاعدة البيانات
3. متغيرات البيئة
4. صلاحيات الملفات
5. إعدادات الشبكة/Firewall
