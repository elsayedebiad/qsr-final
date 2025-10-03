import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

// DELETE - حذف حجز (للأدمن فقط)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // التحقق من أن المستخدم أدمن
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'غير مصرح - هذه العملية متاحة للأدمن العام فقط' 
      }, { status: 403 })
    }

    const bookingId = parseInt(params.id)

    // جلب معلومات الحجز قبل الحذف
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        cv: {
          select: {
            id: true,
            fullName: true,
            referenceCode: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })
    }

    // حذف الحجز
    await db.booking.delete({
      where: { id: bookingId }
    })

    // تحديث حالة السيرة الذاتية إلى NEW
    await db.cV.update({
      where: { id: booking.cvId },
      data: { 
        status: 'NEW',
        updatedById: decoded.userId
      }
    })

    // إضافة سجل في ActivityLog
    await db.activityLog.create({
      data: {
        userId: decoded.userId,
        cvId: booking.cvId,
        action: 'BOOKING_DELETED',
        description: `تم حذف حجز السيرة الذاتية ${booking.cv.fullName} (${booking.cv.referenceCode}) - رقم الهوية: ${booking.identityNumber}`,
        metadata: {
          bookingId: booking.id,
          identityNumber: booking.identityNumber,
          notes: booking.notes,
          deletedAt: new Date().toISOString()
        },
        targetType: 'BOOKING',
        targetId: booking.id.toString(),
        targetName: booking.cv.fullName
      }
    })

    return NextResponse.json({
      message: 'تم حذف الحجز بنجاح وإعادة السيرة الذاتية إلى قائمة الجديد',
      booking: {
        id: booking.id,
        cv: booking.cv
      }
    })

  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'فشل في حذف الحجز' }, { status: 500 })
  }
}
