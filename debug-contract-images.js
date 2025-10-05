const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function debugContractImages() {
  try {
    console.log('🔍 فحص صور العمال في التعاقدات...\n')

    const dbPath = path.join(__dirname, 'prisma', 'dev.db')
    const db = new sqlite3.Database(dbPath)

    // فحص التعاقدات مع صور العمال
    db.all(`
      SELECT 
        c.id as contractId,
        c.cvId,
        c.identityNumber,
        c.contractStartDate,
        cv.fullName,
        cv.referenceCode,
        cv.nationality,
        cv.position,
        cv.profileImage,
        cv.status
      FROM contracts c
      LEFT JOIN cvs cv ON c.cvId = cv.id
      ORDER BY c.createdAt DESC
      LIMIT 10
    `, (err, contracts) => {
      if (err) {
        console.error('❌ خطأ في قراءة التعاقدات:', err)
        db.close()
        return
      }

      console.log(`📊 عدد التعاقدات المفحوصة: ${contracts.length}`)

      if (contracts.length === 0) {
        console.log('❌ لا توجد تعاقدات في قاعدة البيانات')
        db.close()
        return
      }

      console.log('\n📋 تحليل صور العمال في التعاقدات:')
      console.log('='.repeat(80))
      
      let contractsWithImages = 0
      let contractsWithoutImages = 0
      let imageIssues = []

      contracts.forEach((contract, index) => {
        console.log(`\n${index + 1}. التعاقد رقم: ${contract.contractId}`)
        console.log(`   👤 الاسم: ${contract.fullName || 'غير محدد'}`)
        console.log(`   🆔 رقم الهوية: ${contract.identityNumber}`)
        console.log(`   📋 الكود المرجعي: ${contract.referenceCode || 'غير محدد'}`)
        
        if (contract.profileImage) {
          console.log(`   🖼️ الصورة: ✅ موجودة`)
          console.log(`   📁 مسار الصورة: ${contract.profileImage}`)
          contractsWithImages++
          
          // فحص صحة مسار الصورة
          if (!contract.profileImage.startsWith('/uploads/') && 
              !contract.profileImage.startsWith('http') && 
              !contract.profileImage.startsWith('data:')) {
            imageIssues.push({
              contractId: contract.contractId,
              name: contract.fullName,
              issue: 'مسار الصورة غير صحيح',
              path: contract.profileImage
            })
          }
        } else {
          console.log(`   🖼️ الصورة: ❌ غير موجودة`)
          contractsWithoutImages++
        }
      })

      // عرض الإحصائيات
      console.log('\n📊 إحصائيات الصور:')
      console.log('='.repeat(40))
      console.log(`✅ تعاقدات بصور: ${contractsWithImages}`)
      console.log(`❌ تعاقدات بدون صور: ${contractsWithoutImages}`)
      console.log(`⚠️ مشاكل في مسارات الصور: ${imageIssues.length}`)

      if (imageIssues.length > 0) {
        console.log('\n⚠️ مشاكل مسارات الصور:')
        imageIssues.forEach(issue => {
          console.log(`- ${issue.name}: ${issue.issue}`)
          console.log(`  المسار: ${issue.path}`)
        })
      }

      // فحص إجمالي السير الذاتية مع الصور
      db.get(`
        SELECT COUNT(*) as totalCVs,
               COUNT(profileImage) as cvsWithImages
        FROM cvs 
        WHERE profileImage IS NOT NULL AND profileImage != ''
      `, (err, result) => {
        if (!err) {
          console.log('\n📈 إحصائيات عامة:')
          console.log(`📁 إجمالي السير مع صور: ${result.cvsWithImages}`)
        }

        // التحقق من وجود ملفات الصور
        console.log('\n🔍 نصائح لحل المشكلة:')
        console.log('1. تأكد من وجود مجلد /public/uploads/images/')
        console.log('2. تحقق من صحة مسارات الصور في قاعدة البيانات')
        console.log('3. تأكد من أن الصور موجودة فعلياً في المجلد')
        console.log('4. تحقق من إعدادات عرض الصور في الكود')

        db.close()
      })
    })

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

debugContractImages()
