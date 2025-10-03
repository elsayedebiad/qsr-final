const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function checkVideoLinks() {
  try {
    console.log('🔍 فحص روابط الفيديو في قاعدة البيانات...\n')

    // جلب جميع السير الذاتية مع حقل الفيديو
    const cvs = await db.cV.findMany({
      select: {
        id: true,
        fullName: true,
        videoLink: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    console.log(`📊 إجمالي السير الذاتية: ${cvs.length}`)

    // تحليل البيانات
    const withVideo = cvs.filter(cv => cv.videoLink && cv.videoLink.trim() !== '')
    const withoutVideo = cvs.filter(cv => !cv.videoLink || cv.videoLink.trim() === '')
    const availableCVs = cvs.filter(cv => cv.status === 'NEW')

    console.log(`\n📈 الإحصائيات:`)
    console.log(`✅ سير لديها فيديو: ${withVideo.length}`)
    console.log(`❌ سير بدون فيديو: ${withoutVideo.length}`)
    console.log(`🆕 سير متاحة (NEW): ${availableCVs.length}`)

    console.log(`\n🎥 السير التي لديها روابط فيديو:`)
    withVideo.forEach((cv, index) => {
      const videoType = cv.videoLink.includes('youtube.com') ? 'YouTube' :
                       cv.videoLink.includes('youtu.be') ? 'YouTube Short' :
                       cv.videoLink.includes('drive.google.com') ? 'Google Drive' :
                       cv.videoLink.includes('vimeo.com') ? 'Vimeo' : 'أخرى'
      
      console.log(`${index + 1}. ${cv.fullName} - ${videoType}`)
      console.log(`   الرابط: ${cv.videoLink}`)
      console.log(`   الحالة: ${cv.status}`)
      console.log('')
    })

    if (withoutVideo.length > 0) {
      console.log(`\n❌ السير بدون فيديو (أول 5):`)
      withoutVideo.slice(0, 5).forEach((cv, index) => {
        console.log(`${index + 1}. ${cv.fullName} - الحالة: ${cv.status}`)
      })
    }

    // اقتراحات
    console.log(`\n💡 التوصيات:`)
    if (withoutVideo.length > 0) {
      console.log(`- تشغيل سكريبت add-video-links.js لإضافة روابط تجريبية`)
    }
    if (availableCVs.length === 0) {
      console.log(`- لا توجد سير متاحة (NEW status) - تحقق من حالة السير`)
    }

  } catch (error) {
    console.error('❌ خطأ في فحص البيانات:', error)
  } finally {
    await db.$disconnect()
  }
}

// تشغيل الفحص
checkVideoLinks()
