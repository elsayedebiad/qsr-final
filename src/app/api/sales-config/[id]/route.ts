import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// GET - جلب إعدادات صفحة مبيعات محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const salesId = resolvedParams.id

    // التحقق من أن salesId صحيح
    if (!['sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'gallery'].includes(salesId)) {
      return NextResponse.json(
        { error: 'صفحة المبيعات غير موجودة' },
        { status: 404 }
      )
    }

    // البحث عن الإعدادات في قاعدة البيانات
    let config = await db.salesConfig.findUnique({
      where: { salesPageId: salesId }
    })

    // إذا لم توجد، أنشئها
    if (!config) {
      config = await db.salesConfig.create({
        data: {
          salesPageId: salesId,
          whatsappNumber: ''
        }
      })
    }

    return NextResponse.json({ whatsappNumber: config.whatsappNumber })
  } catch (error) {
    console.error('Error fetching sales config:', error)
    return NextResponse.json(
      { error: 'فشل في جلب إعدادات المبيعات' },
      { status: 500 }
    )
  }
}

// PUT - تحديث إعدادات صفحة مبيعات محددة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const salesId = resolvedParams.id
    const body = await request.json()
    const { whatsappNumber } = body

    // التحقق من أن salesId صحيح
    if (!['sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'gallery'].includes(salesId)) {
      return NextResponse.json(
        { error: 'صفحة المبيعات غير موجودة' },
        { status: 404 }
      )
    }

    if (typeof whatsappNumber !== 'string') {
      return NextResponse.json(
        { error: 'رقم الواتساب يجب أن يكون نص' },
        { status: 400 }
      )
    }

    // تحديث أو إنشاء الإعدادات في قاعدة البيانات
    const config = await db.salesConfig.upsert({
      where: { salesPageId: salesId },
      update: { whatsappNumber },
      create: {
        salesPageId: salesId,
        whatsappNumber
      }
    })

    return NextResponse.json({
      message: 'تم تحديث رقم الواتساب بنجاح',
      salesId,
      whatsappNumber: config.whatsappNumber
    })
  } catch (error) {
    console.error('Error updating sales config:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث إعدادات المبيعات' },
      { status: 500 }
    )
  }
}
