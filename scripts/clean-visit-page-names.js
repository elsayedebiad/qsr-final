const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanVisitPageNames() {
  console.log('🔄 بدء تنظيف أسماء الصفحات في جدول الزيارات...\n')
  
  try {
    // جلب جميع الزيارات
    const visits = await prisma.visit.findMany({
      select: {
        id: true,
        targetPage: true
      }
    })
    
    console.log(`📊 إجمالي الزيارات: ${visits.length}\n`)
    
    // تجميع الصفحات حسب الاسم المنظف
    const pageGroups = new Map()
    
    visits.forEach(visit => {
      // تنظيف اسم الصفحة: إزالة / من البداية، المسافات، وتحويل لأحرف صغيرة
      const cleanPage = visit.targetPage.trim().toLowerCase().replace(/^\/+/, '')
      if (!pageGroups.has(cleanPage)) {
        pageGroups.set(cleanPage, [])
      }
      pageGroups.get(cleanPage).push({
        id: visit.id,
        original: visit.targetPage
      })
    })
    
    console.log(`📋 عدد الصفحات الفريدة (بعد التنظيف): ${pageGroups.size}\n`)
    
    // عرض الصفحات المكررة
    let duplicatesFound = false
    let totalUpdates = 0
    
    for (const [cleanPage, group] of pageGroups.entries()) {
      // التحقق من وجود نسخ مختلفة من نفس الصفحة
      const uniqueVersions = new Set(group.map(v => v.original))
      
      if (uniqueVersions.size > 1) {
        duplicatesFound = true
        console.log(`⚠️  صفحة مكررة: "${cleanPage}"`)
        console.log(`   النسخ المختلفة:`)
        uniqueVersions.forEach(version => {
          const count = group.filter(v => v.original === version).length
          console.log(`   - "${version}" (${count} زيارة)`)
        })
        
        // تحديث جميع النسخ إلى الاسم المنظف
        const idsToUpdate = group.map(v => v.id)
        
        try {
          await prisma.visit.updateMany({
            where: {
              id: {
                in: idsToUpdate
              }
            },
            data: {
              targetPage: cleanPage
            }
          })
          
          totalUpdates += idsToUpdate.length
          console.log(`   ✅ تم توحيد ${idsToUpdate.length} زيارة إلى "${cleanPage}"\n`)
        } catch (error) {
          console.error(`   ❌ خطأ في التحديث:`, error.message, '\n')
        }
      }
    }
    
    if (!duplicatesFound) {
      console.log('✅ لا توجد صفحات مكررة - جميع الأسماء موحدة!\n')
    } else {
      console.log(`\n✨ اكتمل التنظيف!`)
      console.log(`📊 إجمالي الزيارات المحدثة: ${totalUpdates}`)
    }
    
    // عرض ملخص الصفحات بعد التنظيف
    console.log('\n📊 ملخص الصفحات بعد التنظيف:')
    console.log('─'.repeat(60))
    
    const finalStats = await prisma.visit.groupBy({
      by: ['targetPage'],
      _count: true,
      orderBy: {
        _count: {
          targetPage: 'desc'
        }
      }
    })
    
    finalStats.forEach(stat => {
      console.log(`${stat.targetPage.padEnd(30)} : ${stat._count} زيارة`)
    })
    
  } catch (error) {
    console.error('❌ خطأ:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanVisitPageNames()
