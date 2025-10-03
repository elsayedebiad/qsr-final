// إنشاء مستخدم admin تجريبي
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt')
const path = require('path')

async function createAdminUser() {
  try {
    console.log('🔧 إنشاء مستخدم admin تجريبي...\n')

    const dbPath = path.join(__dirname, 'prisma', 'dev.db')
    const db = new sqlite3.Database(dbPath)

    // التحقق من وجود مستخدم admin
    db.get("SELECT * FROM users WHERE email = 'admin@test.com'", async (err, existingUser) => {
      if (err) {
        console.error('❌ خطأ في البحث عن المستخدم:', err)
        db.close()
        return
      }

      if (existingUser) {
        console.log('✅ مستخدم admin موجود بالفعل')
        console.log(`   📧 Email: admin@test.com`)
        console.log(`   🔑 Password: admin123`)
        console.log(`   👤 Role: ${existingUser.role}`)
        db.close()
        return
      }

      // إنشاء مستخدم جديد
      console.log('🔧 إنشاء مستخدم admin جديد...')
      
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const now = new Date().toISOString()

      db.run(`
        INSERT INTO users (email, name, password, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'admin@test.com',
        'Admin User',
        hashedPassword,
        'ADMIN',
        1,
        now,
        now
      ], function(err) {
        if (err) {
          console.error('❌ فشل في إنشاء المستخدم:', err)
        } else {
          console.log('✅ تم إنشاء مستخدم admin بنجاح!')
          console.log(`   🆔 User ID: ${this.lastID}`)
          console.log(`   📧 Email: admin@test.com`)
          console.log(`   🔑 Password: admin123`)
          console.log(`   👤 Role: ADMIN`)
          
          console.log('\n🎯 الآن يمكنك:')
          console.log('1. الذهاب لصفحة تسجيل الدخول: http://localhost:3000/auth/login')
          console.log('2. استخدام البيانات: admin@test.com / admin123')
          console.log('3. الوصول لصفحة التعاقدات: http://localhost:3000/dashboard/contracts')
        }
        
        db.close()
      })
    })

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

createAdminUser()
