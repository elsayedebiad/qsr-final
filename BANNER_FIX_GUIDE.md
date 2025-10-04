# 🎯 حل مشكلة اختفاء البنرات على Vercel

## 🚨 المشكلة

البنرات تُحفظ في file system (`public/banners/`) وتختفي بعد كل deployment على Vercel!

```
src/app/api/banners/route.ts: line 62-73
❌ يحفظ الملفات في: public/banners/
❌ الملفات تختفي بعد deployment
```

---

## ✅ الحلول المقترحة

### الحل 1: استخدام Vercel Blob Storage (موصى به ⭐)

#### الخطوة 1: التثبيت
```bash
npm install @vercel/blob
```

#### الخطوة 2: الحصول على Token
1. اذهب إلى: https://vercel.com/dashboard/stores
2. أنشئ Blob Store جديد
3. انسخ الـ Token

#### الخطوة 3: أضف في `.env.local`
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

#### الخطوة 4: تحديث `src/app/api/banners/route.ts`

**قبل:**
```typescript
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  // ...
  const bannersDir = join(process.cwd(), 'public', 'banners')
  if (!existsSync(bannersDir)) {
    await mkdir(bannersDir, { recursive: true })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const fileName = `${salesPageId}_${deviceType.toLowerCase()}_${Date.now()}_${file.name}`
  const filePath = join(bannersDir, fileName)
  await writeFile(filePath, buffer)

  const banner = await db.banner.create({
    data: {
      salesPageId,
      deviceType: deviceType as 'MOBILE' | 'DESKTOP',
      imageUrl: `/banners/${fileName}`,
      order,
      isActive: true
    }
  })
}
```

**بعد:**
```typescript
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  // ...
  const fileName = `${salesPageId}_${deviceType.toLowerCase()}_${Date.now()}_${file.name}`
  
  // رفع إلى Vercel Blob
  const blob = await put(`banners/${fileName}`, file, {
    access: 'public',
  })

  // حفظ URL الكامل في قاعدة البيانات
  const banner = await db.banner.create({
    data: {
      salesPageId,
      deviceType: deviceType as 'MOBILE' | 'DESKTOP',
      imageUrl: blob.url, // ✅ استخدم URL من Vercel Blob
      order,
      isActive: true
    }
  })

  return NextResponse.json(banner)
}
```

#### الخطوة 5: تحديث DELETE endpoint
```typescript
import { del } from '@vercel/blob'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Banner ID is required' },
        { status: 400 }
      )
    }

    // جلب البنر من قاعدة البيانات
    const banner = await db.banner.findUnique({
      where: { id: parseInt(id) }
    })

    if (banner && banner.imageUrl) {
      // حذف الصورة من Vercel Blob
      try {
        await del(banner.imageUrl)
      } catch (error) {
        console.error('Error deleting blob:', error)
      }
    }

    // حذف من قاعدة البيانات
    await db.banner.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}
```

---

### الحل 2: استخدام Cloudinary

#### الخطوة 1: التثبيت
```bash
npm install cloudinary
```

#### الخطوة 2: إعداد Environment Variables
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### الخطوة 3: تحديث API Route
```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request: NextRequest) {
  // ...
  
  // تحويل File إلى Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // رفع إلى Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'banners',
        public_id: `${salesPageId}_${deviceType.toLowerCase()}_${Date.now()}`,
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })

  const banner = await db.banner.create({
    data: {
      salesPageId,
      deviceType: deviceType as 'MOBILE' | 'DESKTOP',
      imageUrl: uploadResult.secure_url, // ✅ URL من Cloudinary
      order,
      isActive: true
    }
  })

  return NextResponse.json(banner)
}
```

---

### الحل 3: استخدام External CDN أو S3

يمكنك استخدام:
- AWS S3 + CloudFront
- DigitalOcean Spaces
- Backblaze B2
- Bunny CDN

---

## 🎬 الخطوات السريعة (Vercel Blob)

### 1. ثبت المكتبة
```bash
npm install @vercel/blob
```

### 2. احصل على Token من Vercel Dashboard

### 3. أضف Token في `.env.local`
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

### 4. استبدل الكود في `src/app/api/banners/route.ts`

```typescript
import { put, del } from '@vercel/blob'

// POST - رفع بنر جديد
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const salesPageId = formData.get('salesPageId') as string
    const deviceType = formData.get('deviceType') as string
    const order = parseInt(formData.get('order') as string || '0')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!salesPageId || !deviceType) {
      return NextResponse.json(
        { error: 'salesPageId and deviceType are required' },
        { status: 400 }
      )
    }

    // رفع إلى Vercel Blob
    const fileName = `${salesPageId}_${deviceType.toLowerCase()}_${Date.now()}_${file.name}`
    const blob = await put(`banners/${fileName}`, file, {
      access: 'public',
    })

    // حفظ في قاعدة البيانات
    const banner = await db.banner.create({
      data: {
        salesPageId,
        deviceType: deviceType as 'MOBILE' | 'DESKTOP',
        imageUrl: blob.url,
        order,
        isActive: true
      }
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}

// DELETE - حذف بنر
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Banner ID is required' },
        { status: 400 }
      )
    }

    // جلب البنر
    const banner = await db.banner.findUnique({
      where: { id: parseInt(id) }
    })

    // حذف الصورة من Blob
    if (banner && banner.imageUrl) {
      try {
        await del(banner.imageUrl)
      } catch (blobError) {
        console.error('Error deleting from blob:', blobError)
      }
    }

    // حذف من قاعدة البيانات
    await db.banner.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}
```

### 5. تحديث Component (لا حاجة للتغيير!)

`BannerCarousel.tsx` سيعمل تلقائياً لأن الـ URLs الآن كاملة من Vercel Blob!

---

## 📊 المزايا والعيوب

### Vercel Blob Storage
✅ **المزايا:**
- سهل جداً
- متكامل مع Vercel
- CDN عالمي سريع
- مجاني: 500GB bandwidth/شهر

⚠️ **العيوب:**
- مرتبط بـ Vercel فقط

### Cloudinary
✅ **المزايا:**
- Image optimization تلقائي
- Image transformations
- مستقل عن الاستضافة
- مجاني: 25GB storage

⚠️ **العيوب:**
- يحتاج حساب منفصل

---

## 🧪 الاختبار

1. ارفع بنر جديد من Dashboard
2. تحقق من ظهوره في صفحة Sales
3. امسح البنر وتأكد من اختفائه
4. جرب deployment جديد وتأكد من بقاء البنرات

---

## ⚠️ ملاحظات مهمة

1. **البنرات القديمة:** البنرات المحفوظة حالياً في `public/banners/` ستختفي بعد deployment التالي
2. **نقل البنرات:** ارفع البنرات القديمة مرة أخرى بعد تطبيق الحل
3. **Database:** تأكد من أن `imageUrl` في قاعدة البيانات يحتوي على URL كامل
4. **Performance:** Vercel Blob أسرع من file system على Vercel

---

## 🔄 Migration Plan

### الخطوة 1: تطبيق الحل
- ثبت `@vercel/blob`
- عدّل `src/app/api/banners/route.ts`
- Deploy

### الخطوة 2: نقل البنرات
- احتفظ بنسخة من البنرات القديمة
- ارفعهم مرة أخرى من Dashboard

### الخطوة 3: تنظيف
- احذف مجلد `public/banners/` من الكود

---

تم التحديث: 4 أكتوبر 2025

