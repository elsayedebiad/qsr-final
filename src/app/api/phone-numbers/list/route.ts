import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // ADMIN له وصول كامل دائماً، غيره يحتاج صلاحية SALES
    if (user.role !== 'ADMIN') {
      if (user.role !== 'USER' && user.role !== 'SALES') {
        return NextResponse.json(
          { success: false, message: 'ليس لديك صلاحية الوصول لهذه البيانات' },
          { status: 403 }
        )
      }
    }

    // جلب معاملات البحث
    const { searchParams } = new URL(request.url)
    const salesPageId = searchParams.get('salesPageId')
    const isArchived = searchParams.get('isArchived') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // بناء الفلتر
    const where: any = {
      isArchived
    }

    // فلترة حسب الأرقام المحولة (المنتهية)
    // الأدمن: 
    //   - عند اختيار "جميع الأرقام" (ALL): يرى كل شيء (نشطة + محولة)
    //   - عند الضغط على زر "عرض المحولة": يرى المحولة فقط
    // المستخدم العادي: يراها دائماً (لكن محجوبة مع blur)

    if (user.role === 'ADMIN' && searchParams.get('showExpired') === 'true') {
      where.isExpired = true // الأدمن اختار زر "عرض المحولة" - يعرض المحولة فقط
    }
    // لا نضيف فلتر isExpired للأدمن عند اختيار "جميع الأرقام" (يرى الكل)
    // المستخدمون العاديون: لا نضيف فلتر isExpired (يرون الكل)

    // فلترة حسب حالة التواصل
    const contactFilter = searchParams.get('contactFilter')
    if (contactFilter === 'contacted') {
      where.isContacted = true
    } else if (contactFilter === 'not-contacted') {
      where.isContacted = false
    }
    // إذا كانت 'all' لا نضيف فلتر

    // فلترة حسب صلاحيات المستخدم
    if (user.role !== 'ADMIN' && user.salesPages && user.salesPages.length > 0) {
      // المستخدم العادي يرى:
      // 1. أرقام صفحاته
      // 2. الأرقام المحولة إليه
      where.OR = [
        // الشرط 1: أرقام صفحاته
        {
          salesPageId: {
            in: user.salesPages
          }
        },
        // الشرط 2: الأرقام المحولة إليه
        {
          isTransferred: true,
          transferredToUserId: user.id
        }
      ]
    } else if (salesPageId && salesPageId !== 'ALL') {
      // المدير يمكنه فلترة بصفحة محددة
      // يبحث في salesPageId الحالي أو originalSalesPageId (للأرقام المحولة)
      where.OR = [
        { salesPageId: salesPageId },
        { originalSalesPageId: salesPageId }
      ]
    }

    // جلب العدد الكلي
    const totalCount = await db.phoneNumber.count({ where })

    // جلب البيانات
    const phoneNumbers = await db.phoneNumber.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      include: {
        transferredToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // إخفاء الأرقام المحجوبة من المصدر (Backend) لحماية البيانات
    const processedPhoneNumbers = phoneNumbers.map(number => {
      // الأدمن يرى كل شيء
      if (user.role === 'ADMIN') {
        return number
      }

      // إذا تم التواصل → غير محجوب
      if (number.isContacted) {
        return number
      }

      // إذا كان محولاً
      if (number.isTransferred) {
        const isCurrentRecipient = number.transferredToUserId === user.id
        const isOriginalOwner = user.salesPages && user.salesPages.includes(number.originalSalesPageId || number.salesPageId)
        
        // إذا انتهى الوقت
        if (number.isExpired) {
          // المحول إليه الحالي → يرى الرقم واضحاً
          if (isCurrentRecipient) {
            return number
          }
          // أي شخص آخر (المالك الأصلي أو المحول السابق) → مخفي
          return {
            ...number,
            phoneNumber: '****** (تم سحب الرقم)',
            isBlocked: true
          }
        }

        // إذا لم ينتهي الوقت بعد
        if (number.deadlineAt && !number.isExpired) {
          // المحول إليه الحالي → يرى واضحاً
          if (isCurrentRecipient) {
            return number
          }
          // المالك الأصلي → يرى واضحاً (لديه فرصة لاستعادته عند انتهاء الوقت)
          if (isOriginalOwner) {
            return number
          }
          // أي شخص آخر (محول سابق) → مخفي
          return {
            ...number,
            phoneNumber: '****** (محول لشخص آخر)',
            isBlocked: true
          }
        }

        // تحويل بدون مؤقت (فوري)
        if (!number.deadlineAt) {
          // المحول إليه → يرى واضحاً
          if (isCurrentRecipient) {
            return number
          }
          // أي شخص آخر → مخفي
          return {
            ...number,
            phoneNumber: '****** (محول)',
            isBlocked: true
          }
        }
      }

      // غير محجوب
      return number
    })

    // إحصائيات إضافية
    const statsWhere: any = {
      isArchived: false,
      // استثناء الأرقام المحولة (المنتهية) لتجنب الحساب المزدوج
      NOT: {
        isExpired: true
      }
    }

    // فلترة الإحصائيات حسب صلاحيات المستخدم
    if (user.role !== 'ADMIN' && user.salesPages && user.salesPages.length > 0) {
      statsWhere.salesPageId = {
        in: user.salesPages
      }
    }

    const stats = await db.phoneNumber.groupBy({
      by: ['salesPageId'],
      where: statsWhere,
      _count: {
        id: true
      }
    })

    const statsBySalesPage = stats.reduce((acc: any, stat) => {
      acc[stat.salesPageId] = stat._count.id
      return acc
    }, {})

    // حساب عدد الأرقام المحولة (للأدمن فقط)
    let transferredCount = 0
    if (user.role === 'ADMIN') {
      transferredCount = await db.phoneNumber.count({
        where: {
          isArchived: false,
          isExpired: true,
          isTransferred: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: processedPhoneNumbers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: statsBySalesPage,
      transferredCount: transferredCount
    })

  } catch (error) {
    console.error('❌ Error fetching phone numbers:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    )
  }
}

// تحديث حالة الأرشفة
export async function PATCH(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // ADMIN له صلاحية كاملة، غيره يحتاج صلاحية SALES
    if (user.role !== 'ADMIN') {
      if (user.role !== 'USER' && user.role !== 'SALES') {
        return NextResponse.json(
          { success: false, message: 'ليس لديك صلاحية تعديل هذه البيانات' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { id, isArchived, isContacted } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'معرف الرقم مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من صلاحية المستخدم لتعديل هذا الرقم
    const phoneNumber = await db.phoneNumber.findUnique({
      where: { id },
      select: {
        salesPageId: true,
        isTransferred: true,
        transferredToUserId: true
      }
    })

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'الرقم غير موجود' },
        { status: 404 }
      )
    }

    // ADMIN له صلاحية كاملة على كل الأرقام
    // المستخدم العادي يمكنه تعديل:
    // 1. أرقام صفحاته
    // 2. أرقام محولة إليه
    if (user.role !== 'ADMIN') {
      const hasAccessToPage = user.salesPages && user.salesPages.includes(phoneNumber.salesPageId)
      const isTransferredToUser = phoneNumber.isTransferred && phoneNumber.transferredToUserId === user.id

      if (!hasAccessToPage && !isTransferredToUser) {
        return NextResponse.json(
          { success: false, message: 'غير مسموح بتعديل هذا الرقم' },
          { status: 403 }
        )
      }
    }

    // بناء بيانات التحديث
    const updateData: any = {}
    if (typeof isArchived !== 'undefined') {
      updateData.isArchived = isArchived
    }
    if (typeof isContacted !== 'undefined') {
      updateData.isContacted = isContacted
      // إذا تم التواصل، نضيف التاريخ
      if (isContacted) {
        updateData.contactedAt = new Date()

        // حذف المؤقت فقط - الرقم يبقى عند من تواصل
        // لا نلغي التحويل - من يتواصل أولاً يحتفظ بالرقم
        updateData.deadlineAt = null
        updateData.deadlineHours = null
        updateData.deadlineMinutes = null
        updateData.deadlineSeconds = null
        updateData.isExpired = false
        updateData.expiredAt = null
      }
    }

    const updated = await db.phoneNumber.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: isArchived !== undefined
        ? (isArchived ? 'تم الأرشفة بنجاح' : 'تم الاستعادة بنجاح')
        : 'تم التحديث بنجاح',
      data: updated
    })

  } catch (error) {
    console.error('❌ Error updating phone number:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء التحديث' },
      { status: 500 }
    )
  }
}

// حذف رقم هاتف
export async function DELETE(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // فقط ADMIN يمكنه الحذف (ليس SUB_ADMIN أو CUSTOMER_SERVICE)
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'غير مسموح بالحذف' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'معرف الرقم مطلوب' },
        { status: 400 }
      )
    }

    await db.phoneNumber.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: 'تم الحذف بنجاح'
    })

  } catch (error) {
    console.error('❌ Error deleting phone number:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    )
  }
}
