import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cvs/[id]/public - Get CV for public viewing (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // تحويل ID إلى integer إذا لزم الأمر
    const cvId = parseInt(id)
    if (isNaN(cvId)) {
      return NextResponse.json({ error: 'Invalid CV ID' }, { status: 400 })
    }

    const cv = await db.cV.findUnique({
      where: { id: cvId },
      select: {
        id: true,
        fullName: true,
        fullNameArabic: true,
        email: true,
        phone: true,
        referenceCode: true,
        position: true,
        nationality: true,
        religion: true,
        dateOfBirth: true,
        placeOfBirth: true,
        livingTown: true,
        maritalStatus: true,
        numberOfChildren: true,
        weight: true,
        height: true,
        complexion: true,
        age: true,
        monthlySalary: true,
        contractPeriod: true,
        passportNumber: true,
        passportIssueDate: true,
        passportExpiryDate: true,
        passportIssuePlace: true,
        englishLevel: true,
        arabicLevel: true,
        educationLevel: true,
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
        elderCare: true,
        housekeeping: true,
        experience: true,
        education: true,
        skills: true,
        summary: true,
        priority: true,
        notes: true,
        profileImage: true,
        cvImageUrl: true, // ← إضافة رابط صورة السيرة الكاملة المصممة
        videoLink: true,
        // ملاحظة: الحقول الإضافية الـ 22 قد تحتاج إلى إضافتها لقاعدة البيانات أولاً
        createdAt: true,
        updatedAt: true
      }
    })

    if (!cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }

    return NextResponse.json({ cv })
  } catch (error) {
    console.error('Error fetching public CV:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
