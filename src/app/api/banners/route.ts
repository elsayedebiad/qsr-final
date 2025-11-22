import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ActivityTracker from '@/lib/activity-tracker'

// نحفظ البنرات كـ Base64 في قاعدة البيانات Neon PostgreSQL
// لا حاجة للـ file system أو Vercel Blob Storage

// GET - جلب جميع البنرات أو بنرات صفحة معينة
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const salesPageId = searchParams.get('salesPageId')
    const deviceType = searchParams.get('deviceType')

    console.log(`🔍 GET /api/banners - salesPageId: ${salesPageId}, deviceType: ${deviceType}`)

    const where: any = {}
    
    if (salesPageId) {
      where.salesPageId = salesPageId
    }
    
    if (deviceType) {
      where.deviceType = deviceType
    }
    
    // فلترة البنرات الرئيسية فقط
    where.bannerType = 'MAIN'

    console.log(`📊 Query filters:`, where)

    const banners = await db.banner.findMany({
      where,
      orderBy: { order: 'asc' }
    })

    console.log(`✅ Found ${banners.length} banner(s)`)
    
    // Log banner info without full Base64 data
    banners.forEach(b => {
      const imageSize = b.imageUrl ? (b.imageUrl.length / 1024).toFixed(2) : '0'
      console.log(`  - ID: ${b.id}, Page: ${b.salesPageId}, Device: ${b.deviceType}, Size: ${imageSize} KB, Active: ${b.isActive}`)
    })

    return NextResponse.json(banners)
  } catch (error: any) {
    console.error('❌ Error fetching banners:', error)
    console.error('❌ Error type:', error?.constructor?.name)
    console.error('❌ Error message:', error?.message)
    return NextResponse.json(
      { 
        error: 'Failed to fetch banners',
        details: error?.message || 'Unknown error'
      },
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

    const imageSizeKB = (base64.length / 1024).toFixed(2)
    console.log(`✅ تم تحويل البنر إلى Base64 (${imageSizeKB} KB)`)

    // التحقق من حجم الصورة (حد أقصى 5MB للأمان)
    const maxSizeMB = 5
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    
    if (base64.length > maxSizeBytes) {
      return NextResponse.json(
        { 
          error: `الصورة كبيرة جداً. الحد الأقصى ${maxSizeMB} ميجابايت`,
          currentSize: `${imageSizeKB} KB`,
          maxSize: `${maxSizeMB * 1024} KB`
        },
        { status: 400 }
      )
    }

    console.log(`🔄 محاولة حفظ البنر في قاعدة البيانات...`)
    console.log(`📊 حجم البيانات: ${imageSizeKB} KB`)
    console.log(`📍 صفحة: ${salesPageId}, جهاز: ${deviceType}`)

    try {
      // محاولة حفظ في قاعدة البيانات
      const banner = await db.banner.create({
        data: {
          salesPageId,
          deviceType: deviceType as 'MOBILE' | 'DESKTOP',
          imageUrl: imageData, // حفظ Base64 في imageUrl
          order,
          isActive: true
        }
      })

      console.log(`✅ تم حفظ البنر بنجاح - ID: ${banner.id}`)
      
      // تسجيل النشاط
      try {
        await ActivityTracker.bannerCreated(
          `${salesPageId} - ${deviceType}`,
          banner.id.toString(),
          'رئيسي'
        )
      } catch (activityError) {
        console.error('خطأ في تسجيل النشاط:', activityError)
      }
      
      // إرجاع البنر بنجاح
      return NextResponse.json({
        ...banner,
        hasImage: true
      })
    } catch (dbError: any) {
      console.error('❌ خطأ في حفظ البنر:', dbError)
      console.error('❌ نوع الخطأ:', dbError.constructor.name)
      console.error('❌ كود الخطأ:', dbError.code)
      console.error('❌ رسالة الخطأ:', dbError.message)
      
      // إذا كان الخطأ بسبب حجم البيانات
      if (dbError.message?.includes('value too long') || dbError.code === '22001') {
        return NextResponse.json(
          { 
            error: '⚠️ الصورة كبيرة جداً لقاعدة البيانات',
            solution: 'شغّل SQL على Neon Console',
            sql: 'ALTER TABLE banners ALTER COLUMN "imageUrl" TYPE TEXT;',
            details: 'عمود imageUrl يجب أن يكون TEXT وليس VARCHAR'
          },
          { status: 500 }
        )
      }
      
      // إذا كان خطأ اتصال
      if (dbError.code === 'P1001' || dbError.message?.includes('connect')) {
        return NextResponse.json(
          { 
            error: 'فشل الاتصال بقاعدة البيانات',
            details: 'تحقق من DATABASE_URL في Environment Variables',
            hint: 'هل قاعدة البيانات شغالة على Neon؟'
          },
          { status: 500 }
        )
      }
      
      // خطأ آخر
      return NextResponse.json(
        { 
          error: 'فشل في حفظ البنر',
          errorType: dbError.constructor.name,
          errorCode: dbError.code || 'UNKNOWN',
          details: dbError.message || 'خطأ غير معروف',
          hint: 'راجع Vercel Logs للتفاصيل الكاملة'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ خطأ عام في رفع البنر:', error)
    return NextResponse.json(
      { 
        error: 'فشل في معالجة الصورة',
        details: error.message || 'خطأ غير معروف'
      },
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

    // جلب البنر قبل الحذف للحصول على المعلومات
    const banner = await db.banner.findUnique({
      where: { id: parseInt(id) }
    })

    await db.banner.delete({
      where: { id: parseInt(id) }
    })

    // تسجيل النشاط
    if (banner) {
      try {
        await ActivityTracker.bannerDeleted(
          `${banner.salesPageId} - ${banner.deviceType}`,
          banner.id.toString()
        )
      } catch (activityError) {
        console.error('خطأ في تسجيل النشاط:', activityError)
      }
    }

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

    // تسجيل النشاط
    try {
      if (isActive !== undefined) {
        if (isActive) {
          await ActivityTracker.bannerActivated(
            `${banner.salesPageId} - ${banner.deviceType}`,
            banner.id.toString()
          )
        } else {
          await ActivityTracker.bannerDeactivated(
            `${banner.salesPageId} - ${banner.deviceType}`,
            banner.id.toString()
          )
        }
      } else {
        await ActivityTracker.bannerUpdated(
          `${banner.salesPageId} - ${banner.deviceType}`,
          banner.id.toString()
        )
      }
    } catch (activityError) {
      console.error('خطأ في تسجيل النشاط:', activityError)
    }

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

