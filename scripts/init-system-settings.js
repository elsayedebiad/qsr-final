const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔧 جاري إنشاء إعدادات النظام الافتراضية...')

    // إنشاء أو تحديث إعداد حالة النظام
    const systemSetting = await prisma.systemSettings.upsert({
      where: { key: 'system_active' },
      update: {},
      create: {
        key: 'system_active',
        value: 'true' // النظام مفعل افتراضياً
      }
    })

    console.log('✅ تم إنشاء إعدادات النظام بنجاح:')
    console.log('   - المفتاح:', systemSetting.key)
    console.log('   - القيمة:', systemSetting.value)
    console.log('   - النظام:', systemSetting.value === 'true' ? 'مفعل ✓' : 'معطل ✗')

  } catch (error) {
    console.error('❌ خطأ في إنشاء إعدادات النظام:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
