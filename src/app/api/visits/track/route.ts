import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      targetPage,
      referer,
      utmSource,
      utmMedium,
      utmCampaign,
      isGoogle,
      userAgent
    } = body

    // الحصول على IP من headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded 
      ? forwarded.split(',')[0].trim() 
      : request.headers.get('x-real-ip') || 'unknown'

    // محاولة الحصول على معلومات الموقع الجغرافي
    let country = null
    let city = null
    
    try {
      // استخدام ipapi.co للحصول على معلومات الموقع (مجاني)
      if (ipAddress !== 'unknown' && !ipAddress.includes('127.0.0.1') && !ipAddress.includes('localhost')) {
        const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`)
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          country = geoData.country_name || null
          city = geoData.city || null
        }
      }
    } catch (error) {
      console.log('Error fetching geo data:', error)
      // نستمر بدون بيانات جغرافية
    }

    // حفظ الزيارة في قاعدة البيانات
    const visit = await db.visit.create({
      data: {
        ipAddress,
        country,
        city,
        userAgent,
        referer,
        utmSource,
        utmMedium,
        utmCampaign,
        targetPage,
        isGoogle
      }
    })

    return NextResponse.json({
      success: true,
      visitId: visit.id
    })
  } catch (error) {
    console.error('Error tracking visit:', error)
    return NextResponse.json(
      { error: 'Failed to track visit' },
      { status: 500 }
    )
  }
}
