// التحقق من التعاقدات في قاعدة البيانات
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function checkContractsInDB() {
  try {
    console.log('🔍 التحقق من التعاقدات في قاعدة البيانات...\n')

    const dbPath = path.join(__dirname, 'prisma', 'dev.db')
    const db = new sqlite3.Database(dbPath)

    // عرض جميع التعاقدات مع بيانات السير
    db.all(`
      SELECT 
        c.id as contractId,
        c.cvId,
        c.identityNumber,
        c.contractStartDate,
        c.createdAt,
        cv.fullName,
        cv.referenceCode,
        cv.nationality,
        cv.position,
        cv.status
      FROM contracts c
      LEFT JOIN cvs cv ON c.cvId = cv.id
      ORDER BY c.createdAt DESC
    `, (err, contracts) => {
      if (err) {
        console.error('❌ خطأ في قراءة التعاقدات:', err)
        db.close()
        return
      }

      console.log(`📊 عدد التعاقدات الموجودة: ${contracts.length}`)

      if (contracts.length === 0) {
        console.log('❌ لا توجد تعاقدات في قاعدة البيانات')
      } else {
        console.log('\n📋 تفاصيل التعاقدات:')
        console.log('='.repeat(80))
        
        contracts.forEach((contract, index) => {
          console.log(`\n${index + 1}. التعاقد رقم: ${contract.contractId}`)
          console.log(`   👤 الاسم: ${contract.fullName || 'غير محدد'}`)
          console.log(`   🆔 رقم الهوية: ${contract.identityNumber}`)
          console.log(`   🏳️ الجنسية: ${contract.nationality || 'غير محدد'}`)
          console.log(`   💼 الوظيفة: ${contract.position || 'غير محدد'}`)
          console.log(`   📋 الكود المرجعي: ${contract.referenceCode || 'غير محدد'}`)
          console.log(`   📊 حالة السيرة: ${contract.status}`)
          console.log(`   📅 تاريخ التعاقد: ${contract.contractStartDate}`)
          console.log(`   🕐 تاريخ الإنشاء: ${contract.createdAt}`)
        })
      }

      // التحقق من حالات السير
      console.log('\n📊 إحصائيات السير:')
      console.log('='.repeat(40))

      db.get("SELECT COUNT(*) as count FROM cvs WHERE status = 'HIRED'", (err, result) => {
        if (!err) {
          console.log(`✅ السير المتعاقد عليها: ${result.count}`)
        }

        db.get("SELECT COUNT(*) as count FROM cvs WHERE status = 'NEW'", (err, result) => {
          if (!err) {
            console.log(`🆕 السير المتاحة: ${result.count}`)
          }

          db.get("SELECT COUNT(*) as count FROM contracts", (err, result) => {
            if (!err) {
              console.log(`💼 إجمالي التعاقدات: ${result.count}`)
            }

            console.log('\n🔗 للوصول للتعاقدات:')
            console.log('1. سجل دخول في الداشبورد')
            console.log('2. اذهب لصفحة التعاقدات')
            console.log('3. http://localhost:3000/dashboard/contracts')

            db.close()
          })
        })
      })
    })

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

checkContractsInDB()
