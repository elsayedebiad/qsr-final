import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - البحث عن سيرة ذاتية برقم الجواز
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const passportNumber = searchParams.get('passportNumber')

    if (!passportNumber) {
      return NextResponse.json(
        { error: 'رقم الجواز مطلوب' },
        { status: 400 }
      )
    }

    // البحث عن السيرة الذاتية برقم الجواز
    const cv = await prisma.cV.findFirst({
      where: {
        passportNumber: {
          equals: passportNumber.trim(),
          mode: 'insensitive'
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        contract: true,
        booking: true
      }
    })

    if (!cv) {
      return NextResponse.json(
        { error: 'لا توجد سيرة ذاتية بهذا الرقم', found: false },
        { status: 404 }
      )
    }

    // التحقق من حالة السيرة
    let contractStatus = null
    if (cv.contract) {
      contractStatus = 'متعاقد عليها (عقد قديم)'
    } else if (cv.booking) {
      contractStatus = 'محجوزة'
    }

    return NextResponse.json({
      found: true,
      cv: cv,
      contractStatus: contractStatus
    })
  } catch (error) {
    console.error('❌ خطأ في البحث عن السيرة:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء البحث عن السيرة' },
      { status: 500 }
    )
  }
}

