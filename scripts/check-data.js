const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 فحص البيانات في قاعدة البيانات...\n')
    
    // فحص الاتصال
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ الاتصال بقاعدة البيانات: نجح')
    
    // فحص السير الذاتية
    const cvCount = await prisma.cV.count()
    console.log(`📄 إجمالي السير الذاتية: ${cvCount}`)
    
    if (cvCount > 0) {
      // فحص البيانات المهمة للفلاتر
      const experienceData = await prisma.cV.groupBy({
        by: ['experience'],
        _count: {
          experience: true
        },
        where: {
          experience: {
            not: null
          }
        }
      })
      
      console.log('\n📊 توزيع الخبرات:')
      experienceData.forEach(item => {
        console.log(`   - ${item.experience}: ${item._count.experience}`)
      })
      
      // فحص مستويات اللغات
      const arabicLevels = await prisma.cV.groupBy({
        by: ['arabicLevel'],
        _count: {
          arabicLevel: true
        },
        where: {
          arabicLevel: {
            not: null
          }
        }
      })
      
      console.log('\n🇸🇦 مستويات اللغة العربية:')
      arabicLevels.forEach(item => {
        console.log(`   - ${item.arabicLevel}: ${item._count.arabicLevel}`)
      })
      
      const englishLevels = await prisma.cV.groupBy({
        by: ['englishLevel'],
        _count: {
          englishLevel: true
        },
        where: {
          englishLevel: {
            not: null
          }
        }
      })
      
      console.log('\n🇺🇸 مستويات اللغة الإنجليزية:')
      englishLevels.forEach(item => {
        console.log(`   - ${item.englishLevel}: ${item._count.englishLevel}`)
      })
      
      // فحص المستويات التعليمية
      const educationLevels = await prisma.cV.groupBy({
        by: ['educationLevel'],
        _count: {
          educationLevel: true
        },
        where: {
          educationLevel: {
            not: null
          }
        }
      })
      
      console.log('\n🎓 المستويات التعليمية:')
      educationLevels.forEach(item => {
        console.log(`   - ${item.educationLevel}: ${item._count.educationLevel}`)
      })
      
    } else {
      console.log('⚠️  لا توجد سير ذاتية في قاعدة البيانات')
      console.log('💡 تأكد من رفع البيانات أولاً')
    }
    
    // فحص المستخدمين
    const userCount = await prisma.user.count()
    console.log(`\n👥 إجمالي المستخدمين: ${userCount}`)
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      })
      
      console.log('\n👤 المستخدمون:')
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'نشط' : 'غير نشط'}`)
      })
    } else {
      console.log('⚠️  لا يوجد مستخدمون في قاعدة البيانات')
      console.log('💡 قم بإنشاء حساب مدير أولاً: npm run create-developer')
    }
    
    console.log('\n✅ انتهى فحص البيانات')
    
  } catch (error) {
    console.error('❌ خطأ في فحص البيانات:', error.message)
    
    if (error.code === 'P1001') {
      console.log('\n💡 نصائح لحل مشكلة الاتصال:')
      console.log('   1. تأكد من أن PostgreSQL يعمل')
      console.log('   2. تحقق من DATABASE_URL في ملف .env')
      console.log('   3. تأكد من صحة بيانات الاتصال')
    }
    
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل الفحص
checkData()
