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
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    
    // ترتيب الأولوية: CloudFlare > Real-IP > Forwarded > Unknown
    let ipAddress = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : null) || 'unknown'
    
    // تنظيف IPv6 المختصر
    if (ipAddress.includes('::') && ipAddress.length < 10 && ipAddress !== '::1') {
      ipAddress = 'unknown'
    }
    
    // تحويل localhost IPv6 إلى شكل أوضح
    if (ipAddress === '::1') {
      ipAddress = '127.0.0.1 (localhost)'
    }
    
    // IP للبحث الجغرافي (في التطوير نستخدم IP اختبار)
    let geoLookupIp = ipAddress
    const isLocalhost = ipAddress.includes('127.0.0.1') || ipAddress === 'localhost' || ipAddress.includes('::ffff:127')
    
    if (isLocalhost) {
      geoLookupIp = '41.233.0.1' // IP مصري للاختبار في التطوير
      console.log('🧪 Development mode: Using test IP for geo lookup')
    }
    
    console.log('🔍 IP Detection:', {
      'original': ipAddress,
      'geo-lookup': geoLookupIp,
      'isLocalhost': isLocalhost
    })

    // محاولة الحصول على معلومات الموقع الجغرافي
    let country = null
    let city = null
    
    // جلب البيانات الجغرافية (نستخدم geoLookupIp الذي قد يكون IP اختبار في التطوير)
    if (geoLookupIp !== 'unknown' && !geoLookupIp.includes('localhost')) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const geoResponse = await fetch(`https://ipapi.co/${geoLookupIp}/json/`, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          
          if (!geoData.error) {
            country = geoData.country_name || null
            city = geoData.city || null
            console.log(`✅ Geo: ${geoLookupIp} → ${country}, ${city}`)
          }
        }
      } catch (error: any) {
        console.log(`⚠️ Geo lookup failed:`, error.name)
        // في حالة فشل الـ API للـ localhost، نستخدم بيانات افتراضية
        if (isLocalhost) {
          country = 'Egypt'
          city = 'Cairo'
          console.log('🧪 Fallback: Using test geo data')
        }
      }
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
