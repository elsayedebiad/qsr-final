const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function createMissingContracts() {
  try {
    console.log('🔧 إنشاء التعاقدات المفقودة...\n')

    // البحث عن السير بحالة HIRED لكن بدون تعاقد
    const hiredCVsWithoutContract = await db.cV.findMany({
      where: {
        status: 'HIRED',
        contracts: {
          none: {}
        }
      },
      select: {
        id: true,
        fullName: true,
        referenceCode: true,
        nationality: true,
        position: true
      }
    })

    console.log(`🔍 وُجد ${hiredCVsWithoutContract.length} سير بحالة HIRED بدون تعاقد`)

    if (hiredCVsWithoutContract.length === 0) {
      console.log('✅ جميع السير بحالة HIRED لديها تعاقدات')
      
      // عرض التعاقدات الموجودة
      const existingContracts = await db.contract.count()
      console.log(`💼 عدد التعاقدات الموجودة: ${existingContracts}`)
      
      return
    }

    console.log('\n📋 السير التي تحتاج تعاقدات:')
    console.log('='.repeat(50))

    let createdCount = 0

    for (const cv of hiredCVsWithoutContract) {
      console.log(`\n🔧 إنشاء تعاقد لـ: ${cv.fullName}`)
      console.log(`   🆔 الكود: ${cv.referenceCode || 'غير محدد'}`)
      console.log(`   🏳️ الجنسية: ${cv.nationality || 'غير محدد'}`)
      console.log(`   💼 الوظيفة: ${cv.position || 'غير محدد'}`)

      try {
        // إنشاء تعاقد جديد
        const contract = await db.contract.create({
          data: {
            cvId: cv.id,
            identityNumber: 'غير محدد', // يمكن تحديثه لاحقاً
            contractStartDate: new Date(),
            contractEndDate: null
          }
        })

        console.log(`   ✅ تم إنشاء التعاقد برقم: ${contract.id}`)
        createdCount++

      } catch (error) {
        console.log(`   ❌ فشل في إنشاء التعاقد: ${error.message}`)
      }
    }

    console.log(`\n🎯 النتائج:`)
    console.log('='.repeat(30))
    console.log(`📊 إجمالي السير: ${hiredCVsWithoutContract.length}`)
    console.log(`✅ تم إنشاء: ${createdCount} تعاقد`)
    console.log(`❌ فشل: ${hiredCVsWithoutContract.length - createdCount} تعاقد`)

    if (createdCount > 0) {
      console.log(`\n🎉 تم إنشاء ${createdCount} تعاقد جديد!`)
      console.log('✅ ستظهر الآن في صفحة المتعاقدين')
    }

    // الإحصائيات النهائية
    console.log('\n📊 الإحصائيات النهائية:')
    console.log('='.repeat(40))
    
    const totalContracts = await db.contract.count()
    const totalHired = await db.cV.count({ where: { status: 'HIRED' } })
    const totalNew = await db.cV.count({ where: { status: 'NEW' } })

    console.log(`💼 إجمالي التعاقدات: ${totalContracts}`)
    console.log(`✅ السير المتعاقد عليها: ${totalHired}`)
    console.log(`🆕 السير المتاحة: ${totalNew}`)

    if (totalContracts === totalHired) {
      console.log('\n🎊 النظام متسق! كل سيرة HIRED لديها تعاقد')
    } else {
      console.log('\n⚠️ لا تزال هناك عدم تطابق في البيانات')
    }

  } catch (error) {
    console.error('❌ خطأ في إنشاء التعاقدات:', error)
  } finally {
    await db.$disconnect()
  }
}

createMissingContracts()
