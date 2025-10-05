require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'Yes' : 'No')
const prisma = new PrismaClient()

async function debugContractImages() {
  try {
    console.log('🔍 فحص صور العمال في التعاقدات (PostgreSQL)...\n')

    // فحص التعاقدات مع صور العمال
    const contracts = await prisma.contract.findMany({
      include: {
        cv: {
          select: {
            id: true,
            fullName: true,
            referenceCode: true,
            nationality: true,
            position: true,
            profileImage: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log(`📊 عدد التعاقدات المفحوصة: ${contracts.length}`)

    if (contracts.length === 0) {
      console.log('❌ لا توجد تعاقدات في قاعدة البيانات')
      
      // فحص إجمالي السير الذاتية
      const totalCVs = await prisma.cV.count()
      const cvsWithImages = await prisma.cV.count({
        where: {
          profileImage: {
            not: null,
            not: ''
          }
        }
      })
      
      console.log(`\n📈 إحصائيات عامة:`)
      console.log(`📁 إجمالي السير الذاتية: ${totalCVs}`)
      console.log(`🖼️ السير مع صور: ${cvsWithImages}`)
      
      if (cvsWithImages > 0) {
        console.log('\n📋 عينة من السير مع الصور:')
        const sampleCVs = await prisma.cV.findMany({
          where: {
            profileImage: {
              not: null,
              not: ''
            }
          },
          select: {
            id: true,
            fullName: true,
            profileImage: true,
            status: true
          },
          take: 5
        })
        
        sampleCVs.forEach(cv => {
          console.log(`- ${cv.fullName}: ${cv.profileImage} (${cv.status})`)
        })
      }
      
      await prisma.$disconnect()
      return
    }

    console.log('\n📋 تحليل صور العمال في التعاقدات:')
    console.log('='.repeat(80))
    
    let contractsWithImages = 0
    let contractsWithoutImages = 0
    let imageIssues = []

    contracts.forEach((contract, index) => {
      console.log(`\n${index + 1}. التعاقد رقم: ${contract.id}`)
      console.log(`   👤 الاسم: ${contract.cv.fullName || 'غير محدد'}`)
      console.log(`   🆔 رقم الهوية: ${contract.identityNumber}`)
      console.log(`   📋 الكود المرجعي: ${contract.cv.referenceCode || 'غير محدد'}`)
      console.log(`   📊 حالة السيرة: ${contract.cv.status}`)
      
      if (contract.cv.profileImage) {
        console.log(`   🖼️ الصورة: ✅ موجودة`)
        console.log(`   📁 مسار الصورة: ${contract.cv.profileImage}`)
        contractsWithImages++
        
        // فحص صحة مسار الصورة
        if (!contract.cv.profileImage.startsWith('/uploads/') && 
            !contract.cv.profileImage.startsWith('http') && 
            !contract.cv.profileImage.startsWith('data:') &&
            !contract.cv.profileImage.startsWith('https://')) {
          imageIssues.push({
            contractId: contract.id,
            name: contract.cv.fullName,
            issue: 'مسار الصورة قد يكون غير صحيح',
            path: contract.cv.profileImage
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
    console.log(`⚠️ مشاكل محتملة في مسارات الصور: ${imageIssues.length}`)

    if (imageIssues.length > 0) {
      console.log('\n⚠️ مشاكل محتملة في مسارات الصور:')
      imageIssues.forEach(issue => {
        console.log(`- ${issue.name}: ${issue.issue}`)
        console.log(`  المسار: ${issue.path}`)
      })
    }

    // فحص إجمالي السير الذاتية مع الصور
    const totalCVsWithImages = await prisma.cV.count({
      where: {
        profileImage: {
          not: null,
          not: ''
        }
      }
    })

    console.log('\n📈 إحصائيات عامة:')
    console.log(`📁 إجمالي السير مع صور في النظام: ${totalCVsWithImages}`)

    // التحقق من وجود ملفات الصور
    console.log('\n🔍 نصائح لحل المشكلة:')
    console.log('1. تأكد من وجود مجلد /public/uploads/images/')
    console.log('2. تحقق من صحة مسارات الصور في قاعدة البيانات')
    console.log('3. تأكد من أن الصور موجودة فعلياً في المجلد أو الخدمة السحابية')
    console.log('4. تحقق من إعدادات عرض الصور في الكود')
    console.log('5. تأكد من أن خادم الويب يمكنه الوصول للصور')

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugContractImages()
