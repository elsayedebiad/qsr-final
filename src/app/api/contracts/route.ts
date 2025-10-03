import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - جلب جميع التعاقدات
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 جلب التعاقدات من قاعدة البيانات...')

    const contracts = await prisma.contract.findMany({
      include: {
        cv: {
          select: {
            id: true,
            fullName: true,
            fullNameArabic: true,
            referenceCode: true,
            nationality: true,
            position: true,
            profileImage: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ تم جلب ${contracts.length} تعاقد من قاعدة البيانات`)
    
    return NextResponse.json(contracts)

  } catch (error) {
    console.error('❌ خطأ في جلب التعاقدات:', error)
    return NextResponse.json({ 
      error: 'فشل في جلب التعاقدات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST - إنشاء تعاقد جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cvId, identityNumber, contractDate, notes } = body

    console.log('🔧 إنشاء تعاقد جديد:', { cvId, identityNumber })

    if (!cvId || !identityNumber) {
      return NextResponse.json(
        { error: 'معرف السيرة الذاتية ورقم الهوية مطلوبان' },
        { status: 400 }
      )
    }

    // التحقق من وجود السيرة الذاتية
    const cv = await prisma.cV.findUnique({
      where: { id: Number(cvId) }
    })

    if (!cv) {
      return NextResponse.json(
        { error: 'السيرة الذاتية غير موجودة' },
        { status: 404 }
      )
    }

    // التحقق من عدم وجود تعاقد مسبق
    const existingContract = await prisma.contract.findUnique({
      where: { cvId: Number(cvId) }
    })

    if (existingContract) {
      return NextResponse.json(
        { error: 'هذه السيرة الذاتية متعاقد عليها بالفعل' },
        { status: 400 }
      )
    }

    // إنشاء التعاقد وتحديث حالة السيرة في معاملة واحدة
    const result = await prisma.$transaction(async (tx) => {
      // إنشاء التعاقد
      const contract = await tx.contract.create({
        data: {
          cvId: Number(cvId),
          identityNumber: identityNumber,
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
        where: { id: Number(cvId) },
        data: { status: 'HIRED' }
      })

      // ملاحظة: تم إنشاء التعاقد وتحديث حالة السيرة بنجاح

      return contract
    })

    console.log(`✅ تم إنشاء التعاقد بنجاح للسيرة: ${result.cv.fullName}`)

    return NextResponse.json({
      message: 'تم إنشاء التعاقد بنجاح',
      contract: result
    }, { status: 201 })

  } catch (error) {
    console.error('❌ خطأ في إنشاء التعاقد:', error)
    return NextResponse.json(
      { 
        error: 'فشل في إنشاء التعاقد',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - حذف تعاقد
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const contractId = url.searchParams.get('id')

    if (!contractId) {
      return NextResponse.json(
        { error: 'معرف التعاقد مطلوب' },
        { status: 400 }
      )
    }

    console.log('🗑️ حذف التعاقد:', contractId)

    // البحث عن التعاقد
    const contract = await prisma.contract.findUnique({
      where: { id: Number(contractId) },
      include: { cv: true }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'التعاقد غير موجود' },
        { status: 404 }
      )
    }

    // حذف التعاقد وإرجاع السيرة لحالة NEW
    await prisma.$transaction(async (tx) => {
      // حذف التعاقد
      await tx.contract.delete({
        where: { id: Number(contractId) }
      })

      // إرجاع السيرة لحالة NEW
      await tx.cV.update({
        where: { id: contract.cvId },
        data: { status: 'NEW' }
      })
    })

    console.log(`✅ تم حذف التعاقد وإرجاع السيرة: ${contract.cv.fullName}`)

    return NextResponse.json({
      message: 'تم حذف التعاقد بنجاح'
    })

  } catch (error) {
    console.error('❌ خطأ في حذف التعاقد:', error)
    return NextResponse.json(
      { 
        error: 'فشل في حذف التعاقد',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
