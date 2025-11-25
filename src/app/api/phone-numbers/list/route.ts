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

    if (salesPageId && salesPageId !== 'ALL') {
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
    const stats = await db.phoneNumber.groupBy({
      by: ['salesPageId'],
      where: { isArchived: false },
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

    const body = await request.json()
    const { id, isArchived } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'معرف الرقم مطلوب' },
        { status: 400 }
      )
    }

    const updated = await db.phoneNumber.update({
      where: { id },
      data: { isArchived }
    })

    return NextResponse.json({
      success: true,
      message: isArchived ? 'تم الأرشفة بنجاح' : 'تم الاستعادة بنجاح',
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
