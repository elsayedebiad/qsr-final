require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testContractsImages() {
  try {
    console.log('🔍 اختبار نهائي لصور العمال في التعاقدات...\n')

    // جلب التعاقدات مع الصور
    const contracts = await prisma.contract.findMany({
      include: {
        cv: {
          select: {
            id: true,
            fullName: true,
            referenceCode: true,
            profileImage: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 إجمالي التعاقدات: ${contracts.length}`)

    if (contracts.length === 0) {
      console.log('❌ لا توجد تعاقدات في النظام')
      return
    }

    // تحليل الصور
    let successCount = 0
    let failureCount = 0

    console.log('\n📋 تحليل صور العمال:')
    console.log('='.repeat(80))

    contracts.forEach((contract, index) => {
      console.log(`\n${index + 1}. ${contract.cv.fullName}`)
      console.log(`   📋 الكود: ${contract.cv.referenceCode || 'غير محدد'}`)
      
      if (contract.cv.profileImage) {
        console.log(`   🖼️ الصورة: ✅ موجودة`)
        console.log(`   🔗 الرابط الأصلي: ${contract.cv.profileImage}`)
        
        // محاكاة تحويل الرابط
        const fileIdMatch = contract.cv.profileImage.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
        if (fileIdMatch && fileIdMatch[1]) {
          const fileId = fileIdMatch[1]
          const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
          console.log(`   🔄 الرابط المحول: ${directUrl}`)
          successCount++
        } else {
          console.log(`   ⚠️ لا يمكن تحويل الرابط`)
          failureCount++
        }
      } else {
        console.log(`   🖼️ الصورة: ❌ غير موجودة`)
        failureCount++
      }
    })

    // النتائج النهائية
    console.log('\n📊 النتائج النهائية:')
    console.log('='.repeat(40))
    console.log(`✅ صور يمكن عرضها: ${successCount}`)
    console.log(`❌ صور لا يمكن عرضها: ${failureCount}`)
    console.log(`📈 معدل النجاح: ${((successCount / contracts.length) * 100).toFixed(1)}%`)

    console.log('\n🚀 الحلول المطبقة:')
    console.log('1. ✅ إنشاء دالة تحويل روابط Google Drive')
    console.log('2. ✅ إنشاء مكون ProfileImage محسن')
    console.log('3. ✅ إضافة مودال لعرض الصور بحجم كبير')
    console.log('4. ✅ تحديث صفحة التعاقدات')
    console.log('5. ✅ إضافة معالجة أخطاء تحميل الصور')

    console.log('\n🔧 للاختبار:')
    console.log('1. تشغيل الخادم: npm run dev')
    console.log('2. الذهاب إلى: http://localhost:3000/dashboard/contracts')
    console.log('3. التحقق من ظهور صور العمال')
    console.log('4. النقر على الصور لفتحها في مودال')

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testContractsImages()
