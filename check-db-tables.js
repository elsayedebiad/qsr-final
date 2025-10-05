const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function checkDatabaseTables() {
  try {
    console.log('🔍 فحص جداول قاعدة البيانات...\n')

    const dbPath = path.join(__dirname, 'prisma', 'dev.db')
    const db = new sqlite3.Database(dbPath)

    // عرض جميع الجداول
    db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `, (err, tables) => {
      if (err) {
        console.error('❌ خطأ في قراءة الجداول:', err)
        db.close()
        return
      }

      console.log(`📊 عدد الجداول الموجودة: ${tables.length}`)
      console.log('\n📋 قائمة الجداول:')
      console.log('='.repeat(40))
      
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.name}`)
      })

      // فحص جدول السير الذاتية
      if (tables.some(t => t.name === 'cvs')) {
        console.log('\n🔍 فحص جدول السير الذاتية (cvs):')
        db.all(`
          SELECT COUNT(*) as total,
                 COUNT(profileImage) as withImages
          FROM cvs 
          WHERE profileImage IS NOT NULL AND profileImage != ''
        `, (err, result) => {
          if (!err && result.length > 0) {
            console.log(`📁 إجمالي السير: ${result[0].total}`)
            console.log(`🖼️ السير مع صور: ${result[0].withImages}`)
          }

          // عرض عينة من السير مع الصور
          db.all(`
            SELECT id, fullName, profileImage, status
            FROM cvs 
            WHERE profileImage IS NOT NULL AND profileImage != ''
            LIMIT 5
          `, (err, cvs) => {
            if (!err && cvs.length > 0) {
              console.log('\n📋 عينة من السير مع الصور:')
              cvs.forEach(cv => {
                console.log(`- ${cv.fullName}: ${cv.profileImage}`)
              })
            }
            db.close()
          })
        })
      } else {
        console.log('\n❌ جدول السير الذاتية (cvs) غير موجود')
        db.close()
      }
    })

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

checkDatabaseTables()
