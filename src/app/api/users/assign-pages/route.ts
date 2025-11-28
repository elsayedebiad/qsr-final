/**
 * API endpoint لربط المستخدمين بصفحات المبيعات
 * ADMIN فقط
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAuthFromRequest } from '@/lib/middleware-auth'

// الحصول على صفحات المستخدم
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'هذه العملية مخصصة للمدير العام فقط' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // جلب صفحات المستخدم
    const userPages = await db.userSalesPage.findMany({
      where: { userId: parseInt(userId) }
    })

    return NextResponse.json({
      success: true,
      salesPages: userPages.map(p => p.salesPageId)
    })

  } catch (error) {
    console.error('Error fetching user pages:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    )
  }
}

// تحديث صفحات المستخدم
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'هذه العملية مخصصة للمدير العام فقط' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, salesPageIds } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    if (!Array.isArray(salesPageIds)) {
      return NextResponse.json(
        { success: false, message: 'قائمة الصفحات يجب أن تكون مصفوفة' },
        { status: 400 }
      )
    }

    // التحقق من وجود المستخدم
    const user = await db.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // حذف جميع الصفحات القديمة للمستخدم
    await db.userSalesPage.deleteMany({
      where: { userId: parseInt(userId) }
    })

    // إضافة الصفحات الجديدة
    if (salesPageIds.length > 0) {
      await db.userSalesPage.createMany({
        data: salesPageIds.map((pageId: string) => ({
          userId: parseInt(userId),
          salesPageId: pageId
        }))
      })
    }

    return NextResponse.json({
      success: true,
      message: `تم تحديث صفحات ${user.name} بنجاح`,
      data: {
        userId: user.id,
        userName: user.name,
        salesPages: salesPageIds
      }
    })

  } catch (error) {
    console.error('Error assigning pages:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث الصفحات' },
      { status: 500 }
    )
  }
}
