import { NextRequest, NextResponse } from 'next/server'
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

    // التحقق من حجم الملف (أقل من 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' },
        { status: 400 }
      )
    }

    // تحويل الملف إلى base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type
    
    // إنشاء data URL للصورة
    const imageUrl = `data:${mimeType};base64,${base64}`

    // تحديث قاعدة البيانات بالصورة base64
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
