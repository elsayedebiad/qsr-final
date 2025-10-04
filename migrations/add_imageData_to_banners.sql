-- Migration: إضافة عمود imageData لجدول banners
-- تاريخ: 4 أكتوبر 2025

-- 1. إضافة عمود imageData (لحفظ الصورة كـ Base64)
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS "imageData" TEXT;

-- 2. جعل imageUrl اختياري (للتوافق مع النظام الجديد)
ALTER TABLE banners 
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- 3. التحقق من النتيجة
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'banners' 
AND column_name IN ('imageUrl', 'imageData');

-- ✅ يجب أن ترى:
-- imageUrl    | text or character varying | YES
-- imageData   | text                      | YES

