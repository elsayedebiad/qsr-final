const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function fixCVStatus() {
  try {
    console.log('🔧 إصلاح حالات السير الذاتية...\n')

    // البحث عن السير المتعاقد عليها لكن حالتها ليست HIRED
    const problematicCVs = await db.cV.findMany({
      where: {
        status: { not: 'HIRED' },
        contracts: { some: {} }
      },
      include: {
        contracts: {
          select: {
            id: true,
            identityNumber: true,
            contractStartDate: true
          }
        }
      }
    })

    if (problematicCVs.length > 0) {
      console.log(`⚠️  وُجد ${problematicCVs.length} سير متعاقد عليها لكن حالتها خاطئة:`)
      
      for (const cv of problematicCVs) {
        console.log(`\n🔧 إصلاح: ${cv.fullName}`)
        console.log(`   الحالة الحالية: ${cv.status}`)
        console.log(`   عدد التعاقدات: ${cv.contracts.length}`)
        
        // تحديث الحالة إلى HIRED
        await db.cV.update({
          where: { id: cv.id },
          data: { status: 'HIRED' }
        })
        
        console.log(`   ✅ تم تحديث الحالة إلى HIRED`)
      }
      
      console.log(`\n✅ تم إصلاح ${problematicCVs.length} سير ذاتية`)
    } else {
      console.log('✅ لا توجد مشاكل في حالات السير المتعاقد عليها')
    }

    // البحث عن السير بحالة HIRED لكن بدون تعاقد
    const hiredWithoutContract = await db.cV.findMany({
      where: {
        status: 'HIRED',
        contracts: { none: {} }
      }
    })

    if (hiredWithoutContract.length > 0) {
      console.log(`\n⚠️  وُجد ${hiredWithoutContract.length} سير بحالة HIRED لكن بدون تعاقد:`)
      
      for (const cv of hiredWithoutContract) {
        console.log(`\n🔧 إصلاح: ${cv.fullName}`)
        console.log(`   الحالة الحالية: ${cv.status}`)
        
        // تحديث الحالة إلى NEW (متاحة للحجز)
        await db.cV.update({
          where: { id: cv.id },
          data: { status: 'NEW' }
        })
        
        console.log(`   ✅ تم تحديث الحالة إلى NEW`)
      }
      
      console.log(`\n✅ تم إصلاح ${hiredWithoutContract.length} سير ذاتية`)
    } else {
      console.log('\n✅ جميع السير بحالة HIRED لديها تعاقدات')
    }

    // إحصائيات نهائية
    console.log('\n📊 الإحصائيات بعد الإصلاح:')
    console.log('='.repeat(40))
    
    const totalCVs = await db.cV.count()
    const newCVs = await db.cV.count({ where: { status: 'NEW' } })
    const bookedCVs = await db.cV.count({ where: { status: 'BOOKED' } })
    const hiredCVs = await db.cV.count({ where: { status: 'HIRED' } })
    const contracts = await db.contract.count()

    console.log(`📋 إجمالي السير: ${totalCVs}`)
    console.log(`🆕 جديدة (NEW): ${newCVs}`)
    console.log(`📝 محجوزة (BOOKED): ${bookedCVs}`)
    console.log(`✅ متعاقد عليها (HIRED): ${hiredCVs}`)
    console.log(`💼 عدد التعاقدات: ${contracts}`)

    if (hiredCVs === contracts) {
      console.log('\n🎉 تم الإصلاح بنجاح! النظام يعمل بشكل صحيح الآن')
      console.log('✅ السير المتعاقد عليها ستختفي من صفحات السيلز')
    } else {
      console.log('\n⚠️  لا تزال هناك مشاكل تحتاج مراجعة يدوية')
    }

  } catch (error) {
    console.error('❌ خطأ في إصلاح البيانات:', error)
  } finally {
    await db.$disconnect()
  }
}

// تشغيل الإصلاح
fixCVStatus()
