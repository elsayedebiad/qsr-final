import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم إرسال ملف' },
        { status: 400 }
      )
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'الملف يجب أن يكون صورة' },
        { status: 400 }
      )
    }

    // تحويل الملف إلى buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // إنشاء مجلد uploads/images إذا لم يكن موجوداً
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // إنشاء اسم ملف فريد
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}_${randomString}.${extension}`
    
    // حفظ الملف
    const filePath = join(uploadsDir, filename)
    await writeFile(filePath, buffer)
    
    // إرجاع رابط الصورة
    const imageUrl = `/uploads/images/${filename}`
    
    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'تم رفع الصورة بنجاح'
    })

  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'فشل رفع الصورة' },
      { status: 500 }
    )
  }
}
