const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetOldContracts() {
  try {
    console.log('🔄 جاري إعادة تعيين العقود القديمة إلى "غير معروف"...');

    // الحصول على تاريخ اليوم - 7 أيام (العقود الأقدم من أسبوع)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // إعادة تعيين createdById إلى null للعقود القديمة
    const result = await prisma.$executeRaw`
      UPDATE contracts 
      SET "createdById" = NULL
      WHERE "createdAt" < ${oneWeekAgo}
    `;

    console.log(`✅ تم إعادة تعيين العقود القديمة (قبل أسبوع) إلى "غير معروف"`);
    console.log(`📊 عدد العقود المتأثرة: ${result}`);

    // عرض إحصائيات
    const oldContractsWithNull = await prisma.contract.count({
      where: {
        createdById: null
      }
    });

    const recentContractsWithCreator = await prisma.contract.count({
      where: {
        createdById: { not: null }
      }
    });

    console.log('\n📈 الإحصائيات الحالية:');
    console.log(`❓ عقود بدون منشئ معروف: ${oldContractsWithNull}`);
    console.log(`✅ عقود بمنشئ معروف: ${recentContractsWithCreator}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetOldContracts();
