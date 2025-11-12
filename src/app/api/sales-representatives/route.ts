import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - جلب جميع ممثلي المبيعات
export async function GET() {
  try {
    const salesReps = await prisma.salesRepresentative.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(salesReps)
  } catch (error) {
    console.error('❌ خطأ في جلب ممثلي المبيعات:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب ممثلي المبيعات' },
      { status: 500 }
    )
  }
}

// POST - إضافة ممثل مبيعات جديد
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'اسم ممثل المبيعات مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من عدم تكرار الاسم
    const existing = await prisma.salesRepresentative.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'هذا الاسم موجود بالفعل' },
        { status: 400 }
      )
    }

    const salesRep = await prisma.salesRepresentative.create({
      data: {
        name: name.trim()
      }
    })

    return NextResponse.json(salesRep, { status: 201 })
  } catch (error) {
    console.error('❌ خطأ في إضافة ممثل المبيعات:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة ممثل المبيعات' },
      { status: 500 }
    )
  }
}

// DELETE - حذف ممثل مبيعات
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'معرف ممثل المبيعات مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من وجود ممثل المبيعات
    const existing = await prisma.salesRepresentative.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'ممثل المبيعات غير موجود' },
        { status: 404 }
      )
    }

    // تعطيل بدلاً من الحذف (soft delete)
    await prisma.salesRepresentative.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'تم حذف ممثل المبيعات بنجاح' })
  } catch (error) {
    console.error('❌ خطأ في حذف ممثل المبيعات:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف ممثل المبيعات' },
      { status: 500 }
    )
  }
}

