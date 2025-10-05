import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * API للتحقق من حالة النظام
 * يتحقق من حالة تفعيل النظام من جدول SystemSettings
 */
export async function GET(request: NextRequest) {
  try {
    // البحث عن إعداد حالة النظام
    const systemSetting = await db.systemSettings.findUnique({
      where: {
        key: 'system_active'
      }
    })
  
    // إذا لم يوجد إعداد، النظام مفعل افتراضياً
    if (!systemSetting) {
      return NextResponse.json({
        isActive: true,
        message: 'النظام مفعل'
      })
    }

    const isActive = systemSetting.value === 'true'

    // إرجاع حالة التفعيل
    return NextResponse.json({
      isActive,
      message: isActive ? 'النظام مفعل' : 'النظام معطل - يرجى دفع الرسوم'
    })

  } catch (error) {
    console.error('Error checking system status:', error)
    // في حالة الخطأ، السماح بالوصول لتجنب تعطيل النظام
    return NextResponse.json({
      isActive: true,
      message: 'خطأ في التحقق - السماح بالوصول'
    })
  }
}
