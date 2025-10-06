const { PrismaClient } = require('@prisma/client')
const readline = require('readline')
const db = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function updateImageUrls() {
  console.log('🔄 أداة تحديث روابط Google Drive للصور\n')
  console.log('يمكنك:')
  console.log('1. تحديث سيرة ذاتية واحدة')
  console.log('2. تحديث عدة سير ذاتية من ملف')
  console.log('3. عرض السير الذاتية بدون صور Google Drive\n')
  
  rl.question('اختر رقم (1-3): ', async (choice) => {
    switch(choice) {
      case '1':
        await updateSingleCV()
        break
      case '2':
        await updateMultipleCVs()
        break
      case '3':
        await showCVsWithoutGoogleDrive()
        break
      default:
        console.log('اختيار غير صحيح')
        rl.close()
        await db.$disconnect()
    }
  })
}

async function updateSingleCV() {
  rl.question('أدخل ID السيرة الذاتية: ', async (cvId) => {
    rl.question('أدخل رابط Google Drive: ', async (googleDriveUrl) => {
      try {
        const cv = await db.cV.update({
          where: { id: cvId },
          data: { profileImage: googleDriveUrl }
        })
        console.log(`✅ تم تحديث ${cv.fullName}`)
      } catch (error) {
        console.error('❌ خطأ:', error.message)
      }
      rl.close()
      await db.$disconnect()
    })
  })
}

async function updateMultipleCVs() {
  console.log('\n📋 يرجى إنشاء ملف CSV بصيغة:')
  console.log('cvId,googleDriveUrl')
  console.log('1,https://drive.google.com/file/d/...')
  console.log('2,https://drive.google.com/file/d/...\n')
  
  rl.question('أدخل مسار ملف CSV: ', async (filePath) => {
    try {
      const fs = require('fs')
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n').slice(1) // skip header
      
      let updated = 0
      for (const line of lines) {
        if (!line.trim()) continue
        
        const [cvId, googleDriveUrl] = line.split(',')
        if (cvId && googleDriveUrl) {
          try {
            await db.cV.update({
              where: { id: cvId.trim() },
              data: { profileImage: googleDriveUrl.trim() }
            })
            updated++
            console.log(`✅ تم تحديث CV ${cvId}`)
          } catch (error) {
            console.error(`❌ فشل تحديث CV ${cvId}:`, error.message)
          }
        }
      }
      
      console.log(`\n✨ تم تحديث ${updated} سيرة ذاتية بنجاح`)
    } catch (error) {
      console.error('❌ خطأ في قراءة الملف:', error.message)
    }
    
    rl.close()
    await db.$disconnect()
  })
}

async function showCVsWithoutGoogleDrive() {
  try {
    const cvs = await db.cV.findMany({
      where: {
        profileImage: {
          not: {
            contains: 'drive.google.com'
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        profileImage: true
      },
      take: 50
    })
    
    console.log(`\n📊 عدد السير الذاتية بدون روابط Google Drive: ${cvs.length}\n`)
    
    cvs.forEach((cv, index) => {
      console.log(`${index + 1}. ID: ${cv.id} | ${cv.fullName}`)
      console.log(`   الرابط الحالي: ${cv.profileImage || 'لا يوجد'}\n`)
    })
    
    console.log('\n💡 لتحديث هذه السير الذاتية، استخدم الخيار 1 أو 2')
  } catch (error) {
    console.error('❌ خطأ:', error.message)
  }
  
  rl.close()
  await db.$disconnect()
}

updateImageUrls()

