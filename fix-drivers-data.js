const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixDriversData() {
  try {
    console.log('🔧 تصحيح بيانات السائقين...\n')
    
    // السائق الصحيح الوحيد (حسب الكود المرجعي IJ-0010)
    const correctDriverCode = 'IJ-0010'
    
    console.log(`✅ السائق الصحيح: ${correctDriverCode}\n`)
    
    // الحصول على قائمة جميع السائقين
    const allDrivers = await prisma.cV.findMany({
      where: { driving: 'YES' }
    })
    
    console.log(`📋 السائقين الحاليين في قاعدة البيانات:`)
    allDrivers.forEach((cv, i) => {
      console.log(`   ${i + 1}. ${cv.fullName} (${cv.referenceCode})`)
    })
    
    // تصحيح البيانات: تغيير السائقين الآخرين إلى NO
    const wrongDrivers = allDrivers.filter(cv => cv.referenceCode !== correctDriverCode)
    
    if (wrongDrivers.length > 0) {
      console.log(`\n⚠️  سيتم تغيير ${wrongDrivers.length} سيرة ذاتية من YES إلى NO:\n`)
      
      for (const cv of wrongDrivers) {
        console.log(`   - ${cv.fullName} (${cv.referenceCode})`)
        
        await prisma.cV.update({
          where: { id: cv.id },
          data: { driving: 'NO' }
        })
      }
      
      console.log(`\n✅ تم تصحيح البيانات بنجاح!`)
      console.log(`✅ السائق الوحيد المتبقي: ${correctDriverCode}`)
    } else {
      console.log(`\n✅ البيانات صحيحة. سائق واحد فقط.`)
    }
    
    // التحقق النهائي
    const finalCount = await prisma.cV.count({
      where: { driving: 'YES' }
    })
    
    console.log(`\n📊 العدد النهائي للسائقين: ${finalCount}`)
    
  } catch (error) {
    console.error('❌ خطأ:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// تنفيذ السكريبت
console.log('هل أنت متأكد من تصحيح البيانات؟')
console.log('سيتم الإبقاء على السائق: IJ-0010 فقط')
console.log('وتغيير الباقي إلى "NO"\n')

fixDriversData()

