-- ✅ سكريبت للتحقق من أن عمود imageUrl تم تحديثه

-- 1. عرض معلومات العمود الحالي
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'banners' 
  AND column_name = 'imageUrl';

-- يجب أن ترى:
-- column_name | data_type | character_maximum_length | is_nullable
-- imageUrl    | text      | NULL (unlimited)         | NO

-- 2. إذا لم يكن text، شغّل هذا:
-- ALTER TABLE banners ALTER COLUMN "imageUrl" TYPE TEXT;

-- 3. تحقق من البنرات الموجودة
SELECT 
    id,
    "salesPageId",
    "deviceType",
    LENGTH("imageUrl") as image_size_bytes,
    (LENGTH("imageUrl") / 1024)::numeric(10,2) as image_size_kb,
    "isActive",
    "createdAt"
FROM banners
ORDER BY "createdAt" DESC
LIMIT 5;

