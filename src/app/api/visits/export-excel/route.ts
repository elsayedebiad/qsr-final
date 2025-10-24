import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }
    
    // التحقق من أن المستخدم ADMIN أو DEVELOPER
    const allowedRoles = ['ADMIN', 'DEVELOPER']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'غير مصرح - هذه الصفحة للمدير والمطور فقط' },
        { status: 403 }
      )
    }

    // الحصول على الفلاتر من query parameters
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const targetPage = searchParams.get('targetPage')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '1000') // حد أقصى 1000 زيارة

    // بناء شروط الفلترة
    const where: any = { isArchived: false }
    
    if (country && country !== 'ALL') {
      // تنظيف اسم الدولة للبحث
      where.country = country.trim()
    }
    
    if (targetPage && targetPage !== 'ALL') {
      // تنظيف اسم الصفحة للبحث
      where.targetPage = targetPage.trim().toLowerCase()
    }
    
    if (dateFrom) {
      where.timestamp = {
        ...where.timestamp,
        gte: new Date(dateFrom)
      }
    }
    
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      where.timestamp = {
        ...where.timestamp,
        lte: endDate
      }
    }

    // جلب الزيارات
    const visits = await db.visit.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit
    })

    if (visits.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد زيارات للتصدير' },
        { status: 404 }
      )
    }

    // تحضير البيانات للإكسل (مع تنظيف البيانات)
    const excelData = visits.map((visit, index) => ({
      '#': index + 1,
      'ID': visit.id,
      'التاريخ': new Date(visit.timestamp).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      'الوقت': new Date(visit.timestamp).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
      'عنوان IP': visit.ipAddress,
      'الدولة': (visit.country || 'غير معروف').trim(),
      'المدينة': visit.city || 'غير معروف',
      'الصفحة المستهدفة': visit.targetPage.trim().toLowerCase(),
      'المصدر': visit.isGoogle ? 'Google' : (visit.utmSource || 'مباشر'),
      'الوسيط': visit.utmMedium || '-',
      'الحملة': visit.utmCampaign || '-',
      'المتصفح': extractBrowser(visit.userAgent),
      'نظام التشغيل': extractOS(visit.userAgent),
      'الجهاز': extractDevice(visit.userAgent),
      'Referrer': visit.referer || 'مباشر'
    }))

    // إنشاء workbook
    const wb = XLSX.utils.book_new()
    
    // إنشاء worksheet من البيانات
    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // تنسيق العرض - جعل الأعمدة عريضة بما يكفي
    const columnWidths = [
      { wch: 5 },   // #
      { wch: 8 },   // ID
      { wch: 12 },  // التاريخ
      { wch: 12 },  // الوقت
      { wch: 16 },  // IP
      { wch: 18 },  // الدولة
      { wch: 18 },  // المدينة
      { wch: 15 },  // الصفحة
      { wch: 15 },  // المصدر
      { wch: 12 },  // الوسيط
      { wch: 20 },  // الحملة
      { wch: 12 },  // المتصفح
      { wch: 15 },  // نظام التشغيل
      { wch: 12 },  // الجهاز
      { wch: 30 }   // Referrer
    ]
    ws['!cols'] = columnWidths

    // تنسيق الرأس
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1'
      if (!ws[address]) continue
      ws[address].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }

    // إضافة worksheet للـ workbook
    XLSX.utils.book_append_sheet(wb, ws, 'الزيارات')

    // إضافة ورقة إحصائيات
    const stats = {
      'إجمالي الزيارات': visits.length,
      'من Google': visits.filter(v => v.isGoogle).length,
      'من Facebook': visits.filter(v => v.utmSource?.toLowerCase().includes('facebook')).length,
      'من Instagram': visits.filter(v => v.utmSource?.toLowerCase().includes('instagram')).length,
      'من TikTok': visits.filter(v => v.utmSource?.toLowerCase().includes('tiktok')).length,
      'من YouTube': visits.filter(v => v.utmSource?.toLowerCase().includes('youtube')).length,
      'مباشر': visits.filter(v => !v.utmSource && !v.isGoogle).length,
      'أخرى': visits.filter(v => v.utmSource && !v.isGoogle && 
        !['facebook', 'instagram', 'tiktok', 'youtube'].some(s => v.utmSource?.toLowerCase().includes(s))
      ).length
    }

    const statsData = Object.entries(stats).map(([key, value]) => ({
      'البيان': key,
      'العدد': value,
      'النسبة المئوية': `${((value / visits.length) * 100).toFixed(1)}%`
    }))

    const wsStats = XLSX.utils.json_to_sheet(statsData)
    wsStats['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsStats, 'الإحصائيات')

    // إضافة ورقة إحصائيات الدول (مع تنظيف)
    const countryStats: Record<string, number> = {}
    visits.forEach(v => {
      const country = (v.country || 'Unknown').trim()
      countryStats[country] = (countryStats[country] || 0) + 1
    })

    const countryData = Object.entries(countryStats)
      .sort(([, a], [, b]) => b - a)
      .map(([country, count], index) => ({
        '#': index + 1,
        'الدولة': country,
        'عدد الزيارات': count,
        'النسبة': `${((count / visits.length) * 100).toFixed(1)}%`
      }))

    const wsCountry = XLSX.utils.json_to_sheet(countryData)
    wsCountry['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsCountry, 'الدول')

    // إضافة ورقة إحصائيات الصفحات (مع تنظيف)
    const pageStats: Record<string, number> = {}
    visits.forEach(v => {
      const page = v.targetPage.trim().toLowerCase()
      pageStats[page] = (pageStats[page] || 0) + 1
    })

    const pageData = Object.entries(pageStats)
      .sort(([, a], [, b]) => b - a)
      .map(([page, count], index) => ({
        '#': index + 1,
        'الصفحة': page,
        'عدد الزيارات': count,
        'النسبة': `${((count / visits.length) * 100).toFixed(1)}%`
      }))

    const wsPage = XLSX.utils.json_to_sheet(pageData)
    wsPage['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsPage, 'الصفحات')

    // توليد اسم الملف
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `visits-report-${timestamp}.xlsx`

    // تحويل الـ workbook إلى buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // إرجاع الملف
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error exporting visits:', error)
    return NextResponse.json(
      { error: 'فشل تصدير الزيارات' },
      { status: 500 }
    )
  }
}

// دوال مساعدة لاستخراج معلومات المتصفح والنظام
function extractBrowser(userAgent: string | null): string {
  if (!userAgent) return 'Unknown'
  
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('Opera')) return 'Opera'
  
  return 'Other'
}

function extractOS(userAgent: string | null): string {
  if (!userAgent) return 'Unknown'
  
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac OS')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  
  return 'Other'
}

function extractDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown'
  
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) return 'Mobile'
  if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'Tablet'
  
  return 'Desktop'
}
