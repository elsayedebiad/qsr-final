import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      phoneNumber,
      salesPageId,
      source,
      notes
    } = body

    // التحقق من وجود رقم الهاتف
    if (!phoneNumber || !salesPageId) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف والصفحة مطلوبان' },
        { status: 400 }
      )
    }

    // الحصول على IP من headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    
    let ipAddress = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : null) || 'unknown'
    
    if (ipAddress.includes('::') && ipAddress.length < 10 && ipAddress !== '::1') {
      ipAddress = 'unknown'
    }
    
    if (ipAddress === '::1') {
      ipAddress = '127.0.0.1 (localhost)'
    }

    // الحصول على User Agent
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // تحديد نوع الجهاز
    const deviceType = userAgent.toLowerCase().includes('mobile') ? 'MOBILE' : 'DESKTOP'

    // IP للبحث الجغرافي
    let geoLookupIp = ipAddress
    const isLocalhost = ipAddress.includes('127.0.0.1') || ipAddress === 'localhost' || ipAddress.includes('::ffff:127')
    
    if (isLocalhost) {
      geoLookupIp = '41.233.0.1' // IP مصري للاختبار في التطوير
    }

    // جلب معلومات الموقع الجغرافي
    let country = null
    let city = null
    
    if (geoLookupIp !== 'unknown' && !geoLookupIp.includes('localhost')) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const geoResponse = await fetch(`http://ip-api.com/json/${geoLookupIp}?fields=status,country,city,query`, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          
          if (geoData.status === 'success') {
            country = geoData.country || null
            city = geoData.city || null
          }
        }
      } catch (error) {
        console.log('⚠️ Geo lookup failed:', error)
      }
    }

    // حفظ رقم الهاتف في قاعدة البيانات
    const phoneNumberRecord = await db.phoneNumber.create({
      data: {
        phoneNumber,
        salesPageId,
        source,
        ipAddress,
        userAgent,
        deviceType,
        country,
        city,
        notes
      }
    })

    console.log('✅ Phone number saved:', {
      id: phoneNumberRecord.id,
      phoneNumber: phoneNumberRecord.phoneNumber,
      salesPageId: phoneNumberRecord.salesPageId,
      country,
      city
    })

    return NextResponse.json({
      success: true,
      message: 'تم حفظ رقم الهاتف بنجاح',
      data: phoneNumberRecord
    })

  } catch (error) {
    console.error('❌ Error saving phone number:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حفظ رقم الهاتف' },
      { status: 500 }
    )
  }
}
