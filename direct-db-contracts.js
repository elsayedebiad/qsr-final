// إنشاء تعاقدات مباشرة في قاعدة البيانات
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function createDirectContracts() {
  try {
    console.log('🔧 إنشاء تعاقدات مباشرة في قاعدة البيانات...\n')

    // الاتصال بقاعدة البيانات
    const dbPath = path.join(__dirname, 'prisma', 'dev.db')
    const db = new sqlite3.Database(dbPath)

    // البحث عن السير المتاحة
    db.all("SELECT id, fullName, referenceCode FROM CV WHERE status = 'NEW' LIMIT 3", (err, cvs) => {
      if (err) {
        console.error('❌ خطأ في قراءة السير:', err)
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
      const sampleIdentityNumbers = ['123456789', '987654321', '456789123']

      cvs.forEach((cv, index) => {
        const identityNumber = sampleIdentityNumbers[index] || `ID${Date.now()}${index}`
        const contractDate = new Date().toISOString()

        console.log(`\n🔧 إنشاء تعاقد لـ: ${cv.fullName}`)

        // إنشاء التعاقد
        db.run(
          `INSERT INTO Contract (cvId, identityNumber, contractStartDate, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?)`,
          [cv.id, identityNumber, contractDate, contractDate, contractDate],
          function(err) {
            if (err) {
              console.log(`   ❌ فشل في إنشاء التعاقد: ${err.message}`)
            } else {
              console.log(`   ✅ تم إنشاء التعاقد برقم: ${this.lastID}`)

              // تحديث حالة السيرة إلى HIRED
              db.run(
                `UPDATE CV SET status = 'HIRED', updatedAt = ? WHERE id = ?`,
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
                    
                    db.get("SELECT COUNT(*) as count FROM Contract", (err, result) => {
                      if (!err) {
                        console.log(`💼 إجمالي التعاقدات: ${result.count}`)
                      }
                    })

                    db.get("SELECT COUNT(*) as count FROM CV WHERE status = 'HIRED'", (err, result) => {
                      if (!err) {
                        console.log(`✅ السير المتعاقد عليها: ${result.count}`)
                      }
                    })

                    db.get("SELECT COUNT(*) as count FROM CV WHERE status = 'NEW'", (err, result) => {
                      if (!err) {
                        console.log(`🆕 السير المتاحة: ${result.count}`)
                      }
                      
                      console.log('\n🎉 تم إنشاء التعاقدات بنجاح!')
                      console.log('✅ يمكنك الآن زيارة صفحة التعاقدات لرؤيتها')
                      console.log('🔗 http://localhost:3000/dashboard/contracts')
                      
                      db.close()
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

createDirectContracts()
