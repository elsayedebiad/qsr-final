const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detectContractCreators() {
  try {
    console.log('🔍 جاري فحص سجل الأنشطة لمعرفة منشئي العقود...\n');

    // جلب جميع العقود بدون منشئ محدد أو بمنشئ افتراضي
    const contracts = await prisma.contract.findMany({
      include: {
        cv: {
          select: {
            id: true,
            fullName: true,
            referenceCode: true
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

    console.log(`📊 إجمالي العقود: ${contracts.length}\n`);

    const results = {
      found: [],
      notFound: [],
      alreadyHasCreator: []
    };

    for (const contract of contracts) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📋 العقد #${contract.id}: ${contract.cv.fullName}`);
      console.log(`   📅 تاريخ الإنشاء: ${contract.createdAt.toISOString()}`);
      console.log(`   👤 المنشئ الحالي: ${contract.createdBy?.name || 'غير محدد'}`);

      // البحث في سجل الأنشطة عن أي نشاط متعلق بهذه السيرة
      const activities = await prisma.activityLog.findMany({
        where: {
          cvId: contract.cvId,
          createdAt: {
            lte: new Date(contract.createdAt.getTime() + 24 * 60 * 60 * 1000), // يوم بعد إنشاء العقد
            gte: new Date(contract.createdAt.getTime() - 7 * 24 * 60 * 60 * 1000) // أسبوع قبل
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (activities.length > 0) {
        console.log(`   ✅ تم العثور على ${activities.length} نشاط:`);
        
        activities.forEach((activity, index) => {
          console.log(`      ${index + 1}. [${activity.action}] - ${activity.user.name} (${activity.user.role})`);
          console.log(`         📅 ${activity.createdAt.toISOString()}`);
          console.log(`         📝 ${activity.description.substring(0, 80)}${activity.description.length > 80 ? '...' : ''}`);
        });

        // البحث عن أقرب نشاط لتاريخ إنشاء العقد
        const closestActivity = activities.reduce((closest, current) => {
          const currentDiff = Math.abs(current.createdAt - contract.createdAt);
          const closestDiff = Math.abs(closest.createdAt - contract.createdAt);
          return currentDiff < closestDiff ? current : closest;
        });

        // البحث عن نشاط يحتوي على كلمات مفتاحية متعلقة بالعقود
        const contractActivity = activities.find(a => 
          a.action.includes('CONTRACT') || 
          a.action.includes('HIRED') ||
          a.description.includes('تعاقد') ||
          a.description.includes('عقد')
        );

        const suggestedCreator = contractActivity || closestActivity;

        console.log(`   \n   🎯 المنشئ المقترح: ${suggestedCreator.user.name} (${suggestedCreator.user.role})`);
        console.log(`      السبب: ${contractActivity ? 'نشاط متعلق بالعقد' : 'أقرب نشاط زمنياً'}`);
        console.log(`      فارق زمني: ${Math.abs(suggestedCreator.createdAt - contract.createdAt) / (1000 * 60)} دقيقة`);

        results.found.push({
          contractId: contract.id,
          cvName: contract.cv.fullName,
          currentCreator: contract.createdBy?.name || null,
          suggestedCreator: suggestedCreator.user.name,
          suggestedCreatorId: suggestedCreator.userId,
          confidence: contractActivity ? 'عالية' : 'متوسطة',
          reason: contractActivity ? 'نشاط عقد مباشر' : 'أقرب نشاط',
          timeDiffMinutes: Math.abs(suggestedCreator.createdAt - contract.createdAt) / (1000 * 60)
        });

      } else {
        console.log(`   ⚠️  لم يتم العثور على أي نشاط في سجل الأنشطة`);
        results.notFound.push({
          contractId: contract.id,
          cvName: contract.cv.fullName,
          currentCreator: contract.createdBy?.name || null
        });
      }
    }

    // طباعة التقرير النهائي
    console.log(`\n\n${'='.repeat(70)}`);
    console.log('📊 التقرير النهائي\n');
    
    console.log(`✅ عقود تم العثور على منشئ محتمل لها: ${results.found.length}`);
    if (results.found.length > 0) {
      console.log('\n   القائمة:');
      results.found.forEach((item, index) => {
        console.log(`   ${index + 1}. العقد #${item.contractId} - ${item.cvName}`);
        console.log(`      المنشئ المقترح: ${item.suggestedCreator}`);
        console.log(`      الثقة: ${item.confidence} (${item.reason})`);
        console.log(`      فارق زمني: ${item.timeDiffMinutes.toFixed(2)} دقيقة\n`);
      });
    }

    console.log(`\n⚠️  عقود لم يتم العثور على منشئ لها: ${results.notFound.length}`);
    if (results.notFound.length > 0) {
      console.log('   القائمة:');
      results.notFound.forEach((item, index) => {
        console.log(`   ${index + 1}. العقد #${item.contractId} - ${item.cvName}`);
      });
    }

    // حفظ التقرير في ملف JSON
    const fs = require('fs');
    fs.writeFileSync(
      'contract-creators-report.json',
      JSON.stringify({ found: results.found, notFound: results.notFound }, null, 2),
      'utf8'
    );
    console.log('\n💾 تم حفظ التقرير التفصيلي في: contract-creators-report.json');

    // سؤال المستخدم
    console.log('\n' + '='.repeat(70));
    console.log('❓ هل تريد تطبيق هذه التغييرات على قاعدة البيانات؟');
    console.log('   قم بتشغيل: node apply-contract-creators.js');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

detectContractCreators();
