const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function checkCVStatus() {
  try {
    console.log('🔍 فحص حالات السير الذاتية في قاعدة البيانات...\n')

    // إحصائيات عامة
    const totalCVs = await db.cV.count()
    const newCVs = await db.cV.count({ where: { status: 'NEW' } })
    const bookedCVs = await db.cV.count({ where: { status: 'BOOKED' } })
    const hiredCVs = await db.cV.count({ where: { status: 'HIRED' } })

    console.log('📊 إحصائيات عامة:')
    console.log(`📋 إجمالي السير: ${totalCVs}`)
    console.log(`🆕 جديدة (NEW): ${newCVs}`)
    console.log(`📝 محجوزة (BOOKED): ${bookedCVs}`)
    console.log(`✅ متعاقد عليها (HIRED): ${hiredCVs}`)
    console.log()

    // التحقق من التعاقدات
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

    console.log(`💼 عدد التعاقدات في قاعدة البيانات: ${contracts.length}`)
    
    if (contracts.length > 0) {
      console.log('\n📋 تفاصيل التعاقدات:')
      console.log('='.repeat(60))
      
      contracts.forEach((contract, index) => {
        console.log(`${index + 1}. ${contract.cv.fullName}`)
        console.log(`   📊 حالة السيرة: ${contract.cv.status}`)
        console.log(`   🆔 الكود المرجعي: ${contract.cv.referenceCode || 'غير محدد'}`)
        console.log(`   🆔 رقم الهوية: ${contract.identityNumber}`)
        console.log(`   📅 تاريخ التعاقد: ${contract.contractStartDate}`)
        
        if (contract.cv.status !== 'HIRED') {
          console.log(`   ⚠️  تحذير: السيرة متعاقد عليها لكن حالتها ${contract.cv.status} بدلاً من HIRED`)
        }
        console.log()
      })
    }

    // التحقق من السير التي تظهر في صفحات السيلز
    const salesCVs = await db.cV.findMany({
      where: { status: 'NEW' },
      select: {
        id: true,
        fullName: true,
        referenceCode: true,
        status: true
      },
      take: 10
    })

    console.log(`\n🏪 السير التي تظهر في صفحات السيلز (أول 10):`)
    console.log('='.repeat(50))
    
    if (salesCVs.length === 0) {
      console.log('❌ لا توجد سير متاحة في صفحات السيلز!')
      console.log('💡 هذا يعني أن جميع السير إما محجوزة أو متعاقد عليها')
    } else {
      salesCVs.forEach((cv, index) => {
        console.log(`${index + 1}. ${cv.fullName} (${cv.referenceCode || 'بدون كود'}) - ${cv.status}`)
      })
    }

    // البحث عن مشاكل محتملة
    console.log('\n🔍 البحث عن مشاكل محتملة:')
    console.log('='.repeat(40))

    // السير المتعاقد عليها لكن حالتها ليست HIRED
    const problematicCVs = await db.cV.findMany({
      where: {
        status: { not: 'HIRED' },
        contracts: { some: {} }
      },
      include: {
        contracts: true
      }
    })

    if (problematicCVs.length > 0) {
      console.log(`⚠️  وُجد ${problematicCVs.length} سير متعاقد عليها لكن حالتها خاطئة:`)
      problematicCVs.forEach(cv => {
        console.log(`   - ${cv.fullName}: حالة ${cv.status} لكن لديها ${cv.contracts.length} تعاقد`)
      })
    } else {
      console.log('✅ لا توجد مشاكل في حالات السير المتعاقد عليها')
    }

    // السير بحالة HIRED لكن بدون تعاقد
    const hiredWithoutContract = await db.cV.findMany({
      where: {
        status: 'HIRED',
        contracts: { none: {} }
      }
    })

    if (hiredWithoutContract.length > 0) {
      console.log(`⚠️  وُجد ${hiredWithoutContract.length} سير بحالة HIRED لكن بدون تعاقد:`)
      hiredWithoutContract.forEach(cv => {
        console.log(`   - ${cv.fullName} (${cv.referenceCode || 'بدون كود'})`)
      })
    } else {
      console.log('✅ جميع السير بحالة HIRED لديها تعاقدات')
    }

    console.log('\n🎯 الخلاصة:')
    console.log('='.repeat(30))
    
    if (hiredCVs === contracts.length && problematicCVs.length === 0) {
      console.log('✅ النظام يعمل بشكل صحيح!')
      console.log('✅ السير المتعاقد عليها مخفية من صفحات السيلز')
    } else {
      console.log('❌ يوجد مشاكل في النظام تحتاج إصلاح')
      
      if (hiredCVs !== contracts.length) {
        console.log(`   - عدد السير HIRED (${hiredCVs}) لا يطابق عدد التعاقدات (${contracts.length})`)
      }
      
      if (problematicCVs.length > 0) {
        console.log(`   - ${problematicCVs.length} سير متعاقد عليها لكن حالتها خاطئة`)
      }
    }

  } catch (error) {
    console.error('❌ خطأ في فحص البيانات:', error)
  } finally {
    await db.$disconnect()
  }
}

// تشغيل الفحص
checkCVStatus()
