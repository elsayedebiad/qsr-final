import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

// GET - جلب جميع النقرات
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة - مطلوب للمشرفين فقط
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const clicks = await db.bookingClick.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000
    })

    return NextResponse.json({ clicks })
  } catch (error) {
    console.error('Error fetching booking clicks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clicks' },
      { status: 500 }
    )
  }
}

// POST - تسجيل نقرة جديدة (متاح للجميع - بدون مصادقة)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      salesPageId, 
      cvId, 
      cvName, 
      action = 'BOOKING_CLICK',
      messageSent = false 
    } = body

    console.log('📥 طلب تسجيل نقرة جديد:', { salesPageId, cvId, cvName, action });

    if (!salesPageId) {
      console.error('❌ salesPageId مفقود');
      return NextResponse.json(
        { error: 'salesPageId is required' },
        { status: 400 }
      )
    }

    // الحصول على معلومات الجهاز
    const userAgent = request.headers.get('user-agent') || ''
    const deviceType = /mobile/i.test(userAgent) ? 'MOBILE' : 'DESKTOP'
    
    // IP Address (محاولة الحصول عليه)
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'

    console.log('🔍 معلومات الطلب:', { deviceType, ipAddress, userAgent: userAgent.substring(0, 50) });

    const click = await db.bookingClick.create({
      data: {
        salesPageId,
        cvId,
        cvName,
        action,
        userAgent,
        ipAddress,
        deviceType,
        messageSent
      }
    })

    console.log('✅ تم حفظ النقرة بنجاح! ID:', click.id);

    return NextResponse.json({ 
      success: true, 
      click 
    }, { status: 201 })
  } catch (error) {
    console.error('❌ خطأ في حفظ النقرة:', error)
    return NextResponse.json(
      { error: 'Failed to create click record', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
