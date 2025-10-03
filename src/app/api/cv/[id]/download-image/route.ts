import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import puppeteer from 'puppeteer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cvId = parseInt(id)

    if (isNaN(cvId)) {
      return NextResponse.json({ error: 'Invalid CV ID' }, { status: 400 })
    }

    // جلب بيانات السيرة الذاتية
    const cv = await db.cV.findUnique({
      where: { id: cvId }
    })

    if (!cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }

    // إنشاء الصورة باستخدام puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // تعيين حجم الصفحة
    await page.setViewport({
      width: 1459,
      height: 2048,
      deviceScaleFactor: 2
    })

    // الانتقال لصفحة السيرة الذاتية
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    await page.goto(`${baseUrl}/cv/${cvId}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    })

    // انتظار تحميل المحتوى
    await page.waitForSelector('.cv-container', { timeout: 10000 })

    // أخذ لقطة شاشة
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1459,
        height: 2048
      }
    })

    await browser.close()

    // إرجاع الصورة
    return new NextResponse(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="CV-${cv.fullName}-${Date.now()}.png"`
      }
    })

  } catch (error) {
    console.error('Error generating CV image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
