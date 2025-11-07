const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function applyContractCreators() {
  try {
    console.log('🔄 جاري تطبيق التغييرات على قاعدة البيانات...\n');

    // قراءة التقرير
    if (!fs.existsSync('contract-creators-report.json')) {
      console.error('❌ لم يتم العثور على ملف التقرير!');
      console.log('   قم بتشغيل: node detect-contract-creators.js أولاً');
      return;
    }

    const report = JSON.parse(fs.readFileSync('contract-creators-report.json', 'utf8'));

    console.log(`📊 التقرير يحتوي على ${report.found.length} عقد قابل للتحديث\n`);

    if (report.found.length === 0) {
      console.log('ℹ️  لا توجد عقود للتحديث');
      return;
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of report.found) {
      try {
        // تحديث العقد
        await prisma.contract.update({
          where: { id: item.contractId },
          data: { createdById: item.suggestedCreatorId }
        });

        console.log(`✅ تم تحديث العقد #${item.contractId} (${item.cvName})`);
        console.log(`   المنشئ: ${item.suggestedCreator} (ثقة: ${item.confidence})\n`);
        updated++;

      } catch (error) {
        console.error(`❌ خطأ في تحديث العقد #${item.contractId}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📈 النتائج النهائية:');
    console.log(`✅ تم التحديث بنجاح: ${updated} عقد`);
    console.log(`⏭️  تم تخطيها: ${skipped} عقد`);
    console.log(`❌ أخطاء: ${errors} عقد`);
    console.log(`⚠️  تبقى بدون منشئ: ${report.notFound.length} عقد`);

    if (report.notFound.length > 0) {
      console.log('\n⚠️  العقود التي لم يتم العثور على منشئ لها:');
      report.notFound.forEach((item, index) => {
        console.log(`   ${index + 1}. العقد #${item.contractId} - ${item.cvName}`);
      });
      console.log('\n   هذه العقود ستبقى كـ "غير معروف" في صفحة التعاقدات');
    }

    console.log('\n✅ تم الانتهاء! يمكنك الآن فتح صفحة التعاقدات لرؤية التحديثات');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyContractCreators();
