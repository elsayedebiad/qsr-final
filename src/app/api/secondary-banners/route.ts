import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import ActivityTracker from '@/lib/activity-tracker'

const prisma = new PrismaClient()

// GET - جلب البنرات الإضافية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const salesPageId = searchParams.get('salesPageId') || 'sales1'

    console.log('🔍 جلب البنرات الإضافية لصفحة:', salesPageId)

    const banners = await prisma.banner.findMany({
      where: {
        salesPageId: salesPageId,
        bannerType: 'SECONDARY'
      },
      orderBy: {
        order: 'asc'
      }
    })

    console.log(`✅ تم جلب ${banners.length} بنر إضافي`)
    
    return NextResponse.json(banners)

  } catch (error) {
    console.error('❌ خطأ في جلب البنرات الإضافية:', error)
    return NextResponse.json({ 
      error: 'فشل في جلب البنرات الإضافية',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST - إضافة بنر إضافي جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salesPageId, imageUrl, deviceType, order } = body

    console.log('🔧 إضافة بنر إضافي جديد:', { salesPageId, deviceType })

    if (!salesPageId || !imageUrl) {
      return NextResponse.json(
        { error: 'معرف الصفحة ورابط الصورة مطلوبان' },
        { status: 400 }
      )
    }

    const banner = await prisma.banner.create({
      data: {
        salesPageId: salesPageId,
        imageUrl: imageUrl,
        deviceType: deviceType || 'DESKTOP',
        bannerType: 'SECONDARY',
        order: order || 0,
        isActive: true
      }
    })

    console.log(`✅ تم إنشاء البنر الإضافي بنجاح: ${banner.id}`)

    // تسجيل النشاط
    try {
      await ActivityTracker.bannerCreated(
        `${salesPageId} - ${deviceType}`,
        banner.id.toString(),
        'ثانوي'
      )
    } catch (activityError) {
      console.error('خطأ في تسجيل النشاط:', activityError)
    }

    return NextResponse.json({
      message: 'تم إضافة البنر الإضافي بنجاح',
      banner: banner
    }, { status: 201 })

  } catch (error) {
    console.error('❌ خطأ في إضافة البنر الإضافي:', error)
    return NextResponse.json(
      { 
        error: 'فشل في إضافة البنر الإضافي',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - تحديث بنر إضافي
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, imageUrl, deviceType, order, isActive } = body

    console.log('🔧 تحديث البنر الإضافي:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'معرف البنر مطلوب' },
        { status: 400 }
      )
    }

    const banner = await prisma.banner.update({
      where: { id: Number(id) },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(deviceType && { deviceType }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive })
      }
    })

    console.log(`✅ تم تحديث البنر الإضافي بنجاح: ${banner.id}`)

    return NextResponse.json({
      message: 'تم تحديث البنر الإضافي بنجاح',
      banner: banner
    })

  } catch (error) {
    console.error('❌ خطأ في تحديث البنر الإضافي:', error)
    return NextResponse.json(
      { 
        error: 'فشل في تحديث البنر الإضافي',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - حذف بنر إضافي
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    console.log('🗑️ حذف البنر الإضافي:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'معرف البنر مطلوب' },
        { status: 400 }
      )
    }

    await prisma.banner.delete({
      where: { id: Number(id) }
    })

    console.log(`✅ تم حذف البنر الإضافي بنجاح: ${id}`)

    return NextResponse.json({
      message: 'تم حذف البنر الإضافي بنجاح'
    })

  } catch (error) {
    console.error('❌ خطأ في حذف البنر الإضافي:', error)
    return NextResponse.json(
      { 
        error: 'فشل في حذف البنر الإضافي',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
