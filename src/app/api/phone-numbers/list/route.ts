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

    // فلترة حسب صلاحيات المستخدم
    if (user.role !== 'ADMIN' && user.salesPages && user.salesPages.length > 0) {
      // المستخدم العادي يرى فقط صفحاته
      where.salesPageId = {
        in: user.salesPages
      }
    } else if (salesPageId && salesPageId !== 'ALL') {
      // المدير يمكنه فلترة بصفحة محددة
      where.salesPageId = salesPageId
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
      take: limit
    })

    // إحصائيات إضافية
    const statsWhere: any = { isArchived: false }
    
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

    return NextResponse.json({
      success: true,
      data: phoneNumbers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: statsBySalesPage
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
      select: { salesPageId: true }
    })

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'الرقم غير موجود' },
        { status: 404 }
      )
    }

    // ADMIN له صلاحية كاملة على كل الأرقام
    // المستخدم العادي يمكنه فقط تعديل أرقام صفحاته
    if (user.role !== 'ADMIN') {
      if (user.salesPages && !user.salesPages.includes(phoneNumber.salesPageId)) {
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
