// إنشاء تعاقدات مع أسماء الجداول الصحيحة
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function createContractsFixed() {
  try {
    console.log('🔧 إنشاء تعاقدات تجريبية...\n')

    const dbPath = path.join(__dirname, 'prisma', 'dev.db')
    const db = new sqlite3.Database(dbPath)

    // البحث عن السير المتاحة (اسم الجدول: cvs)
    db.all("SELECT id, fullName, referenceCode FROM cvs WHERE status = 'NEW' LIMIT 3", (err, cvs) => {
      if (err) {
        console.error('❌ خطأ في قراءة السير:', err)
        db.close()
        return
      }

      if (cvs.length === 0) {
        console.log('❌ لا توجد سير متاحة')
        db.close()
        return
      }

      console.log(`🔍 وُجد ${cvs.length} سير متاحة:`)
      cvs.forEach((cv, index) => {
        console.log(`${index + 1}. ${cv.fullName} (${cv.referenceCode || 'بدون كود'})`)
      })

      let completed = 0
      let createdCount = 0
      const sampleIdentityNumbers = ['123456789', '987654321', '456789123']

      cvs.forEach((cv, index) => {
        const identityNumber = sampleIdentityNumbers[index] || `ID${Date.now()}${index}`
        const contractDate = new Date().toISOString()

        console.log(`\n🔧 إنشاء تعاقد لـ: ${cv.fullName}`)
        console.log(`   🆔 رقم الهوية: ${identityNumber}`)

        // إنشاء التعاقد (اسم الجدول: contracts)
        db.run(
          `INSERT INTO contracts (cvId, identityNumber, contractStartDate, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?)`,
          [cv.id, identityNumber, contractDate, contractDate, contractDate],
          function(err) {
            if (err) {
              console.log(`   ❌ فشل في إنشاء التعاقد: ${err.message}`)
            } else {
              console.log(`   ✅ تم إنشاء التعاقد برقم: ${this.lastID}`)
              createdCount++

              // تحديث حالة السيرة إلى HIRED (اسم الجدول: cvs)
              db.run(
                `UPDATE cvs SET status = 'HIRED', updatedAt = ? WHERE id = ?`,
                [contractDate, cv.id],
                (err) => {
                  if (err) {
                    console.log(`   ❌ فشل في تحديث حالة السيرة: ${err.message}`)
                  } else {
                    console.log(`   ✅ تم تحديث حالة السيرة إلى HIRED`)
                  }

                  completed++
                  if (completed === cvs.length) {
                    // عرض النتائج النهائية
                    console.log('\n📊 الإحصائيات النهائية:')
                    console.log('='.repeat(40))
                    
                    db.get("SELECT COUNT(*) as count FROM contracts", (err, result) => {
                      if (!err) {
                        console.log(`💼 إجمالي التعاقدات: ${result.count}`)
                      }

                      db.get("SELECT COUNT(*) as count FROM cvs WHERE status = 'HIRED'", (err, result) => {
                        if (!err) {
                          console.log(`✅ السير المتعاقد عليها: ${result.count}`)
                        }

                        db.get("SELECT COUNT(*) as count FROM cvs WHERE status = 'NEW'", (err, result) => {
                          if (!err) {
                            console.log(`🆕 السير المتاحة في السيلز: ${result.count}`)
                          }
                          
                          console.log('\n🎉 تم إنشاء التعاقدات بنجاح!')
                          console.log(`✅ تم إنشاء ${createdCount} تعاقد جديد`)
                          console.log('✅ السير المتعاقد عليها ستختفي من صفحات السيلز')
                          console.log('✅ ستظهر التعاقدات في صفحة المتعاقدين')
                          console.log('\n🔗 روابط مفيدة:')
                          console.log('   📋 صفحة التعاقدات: http://localhost:3000/dashboard/contracts')
                          console.log('   🏪 صفحة السيلز: http://localhost:3000/sales1')
                          
                          db.close()
                        })
                      })
                    })
                  }
                }
              )
            }
          }
        )
      })
    })

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

createContractsFixed()
