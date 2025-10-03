const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function addVideoLinksToSampleCVs() {
  try {
    console.log('🎥 بدء إضافة روابط الفيديو للسير الذاتية...')

    // روابط فيديو تجريبية متنوعة
    const sampleVideoLinks = [
      'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://drive.google.com/file/d/1234567890abcdefghijklmnop/view?usp=sharing',
      'https://www.youtube.com/watch?v=ScMzIvxBSi4',
      'https://drive.google.com/file/d/0987654321zyxwvutsrqponmlk/view?usp=sharing',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://vimeo.com/123456789',
      'https://drive.google.com/file/d/abcdef123456789/view?usp=sharing'
    ]

    // جلب أول 10 سير ذاتية
    const cvs = await db.cV.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📋 تم العثور على ${cvs.length} سيرة ذاتية`)

    let updatedCount = 0

    for (let i = 0; i < cvs.length; i++) {
      const cv = cvs[i]
      const videoLink = sampleVideoLinks[i % sampleVideoLinks.length]

      await db.cV.update({
        where: { id: cv.id },
        data: { videoLink }
      })

      console.log(`✅ تم تحديث السيرة ${cv.fullName} برابط: ${videoLink}`)
      updatedCount++
    }

    console.log(`🎉 تم تحديث ${updatedCount} سيرة ذاتية بروابط الفيديو`)
    console.log('\n📊 ملخص الروابط المضافة:')
    console.log('- Google Drive: 4 روابط')
    console.log('- YouTube: 3 روابط') 
    console.log('- Vimeo: 1 رابط')

  } catch (error) {
    console.error('❌ خطأ في إضافة روابط الفيديو:', error)
  } finally {
    await db.$disconnect()
  }
}

// تشغيل السكريبت
addVideoLinksToSampleCVs()
