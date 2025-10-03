const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkImageData() {
  try {
    console.log('🔍 فحص بيانات الصور في قاعدة البيانات...')

    const cvsWithImages = await prisma.cV.findMany({
      where: {
        profileImage: {
          not: null,
          not: '',
        },
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        profileImage: true,
      },
    })

    if (cvsWithImages.length === 0) {
      console.log('لا توجد أي سير ذاتية تحتوي على صور في قاعدة البيانات.')
      return
    }

    console.log(`\n✅ وُجد ${cvsWithImages.length} سيرة ذاتية تحتوي على صور. إليك عينة منها:`)
    cvsWithImages.forEach(cv => {
      console.log(`\n- الاسم: ${cv.fullName}`)
      console.log(`  مسار الصورة: ${cv.profileImage}`)
      
      if (cv.profileImage && cv.profileImage.startsWith('/uploads/images/')) {
        console.log(`  التنسيق: ✅ صحيح (مسار نسبي)`)
      } else {
        console.log(`  التنسيق: ❌ خاطئ - يجب أن يبدأ المسار بـ /uploads/images/`)
      }
    })

  } catch (error) {
    console.error('❌ حدث خطأ أثناء فحص بيانات الصور:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkImageData()
