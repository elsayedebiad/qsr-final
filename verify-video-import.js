const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function verifyVideoImport() {
  try {
    console.log('🔍 التحقق من استيراد الفيديوهات في قاعدة البيانات...\n')

    // جلب السير الذاتية مع روابط الفيديو
    const cvsWithVideo = await db.cV.findMany({
      where: {
        videoLink: {
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        nationality: true,
        position: true,
        videoLink: true,
        status: true,
        source: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    console.log(`📊 إجمالي السير التي تحتوي على فيديو: ${cvsWithVideo.length}`)

    if (cvsWithVideo.length === 0) {
      console.log('❌ لا توجد سير ذاتية تحتوي على روابط فيديو')
      console.log('\n💡 الحلول المقترحة:')
      console.log('1. تشغيل: node create-video-test-excel.js')
      console.log('2. رفع الملف المُنشأ من الداشبورد')
      console.log('3. استخدام الاستيراد الذكي')
      return
    }

    // تحليل أنواع الفيديوهات
    const videoTypes = {
      youtube: 0,
      googleDrive: 0,
      vimeo: 0,
      local: 0,
      other: 0
    }

    const importSources = {}
    const statusCounts = {}

    console.log('\n🎬 السير الذاتية مع الفيديوهات:')
    console.log('='.repeat(80))

    cvsWithVideo.forEach((cv, index) => {
      console.log(`\n${index + 1}. ${cv.fullName}`)
      console.log(`   🏳️ الجنسية: ${cv.nationality || 'غير محدد'}`)
      console.log(`   💼 الوظيفة: ${cv.position || 'غير محدد'}`)
      console.log(`   📊 الحالة: ${cv.status}`)
      console.log(`   📥 المصدر: ${cv.source || 'غير محدد'}`)
      console.log(`   🔗 رابط الفيديو: ${cv.videoLink}`)

      // تصنيف نوع الفيديو
      if (cv.videoLink.includes('youtube.com') || cv.videoLink.includes('youtu.be')) {
        videoTypes.youtube++
        console.log(`   📱 نوع الفيديو: YouTube`)
      } else if (cv.videoLink.includes('drive.google.com')) {
        videoTypes.googleDrive++
        console.log(`   📱 نوع الفيديو: Google Drive`)
      } else if (cv.videoLink.includes('vimeo.com')) {
        videoTypes.vimeo++
        console.log(`   📱 نوع الفيديو: Vimeo`)
      } else if (cv.videoLink.startsWith('/') || cv.videoLink.includes('.mp4') || cv.videoLink.includes('.webm')) {
        videoTypes.local++
        console.log(`   📱 نوع الفيديو: ملف محلي`)
      } else {
        videoTypes.other++
        console.log(`   📱 نوع الفيديو: أخرى`)
      }

      // إحصائيات المصدر
      const source = cv.source || 'غير محدد'
      importSources[source] = (importSources[source] || 0) + 1

      // إحصائيات الحالة
      statusCounts[cv.status] = (statusCounts[cv.status] || 0) + 1
    })

    // عرض الإحصائيات
    console.log('\n📊 إحصائيات أنواع الفيديوهات:')
    console.log('-'.repeat(40))
    console.log(`🎬 YouTube: ${videoTypes.youtube}`)
    console.log(`💾 Google Drive: ${videoTypes.googleDrive}`)
    console.log(`🎭 Vimeo: ${videoTypes.vimeo}`)
    console.log(`📁 ملفات محلية: ${videoTypes.local}`)
    console.log(`🔗 أخرى: ${videoTypes.other}`)

    console.log('\n📥 إحصائيات مصادر الاستيراد:')
    console.log('-'.repeat(40))
    Object.entries(importSources).forEach(([source, count]) => {
      console.log(`📋 ${source}: ${count}`)
    })

    console.log('\n📊 إحصائيات حالات السير:')
    console.log('-'.repeat(40))
    Object.entries(statusCounts).forEach(([status, count]) => {
      const statusIcon = status === 'NEW' ? '🆕' : status === 'BOOKED' ? '📋' : status === 'HIRED' ? '✅' : '❓'
      console.log(`${statusIcon} ${status}: ${count}`)
    })

    // التحقق من السير المتاحة في صفحات السيلز
    const availableCVsWithVideo = cvsWithVideo.filter(cv => cv.status === 'NEW')
    console.log(`\n🔍 السير المتاحة في صفحات السيلز (NEW status): ${availableCVsWithVideo.length}`)

    if (availableCVsWithVideo.length > 0) {
      console.log('\n✅ السير التي ستظهر في صفحات السيلز مع أزرار الفيديو:')
      availableCVsWithVideo.forEach((cv, index) => {
        console.log(`${index + 1}. ${cv.fullName} - ${cv.position}`)
      })
    } else {
      console.log('\n⚠️ لا توجد سير متاحة (NEW status) مع فيديوهات')
      console.log('💡 قم بتغيير حالة بعض السير إلى NEW لرؤيتها في صفحات السيلز')
    }

    // اختبار API
    console.log('\n🔧 اختبار API للتأكد من إرجاع حقل videoLink...')
    
    // محاكاة استدعاء API
    const apiTestCVs = await db.cV.findMany({
      where: {
        status: 'NEW'
      },
      select: {
        id: true,
        fullName: true,
        videoLink: true,
        status: true
      },
      take: 5
    })

    console.log(`📡 API Test - السير المتاحة: ${apiTestCVs.length}`)
    apiTestCVs.forEach((cv, index) => {
      const hasVideo = cv.videoLink ? '✅' : '❌'
      console.log(`${index + 1}. ${cv.fullName} - فيديو: ${hasVideo}`)
      if (cv.videoLink) {
        console.log(`   🔗 ${cv.videoLink}`)
      }
    })

    console.log('\n🎉 اكتمل التحقق من استيراد الفيديوهات!')
    
    if (availableCVsWithVideo.length > 0) {
      console.log('\n✅ التوصيات:')
      console.log('1. افتح أي صفحة سيلز (sales1-5)')
      console.log('2. ستجد أزرار الفيديو الحمراء تظهر')
      console.log('3. اضغط على زر الفيديو لمشاهدة الفيديو')
      console.log('4. تأكد من أن فيديوهات Google Drive تعمل بشكل صحيح')
    }

  } catch (error) {
    console.error('❌ خطأ في التحقق من البيانات:', error)
  } finally {
    await db.$disconnect()
  }
}

// تشغيل التحقق
verifyVideoImport()
