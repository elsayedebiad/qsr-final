import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const phoneNumberId = formData.get('phoneNumberId') as string
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'لم يتم إرسال ملف' },
        { status: 400 }
      )
    }

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, message: 'معرف الرقم مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'الملف يجب أن يكون صورة' },
        { status: 400 }
      )
    }

    // تحويل الملف إلى buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // إنشاء مجلد uploads/conversations إذا لم يكن موجوداً
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'conversations')
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
    const imageUrl = `/uploads/conversations/${filename}`

    // تحديث قاعدة البيانات
    await db.phoneNumber.update({
      where: { id: parseInt(phoneNumberId) },
      data: { conversationImage: imageUrl }
    })
    
    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'تم رفع صورة المحادثة بنجاح'
    })

  } catch (error) {
    console.error('Error uploading conversation image:', error)
    return NextResponse.json(
      { success: false, message: 'فشل رفع الصورة' },
      { status: 500 }
    )
  }
}
