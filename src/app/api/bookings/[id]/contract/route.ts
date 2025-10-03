import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAuthFromRequest } from '@/lib/middleware-auth'

// POST - تحويل حجز إلى تعاقد
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const user = authResult.user
    const bookingId = parseInt(params.id)
    const body = await request.json()
    const { identityNumber, contractDate, notes } = body

    // العثور على الحجز
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        cv: {
          select: {
            id: true,
            fullName: true,
            referenceCode: true,
            nationality: true,
            position: true,
            status: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })
    }

    // التحقق من أن السيرة الذاتية محجوزة
    if (booking.cv.status !== 'BOOKED') {
      return NextResponse.json(
        { error: 'هذه السيرة الذاتية ليست محجوزة' },
        { status: 400 }
      )
    }

    // التحقق من وجود تعاقد مسبق
    const existingContract = await db.contract.findUnique({
      where: { cvId: booking.cvId }
    })

    if (existingContract) {
      return NextResponse.json(
        { error: 'هذه السيرة الذاتية متعاقد عليها بالفعل' },
        { status: 400 }
      )
    }

    // إنشاء التعاقد وتحديث الحالة في معاملة واحدة
    const result = await db.$transaction(async (tx) => {
      // إنشاء التعاقد
      const contract = await tx.contract.create({
        data: {
          cvId: booking.cvId,
          identityNumber: identityNumber || booking.identityNumber,
          contractStartDate: contractDate ? new Date(contractDate) : new Date(),
          contractEndDate: null
        },
        include: {
          cv: {
            select: {
              id: true,
              fullName: true,
              referenceCode: true,
              nationality: true,
              position: true
            }
          }
        }
      })

      // تحديث حالة السيرة الذاتية إلى HIRED
      await tx.cV.update({
        where: { id: booking.cvId },
        data: {
          status: 'HIRED',
          updatedById: user.id
        }
      })

      // حذف الحجز
      await tx.booking.delete({
        where: { id: bookingId }
      })

      // إضافة سجل في ActivityLog
      await tx.activityLog.create({
        data: {
          userId: user.id,
          cvId: booking.cvId,
          action: 'CV_CONTRACTED_FROM_BOOKING',
          description: `تم التعاقد على السيرة الذاتية ${booking.cv.fullName} من الحجز`,
          metadata: {
            originalBookingId: bookingId,
            identityNumber: identityNumber || booking.identityNumber,
            contractDate: contractDate || new Date().toISOString(),
            notes: notes || null,
            contractedAt: new Date().toISOString()
          },
          targetType: 'CV',
          targetId: booking.cvId.toString(),
          targetName: booking.cv.fullName
        }
      })

      return contract
    })

    return NextResponse.json({
      message: 'تم إنشاء التعاقد بنجاح',
      contract: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating contract from booking:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء التعاقد' },
      { status: 500 }
    )
  }
}
