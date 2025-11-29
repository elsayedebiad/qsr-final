import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // ADMIN له وصول كامل دائماً، غيره يحتاج صلاحية SALES
    if (user.role !== 'ADMIN') {
      if (user.role !== 'USER' && user.role !== 'SALES') {
        return NextResponse.json(
          { success: false, message: 'ليس لديك صلاحية الوصول لهذه البيانات' },
          { status: 403 }
        )
      }
    }

    // جلب معاملات البحث
    const { searchParams } = new URL(request.url)
    const salesPageId = searchParams.get('salesPageId')
    const isArchived = searchParams.get('isArchived') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    // بناء الفلتر
    const where: any = {
      isArchived,
      AND: []
    }

    // إضافة البحث
    if (search.trim()) {
      // تنظيف رقم البحث من الرموز للبحث بالأرقام فقط
      const cleanSearchNumber = search.replace(/[^0-9]/g, '')
      
      // إذا كان البحث يحتوي على أرقام، نبحث في رقم الهاتف بعدة طرق
      if (cleanSearchNumber) {
        const searchConditions: any[] = [
          // البحث بالنص الأصلي (مع + والمسافات)
          { phoneNumber: { contains: search, mode: 'insensitive' } },
          // البحث بالأرقام فقط
          { phoneNumber: { contains: cleanSearchNumber } },
          // البحث في الاسم
          { name: { contains: search, mode: 'insensitive' } }
        ]
        
        // إذا كان البحث يبدأ بـ +966 أو 966، أضف بحث بـ 0
        if (cleanSearchNumber.startsWith('966')) {
          const numberWithoutCountryCode = '0' + cleanSearchNumber.substring(3)
          searchConditions.push({ phoneNumber: { contains: numberWithoutCountryCode } })
        }
        // إذا كان البحث يبدأ بـ 0، أضف بحث بـ +966
        else if (cleanSearchNumber.startsWith('0')) {
          const numberWithCountryCode = '966' + cleanSearchNumber.substring(1)
          searchConditions.push({ phoneNumber: { contains: numberWithCountryCode } })
          searchConditions.push({ phoneNumber: { contains: '+966' + cleanSearchNumber.substring(1) } })
        }
        
        where.AND.push({ OR: searchConditions })
      } else {
        // البحث في الاسم فقط إذا لم يكن هناك أرقام
        where.AND.push({
          name: { contains: search, mode: 'insensitive' }
        })
      }
    }

    // فلترة حسب الأرقام المحولة والمسحوبة
    const showExpired = searchParams.get('showExpired') === 'true'
    const showWithdrawn = searchParams.get('showWithdrawn') === 'true'
    const contactFilter = searchParams.get('contactFilter')
    
    if (user.role === 'ADMIN') {
      if (showWithdrawn) {
        // فلترة الأرقام المسحوبة (أرقام منتهية ولم يتم التواصل معها ولم يتم تحويلها)
        where.isExpired = true
        where.isTransferred = false // ليست محولة
        where.isContacted = false   // لم يتم التواصل معها
      } else if (showExpired) {
        // عرض المحولة فقط
        where.isExpired = true
      } else {
        // فلترة عادية حسب حالة التواصل
        if (contactFilter === 'contacted') {
          where.isContacted = true
        } else if (contactFilter === 'not-contacted') {
          where.isContacted = false
        }
      }
    }
    // لا نضيف فلتر isExpired للأدمن عند اختيار "جميع الأرقام" (يرى الكل)
    // المستخدمون العاديون: يتم فلترة الأرقام المحولة حسب حالة المؤقت في الشرط OR أدناه

    // فلترة حسب صلاحيات المستخدم
    if (user.role !== 'ADMIN' && user.salesPages && user.salesPages.length > 0) {
      // المستخدم العادي يرى:
      // 1. أرقام صفحاته (غير المنتهية أو المتواصل معها)
      // 2. الأرقام المحولة إليه (فقط المنتهية أو بدون مؤقت)
      where.AND = where.AND || []
      where.AND.push({
        OR: [
          // الشرط 1: أرقام صفحاته (غير المنتهية أو المتواصل معها)
          {
            salesPageId: {
              in: user.salesPages
            },
            OR: [
              { isExpired: false }, // الأرقام النشطة
              { isContacted: true }  // الأرقام التي تم التواصل معها (حتى لو منتهية)
            ]
          },
          // الشرط 2: الأرقام المحولة إليه المنتهية (isExpired = true)
          {
            isTransferred: true,
            transferredToUserId: user.id,
            isExpired: true
          },
          // الشرط 3: الأرقام المحولة إليه بدون مؤقت (deadlineAt = null)
          {
            isTransferred: true,
            transferredToUserId: user.id,
            deadlineAt: null
          }
        ]
      })
    } else if (salesPageId && salesPageId !== 'ALL') {
      // المدير يمكنه فلترة بصفحة محددة
      // يبحث في salesPageId الحالي أو originalSalesPageId (للأرقام المحولة)
      where.AND = where.AND || []
      where.AND.push({
        OR: [
          { salesPageId: salesPageId },
          { originalSalesPageId: salesPageId }
        ]
      })
    }
    
    // تنظيف: إذا لم يكن هناك شروط AND، نحذف المصفوفة
    if (where.AND && where.AND.length === 0) {
      delete where.AND
    }

    // جلب العدد الكلي
    const totalCount = await db.phoneNumber.count({ where })

    // جلب البيانات
    const phoneNumbers = await db.phoneNumber.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      include: {
        transferredToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // إخفاء الأرقام المحجوبة من المصدر (Backend) لحماية البيانات
    const processedPhoneNumbers = phoneNumbers.map(number => {
      // الأدمن يرى كل شيء
      if (user.role === 'ADMIN') {
        return number
      }

      // إذا تم التواصل → غير محجوب
      if (number.isContacted) {
        return number
      }

      // إذا كان محولاً
      if (number.isTransferred) {
        const isCurrentRecipient = number.transferredToUserId === user.id
        const isOriginalOwner = user.salesPages && user.salesPages.includes(number.originalSalesPageId || number.salesPageId)
        
        // إذا انتهى الوقت
        if (number.isExpired) {
          // المحول إليه الحالي → يرى الرقم واضحاً
          if (isCurrentRecipient) {
            return number
          }
          // أي شخص آخر (المالك الأصلي أو المحول السابق) → مخفي
          return {
            ...number,
            phoneNumber: '****** (تم سحب الرقم)',
            isBlocked: true
          }
        }

        // إذا لم ينتهي الوقت بعد
        if (number.deadlineAt && !number.isExpired) {
          // المحول إليه الحالي → مخفي حتى ينتهي الوقت
          if (isCurrentRecipient) {
            return {
              ...number,
              phoneNumber: '****** (في انتظار انتهاء المؤقت)',
              isBlocked: true
            }
          }
          // المالك الأصلي → يرى واضحاً (لديه فرصة لاستعادته عند انتهاء الوقت)
          if (isOriginalOwner) {
            return number
          }
          // أي شخص آخر (محول سابق) → مخفي
          return {
            ...number,
            phoneNumber: '****** (محول لشخص آخر)',
            isBlocked: true
          }
        }

        // تحويل بدون مؤقت (فوري)
        if (!number.deadlineAt) {
          // المحول إليه → يرى واضحاً
          if (isCurrentRecipient) {
            return number
          }
          // أي شخص آخر → مخفي
          return {
            ...number,
            phoneNumber: '****** (محول)',
            isBlocked: true
          }
        }
      }

      // غير محجوب
      return number
    })

    // إحصائيات إضافية
    const statsWhere: any = {
      isArchived: false,
      // استثناء الأرقام المحولة (المنتهية) لتجنب الحساب المزدوج
      NOT: {
        isExpired: true
      }
    }

    // فلترة الإحصائيات حسب صلاحيات المستخدم
    if (user.role !== 'ADMIN' && user.salesPages && user.salesPages.length > 0) {
      statsWhere.salesPageId = {
        in: user.salesPages
      }
    }

    const stats = await db.phoneNumber.groupBy({
      by: ['salesPageId'],
      where: statsWhere,
      _count: {
        id: true
      }
    })

    const statsBySalesPage = stats.reduce((acc: any, stat) => {
      acc[stat.salesPageId] = stat._count.id
      return acc
    }, {})

    // حساب عدد الأرقام المحولة (للأدمن فقط)
    let transferredCount = 0
    if (user.role === 'ADMIN') {
      const transferredWhere: any = {
        isArchived: false,
        isExpired: true,
        isTransferred: true
      }
      
      // إضافة فلتر الصفحة إذا كان محدداً
      if (salesPageId && salesPageId !== 'ALL') {
        transferredWhere.AND = [
          {
            OR: [
              { salesPageId: salesPageId },
              { originalSalesPageId: salesPageId }
            ]
          }
        ]
      }
      
      transferredCount = await db.phoneNumber.count({
        where: transferredWhere
      })
    }

    // حساب عدد الأرقام المسحوبة (للأدمن فقط)
    let withdrawnCount = 0
    if (user.role === 'ADMIN') {
      const withdrawnWhere: any = {
        isArchived: false,
        isExpired: true,
        isTransferred: false, // ليست محولة
        isContacted: false    // لم يتم التواصل معها
      }
      
      // إضافة فلتر الصفحة إذا كان محدداً
      if (salesPageId && salesPageId !== 'ALL') {
        withdrawnWhere.AND = [
          {
            OR: [
              { salesPageId: salesPageId },
              { originalSalesPageId: salesPageId }
            ]
          }
        ]
      }
      
      withdrawnCount = await db.phoneNumber.count({
        where: withdrawnWhere
      })
    }

    return NextResponse.json({
      success: true,
      data: processedPhoneNumbers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: statsBySalesPage,
      transferredCount: transferredCount,
      withdrawnCount: withdrawnCount
    })

  } catch (error) {
    console.error('❌ Error fetching phone numbers:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    )
  }
}

// تحديث حالة الأرشفة
export async function PATCH(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // ADMIN له صلاحية كاملة، غيره يحتاج صلاحية SALES
    if (user.role !== 'ADMIN') {
      if (user.role !== 'USER' && user.role !== 'SALES') {
        return NextResponse.json(
          { success: false, message: 'ليس لديك صلاحية تعديل هذه البيانات' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { id, isArchived, isContacted, notes, name } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'معرف الرقم مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من صلاحية المستخدم لتعديل هذا الرقم
    const phoneNumber = await db.phoneNumber.findUnique({
      where: { id },
      select: {
        salesPageId: true,
        isTransferred: true,
        transferredToUserId: true
      }
    })

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'الرقم غير موجود' },
        { status: 404 }
      )
    }

    // ADMIN له صلاحية كاملة على كل الأرقام
    // المستخدم العادي يمكنه تعديل:
    // 1. أرقام صفحاته
    // 2. أرقام محولة إليه
    if (user.role !== 'ADMIN') {
      const hasAccessToPage = user.salesPages && user.salesPages.includes(phoneNumber.salesPageId)
      const isTransferredToUser = phoneNumber.isTransferred && phoneNumber.transferredToUserId === user.id

      if (!hasAccessToPage && !isTransferredToUser) {
        return NextResponse.json(
          { success: false, message: 'غير مسموح بتعديل هذا الرقم' },
          { status: 403 }
        )
      }
    }

    // بناء بيانات التحديث
    const updateData: any = {}
    if (typeof isArchived !== 'undefined') {
      updateData.isArchived = isArchived
    }
    if (typeof isContacted !== 'undefined') {
      updateData.isContacted = isContacted
      // إذا تم التواصل، نضيف التاريخ
      if (isContacted) {
        updateData.contactedAt = new Date()

        // حذف المؤقت فقط - الرقم يبقى عند من تواصل
        // لا نلغي التحويل - من يتواصل أولاً يحتفظ بالرقم
        updateData.deadlineAt = null
        updateData.deadlineHours = null
        updateData.deadlineMinutes = null
        updateData.deadlineSeconds = null
        updateData.isExpired = false
        updateData.expiredAt = null
      }
    }
    if (typeof notes !== 'undefined') {
      updateData.notes = notes
    }
    if (typeof name !== 'undefined' && name.trim() !== '') {
      updateData.name = name
    }

    const updated = await db.phoneNumber.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: isArchived !== undefined
        ? (isArchived ? 'تم الأرشفة بنجاح' : 'تم الاستعادة بنجاح')
        : 'تم التحديث بنجاح',
      data: updated
    })

  } catch (error) {
    console.error('❌ Error updating phone number:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء التحديث' },
      { status: 500 }
    )
  }
}

// حذف رقم هاتف
export async function DELETE(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // فقط ADMIN يمكنه الحذف (ليس SUB_ADMIN أو CUSTOMER_SERVICE)
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'غير مسموح بالحذف' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'معرف الرقم مطلوب' },
        { status: 400 }
      )
    }

    await db.phoneNumber.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: 'تم الحذف بنجاح'
    })

  } catch (error) {
    console.error('❌ Error deleting phone number:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    )
  }
}
