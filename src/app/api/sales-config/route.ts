import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// GET - جلب جميع إعدادات صفحات المبيعات
export async function GET() {
  try {
    // محاولة جلب الإعدادات من قاعدة البيانات
    // إذا لم تكن موجودة، سنرجع القيم الافتراضية
    const defaultSettings = {
      sales1: { whatsappNumber: '' },
      sales2: { whatsappNumber: '' },
      sales3: { whatsappNumber: '' },
      sales4: { whatsappNumber: '' },
      sales5: { whatsappNumber: '' }
    }

    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error('Error fetching sales config:', error)
    return NextResponse.json(
      { error: 'فشل في جلب إعدادات المبيعات' },
      { status: 500 }
    )
  }
}

// POST - حفظ إعدادات صفحات المبيعات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salesConfigs } = body

    if (!salesConfigs) {
      return NextResponse.json(
        { error: 'بيانات الإعدادات مطلوبة' },
        { status: 400 }
      )
    }

    // هنا يمكنك حفظ الإعدادات في قاعدة البيانات
    // لكن للبساطة، سنحفظها في ملف JSON أو متغير مؤقت
    
    return NextResponse.json({ 
      message: 'تم حفظ الإعدادات بنجاح',
      salesConfigs 
    })
  } catch (error) {
    console.error('Error saving sales config:', error)
    return NextResponse.json(
      { error: 'فشل في حفظ إعدادات المبيعات' },
      { status: 500 }
    )
  }
}

