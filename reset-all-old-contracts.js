const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAllOldContracts() {
  try {
    console.log('🔄 جاري إعادة تعيين جميع العقود القديمة التي ليس لها منشئ معروف...');

    // الحصول على المستخدم الذي تم وضعه افتراضياً
    const systemUser = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'DEVELOPER' },
          { role: 'ADMIN' }
        ]
      },
      orderBy: {
        id: 'asc'
      }
    });

    if (!systemUser) {
      console.error('❌ لم يتم العثور على مستخدم النظام');
      return;
    }

    console.log(`📌 المستخدم الافتراضي: ${systemUser.name} (ID: ${systemUser.id})`);

    // البحث عن جميع العقود التي لها نفس المستخدم الافتراضي
    // ولم يكن هناك سجل في ActivityLog يثبت أنه هو من أنشأها
    let resetCount = 0;

    const contracts = await prisma.contract.findMany({
      where: {
        createdById: systemUser.id
      },
      include: {
        cv: true
      }
    });

    console.log(`📊 عدد العقود المرتبطة بالمستخدم الافتراضي: ${contracts.length}`);

    for (const contract of contracts) {
      // البحث في ActivityLog لمعرفة إذا كان هذا المستخدم فعلاً هو من أنشأ العقد
      const activity = await prisma.activityLog.findFirst({
        where: {
          userId: systemUser.id,
          cvId: contract.cvId,
          OR: [
            { action: { contains: 'CONTRACT' } },
            { action: 'CV_CONTRACTED_FROM_BOOKING' }
          ],
          createdAt: {
            lte: contract.updatedAt,
            gte: new Date(contract.createdAt.getTime() - 24 * 60 * 60 * 1000) // يوم قبل
          }
        }
      });

      // إذا لم يكن هناك سجل، إذاً هو عقد قديم تم تحديثه افتراضياً
      if (!activity) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: { createdById: null }
        });
        console.log(`✅ تم إعادة تعيين العقد #${contract.id} (${contract.cv.fullName}) إلى "غير معروف"`);
        resetCount++;
      }
    }

    console.log(`\n📈 النتائج النهائية:`);
    console.log(`✅ تم إعادة تعيين ${resetCount} عقد إلى "غير معروف"`);
    console.log(`ℹ️  ${contracts.length - resetCount} عقد تم إنشاؤها فعلياً بواسطة ${systemUser.name}`);

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllOldContracts();
