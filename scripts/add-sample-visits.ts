import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// قائمة بالمصادر المختلفة
const sources = ['google', 'facebook', 'instagram', 'tiktok', 'youtube', 'twitter', null, null] // null = direct
const pages = ['sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'sales6', 'sales7', 'sales8', 'sales9', 'sales10', 'sales11']
const countries = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'EG', 'JO']
const cities = ['Riyadh', 'Dubai', 'Kuwait', 'Doha', 'Manama', 'Muscat', 'Cairo', 'Amman']

// دالة لتوليد تاريخ عشوائي في آخر 30 يوم
function randomDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now)
  date.setDate(date.getDate() - daysAgo)
  date.setHours(Math.floor(Math.random() * 24))
  date.setMinutes(Math.floor(Math.random() * 60))
  return date
}

// دالة لاختيار عنصر عشوائي من مصفوفة
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function addSampleVisits() {
  console.log('🚀 بدء إضافة زيارات تجريبية...')

  try {
    const visits = []
    
    // توليد 500 زيارة تجريبية
    for (let i = 0; i < 500; i++) {
      const source = randomItem(sources)
      const isGoogle = source === 'google' || Math.random() < 0.3
      const targetPage = randomItem(pages)
      const country = randomItem(countries)
      const city = randomItem(cities)
      
      visits.push({
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        country,
        city,
        targetPage,
        referer: source ? `https://${source}.com/referral` : null,
        utmSource: source,
        utmMedium: source ? 'social' : 'direct',
        utmCampaign: source ? `${source}-campaign-2024` : null,
        isGoogle,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: randomDate(),
        isArchived: false
      })
    }

    // إضافة الزيارات دفعة واحدة
    const result = await prisma.visit.createMany({
      data: visits
    })

    console.log(`✅ تم إضافة ${result.count} زيارة تجريبية بنجاح!`)
    
    // عرض إحصائيات
    const stats = {
      total: result.count,
      googleVisits: visits.filter(v => v.isGoogle).length,
      facebookVisits: visits.filter(v => v.utmSource === 'facebook').length,
      instagramVisits: visits.filter(v => v.utmSource === 'instagram').length,
      tiktokVisits: visits.filter(v => v.utmSource === 'tiktok').length,
      directVisits: visits.filter(v => !v.utmSource).length
    }
    
    console.log('\n📊 الإحصائيات:')
    console.log(`   - إجمالي الزيارات: ${stats.total}`)
    console.log(`   - من Google: ${stats.googleVisits}`)
    console.log(`   - من Facebook: ${stats.facebookVisits}`)
    console.log(`   - من Instagram: ${stats.instagramVisits}`)
    console.log(`   - من TikTok: ${stats.tiktokVisits}`)
    console.log(`   - مباشرة: ${stats.directVisits}`)
    
    // عرض التوزيع على الصفحات
    console.log('\n🌐 توزيع الزيارات على الصفحات:')
    for (const page of pages) {
      const pageVisits = visits.filter(v => v.targetPage === page).length
      console.log(`   - ${page}: ${pageVisits} زيارة`)
    }

  } catch (error) {
    console.error('❌ خطأ في إضافة الزيارات:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleVisits()
