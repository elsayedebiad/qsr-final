const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function createSampleContracts() {
  try {
    console.log('🔧 إنشاء تعاقدات تجريبية...\n')

    // البحث عن السير المتاحة لإنشاء تعاقدات لها
    const availableCVs = await db.cV.findMany({
      where: {
        status: 'NEW'
      },
      select: {
        id: true,
        fullName: true,
        referenceCode: true,
        nationality: true,
        position: true
      },
      take: 3 // أخذ أول 3 سير فقط للتجربة
    })

    console.log(`🔍 وُجد ${availableCVs.length} سير متاحة لإنشاء تعاقدات`)

    if (availableCVs.length === 0) {
      console.log('❌ لا توجد سير متاحة لإنشاء تعاقدات')
      
      // التحقق من السير الموجودة
      const totalCVs = await db.cV.count()
      const hiredCVs = await db.cV.count({ where: { status: 'HIRED' } })
      const bookedCVs = await db.cV.count({ where: { status: 'BOOKED' } })
      
      console.log(`📊 إجمالي السير: ${totalCVs}`)
      console.log(`✅ متعاقد عليها: ${hiredCVs}`)
      console.log(`📝 محجوزة: ${bookedCVs}`)
      
      return
    }

    console.log('\n📋 السير التي سيتم التعاقد معها:')
    console.log('='.repeat(50))

    let createdCount = 0
    const sampleIdentityNumbers = ['123456789', '987654321', '456789123']

    for (let i = 0; i < availableCVs.length; i++) {
      const cv = availableCVs[i]
      const identityNumber = sampleIdentityNumbers[i] || `ID${Date.now()}${i}`
      
      console.log(`\n🔧 إنشاء تعاقد لـ: ${cv.fullName}`)
      console.log(`   🆔 الكود: ${cv.referenceCode || 'غير محدد'}`)
      console.log(`   🏳️ الجنسية: ${cv.nationality || 'غير محدد'}`)
      console.log(`   💼 الوظيفة: ${cv.position || 'غير محدد'}`)
      console.log(`   🆔 رقم الهوية: ${identityNumber}`)

      try {
        // إنشاء التعاقد وتحديث حالة السيرة في معاملة واحدة
        await db.$transaction(async (tx) => {
          // إنشاء التعاقد
          const contract = await tx.contract.create({
            data: {
              cvId: cv.id,
              identityNumber: identityNumber,
              contractStartDate: new Date(),
              contractEndDate: null
            }
          })

          // تحديث حالة السيرة إلى HIRED
          await tx.cV.update({
            where: { id: cv.id },
            data: { status: 'HIRED' }
          })

          console.log(`   ✅ تم إنشاء التعاقد برقم: ${contract.id}`)
          console.log(`   ✅ تم تحديث حالة السيرة إلى HIRED`)
        })

        createdCount++

      } catch (error) {
        console.log(`   ❌ فشل في إنشاء التعاقد: ${error.message}`)
      }
    }

    console.log(`\n🎯 النتائج:`)
    console.log('='.repeat(30))
    console.log(`📊 إجمالي السير: ${availableCVs.length}`)
    console.log(`✅ تم إنشاء: ${createdCount} تعاقد`)
    console.log(`❌ فشل: ${availableCVs.length - createdCount} تعاقد`)

    if (createdCount > 0) {
      console.log(`\n🎉 تم إنشاء ${createdCount} تعاقد جديد!`)
      console.log('✅ ستظهر الآن في صفحة المتعاقدين')
      console.log('✅ ستختفي من صفحات السيلز')
    }

    // الإحصائيات النهائية
    console.log('\n📊 الإحصائيات النهائية:')
    console.log('='.repeat(40))
    
    const totalContracts = await db.contract.count()
    const totalHired = await db.cV.count({ where: { status: 'HIRED' } })
    const totalNew = await db.cV.count({ where: { status: 'NEW' } })
    const totalBooked = await db.cV.count({ where: { status: 'BOOKED' } })

    console.log(`💼 إجمالي التعاقدات: ${totalContracts}`)
    console.log(`✅ السير المتعاقد عليها: ${totalHired}`)
    console.log(`🆕 السير المتاحة في السيلز: ${totalNew}`)
    console.log(`📝 السير المحجوزة: ${totalBooked}`)

    console.log('\n🚀 يمكنك الآن:')
    console.log('1. زيارة صفحة المتعاقدين لرؤية التعاقدات الجديدة')
    console.log('2. زيارة صفحات السيلز للتأكد من اختفاء السير المتعاقد عليها')

  } catch (error) {
    console.error('❌ خطأ في إنشاء التعاقدات:', error)
  } finally {
    await db.$disconnect()
  }
}

createSampleContracts()
