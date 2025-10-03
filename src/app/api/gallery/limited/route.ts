import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// API route لعرض السير الذاتية من 1-5 فقط للمعرض المحدود
export async function GET(request: NextRequest) {
  try {
    const cvs = await db.cV.findMany({
      where: {
        id: {
          in: [1, 2, 3, 4, 5] // السير الذاتية من 1 إلى 5 فقط
        }
      },
      select: {
        // جميع الحقول المطلوبة للمعرض
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
        status: true,
        priority: true,
        // مهارات
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
        // خصائص إضافية
        experience: true,
        arabicLevel: true,
        englishLevel: true,
        religion: true,
        educationLevel: true,
        passportNumber: true,
        passportIssueDate: true,
        passportExpiryDate: true,
        passportIssuePlace: true,
        height: true,
        weight: true,
        numberOfChildren: true,
        livingTown: true,
        placeOfBirth: true,
        // معلومات إضافية للسيرة الكاملة
        dateOfBirth: true,
        previousEmployment: true
      },
      orderBy: {
        id: 'asc' // ترتيب حسب الرقم
      }
    })

    return NextResponse.json(cvs)
  } catch (error) {
    console.error('Error fetching limited CVs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CVs' },
      { status: 500 }
    )
  }
}
