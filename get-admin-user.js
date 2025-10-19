const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAdminUser() {
  try {
    // البحث عن أول مستخدم
    const firstUser = await prisma.user.findFirst();
    
    if (firstUser) {
      console.log('✅ تم العثور على مستخدم:');
      console.log(`   ID: ${firstUser.id}`);
      console.log(`   Email: ${firstUser.email}`);
      console.log(`   Name: ${firstUser.name}`);
      console.log('\nاستخدم هذا المعرف في الاستيراد: ', firstUser.id);
    } else {
      console.log('❌ لا يوجد مستخدمين في قاعدة البيانات');
      console.log('يجب إنشاء مستخدم أولاً');
      
      // إنشاء مستخدم افتراضي
      console.log('\n📝 إنشاء مستخدم افتراضي للاستيراد...');
      
      const defaultUser = await prisma.user.create({
        data: {
          email: 'admin@qsr.sa',
          name: 'مدير النظام',
          password: 'admin123', // في الإنتاج يجب تشفير كلمة المرور
          role: 'ADMIN'
        }
      });
      
      console.log('✅ تم إنشاء مستخدم افتراضي:');
      console.log(`   ID: ${defaultUser.id}`);
      console.log(`   Email: ${defaultUser.email}`);
      console.log('\nاستخدم هذا المعرف في الاستيراد: ', defaultUser.id);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getAdminUser();
