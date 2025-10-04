-- Migration: تحديث جدول banners لدعم Base64
-- تاريخ: 4 أكتوبر 2025

-- 1. تغيير imageUrl إلى TEXT لدعم Base64 الكبيرة
ALTER TABLE banners 
ALTER COLUMN "imageUrl" TYPE TEXT;

-- 2. إضافة عمود imageData للمستقبل (اختياري)
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS "imageData" TEXT;

-- 3. التحقق من النتيجة
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'banners' 
AND column_name IN ('imageUrl', 'imageData');

-- ✅ يجب أن ترى:
-- imageUrl    | text | NULL (يعني unlimited)
-- imageData   | text | NULL (يعني unlimited)

