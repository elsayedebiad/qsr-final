/**
 * 🎬 تحديث رابط الفيديو في ملف Excel
 * Update Video URL in Excel File
 * 
 * كيفية الاستخدام:
 * node update-video-url-in-excel.js "YOUTUBE_URL_الجديد"
 * 
 * مثال:
 * node update-video-url-in-excel.js "https://www.youtube.com/watch?v=NEW_VIDEO_ID"
 */

const XLSX = require('xlsx');
const fs = require('fs');

// ألوان للـ Console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function extractYouTubeId(url) {
  try {
    const urlObj = new URL(url);
    
    if (url.includes('youtu.be/')) {
      return urlObj.pathname.substring(1).split('?')[0].split('/')[0];
    }
    
    if (url.includes('youtube.com/shorts/')) {
      return urlObj.pathname.split('/shorts/')[1]?.split('?')[0].split('/')[0];
    }
    
    if (url.includes('youtube.com/embed/')) {
      return urlObj.pathname.split('/embed/')[1]?.split('?')[0].split('/')[0];
    }
    
    if (urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

async function updateVideoUrl(newUrl) {
  const excelFile = 'data.xlsx';
  
  log('\n' + '='.repeat(70), 'cyan');
  log('🎬 تحديث رابط الفيديو في ملف Excel', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');
  
  // التحقق من وجود الملف
  if (!fs.existsSync(excelFile)) {
    log(`❌ الملف ${excelFile} غير موجود!`, 'red');
    log(`💡 تأكد من وجود الملف في المجلد الحالي\n`, 'yellow');
    return;
  }
  
  // التحقق من صحة الرابط الجديد
  if (!newUrl) {
    log('❌ الرجاء إدخال رابط الفيديو الجديد!', 'red');
    log('\nالاستخدام:', 'yellow');
    log('  node update-video-url-in-excel.js "YOUTUBE_URL"\n', 'cyan');
    log('مثال:', 'yellow');
    log('  node update-video-url-in-excel.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ"\n', 'cyan');
    return;
  }
  
  // التحقق من صحة رابط YouTube
  const videoId = extractYouTubeId(newUrl);
  if (!videoId) {
    log('⚠️  الرابط المدخل ليس رابط YouTube صحيح!', 'yellow');
    log(`   الرابط: ${newUrl}\n`, 'yellow');
    log('💡 استخدم رابط من هذه الأنواع:', 'cyan');
    log('   • https://www.youtube.com/watch?v=VIDEO_ID', 'cyan');
    log('   • https://youtu.be/VIDEO_ID', 'cyan');
    log('   • https://www.youtube.com/embed/VIDEO_ID\n', 'cyan');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      readline.question('هل تريد المتابعة على أي حال؟ (y/n): ', (answer) => {
        readline.close();
        if (answer.toLowerCase() !== 'y') {
          log('\n❌ تم الإلغاء\n', 'red');
          resolve();
          return;
        }
        continueUpdate();
        resolve();
      });
    });
  } else {
    log(`✅ رابط YouTube صحيح`, 'green');
    log(`   Video ID: ${videoId}\n`, 'blue');
    await continueUpdate();
  }
  
  async function continueUpdate() {
    try {
      // قراءة الملف
      log('📖 قراءة ملف Excel...', 'cyan');
      const wb = XLSX.readFile(excelFile);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      // البحث عن عمود الفيديو
      const videoColIndex = data[0].findIndex(h => 
        h && (String(h).toLowerCase().includes('video') || String(h).includes('فيديو'))
      );
      
      if (videoColIndex === -1) {
        log('❌ لم يتم العثور على عمود "رابط الفيديو"!', 'red');
        return;
      }
      
      log(`✅ تم العثور على عمود الفيديو: "${data[0][videoColIndex]}"`, 'green');
      
      // عد الصفوف التي سيتم تحديثها
      let updateCount = 0;
      for (let i = 1; i < data.length; i++) {
        if (data[i][videoColIndex]) {
          updateCount++;
        }
      }
      
      log(`\n📊 سيتم تحديث ${updateCount} صف\n`, 'yellow');
      
      // إنشاء نسخة احتياطية
      const backupFile = `data_backup_${Date.now()}.xlsx`;
      log(`💾 إنشاء نسخة احتياطية: ${backupFile}`, 'cyan');
      fs.copyFileSync(excelFile, backupFile);
      log(`✅ تم إنشاء النسخة الاحتياطية بنجاح\n`, 'green');
      
      // تحديث الروابط
      log('🔄 جاري تحديث الروابط...', 'cyan');
      for (let i = 1; i < data.length; i++) {
        if (data[i][videoColIndex]) {
          const oldUrl = data[i][videoColIndex];
          data[i][videoColIndex] = newUrl;
          log(`  ${i}. تم التحديث`, 'green');
        }
      }
      
      // حفظ الملف
      log('\n💾 حفظ التغييرات...', 'cyan');
      const newWs = XLSX.utils.aoa_to_sheet(data);
      wb.Sheets[wb.SheetNames[0]] = newWs;
      XLSX.writeFile(wb, excelFile);
      
      log('\n' + '='.repeat(70), 'green');
      log('✅ تم تحديث الروابط بنجاح!', 'green');
      log('='.repeat(70), 'green');
      
      log(`\n📝 الملف المحدث: ${excelFile}`, 'bright');
      log(`💾 النسخة الاحتياطية: ${backupFile}`, 'bright');
      log(`🔗 الرابط الجديد: ${newUrl}`, 'bright');
      log(`📊 عدد الصفوف المحدثة: ${updateCount}`, 'bright');
      
      log('\n💡 الخطوات التالية:', 'cyan');
      log('  1. اختبر الرابط باستخدام: test-video-embedding.html', 'cyan');
      log('  2. استورد البيانات من dashboard', 'cyan');
      log('  3. تحقق من عمل الفيديو على الموقع\n', 'cyan');
      
    } catch (error) {
      log('\n❌ حدث خطأ أثناء التحديث:', 'red');
      console.error(error);
    }
  }
}

// تشغيل السكريبت
const newUrl = process.argv[2];
updateVideoUrl(newUrl)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
