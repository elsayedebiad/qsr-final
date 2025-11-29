import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    // التحقق من CRON_SECRET للأمان
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'غير مصرح - CRON_SECRET غير صحيح' },
        { status: 401 }
      )
    }

    // حساب تاريخ بداية الأسبوع (آخر 7 أيام)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // جلب إحصائيات السير الذاتية
    const totalCVs = await db.cV.count()
    const weekCVs = await db.cV.count({
      where: {
        createdAt: { gte: weekAgo }
      }
    })

    const cvsByStatus = await db.cV.groupBy({
      by: ['status'],
      _count: true
    })

    // جلب إحصائيات الزيارات
    const totalVisits = await db.visit.count({
      where: { isArchived: false }
    })
    const weekVisits = await db.visit.count({
      where: {
        timestamp: { gte: weekAgo },
        isArchived: false
      }
    })

    const visitsBySource = await db.visit.groupBy({
      by: ['utmSource', 'isGoogle'],
      where: {
        timestamp: { gte: weekAgo },
        isArchived: false
      },
      _count: true
    })

    const visitsByPage = await db.visit.groupBy({
      by: ['targetPage'],
      where: {
        timestamp: { gte: weekAgo },
        isArchived: false
      },
      _count: true,
      orderBy: {
        _count: {
          targetPage: 'desc'
        }
      }
    })

    // جلب أنشطة الأسبوع
    const weekActivities = await db.activityLog.count({
      where: {
        timestamp: { gte: weekAgo }
      }
    })

    // تجهيز البيانات للإرسال
    const reportData = {
      period: `${weekAgo.toLocaleDateString('ar-EG')} - ${new Date().toLocaleDateString('ar-EG')}`,
      cvs: {
        total: totalCVs,
        thisWeek: weekCVs,
        byStatus: cvsByStatus.map(s => ({
          status: s.status,
          count: s._count
        }))
      },
      visits: {
        total: totalVisits,
        thisWeek: weekVisits,
        bySource: visitsBySource.map(s => ({
          source: s.isGoogle ? 'Google' : (s.utmSource || 'Direct'),
          count: s._count
        })),
        byPage: visitsByPage.slice(0, 10).map(p => ({
          page: p.targetPage,
          count: p._count
        }))
      },
      activities: {
        thisWeek: weekActivities
      }
    }

    // إرسال البريد الإلكتروني إذا كان SMTP مُعَدّ
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.REPORT_EMAIL_RECIPIENTS) {
      await sendEmailReport(reportData)
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء التقرير الأسبوعي بنجاح',
      report: reportData
    })

  } catch (error) {
    console.error('Error generating weekly report:', error)
    return NextResponse.json(
      { error: 'فشل إنشاء التقرير الأسبوعي' },
      { status: 500 }
    )
  }
}

// دالة إرسال البريد الإلكتروني
async function sendEmailReport(data: any) {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })

    const emailHTML = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px; }
    h2 { color: #1e40af; margin-top: 25px; border-right: 4px solid #3b82f6; padding-right: 15px; }
    .stat-box { background: #eff6ff; border-radius: 8px; padding: 15px; margin: 10px 0; display: inline-block; min-width: 200px; }
    .stat-label { font-size: 14px; color: #64748b; margin-bottom: 5px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #2563eb; color: white; padding: 12px; text-align: right; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; }
    tr:hover { background: #f8fafc; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 التقرير الأسبوعي لنظام إدارة مكاتب الاستقدام</h1>
    
    <p style="text-align: center; color: #64748b; font-size: 16px;">
      الفترة: ${data.period}
    </p>

    <h2>👥 السير الذاتية</h2>
    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
      <div class="stat-box">
        <div class="stat-label">إجمالي السير</div>
        <div class="stat-value">${data.cvs.total}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">السير هذا الأسبوع</div>
        <div class="stat-value" style="color: #10b981;">${data.cvs.thisWeek}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>الحالة</th>
          <th>العدد</th>
        </tr>
      </thead>
      <tbody>
        ${data.cvs.byStatus.map((s: any) => `
          <tr>
            <td>${getStatusLabel(s.status)}</td>
            <td><strong>${s.count}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>🌐 الزيارات</h2>
    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
      <div class="stat-box">
        <div class="stat-label">إجمالي الزيارات</div>
        <div class="stat-value">${data.visits.total}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">الزيارات هذا الأسبوع</div>
        <div class="stat-value" style="color: #8b5cf6;">${data.visits.thisWeek}</div>
      </div>
    </div>

    <h3>المصادر</h3>
    <table>
      <thead>
        <tr>
          <th>المصدر</th>
          <th>العدد</th>
        </tr>
      </thead>
      <tbody>
        ${data.visits.bySource.map((s: any) => `
          <tr>
            <td>${s.source}</td>
            <td><strong>${s.count}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h3>أكثر الصفحات زيارة</h3>
    <table>
      <thead>
        <tr>
          <th>الصفحة</th>
          <th>العدد</th>
        </tr>
      </thead>
      <tbody>
        ${data.visits.byPage.map((p: any) => `
          <tr>
            <td>${p.page}</td>
            <td><strong>${p.count}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>⚡ الأنشطة</h2>
    <div class="stat-box">
      <div class="stat-label">أنشطة هذا الأسبوع</div>
      <div class="stat-value" style="color: #f59e0b;">${data.activities.thisWeek}</div>
    </div>

    <div class="footer">
      <p>تم إنشاء هذا التقرير تلقائياً في ${new Date().toLocaleString('ar-EG')}</p>
      <p>نظام إدارة مكاتب الاستقدام - QSR Final</p>
    </div>
  </div>
</body>
</html>
    `

    const recipients = process.env.REPORT_EMAIL_RECIPIENTS?.split(',') || []

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: recipients,
      subject: `📊 التقرير الأسبوعي - ${new Date().toLocaleDateString('ar-EG')}`,
      html: emailHTML
    })

    console.log('✅ تم إرسال التقرير بنجاح إلى:', recipients.join(', '))
  } catch (error) {
    console.error('❌ فشل إرسال البريد الإلكتروني:', error)
    throw error
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'NEW': '🆕 جديد',
    'BOOKED': '📋 محجوز',
    'HIRED': '✅ متعاقد',
    'REJECTED': '❌ مرفوض',
    'RETURNED': '🔄 معاد',
    'ARCHIVED': '📦 مؤرشف'
  }
  return labels[status] || status
}

// دالة GET لعرض التقرير في المتصفح (للاختبار)
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'غير مصرح - CRON_SECRET غير صحيح' },
        { status: 401 }
      )
    }

    // حساب تاريخ بداية الأسبوع
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const totalCVs = await db.cV.count()
    const weekCVs = await db.cV.count({
      where: { createdAt: { gte: weekAgo } }
    })

    return NextResponse.json({
      success: true,
      message: 'التقرير متاح',
      data: {
        totalCVs,
        weekCVs,
        period: `${weekAgo.toLocaleDateString('ar-EG')} - ${new Date().toLocaleDateString('ar-EG')}`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل جلب التقرير' },
      { status: 500 }
    )
  }
}
