# مثال: استخدام Vercel Blob Storage بدلاً من File System

## 1. التثبيت

```bash
npm install @vercel/blob
```

## 2. إعداد Environment Variables

في `.env.local`:
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

احصل على Token من: https://vercel.com/dashboard/stores

## 3. تحديث API Routes

### قبل (File System) ❌

```typescript
// src/app/api/upload/image/route.ts
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('image') as File
  
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(join(uploadsDir, filename), buffer)
  
  return NextResponse.json({
    imageUrl: `/uploads/images/${filename}`
  })
}
```

### بعد (Vercel Blob) ✅

```typescript
// src/app/api/upload/image/route.ts
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('image') as File
  
  // رفع مباشرة إلى Vercel Blob
  const blob = await put(`cv-images/${Date.now()}_${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
  })
  
  return NextResponse.json({
    imageUrl: blob.url,
    message: 'Image uploaded successfully'
  })
}
```

## 4. قراءة الصور

### لا حاجة لـ API Route! ✅

الصور الآن لها URLs مباشرة:

```typescript
// في الـ Frontend
<img src={imageUrl} alt="CV Image" />

// imageUrl = https://xxxxx.public.blob.vercel-storage.com/cv-images/image.jpg
```

## 5. حذف الصور

```typescript
// src/app/api/upload/image/delete/route.ts
import { del } from '@vercel/blob'

export async function DELETE(request: NextRequest) {
  const { url } = await request.json()
  
  await del(url)
  
  return NextResponse.json({ message: 'Image deleted' })
}
```

## 6. عرض كل الصور

```typescript
// src/app/api/upload/image/list/route.ts
import { list } from '@vercel/blob'

export async function GET() {
  const { blobs } = await list({
    prefix: 'cv-images/',
  })
  
  return NextResponse.json({ images: blobs })
}
```

## 7. تحديث Prisma Schema

```prisma
model CV {
  id           Int      @id @default(autoincrement())
  fullName     String
  profileImage String?  // سيحتوي على URL كامل من Vercel Blob
  // ... باقي الحقول
}
```

## 8. مثال كامل: Upload Component

```typescript
'use client'

import { useState } from 'react'

export default function ImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()
      setImageUrl(data.imageUrl)
      console.log('✅ تم رفع الصورة:', data.imageUrl)
    } catch (error) {
      console.error('❌ خطأ في رفع الصورة:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload}
        disabled={uploading}
      />
      
      {uploading && <p>جاري الرفع...</p>}
      
      {imageUrl && (
        <div>
          <p>✅ تم الرفع بنجاح!</p>
          <img src={imageUrl} alt="Uploaded" width={200} />
        </div>
      )}
    </div>
  )
}
```

## 9. المزايا ✅

- ✅ لا حاجة لـ file system
- ✅ الصور دائمة (لا تختفي بعد deployment)
- ✅ CDN عالمي (سريع جداً)
- ✅ URLs آمنة ومستقرة
- ✅ Automatic compression
- ✅ مجاني: 500GB bandwidth شهرياً على Hobby plan

## 10. التكلفة 💰

**Hobby Plan (مجاني):**
- 500 GB bandwidth / شهر
- 1000 writes / شهر
- 1000 reads / شهر
- 10 GB storage

**Pro Plan ($20/شهر):**
- 5 TB bandwidth / شهر
- غير محدود writes/reads
- 100 GB storage

## 11. الخطوات التالية

1. ثبت المكتبة: `npm install @vercel/blob`
2. احصل على Token من Vercel Dashboard
3. أضف Token إلى `.env.local`
4. حدث API routes
5. احذف `/api/uploads/[...path]/route.ts` (لن تحتاجه)
6. test!

## 12. Resources

- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [Pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing)
- [API Reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)

