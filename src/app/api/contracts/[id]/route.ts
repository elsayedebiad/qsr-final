import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

// DELETE - حذف عقد (للأدمن فقط)
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

    const contractId = parseInt(params.id)

    // جلب معلومات العقد قبل الحذف
    const contract = await db.contract.findUnique({
      where: { id: contractId },
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

    if (!contract) {
      return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 })
    }

    // حذف العقد
    await db.contract.delete({
      where: { id: contractId }
    })

    // تحديث حالة السيرة الذاتية إلى NEW
    await db.cV.update({
      where: { id: contract.cvId },
      data: { 
        status: 'NEW',
        updatedById: decoded.userId
      }
    })

    // إضافة سجل في ActivityLog
    await db.activityLog.create({
      data: {
        userId: decoded.userId,
        cvId: contract.cvId,
        action: 'CONTRACT_DELETED',
        description: `تم حذف عقد السيرة الذاتية ${contract.cv.fullName} (${contract.cv.referenceCode}) - رقم الهوية: ${contract.identityNumber}`,
        metadata: {
          contractId: contract.id,
          identityNumber: contract.identityNumber,
          contractStartDate: contract.contractStartDate.toISOString(),
          contractEndDate: contract.contractEndDate?.toISOString(),
          deletedAt: new Date().toISOString()
        },
        targetType: 'CONTRACT',
        targetId: contract.id.toString(),
        targetName: contract.cv.fullName
      }
    })

    return NextResponse.json({
      message: 'تم حذف العقد بنجاح وإعادة السيرة الذاتية إلى قائمة الجديد',
      contract: {
        id: contract.id,
        cv: contract.cv
      }
    })

  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json({ error: 'فشل في حذف العقد' }, { status: 500 })
  }
}
