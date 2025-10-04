import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// نحفظ البنرات كـ Base64 في قاعدة البيانات Neon PostgreSQL
// لا حاجة للـ file system أو Vercel Blob Storage

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

    // تحويل الصورة إلى Base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    
    // إنشاء data URI كامل مع MIME type
    const mimeType = file.type || 'image/jpeg'
    const imageData = `data:${mimeType};base64,${base64}`

    console.log(`✅ تم تحويل البنر إلى Base64 (${(base64.length / 1024).toFixed(2)} KB)`)

    // حفظ في قاعدة البيانات
    // مؤقتاً: نستخدم imageUrl حتى تشغيل SQL migration
    // بعد Migration: سيُحفظ في imageData تلقائياً
    const banner = await db.banner.create({
      data: {
        salesPageId,
        deviceType: deviceType as 'MOBILE' | 'DESKTOP',
        imageUrl: imageData, // حفظ Base64 في imageUrl مؤقتاً
        order,
        isActive: true
      }
    })

    // إرجاع البنر بنجاح
    return NextResponse.json({
      ...banner,
      hasImage: true
    })
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

