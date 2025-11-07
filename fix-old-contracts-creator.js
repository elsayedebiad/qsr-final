const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOldContractsCreator() {
  try {
    console.log('🔍 جاري البحث عن منشئي العقود الفعليين من سجل الأنشطة...');

    // جلب جميع العقود
    const contracts = await prisma.contract.findMany({
      include: {
        cv: {
          select: {
            id: true,
            fullName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 إجمالي العقود: ${contracts.length}`);

    let updated = 0;
    let notFound = 0;

    for (const contract of contracts) {
      // البحث في سجل الأنشطة عن من قام بالتعاقد
      const activityLog = await prisma.activityLog.findFirst({
        where: {
          cvId: contract.cvId,
          OR: [
            { action: { contains: 'CONTRACT' } },
            { action: { contains: 'HIRED' } },
            { action: 'CV_CONTRACTED_FROM_BOOKING' }
          ],
          createdAt: {
            lte: contract.createdAt
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (activityLog && activityLog.userId !== contract.createdById) {
        // تحديث العقد بالمستخدم الصحيح
        await prisma.contract.update({
          where: { id: contract.id },
          data: { createdById: activityLog.userId }
        });

        console.log(`✅ تم تحديث العقد #${contract.id} (${contract.cv.fullName})`);
        console.log(`   من: ${contract.createdBy.name} → إلى: ${activityLog.user.name}`);
        updated++;
      } else if (!activityLog) {
        console.log(`⚠️  لم يتم العثور على سجل للعقد #${contract.id} (${contract.cv.fullName})`);
        notFound++;
      }
    }

    console.log('\n📈 النتائج:');
    console.log(`✅ تم تحديث: ${updated} عقد`);
    console.log(`⚠️  لم يتم العثور على سجل: ${notFound} عقد`);
    console.log(`ℹ️  دون تغيير: ${contracts.length - updated - notFound} عقد`);

  } catch (error) {
    console.error('❌ خطأ في معالجة العقود:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOldContractsCreator();
