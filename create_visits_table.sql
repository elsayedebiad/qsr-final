-- =====================================================
-- سكريبت إنشاء جدول الزيارات (visits)
-- =====================================================

-- حذف الجدول إذا كان موجوداً (احذر: سيحذف البيانات!)
-- DROP TABLE IF EXISTS "public"."visits" CASCADE;

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

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS "idx_visits_timestamp" ON "public"."visits"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_visits_targetPage" ON "public"."visits"("targetPage");
CREATE INDEX IF NOT EXISTS "idx_visits_country" ON "public"."visits"("country");
CREATE INDEX IF NOT EXISTS "idx_visits_utmSource" ON "public"."visits"("utmSource");

-- إضافة تعليق للجدول
COMMENT ON TABLE "public"."visits" IS 'جدول تتبع الزيارات مع IP والدولة والمصدر';

-- تحقق من الإنشاء
SELECT 
    'visits' as table_name,
    COUNT(*) as record_count,
    pg_size_pretty(pg_total_relation_size('"public"."visits"')) as table_size
FROM "public"."visits";

-- عرض بنية الجدول
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'visits'
ORDER BY ordinal_position;

-- =====================================================
-- بيانات تجريبية (اختياري)
-- =====================================================

-- إضافة بعض الزيارات التجريبية
INSERT INTO "public"."visits" (
    "ipAddress", 
    "country", 
    "city", 
    "targetPage", 
    "isGoogle",
    "utmSource",
    "timestamp"
) VALUES
    ('192.168.1.100', 'Saudi Arabia', 'Riyadh', '/sales1', true, 'google', NOW() - INTERVAL '1 hour'),
    ('192.168.1.101', 'Egypt', 'Cairo', '/sales2', false, 'facebook', NOW() - INTERVAL '2 hours'),
    ('192.168.1.102', 'United Arab Emirates', 'Dubai', '/sales3', true, 'google', NOW() - INTERVAL '3 hours'),
    ('192.168.1.103', 'Saudi Arabia', 'Jeddah', '/sales1', false, 'direct', NOW() - INTERVAL '4 hours'),
    ('192.168.1.104', 'Kuwait', 'Kuwait City', '/sales4', true, 'google', NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

-- التحقق من البيانات
SELECT 
    COUNT(*) as total_visits,
    COUNT(DISTINCT "ipAddress") as unique_visitors,
    COUNT(DISTINCT "country") as countries_count
FROM "public"."visits";

-- عرض آخر 10 زيارات
SELECT 
    id,
    "ipAddress",
    country,
    "targetPage",
    "isGoogle",
    timestamp
FROM "public"."visits"
ORDER BY timestamp DESC
LIMIT 10;

-- =====================================================
-- استعلامات مفيدة
-- =====================================================

-- 1. الزيارات حسب الدولة
SELECT 
    COALESCE(country, 'Unknown') as country,
    COUNT(*) as visits,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM "public"."visits"
GROUP BY country
ORDER BY visits DESC;

-- 2. الزيارات حسب الصفحة
SELECT 
    "targetPage",
    COUNT(*) as visits,
    COUNT(CASE WHEN "isGoogle" THEN 1 END) as google_visits,
    COUNT(CASE WHEN NOT "isGoogle" THEN 1 END) as other_visits
FROM "public"."visits"
GROUP BY "targetPage"
ORDER BY visits DESC;

-- 3. الزيارات حسب المصدر
SELECT 
    COALESCE("utmSource", CASE WHEN "isGoogle" THEN 'google' ELSE 'direct' END) as source,
    COUNT(*) as visits
FROM "public"."visits"
GROUP BY source
ORDER BY visits DESC;

-- 4. الزيارات اليوم
SELECT COUNT(*) as today_visits
FROM "public"."visits"
WHERE DATE("timestamp") = CURRENT_DATE;

-- 5. الزيارات هذا الأسبوع
SELECT COUNT(*) as week_visits
FROM "public"."visits"
WHERE "timestamp" >= DATE_TRUNC('week', CURRENT_DATE);

-- =====================================================
-- صلاحيات (إذا لزم الأمر)
-- =====================================================

-- إعطاء صلاحيات للمستخدم
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."visits" TO your_user;
-- GRANT USAGE, SELECT ON SEQUENCE visits_id_seq TO your_user;

-- =====================================================
-- تنظيف البيانات القديمة (صيانة)
-- =====================================================

-- حذف الزيارات الأقدم من 6 أشهر (تشغيل دوري)
-- DELETE FROM "public"."visits" 
-- WHERE "timestamp" < NOW() - INTERVAL '6 months';

-- =====================================================
-- ✅ تم بنجاح!
-- =====================================================
