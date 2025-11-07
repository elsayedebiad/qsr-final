const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateOldContracts() {
  try {
    console.log('🔄 جاري تحديث العقود القديمة...');

    // البحث عن أول مستخدم أدمن
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'DEVELOPER' }
        ]
      },
      orderBy: {
        id: 'asc'
      }
    });

    if (!adminUser) {
      console.error('❌ لم يتم العثور على مستخدم أدمن');
      return;
    }

    console.log(`✅ سيتم استخدام المستخدم: ${adminUser.name} (${adminUser.email}) كمُنشئ للعقود القديمة`);

    // التحقق من وجود عقود بدون createdById
    const contractsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM contracts WHERE "createdById" IS NULL
    `;
    
    const count = Number(contractsCount[0]?.count || 0);
    console.log(`📊 عدد العقود التي تحتاج للتحديث: ${count}`);

    if (count > 0) {
      // تحديث جميع العقود التي لا تحتوي على createdById باستخدام SQL مباشر
      await prisma.$executeRaw`
        UPDATE contracts 
        SET "createdById" = ${adminUser.id}
        WHERE "createdById" IS NULL
      `;

      console.log(`✅ تم تحديث ${count} عقد بنجاح`);
    } else {
      console.log('ℹ️ جميع العقود محدثة بالفعل');
    }
    
  } catch (error) {
    console.error('❌ خطأ في تحديث العقود:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOldContracts();
