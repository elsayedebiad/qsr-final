const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function resetUnknownContracts() {
  try {
    console.log('🔄 جاري إعادة تعيين العقود المتبقية إلى "غير معروف"...\n');

    // قراءة التقرير
    const report = JSON.parse(fs.readFileSync('contract-creators-report.json', 'utf8'));

    console.log(`📊 عدد العقود التي ستُعاد إلى "غير معروف": ${report.notFound.length}\n`);

    let updated = 0;

    for (const item of report.notFound) {
      try {
        await prisma.contract.update({
          where: { id: item.contractId },
          data: { createdById: null }
        });

        console.log(`✅ العقد #${item.contractId} - ${item.cvName}`);
        updated++;

      } catch (error) {
        console.error(`❌ خطأ في العقد #${item.contractId}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`✅ تم إعادة تعيين ${updated} عقد إلى "غير معروف"`);
    
    // الإحصائيات النهائية
    const stats = await prisma.$transaction([
      prisma.contract.count({ where: { createdById: { not: null } } }),
      prisma.contract.count({ where: { createdById: null } }),
      prisma.contract.count()
    ]);

    console.log('\n📈 الإحصائيات النهائية:');
    console.log(`✅ عقود بمنشئ معروف: ${stats[0]}`);
    console.log(`❓ عقود "غير معروف": ${stats[1]}`);
    console.log(`📊 إجمالي العقود: ${stats[2]}`);

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUnknownContracts();
