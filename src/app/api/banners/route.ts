import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET - جلب جميع البنرات أو بنرات صفحة معينة
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const salesPageId = searchParams.get('salesPageId')
    const deviceType = searchParams.get('deviceType')

    const where: any = {}
    
    if (salesPageId) {
      where.salesPageId = salesPageId
    }
    
    if (deviceType) {
      where.deviceType = deviceType
    }

    const banners = await db.banner.findMany({
      where,
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}

// POST - إضافة بنر جديد
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const salesPageId = formData.get('salesPageId') as string
    const deviceType = formData.get('deviceType') as string
    const order = parseInt(formData.get('order') as string || '0')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!salesPageId || !deviceType) {
      return NextResponse.json(
        { error: 'salesPageId and deviceType are required' },
        { status: 400 }
      )
    }

    // إنشاء مجلد البنرات إذا لم يكن موجوداً
    const bannersDir = join(process.cwd(), 'public', 'banners')
    if (!existsSync(bannersDir)) {
      await mkdir(bannersDir, { recursive: true })
    }

    // حفظ الملف
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${salesPageId}_${deviceType.toLowerCase()}_${Date.now()}_${file.name}`
    const filePath = join(bannersDir, fileName)
    await writeFile(filePath, buffer)

    // حفظ في قاعدة البيانات
    const banner = await db.banner.create({
      data: {
        salesPageId,
        deviceType: deviceType as 'MOBILE' | 'DESKTOP',
        imageUrl: `/banners/${fileName}`,
        order,
        isActive: true
      }
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}

// DELETE - حذف بنر
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Banner ID is required' },
        { status: 400 }
      )
    }

    await db.banner.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}

// PATCH - تحديث ترتيب أو تفعيل/تعطيل بنر
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, order, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Banner ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (order !== undefined) updateData.order = order
    if (isActive !== undefined) updateData.isActive = isActive

    const banner = await db.banner.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

