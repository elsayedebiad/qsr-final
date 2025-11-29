import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getGlobalSettings, updateGlobalSettings } from '../phone-numbers/save/route'

// GET - جلب الإعدادات
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: getGlobalSettings()
    })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ' },
      { status: 500 }
    )
  }
}

// POST - تحديث الإعدادات
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // يجب أن يكون أدمن
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'ليس لديك صلاحية' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { autoTimerEnabled } = body

    if (typeof autoTimerEnabled !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'قيمة غير صحيحة' },
        { status: 400 }
      )
    }

    updateGlobalSettings({ autoTimerEnabled })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الإعدادات',
      settings: getGlobalSettings()
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ' },
      { status: 500 }
    )
  }
}
