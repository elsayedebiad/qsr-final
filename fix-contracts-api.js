// إصلاح مشكلة عدم ظهور التعاقدات
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function fixContractsAPI() {
  try {
    console.log('🔧 إصلاح مشكلة عدم ظهور التعاقدات...\n')

    const dbPath = path.join(__dirname, 'prisma', 'dev.db')
    const db = new sqlite3.Database(dbPath)

    // التحقق من التعاقدات الموجودة
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
    `, (err, contracts) => {
      if (err) {
        console.error('❌ خطأ في قراءة التعاقدات:', err)
        db.close()
        return
      }

      console.log(`📊 عدد التعاقدات في قاعدة البيانات: ${contracts.length}`)

      if (contracts.length === 0) {
        console.log('❌ لا توجد تعاقدات في قاعدة البيانات')
        console.log('💡 قم بتشغيل: node create-contracts-fixed.js')
        db.close()
        return
      }

      // إنشاء ملف JSON للتعاقدات (للاختبار)
      const contractsData = contracts.map(contract => ({
        id: contract.contractId,
        cvId: contract.cvId,
        identityNumber: contract.identityNumber,
        contractStartDate: contract.contractStartDate,
        contractEndDate: null,
        createdAt: contract.contractStartDate,
        updatedAt: contract.contractStartDate,
        cv: {
          id: contract.cvId,
          fullName: contract.fullName,
          fullNameArabic: null,
          referenceCode: contract.referenceCode,
          nationality: contract.nationality,
          position: contract.position,
          profileImage: contract.profileImage,
          status: contract.status
        }
      }))

      console.log('\n📋 التعاقدات الموجودة:')
      contractsData.forEach((contract, index) => {
        console.log(`${index + 1}. ${contract.cv.fullName} - ${contract.identityNumber}`)
      })

      // حفظ البيانات في ملف JSON للاختبار
      const fs = require('fs')
      fs.writeFileSync('contracts-test.json', JSON.stringify(contractsData, null, 2))
      console.log('\n✅ تم حفظ التعاقدات في ملف contracts-test.json')

      console.log('\n🔧 الحلول المقترحة:')
      console.log('1. تأكد من تشغيل الخادم: npm run dev')
      console.log('2. تأكد من وجود ملف .env مع DATABASE_URL')
      console.log('3. سجل دخول في الداشبورد')
      console.log('4. اذهب لصفحة التعاقدات')

      // التحقق من اتصال Prisma
      console.log('\n🔍 اختبار اتصال Prisma...')
      try {
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()
        
        prisma.contract.count().then(count => {
          console.log(`✅ Prisma يعمل - عدد التعاقدات: ${count}`)
          prisma.$disconnect()
        }).catch(error => {
          console.log(`❌ Prisma لا يعمل: ${error.message}`)
          console.log('💡 تأكد من ملف .env وإعادة تشغيل الخادم')
        })
      } catch (error) {
        console.log(`❌ مشكلة في Prisma: ${error.message}`)
      }

      db.close()
    })

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

fixContractsAPI()
