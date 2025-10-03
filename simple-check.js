const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function simpleCheck() {
  try {
    console.log('🔍 فحص بسيط للتعاقدات...\n')

    // عدد التعاقدات
    const contractsCount = await db.contract.count()
    console.log(`💼 عدد التعاقدات: ${contractsCount}`)

    // عدد السير بحالة HIRED
    const hiredCount = await db.cV.count({ where: { status: 'HIRED' } })
    console.log(`✅ عدد السير بحالة HIRED: ${hiredCount}`)

    // عدد السير بحالة NEW
    const newCount = await db.cV.count({ where: { status: 'NEW' } })
    console.log(`🆕 عدد السير بحالة NEW: ${newCount}`)

    if (contractsCount > 0) {
      console.log('\n📋 التعاقدات الموجودة:')
      const contracts = await db.contract.findMany({
        include: {
          cv: {
            select: {
              fullName: true,
              status: true
            }
          }
        },
        take: 5
      })

      contracts.forEach((contract, index) => {
        console.log(`${index + 1}. ${contract.cv.fullName} - حالة: ${contract.cv.status}`)
      })
    }

  } catch (error) {
    console.error('خطأ:', error.message)
  } finally {
    await db.$disconnect()
  }
}

simpleCheck()
