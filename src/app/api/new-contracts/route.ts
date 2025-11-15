import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, NewContractStatus, ContractType } from '@prisma/client'
import { cache, CACHE_KEYS, CACHE_TTL, invalidateContractCache } from '@/lib/cache'

const prisma = new PrismaClient()

// GET - جلب جميع العقود
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const salesRep = searchParams.get('salesRep')

    if (id) {
      // محاولة الحصول على العقد من الـ cache أولاً
      const cacheKey = CACHE_KEYS.NEW_CONTRACT_BY_ID(parseInt(id))
      const cachedContract = cache.get(cacheKey)
      
      if (cachedContract) {
        return NextResponse.json(cachedContract)
      }

      // جلب عقد واحد
      const contract = await prisma.newContract.findUnique({
        where: { id: parseInt(id) },
        include: {
          statusChanges: {
            include: {
              changedBy: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              changedAt: 'desc'
            }
          },
          followUpNotesHistory: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      })

      if (!contract) {
        return NextResponse.json(
          { error: 'العقد غير موجود' },
          { status: 404 }
        )
      }

      // حفظ في الـ cache
      cache.set(cacheKey, contract, CACHE_TTL.MEDIUM)

      return NextResponse.json(contract)
    }

    // جلب جميع العقود مع الفلترة
    // إذا لم يكن هناك فلاتر، استخدم الـ cache
    if (!status && !salesRep) {
      const cachedContracts = cache.get(CACHE_KEYS.ALL_NEW_CONTRACTS)
      if (cachedContracts) {
        return NextResponse.json(cachedContracts)
      }
    }

    const where: any = {}
    if (status) {
      where.status = status as NewContractStatus
    }
    if (salesRep) {
      where.salesRepName = salesRep
    }

    const contracts = await prisma.newContract.findMany({
      where,
      include: {
        statusChanges: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            changedAt: 'desc'
          }
        },
        followUpNotesHistory: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // حفظ في الـ cache إذا لم يكن هناك فلاتر
    if (!status && !salesRep) {
      cache.set(CACHE_KEYS.ALL_NEW_CONTRACTS, contracts, CACHE_TTL.SHORT)
    }

    return NextResponse.json(contracts)
  } catch (error) {
    console.error('❌ خطأ في جلب العقود:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب العقود' },
      { status: 500 }
    )
  }
}

// POST - إنشاء عقد جديد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // التحقق من البيانات المطلوبة
    const requiredFields = [
      'contractType',
      'salesRepName',
      'clientName',
      'contractNumber',
      'countryName',
      'profession',
      'employerIdNumber',
      'workerPassportNumber',
      'office',
      'createdById'
    ]

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `الحقل ${field} مطلوب` },
          { status: 400 }
        )
      }
    }

    // التحقق من عدم تكرار رقم العقد
    const existingContract = await prisma.newContract.findUnique({
      where: { contractNumber: data.contractNumber }
    })

    if (existingContract) {
      return NextResponse.json(
        { error: 'رقم العقد موجود بالفعل' },
        { status: 400 }
      )
    }

    // الحصول على الشهر الحالي
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1

    // إنشاء العقد
    const contract = await prisma.newContract.create({
      data: {
        contractType: data.contractType as ContractType,
        salesRepName: data.salesRepName,
        clientName: data.clientName,
        contractNumber: data.contractNumber,
        supportMobileNumber: data.supportMobileNumber || null,
        salesMobileNumber: data.salesMobileNumber || null,
        currentMonth: data.currentMonth || currentMonth,
        currentDate: data.currentDate ? new Date(data.currentDate) : currentDate,
        countryName: data.countryName,
        profession: data.profession,
        employerIdNumber: data.employerIdNumber,
        workerPassportNumber: data.workerPassportNumber,
        office: data.office,
        status: data.status || NewContractStatus.CV_REQUEST,
        followUpNotes: data.followUpNotes || null,
        hasCVIssue: data.hasCVIssue || false,
        cvIssueType: data.cvIssueType || null,
        createdById: data.createdById,
        statusHistory: {
          [NewContractStatus.CV_REQUEST]: currentDate.toISOString()
        }
      },
      include: {
        statusChanges: true
      }
    })

    // إنشاء سجل تغيير الحالة الأولي
    await prisma.contractStatusChange.create({
      data: {
        contractId: contract.id,
        fromStatus: null,
        toStatus: NewContractStatus.CV_REQUEST,
        changedById: data.createdById,
        notes: 'إنشاء العقد'
      }
    })

    // حذف الـ cache لتحديثه
    invalidateContractCache()

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('❌ خطأ في إنشاء العقد:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء العقد' },
      { status: 500 }
    )
  }
}

// PUT - تحديث عقد
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'معرف العقد مطلوب' },
        { status: 400 }
      )
    }

    const data = await request.json()

    // التحقق من وجود العقد
    const existingContract = await prisma.newContract.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingContract) {
      return NextResponse.json(
        { error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    // تحديث البيانات
    const updateData: any = {}
    
    // الحقول القابلة للتحديث
    if (data.contractType) updateData.contractType = data.contractType
    if (data.salesRepName) updateData.salesRepName = data.salesRepName
    if (data.clientName) updateData.clientName = data.clientName
    if (data.supportMobileNumber !== undefined) updateData.supportMobileNumber = data.supportMobileNumber
    if (data.salesMobileNumber !== undefined) updateData.salesMobileNumber = data.salesMobileNumber
    if (data.countryName) updateData.countryName = data.countryName
    if (data.profession) updateData.profession = data.profession
    if (data.employerIdNumber) updateData.employerIdNumber = data.employerIdNumber
    if (data.workerPassportNumber) updateData.workerPassportNumber = data.workerPassportNumber
    if (data.office) updateData.office = data.office
    if (data.followUpNotes !== undefined) updateData.followUpNotes = data.followUpNotes
    if (data.hasCVIssue !== undefined) updateData.hasCVIssue = data.hasCVIssue
    if (data.cvIssueType !== undefined) updateData.cvIssueType = data.cvIssueType

    // تحديث الحالة
    if (data.status && data.status !== existingContract.status) {
      updateData.status = data.status
      updateData.lastStatusUpdate = new Date()

      // تحديث تاريخ الحالات
      const statusHistory = existingContract.statusHistory as any || {}
      statusHistory[data.status] = new Date().toISOString()
      updateData.statusHistory = statusHistory

      // تحديث تاريخ طلب رفع السيرة
      if (data.status === NewContractStatus.CV_REQUEST && data.cvUploadRequestDate) {
        updateData.cvUploadRequestDate = new Date(data.cvUploadRequestDate)
      }

      // تحديث تاريخ طلب التوظيف
      if (data.status === NewContractStatus.EXTERNAL_OFFICE_APPROVAL && data.employmentRequestDate) {
        updateData.employmentRequestDate = new Date(data.employmentRequestDate)
      }

      // إنشاء سجل تغيير الحالة
      if (data.changedById) {
        await prisma.contractStatusChange.create({
          data: {
            contractId: parseInt(id),
            fromStatus: existingContract.status,
            toStatus: data.status,
            changedById: data.changedById,
            notes: data.statusChangeNotes || null
          }
        })
      }
    }

    const updatedContract = await prisma.newContract.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        statusChanges: {
          orderBy: {
            changedAt: 'desc'
          }
        }
      }
    })

    // حذف الـ cache لتحديثه
    invalidateContractCache()

    return NextResponse.json(updatedContract)
  } catch (error) {
    console.error('❌ خطأ في تحديث العقد:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث العقد' },
      { status: 500 }
    )
  }
}

// DELETE - حذف عقد
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'معرف العقد مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من وجود العقد
    const existingContract = await prisma.newContract.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingContract) {
      return NextResponse.json(
        { error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    // حذف العقد
    await prisma.newContract.delete({
      where: { id: parseInt(id) }
    })

    // حذف الـ cache لتحديثه
    invalidateContractCache()

    return NextResponse.json({ message: 'تم حذف العقد بنجاح' })
  } catch (error) {
    console.error('❌ خطأ في حذف العقد:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف العقد' },
      { status: 500 }
    )
  }
}

