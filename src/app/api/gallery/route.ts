import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CVStatus } from '@prisma/client'

// API route للمعرض العام - بدون authentication
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') as CVStatus | null

    // عرض السير الذاتية المتاحة للمعرض العام (غير المحجوزة أو المتعاقدة)
    const whereClause: any = {
      status: {
        in: ['NEW', 'RETURNED'] // عرض السير الجديدة والمعادة فقط
      }
    }

    // إذا تم تحديد status معين
    if (status) {
      whereClause.status = status
    }

    const cvs = await db.cV.findMany({
      where: whereClause,
      select: {
        // اختيار الحقول المناسبة للعرض العام فقط
        id: true,
        fullName: true,
        fullNameArabic: true,
        email: true,
        phone: true,
        referenceCode: true,
        monthlySalary: true,
        contractPeriod: true,
        position: true,
        nationality: true,
        maritalStatus: true,
        age: true,
        profileImage: true,
        videoLink: true,
        status: true,
        priority: true,
        // مهارات اختيارية
        babySitting: true,
        childrenCare: true,
        tutoring: true,
        disabledCare: true,
        cleaning: true,
        washing: true,
        ironing: true,
        arabicCooking: true,
        sewing: true,
        driving: true,
        // خصائص اختيارية للفلاتر
        experience: true,
        arabicLevel: true,
        englishLevel: true,
        // خصائص إضافية للفلاتر المتقدمة
        religion: true,
        educationLevel: true,
        passportNumber: true,
        passportExpiryDate: true,
        height: true,
        weight: true,
        numberOfChildren: true,
        livingTown: true,
        placeOfBirth: true,
        // إخفاء الحقول الحساسة
        // createdBy: false,
        // updatedBy: false,
        // contracts: false,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(cvs)
  } catch (error) {
    console.error('Error fetching gallery CVs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CVs for gallery' },
      { status: 500 }
    )
  }
}
