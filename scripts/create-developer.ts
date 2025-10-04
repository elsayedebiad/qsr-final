import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createDeveloper() {
  try {
    // التحقق من وجود حساب مطور
    const existingDeveloper = await prisma.user.findFirst({
      where: {
        role: Role.DEVELOPER
      }
    })

    if (existingDeveloper) {
      console.log('✅ حساب المطور موجود بالفعل')
      console.log(`   البريد: ${existingDeveloper.email}`)
      console.log(`   الحالة: ${existingDeveloper.isActive ? 'مفعل' : 'غير مفعل'}`)
      return
    }

    // إنشاء حساب المطور
    const hashedPassword = await bcrypt.hash('developer123', 12)
    
    const developer = await prisma.user.create({
      data: {
        name: 'Developer',
        email: 'developer@system.local',
        password: hashedPassword,
        role: Role.DEVELOPER,
        isActive: true // مفعل افتراضياً
      }
    })

    console.log('✅ تم إنشاء حساب المطور بنجاح!')
    console.log(`   البريد: ${developer.email}`)
    console.log(`   كلمة المرور: developer123`)
    console.log(`   الحالة: مفعل`)
    console.log('\n⚠️  تأكد من تغيير كلمة المرور بعد أول تسجيل دخول!')
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء حساب المطور:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDeveloper()
