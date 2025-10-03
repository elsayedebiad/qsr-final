const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function quickFixContracts() {
  try {
    console.log('🔧 إصلاح سريع لحالات السير المتعاقد عليها...\n')

    // البحث عن جميع التعاقدات
    const contracts = await db.contract.findMany({
      include: {
        cv: {
          select: {
            id: true,
            fullName: true,
            status: true,
            referenceCode: true
          }
        }
      }
    })

    console.log(`💼 عدد التعاقدات الموجودة: ${contracts.length}`)

    if (contracts.length === 0) {
      console.log('❌ لا توجد تعاقدات في قاعدة البيانات')
      return
    }

    let fixedCount = 0
    
    console.log('\n🔍 فحص وإصلاح السير المتعاقد عليها:')
    console.log('='.repeat(60))

    for (const contract of contracts) {
      console.log(`\n📋 ${contract.cv.fullName}`)
      console.log(`   🆔 الكود: ${contract.cv.referenceCode || 'غير محدد'}`)
      console.log(`   📊 الحالة الحالية: ${contract.cv.status}`)
      console.log(`   🆔 رقم الهوية: ${contract.identityNumber}`)

      if (contract.cv.status !== 'HIRED') {
        console.log(`   ⚠️  تحديث الحالة من ${contract.cv.status} إلى HIRED`)
        
        await db.cV.update({
          where: { id: contract.cv.id },
          data: { status: 'HIRED' }
        })
        
        console.log(`   ✅ تم التحديث بنجاح`)
        fixedCount++
      } else {
        console.log(`   ✅ الحالة صحيحة`)
      }
    }

    console.log(`\n🎯 النتائج:`)
    console.log('='.repeat(30))
    console.log(`📊 إجمالي التعاقدات: ${contracts.length}`)
    console.log(`🔧 تم إصلاح: ${fixedCount} سيرة`)
    console.log(`✅ صحيحة مسبقاً: ${contracts.length - fixedCount} سيرة`)

    if (fixedCount > 0) {
      console.log(`\n🎉 تم إصلاح ${fixedCount} سيرة ذاتية!`)
      console.log('✅ السير المتعاقد عليها ستختفي الآن من صفحات السيلز')
    } else {
      console.log('\n✅ جميع السير المتعاقد عليها لديها الحالة الصحيحة')
    }

    // التحقق من النتيجة النهائية
    console.log('\n📊 الإحصائيات النهائية:')
    console.log('='.repeat(40))
    
    const totalCVs = await db.cV.count()
    const newCVs = await db.cV.count({ where: { status: 'NEW' } })
    const bookedCVs = await db.cV.count({ where: { status: 'BOOKED' } })
    const hiredCVs = await db.cV.count({ where: { status: 'HIRED' } })

    console.log(`📋 إجمالي السير: ${totalCVs}`)
    console.log(`🆕 متاحة في السيلز (NEW): ${newCVs}`)
    console.log(`📝 محجوزة (BOOKED): ${bookedCVs}`)
    console.log(`✅ متعاقد عليها (HIRED): ${hiredCVs}`)

    console.log('\n🚀 يمكنك الآن تحديث صفحات السيلز لرؤية النتيجة!')

  } catch (error) {
    console.error('❌ خطأ في الإصلاح:', error)
  } finally {
    await db.$disconnect()
  }
}

// تشغيل الإصلاح
quickFixContracts()
