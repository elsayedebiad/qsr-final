/**
 * 🎬 فحص وإصلاح روابط الفيديوهات في قاعدة البيانات
 * Check and Fix Video URLs in Database
 * 
 * هذا السكريبت يقوم بـ:
 * 1. فحص جميع الفيديوهات في قاعدة البيانات
 * 2. التحقق من صحة الروابط
 * 3. اكتشاف الفيديوهات المحظورة
 * 4. عرض تقرير مفصل
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ألوان للـ Console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset)
}

function extractYouTubeId(url) {
  if (!url) return null
  
  try {
    const urlObj = new URL(url)
    
    // youtu.be/VIDEO_ID
    if (url.includes('youtu.be/')) {
      return urlObj.pathname.substring(1).split('?')[0].split('/')[0]
    }
    
    // youtube.com/shorts/VIDEO_ID
    if (url.includes('youtube.com/shorts/')) {
      return urlObj.pathname.split('/shorts/')[1]?.split('?')[0].split('/')[0]
    }
    
    // youtube.com/embed/VIDEO_ID
    if (url.includes('youtube.com/embed/')) {
      return urlObj.pathname.split('/embed/')[1]?.split('?')[0].split('/')[0]
    }
    
    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v')
    }
    
    return null
  } catch (e) {
    log(`  ❌ خطأ في تحليل الرابط: ${url}`, 'red')
    return null
  }
}

function isYouTubeUrl(url) {
  if (!url) return false
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isValidUrl(url) {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

async function checkVideoUrls() {
  log('\n' + '='.repeat(70), 'cyan')
  log('🎬 فحص روابط الفيديوهات في قاعدة البيانات', 'cyan')
  log('='.repeat(70) + '\n', 'cyan')
  
  try {
    // جلب جميع السير الذاتية التي تحتوي على روابط فيديو
    const cvs = await prisma.cV.findMany({
      where: {
        videoLink: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        nationality: true,
        videoLink: true,
        position: true
      }
    })
    
    if (cvs.length === 0) {
      log('📭 لا توجد سير ذاتية تحتوي على روابط فيديو', 'yellow')
      return
    }
    
    log(`📊 تم العثور على ${cvs.length} سيرة ذاتية تحتوي على روابط فيديو\n`, 'green')
    
    const stats = {
      total: cvs.length,
      youtube: 0,
      validYouTube: 0,
      invalidYouTube: 0,
      nonYouTube: 0,
      invalid: 0
    }
    
    const problematicVideos = []
    
    // فحص كل رابط
    for (let i = 0; i < cvs.length; i++) {
      const cv = cvs[i]
      const index = i + 1
      
      log(`\n${index}. ${cv.name} (${cv.nationality}) - ${cv.position}`, 'bright')
      log(`   ID: ${cv.id}`, 'blue')
      log(`   الرابط: ${cv.videoLink}`, 'blue')
      
      // التحقق من صحة الرابط
      if (!isValidUrl(cv.videoLink)) {
        log(`   ❌ رابط غير صحيح`, 'red')
        stats.invalid++
        problematicVideos.push({
          id: cv.id,
          name: cv.name,
          url: cv.videoLink,
          issue: 'رابط غير صحيح'
        })
        continue
      }
      
      // فحص إذا كان YouTube
      if (isYouTubeUrl(cv.videoLink)) {
        stats.youtube++
        
        const videoId = extractYouTubeId(cv.videoLink)
        
        if (videoId && videoId.length >= 10) {
          log(`   ✅ YouTube Video ID: ${videoId}`, 'green')
          log(`   🔗 رابط التضمين: https://www.youtube-nocookie.com/embed/${videoId}`, 'cyan')
          stats.validYouTube++
          
          // معلومات إضافية
          log(`   💡 للتحقق من التضمين: افتح الرابط أعلاه في المتصفح`, 'yellow')
        } else {
          log(`   ❌ فشل استخراج معرف الفيديو من YouTube`, 'red')
          stats.invalidYouTube++
          problematicVideos.push({
            id: cv.id,
            name: cv.name,
            url: cv.videoLink,
            issue: 'فشل استخراج معرف YouTube'
          })
        }
      } else {
        log(`   ℹ️  فيديو من منصة أخرى (ليس YouTube)`, 'magenta')
        stats.nonYouTube++
      }
    }
    
    // عرض التقرير النهائي
    log('\n' + '='.repeat(70), 'cyan')
    log('📊 ملخص التقرير', 'cyan')
    log('='.repeat(70), 'cyan')
    
    log(`\n إجمالي الفيديوهات: ${stats.total}`, 'bright')
    log(`  ✅ فيديوهات YouTube صحيحة: ${stats.validYouTube}`, 'green')
    log(`  ❌ فيديوهات YouTube بها مشاكل: ${stats.invalidYouTube}`, 'red')
    log(`  ℹ️  فيديوهات من منصات أخرى: ${stats.nonYouTube}`, 'magenta')
    log(`  ⚠️  روابط غير صحيحة: ${stats.invalid}`, 'yellow')
    
    // عرض الفيديوهات التي بها مشاكل
    if (problematicVideos.length > 0) {
      log('\n' + '='.repeat(70), 'yellow')
      log('⚠️  الفيديوهات التي تحتاج إلى مراجعة:', 'yellow')
      log('='.repeat(70), 'yellow')
      
      problematicVideos.forEach((video, index) => {
        log(`\n${index + 1}. ${video.name}`, 'bright')
        log(`   ID: ${video.id}`, 'blue')
        log(`   المشكلة: ${video.issue}`, 'red')
        log(`   الرابط: ${video.url}`, 'blue')
      })
      
      log('\n' + '💡 الحلول المقترحة:', 'cyan')
      log('   1. تحديث الرابط بنسخة صحيحة', 'cyan')
      log('   2. رفع الفيديو على قناة YouTube خاصة بك', 'cyan')
      log('   3. استخدام منصة بديلة (Vimeo, Google Drive)', 'cyan')
    } else {
      log('\n✨ رائع! جميع روابط الفيديوهات صحيحة', 'green')
    }
    
    log('\n' + '='.repeat(70), 'cyan')
    log('📝 ملاحظات مهمة:', 'cyan')
    log('='.repeat(70), 'cyan')
    log('  • هذا السكريبت يفحص صحة الروابط فقط', 'yellow')
    log('  • للتحقق من التضمين، استخدم: test-video-embedding.html', 'yellow')
    log('  • الفيديوهات الصحيحة هنا قد تكون محظورة من التضمين', 'yellow')
    log('  • راجع ملف VIDEO_BLOCKED_SOLUTION.md للحلول الكاملة\n', 'yellow')
    
  } catch (error) {
    log('\n❌ حدث خطأ أثناء الفحص:', 'red')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل الفحص
checkVideoUrls()
  .then(() => {
    log('\n✅ انتهى الفحص بنجاح\n', 'green')
    process.exit(0)
  })
  .catch((error) => {
    log('\n❌ فشل الفحص\n', 'red')
    console.error(error)
    process.exit(1)
  })
