import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// GET - جلب السير الذاتية المتاحة فقط (NEW status) للمعرض وصفحات السيلز
export async function GET() {
  try {
    const cvs = await db.cV.findMany({
      where: {
        status: 'NEW' // فقط السير الذاتية المتاحة (غير محجوزة وغير متعاقدة)
      },
      select: {
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
        videoLink: true, // إضافة حقل الفيديو
        status: true,
        priority: true,
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
        experience: true,
        arabicLevel: true,
        englishLevel: true,
        religion: true,
        educationLevel: true,
        passportNumber: true,
        passportExpiryDate: true,
        height: true,
        weight: true,
        numberOfChildren: true,
        livingTown: true,
        placeOfBirth: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    console.log(`Found ${cvs.length} available CVs (NEW status only)`)
    return NextResponse.json(cvs)
  } catch (error) {
    console.error('Error fetching CVs for gallery:', error)
    return NextResponse.json(
      { error: 'فشل في جلب السير الذاتية' },
      { status: 500 }
    )
  }
}

