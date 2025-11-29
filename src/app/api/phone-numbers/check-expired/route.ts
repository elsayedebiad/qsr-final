/**
 * API endpoint للتحقق من الأرقام المنتهية تلقائياً
 * يتم استدعاؤه بشكل دوري للتحقق من انتهاء المدة الزمنية
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    // 1. العثور على الأرقام المحولة التي انتهى وقتها
    const expiredTransferredNumbers = await db.phoneNumber.findMany({
      where: {
        isTransferred: true,
        isExpired: false,
        deadlineAt: {
          lte: now
        }
      }
    })

    // 2. العثور على الأرقام غير المحولة (أرقام جديدة) التي انتهى وقتها ولم يتم التواصل معها
    const expiredNewNumbers = await db.phoneNumber.findMany({
      where: {
        isTransferred: false,
        isExpired: false,
        isContacted: false,
        deadlineAt: {
          lte: now
        }
      }
    })

    const totalExpired = expiredTransferredNumbers.length + expiredNewNumbers.length

    if (totalExpired === 0) {
      return NextResponse.json({
        success: true,
        message: 'لا توجد أرقام منتهية',
        count: 0
      })
    }

    // تحديث الأرقام المحولة المنتهية
    if (expiredTransferredNumbers.length > 0) {
      await db.phoneNumber.updateMany({
        where: {
          id: {
            in: expiredTransferredNumbers.map(n => n.id)
          }
        },
        data: {
          isExpired: true,
          expiredAt: now
        }
      })
    }

    // سحب الأرقام الجديدة المنتهية (إعادتها للأدمن)
    if (expiredNewNumbers.length > 0) {
      await db.phoneNumber.updateMany({
        where: {
          id: {
            in: expiredNewNumbers.map(n => n.id)
          }
        },
        data: {
          isExpired: true,
          expiredAt: now,
          // سحب الرقم - الأدمن فقط يراه الآن
          isArchived: false // التأكد من عدم أرشفته
        }
      })
    }

    console.log(`✅ تم تحديث ${totalExpired} رقم منتهي (${expiredTransferredNumbers.length} محول، ${expiredNewNumbers.length} جديد)`)

    return NextResponse.json({
      success: true,
      message: `تم تحديث ${totalExpired} رقم منتهي`,
      count: totalExpired,
      expiredTransferred: expiredTransferredNumbers.length,
      expiredNew: expiredNewNumbers.length
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
