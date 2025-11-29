import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// تحويل كود الدولة إلى اسم الدولة بالعربية
function getCountryNameFromCode(code: string): string {
  const countries: { [key: string]: string } = {
    'SA': 'السعودية',
    'AE': 'الإمارات',
    'EG': 'مصر',
    'KW': 'الكويت',
    'QA': 'قطر',
    'BH': 'البحرين',
    'OM': 'عمان',
    'JO': 'الأردن',
    'LB': 'لبنان',
    'SY': 'سوريا',
    'IQ': 'العراق',
    'YE': 'اليمن',
    'PS': 'فلسطين',
    'SD': 'السودان',
    'LY': 'ليبيا',
    'TN': 'تونس',
    'DZ': 'الجزائر',
    'MA': 'المغرب',
    'US': 'أمريكا',
    'GB': 'بريطانيا',
    'DE': 'ألمانيا',
    'FR': 'فرنسا',
    'IN': 'الهند',
    'PK': 'باكستان',
    'BD': 'بنغلاديش',
    'PH': 'الفلبين',
    'ID': 'إندونيسيا',
    'TR': 'تركيا',
    'ET': 'إثيوبيا',
    'KE': 'كينيا',
    'UG': 'أوغندا',
    'NG': 'نيجيريا',
    'GH': 'غانا',
    'NP': 'نيبال',
    'LK': 'سريلانكا'
  }
  return countries[code.toUpperCase()] || code
}

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

    // الحصول على IP من headers (مرتبة حسب الأولوية)
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    const xRealIp = request.headers.get('x-real-ip')
    const forwarded = request.headers.get('x-forwarded-for')
    const vercelForwarded = request.headers.get('x-vercel-forwarded-for')
    
    let ipAddress = cfConnectingIp || 
                    xRealIp || 
                    (vercelForwarded ? vercelForwarded.split(',')[0].trim() : null) ||
                    (forwarded ? forwarded.split(',')[0].trim() : null) || 
                    'unknown'
    
    // تنظيف عنوان IP
    if (ipAddress.includes('::') && ipAddress.length < 10 && ipAddress !== '::1') {
      ipAddress = 'unknown'
    }
    if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
      ipAddress = '127.0.0.1 (localhost)'
    }

    // الحصول على User Agent
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // تحديد نوع الجهاز
    const deviceType = userAgent.toLowerCase().includes('mobile') ? 'MOBILE' : 'DESKTOP'

    // الحصول على معلومات الموقع من Cloudflare/Vercel مباشرة (أكثر دقة)
    const cfCountry = request.headers.get('cf-ipcountry') // كود الدولة من Cloudflare
    const cfCity = request.headers.get('cf-ipcity') // المدينة من Cloudflare
    const vercelCountry = request.headers.get('x-vercel-ip-country')
    const vercelCity = request.headers.get('x-vercel-ip-city')
    
    // جلب معلومات الموقع الجغرافي
    let country: string | null = null
    let city: string | null = null
    
    // استخدام headers Cloudflare/Vercel أولاً (أكثر دقة)
    if (cfCountry && cfCountry !== 'XX') {
      country = getCountryNameFromCode(cfCountry)
      city = cfCity ? decodeURIComponent(cfCity) : null
    } else if (vercelCountry) {
      country = getCountryNameFromCode(vercelCountry)
      city = vercelCity ? decodeURIComponent(vercelCity) : null
    }
    
    // إذا لم نحصل على الموقع من headers، استخدم IP API
    if (!country) {
      let geoLookupIp = ipAddress
      const isLocalhost = ipAddress.includes('127.0.0.1') || ipAddress === 'localhost' || ipAddress.includes('::ffff:127')
      
      if (isLocalhost) {
        geoLookupIp = '' // تخطي البحث للـ localhost
      }

      if (geoLookupIp && geoLookupIp !== 'unknown' && !geoLookupIp.includes('localhost')) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          
          const geoResponse = await fetch(`http://ip-api.com/json/${geoLookupIp}?fields=status,country,city,query&lang=ar`, {
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
    }

    // حساب موعد انتهاء المؤقت (6 ساعات من الآن)
    const deadlineAt = new Date()
    deadlineAt.setHours(deadlineAt.getHours() + 6)

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
        notes,
        // إضافة مؤقت تلقائي 6 ساعات
        deadlineHours: 6,
        deadlineMinutes: 0,
        deadlineSeconds: 0,
        deadlineAt: deadlineAt,
        isExpired: false
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
