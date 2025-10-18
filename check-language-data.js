// Script للتحقق من بيانات اللغات في قاعدة البيانات
// تشغيل: node check-language-data.js

const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function checkLanguageData() {
  try {
    console.log('🔍 جاري التحقق من بيانات اللغات...\n')

    // جلب أول 10 سير ذاتية
    const cvs = await db.cV.findMany({
      take: 10,
      select: {
        id: true,
        fullNameArabic: true,
        arabicLevel: true,
        englishLevel: true,
        arabicLevelRaw: true,
        englishLevelRaw: true
      }
    })

    if (cvs.length === 0) {
      console.log('⚠️ لا توجد سير ذاتية في قاعدة البيانات')
      console.log('💡 يجب رفع الشيت أولاً\n')
      return
    }

    console.log(`✅ تم العثور على ${cvs.length} سير ذاتية\n`)
    console.log('📊 عينة من البيانات:\n')

    let hasRawData = false
    let hasOldData = false

    cvs.forEach((cv, index) => {
      console.log(`${index + 1}. ${cv.fullNameArabic || 'لا يوجد اسم'}`)
      console.log(`   - arabicLevel (قديم): ${cv.arabicLevel || 'فارغ'}`)
      console.log(`   - arabicLevelRaw (جديد): ${cv.arabicLevelRaw || 'فارغ'}`)
      console.log(`   - englishLevel (قديم): ${cv.englishLevel || 'فارغ'}`)
      console.log(`   - englishLevelRaw (جديد): ${cv.englishLevelRaw || 'فارغ'}`)
      console.log()

      if (cv.arabicLevelRaw || cv.englishLevelRaw) {
        hasRawData = true
      }
      if (cv.arabicLevel || cv.englishLevel) {
        hasOldData = true
      }
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // تقرير الحالة
    if (hasRawData) {
      console.log('✅ البيانات المحولة موجودة (arabicLevelRaw, englishLevelRaw)')
      console.log('✅ الفلتر سيعمل بشكل صحيح!')
    } else {
      console.log('⚠️ البيانات المحولة غير موجودة')
      console.log('💡 يجب إعادة رفع الشيت لتفعيل الفلتر الجديد')
    }

    if (hasOldData && !hasRawData) {
      console.log('\n📌 ملاحظة: توجد بيانات قديمة فقط')
      console.log('   النظام يدعم fallback للبيانات القديمة، لكن للأداء الأفضل:')
      console.log('   → أعد رفع الشيت من خلال صفحة الرفع الذكي')
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // إحصائيات
    const stats = await db.cV.groupBy({
      by: ['englishLevelRaw'],
      _count: true
    })

    if (stats.length > 0) {
      console.log('\n📊 إحصائيات مستويات الإنجليزية:')
      stats.forEach(stat => {
        if (stat.englishLevelRaw) {
          console.log(`   - ${stat.englishLevelRaw}: ${stat._count} سيرة ذاتية`)
        }
      })
    }

    const statsArabic = await db.cV.groupBy({
      by: ['arabicLevelRaw'],
      _count: true
    })

    if (statsArabic.length > 0) {
      console.log('\n📊 إحصائيات مستويات العربية:')
      statsArabic.forEach(stat => {
        if (stat.arabicLevelRaw) {
          console.log(`   - ${stat.arabicLevelRaw}: ${stat._count} سيرة ذاتية`)
        }
      })
    }

    console.log('\n✅ انتهى الفحص\n')

  } catch (error) {
    if (error.code === 'P2021') {
      console.error('\n❌ خطأ: الحقول arabicLevelRaw و englishLevelRaw غير موجودة في قاعدة البيانات')
      console.error('\n📝 الحل:')
      console.error('   1. شغّل: npx prisma db push')
      console.error('   2. أو نفذ SQL التالي على قاعدة البيانات:')
      console.error('      ALTER TABLE "CV" ADD COLUMN "englishLevelRaw" TEXT;')
      console.error('      ALTER TABLE "CV" ADD COLUMN "arabicLevelRaw" TEXT;\n')
    } else {
      console.error('❌ خطأ:', error.message)
    }
  } finally {
    await db.$disconnect()
  }
}

checkLanguageData()

