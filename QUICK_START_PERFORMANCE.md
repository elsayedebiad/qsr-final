# دليل سريع: تشغيل النظام بأداء عالي 🚀

## الخطوات السريعة للنشر على VPS

### 1. رفع الكود على VPS
```bash
# في السيرفر
cd /var/www
git clone your-repo-url qsr-system
cd qsr-system
```

### 2. تثبيت المتطلبات
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PM2
sudo npm install -g pm2

# تثبيت dependencies
npm ci --production
```

### 3. إعداد قاعدة البيانات
```bash
# تطبيق migrations
npx prisma migrate deploy

# توليد Prisma Client
npx prisma generate
```

### 4. Build التطبيق
```bash
npm run build
```

### 5. تشغيل مع PM2 (Cluster Mode)
```bash
# تشغيل مع استخدام كل الـCPUs
pm2 start ecosystem.config.js --env production

# حفظ الإعدادات
pm2 save

# تفعيل البدء التلقائي عند إعادة تشغيل السيرفر
pm2 startup
# اتبع التعليمات التي ستظهر
```

### 6. مراقبة الأداء
```bash
# عرض حالة التطبيقات
pm2 list

# مراقبة مباشرة
pm2 monit

# عرض اللوجات
pm2 logs qsr-system

# عرض معلومات تفصيلية
pm2 show qsr-system
```

## إعدادات NGINX (اختياري لكن مُوصى به) 🌐

### تثبيت NGINX
```bash
sudo apt install nginx -y
```

### إنشاء ملف تكوين
```bash
sudo nano /etc/nginx/sites-available/qsr-system
```

### محتوى الملف:
```nginx
# Upstream لـ Next.js
upstream qsr_app {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 64;
}

# تفعيل caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=qsr_cache:10m max_size=1g inactive=60m use_temp_path=off;

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # تفعيل gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
    gzip_disable "MSIE [1-6]\.";
    
    # زيادة حجم الملفات المرفوعة
    client_max_body_size 50M;
    
    # تحسينات الأداء
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 16k;
    
    # Logging
    access_log /var/log/nginx/qsr_access.log;
    error_log /var/log/nginx/qsr_error.log;
    
    # Static files caching
    location /_next/static {
        proxy_pass http://qsr_app;
        proxy_cache qsr_cache;
        proxy_cache_valid 200 60d;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status $upstream_cache_status;
    }
    
    # Images and uploads
    location ~ ^/(uploads|banners)/ {
        proxy_pass http://qsr_app;
        proxy_cache qsr_cache;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
        add_header X-Cache-Status $upstream_cache_status;
    }
    
    # API routes - no caching
    location /api {
        proxy_pass http://qsr_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # تحسينات
        proxy_buffering off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # All other routes
    location / {
        proxy_pass http://qsr_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Cache للصفحات
        proxy_cache qsr_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

### تفعيل الإعدادات:
```bash
# إنشاء رابط للملف
sudo ln -s /etc/nginx/sites-available/qsr-system /etc/nginx/sites-enabled/

# اختبار الإعدادات
sudo nginx -t

# إعادة تشغيل NGINX
sudo systemctl restart nginx

# تفعيل البدء التلقائي
sudo systemctl enable nginx
```

## إضافة SSL (Let's Encrypt) 🔒

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# التجديد التلقائي
sudo certbot renew --dry-run
```

## أوامر مفيدة 🛠️

### PM2
```bash
# إعادة تشغيل
pm2 restart qsr-system

# إعادة تحميل بدون downtime
pm2 reload qsr-system

# إيقاف
pm2 stop qsr-system

# حذف من PM2
pm2 delete qsr-system

# عرض استخدام الموارد
pm2 monit
```

### تحديث التطبيق
```bash
# سحب آخر تحديثات
git pull origin main

# تثبيت dependencies الجديدة
npm ci --production

# تطبيق migrations
npx prisma migrate deploy

# بناء جديد
npm run build

# إعادة تحميل بدون downtime
pm2 reload qsr-system
```

### مراقبة الأداء
```bash
# استخدام الموارد
pm2 monit

# حالة النظام
htop

# مساحة القرص
df -h

# حجم مجلد التطبيق
du -sh /var/www/qsr-system
```

## استكشاف الأخطاء 🔍

### إذا كان التطبيق بطيء:
```bash
# تحقق من استخدام الذاكرة
pm2 monit

# تحقق من اللوجات
pm2 logs qsr-system --lines 100

# إعادة تشغيل
pm2 reload qsr-system
```

### إذا كانت قاعدة البيانات بطيئة:
```bash
# تحقق من الـindexes
npx prisma studio

# راجع ملف PERFORMANCE_OPTIMIZATIONS.md
```

### مسح الـCache:
```bash
# في التطبيق، أنشئ endpoint:
# POST /api/admin/clear-cache

# أو أعد تشغيل التطبيق
pm2 reload qsr-system
```

## التحقق من الأداء ✅

بعد التشغيل، تحقق من:
- ✅ زمن تحميل الصفحة < 1 ثانية
- ✅ استخدام الذاكرة < 70%
- ✅ استخدام CPU < 50% في الأوقات العادية
- ✅ عدم وجود أخطاء في اللوجات

## النتيجة المتوقعة 🎯

مع كل هذه التحسينات:
- **السرعة**: أسرع 3-5 مرات
- **التحمل**: يتحمل 10-20x ضغط أكثر
- **الاستقرار**: أقل أخطاء وتوقفات
- **التكلفة**: أقل استهلاك للموارد

---

**دعم:** إذا واجهت أي مشاكل، راجع اللوجات أولاً:
```bash
pm2 logs qsr-system
```
