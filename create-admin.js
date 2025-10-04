const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔐 Creating admin account...')
    
    // بيانات الأدمن
    const adminData = {
      email: 'admin@alqaeid.com',
      password: 'Admin@123456',
      name: 'Admin',
      role: 'ADMIN'
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(adminData.password, 10)

    // البحث عن المستخدم أولاً
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email }
    })

    if (existingUser) {
      // تحديث المستخدم الموجود
      const updatedUser = await prisma.user.update({
        where: { email: adminData.email },
        data: {
          password: hashedPassword,
          role: adminData.role,
          name: adminData.name
        }
      })
      
      console.log('✅ Admin account updated successfully!')
      console.log('📧 Email:', adminData.email)
      console.log('🔑 Password:', adminData.password)
      console.log('👤 Role:', updatedUser.role)
    } else {
      // إنشاء مستخدم جديد
      const newUser = await prisma.user.create({
        data: {
          email: adminData.email,
          password: hashedPassword,
          name: adminData.name,
          role: adminData.role
        }
      })
      
      console.log('✅ Admin account created successfully!')
      console.log('📧 Email:', adminData.email)
      console.log('🔑 Password:', adminData.password)
      console.log('👤 Role:', newUser.role)
    }

  } catch (error) {
    console.error('❌ Error creating admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

