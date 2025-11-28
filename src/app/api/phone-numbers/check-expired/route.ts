/**
 * API endpoint للتحقق من الأرقام المنتهية تلقائياً
 * يتم استدعاؤه بشكل دوري للتحقق من انتهاء المدة الزمنية
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // العثور على جميع الأرقام المحولة وغير المنتهية وعندها deadline
    const now = new Date()

    const expiredNumbers = await db.phoneNumber.findMany({
      where: {
        isTransferred: true,
        isExpired: false,
        deadlineAt: {
          lte: now // انتهى الوقت المحدد
        }
      }
    })

    if (expiredNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'لا توجد أرقام منتهية',
        count: 0
      })
    }

    // تحديث الأرقام المنتهية
    const updateResult = await db.phoneNumber.updateMany({
      where: {
        id: {
          in: expiredNumbers.map(n => n.id)
        }
      },
      data: {
        isExpired: true,
        expiredAt: now
      }
    })

    console.log(`✅ تم تحديث ${updateResult.count} رقم منتهي`)

    return NextResponse.json({
      success: true,
      message: `تم تحديث ${updateResult.count} رقم منتهي`,
      count: updateResult.count,
      expiredNumbers: expiredNumbers.map(n => ({
        id: n.id,
        phoneNumber: n.phoneNumber,
        transferredToUserId: n.transferredToUserId,
        deadlineAt: n.deadlineAt
      }))
    })

  } catch (error) {
    console.error('Error checking expired numbers:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء التحقق من الأرقام المنتهية' },
      { status: 500 }
    )
  }
}

// API لإعادة تفعيل رقم منتهي (للأدمن فقط)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumberId } = body

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, message: 'معرف الرقم مطلوب' },
        { status: 400 }
      )
    }

    // جلب بيانات الرقم أولاً للحصول على originalSalesPageId
    const phoneNumber = await db.phoneNumber.findUnique({
      where: { id: parseInt(phoneNumberId) },
      select: {
        originalSalesPageId: true,
        salesPageId: true
      }
    })

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'الرقم غير موجود' },
        { status: 404 }
      )
    }

    // إعادة تفعيل الرقم وإلغاء التحويل
    const updatedNumber = await db.phoneNumber.update({
      where: { id: parseInt(phoneNumberId) },
      data: {
        // إلغاء حالة الانتهاء
        isExpired: false,
        expiredAt: null,

        // إلغاء التحويل - الرقم يعود للشخص الأصلي
        isTransferred: false,
        transferredToUserId: null,
        transferredBy: null,
        transferredAt: null,
        transferReason: null,

        // إعادة الرقم للصفحة الأصلية
        salesPageId: phoneNumber.originalSalesPageId || phoneNumber.salesPageId,
        originalSalesPageId: null,

        // حذف معلومات المؤقت
        deadlineAt: null,
        deadlineHours: null,
        deadlineMinutes: null,
        deadlineSeconds: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تفعيل الرقم بنجاح',
      data: updatedNumber
    })

  } catch (error) {
    console.error('Error reactivating number:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إعادة التفعيل' },
      { status: 500 }
    )
  }
}
