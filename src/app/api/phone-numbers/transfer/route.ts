/**
 * API endpoint لتحويل أرقام الهواتف من مستخدم لآخر
 * يسمح فقط للـ ADMIN بتحويل الأرقام
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAuthFromRequest } from '@/lib/middleware-auth'

export async function POST(request: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // التأكد من أن المستخدم هو ADMIN
    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'هذه العملية مخصصة للمدير العام فقط' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { phoneNumberIds, targetUserId, reason, deadlineHours, deadlineMinutes, deadlineSeconds } = body

    // التحقق من البيانات المطلوبة
    if (!phoneNumberIds || !Array.isArray(phoneNumberIds) || phoneNumberIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'يجب اختيار رقم واحد على الأقل' },
        { status: 400 }
      )
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: 'يجب اختيار المستخدم المستهدف' },
        { status: 400 }
      )
    }

    // التحقق من وجود المستخدم المستهدف
    const targetUser = await db.user.findUnique({
      where: { id: parseInt(targetUserId) },
      include: {
        assignedSalesPages: true
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'المستخدم المستهدف غير موجود' },
        { status: 404 }
      )
    }

    if (!targetUser.isActive) {
      return NextResponse.json(
        { success: false, message: 'المستخدم المستهدف معطل' },
        { status: 400 }
      )
    }

    // جلب الأرقام المراد تحويلها
    const phoneNumbers = await db.phoneNumber.findMany({
      where: {
        id: { in: phoneNumberIds.map((id: string) => parseInt(id)) }
      }
    })

    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'لم يتم العثور على الأرقام المحددة' },
        { status: 404 }
      )
    }

    // فحص الأرقام التي تم التواصل معها
    const contactedNumbers = phoneNumbers.filter(phone => phone.isContacted)
    if (contactedNumbers.length > 0) {
      const contactedPhonesList = contactedNumbers.map(phone => phone.phoneNumber).join(', ')
      return NextResponse.json(
        { 
          success: false, 
          message: `لا يمكن تحويل الأرقام التالية لأنه تم التواصل معها بالفعل: ${contactedPhonesList}` 
        },
        { status: 400 }
      )
    }

    // حساب وقت الانتهاء
    const hours = parseInt(deadlineHours) || 0
    const minutes = parseInt(deadlineMinutes) || 0
    const seconds = parseInt(deadlineSeconds) || 0
    
    const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000
    const deadlineAt = totalMilliseconds > 0 ? new Date(Date.now() + totalMilliseconds) : null

    // تحويل الأرقام واحداً تلو الآخر للحفاظ على originalSalesPageId الصحيح
    const updatePromises = phoneNumbers.map(async (phoneNumber) => {
      return db.phoneNumber.update({
        where: { id: phoneNumber.id },
        data: {
          isTransferred: true,
          // إذا كان محول بالفعل، نحتفظ بـ originalSalesPageId القديم
          // وإلا نحفظ salesPageId الحالي كـ original
          originalSalesPageId: phoneNumber.originalSalesPageId || phoneNumber.salesPageId,
          transferredToUserId: parseInt(targetUserId),
          transferredBy: authResult.user.id,
          transferredAt: new Date(),
          transferReason: reason || 'تأخير في التواصل',
          deadlineHours: hours > 0 ? hours : null,
          deadlineMinutes: minutes > 0 ? minutes : null,
          deadlineSeconds: seconds > 0 ? seconds : null,
          deadlineAt: deadlineAt,
          isExpired: false
        }
      })
    })

    const updateResults = await Promise.all(updatePromises)
    const updateResult = { count: updateResults.length }

    return NextResponse.json({
      success: true,
      message: `تم تحويل ${updateResult.count} رقم بنجاح إلى ${targetUser.name}`,
      data: {
        count: updateResult.count,
        targetUser: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email
        }
      }
    })

  } catch (error) {
    console.error('Error transferring phone numbers:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحويل الأرقام' },
      { status: 500 }
    )
  }
}

// إلغاء التحويل (إرجاع الرقم للمالك الأصلي)
export async function DELETE(request: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // التأكد من أن المستخدم هو ADMIN
    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'هذه العملية مخصصة للمدير العام فقط' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const phoneNumberId = searchParams.get('id')

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, message: 'معرف الرقم مطلوب' },
        { status: 400 }
      )
    }

    // إلغاء التحويل
    const updateResult = await db.phoneNumber.update({
      where: { id: parseInt(phoneNumberId) },
      data: {
        isTransferred: false,
        transferredToUserId: null,
        transferredBy: null,
        transferredAt: null,
        transferReason: null
        // نبقي originalSalesPageId للسجل
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء التحويل بنجاح',
      data: updateResult
    })

  } catch (error) {
    console.error('Error cancelling transfer:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إلغاء التحويل' },
      { status: 500 }
    )
  }
}
