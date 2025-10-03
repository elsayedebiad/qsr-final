// فحص بنية قاعدة البيانات
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function checkDBStructure() {
  try {
    console.log('🔍 فحص بنية قاعدة البيانات...\n')

    const dbPath = path.join(__dirname, 'prisma', 'dev.db')
    const db = new sqlite3.Database(dbPath)

    // عرض جميع الجداول
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ خطأ في قراءة الجداول:', err)
        return
      }

      console.log('📋 الجداول الموجودة:')
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.name}`)
      })

      // البحث عن جدول السير الذاتية
      const cvTable = tables.find(t => t.name.toLowerCase().includes('cv') || t.name.toLowerCase().includes('c_v'))
      
      if (cvTable) {
        console.log(`\n🎯 جدول السير الذاتية: ${cvTable.name}`)
        
        // عرض بنية الجدول
        db.all(`PRAGMA table_info(${cvTable.name})`, (err, columns) => {
          if (!err) {
            console.log('\n📊 أعمدة الجدول:')
            columns.forEach(col => {
              console.log(`   - ${col.name} (${col.type})`)
            })
          }

          // عد السير المتاحة
          db.get(`SELECT COUNT(*) as count FROM ${cvTable.name} WHERE status = 'NEW'`, (err, result) => {
            if (!err) {
              console.log(`\n🆕 عدد السير المتاحة: ${result.count}`)
            }

            // عد السير المتعاقد عليها
            db.get(`SELECT COUNT(*) as count FROM ${cvTable.name} WHERE status = 'HIRED'`, (err, result) => {
              if (!err) {
                console.log(`✅ عدد السير المتعاقد عليها: ${result.count}`)
              }

              // البحث عن جدول التعاقدات
              const contractTable = tables.find(t => t.name.toLowerCase().includes('contract'))
              
              if (contractTable) {
                console.log(`\n💼 جدول التعاقدات: ${contractTable.name}`)
                
                db.get(`SELECT COUNT(*) as count FROM ${contractTable.name}`, (err, result) => {
                  if (!err) {
                    console.log(`📊 عدد التعاقدات: ${result.count}`)
                  }
                  db.close()
                })
              } else {
                console.log('\n❌ لم يتم العثور على جدول التعاقدات')
                db.close()
              }
            })
          })
        })
      } else {
        console.log('\n❌ لم يتم العثور على جدول السير الذاتية')
        db.close()
      }
    })

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

checkDBStructure()
