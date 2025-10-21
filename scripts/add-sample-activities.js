const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addSampleActivities() {
  try {
    console.log('🚀 إضافة أنشطة تجريبية...')
    
    // Get first admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      console.error('❌ لا يوجد مستخدم مدير!')
      return
    }
    
    // Get some CVs
    const cvs = await prisma.cV.findMany({ take: 5 })
    
    // Sample activities
    const activities = [
      // Contract activities - مهمة جداً
      {
        userId: adminUser.id,
        action: 'CONTRACT_CREATED',
        description: 'تم إنشاء عقد جديد لخادمة منزلية',
        targetType: 'CONTRACT',
        targetId: 'contract_001',
        targetName: 'عقد - فاطمة محمد',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0'
      },
      {
        userId: adminUser.id,
        action: 'CONTRACT_SIGNED',
        description: 'تم توقيع عقد العمل بنجاح',
        targetType: 'CONTRACT',
        targetId: 'contract_002',
        targetName: 'عقد - مريم أحمد',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0'
      },
      // Booking activities - مهمة جداً
      {
        userId: adminUser.id,
        action: 'BOOKING_CREATED',
        description: 'تم حجز خادمة جديدة من الفلبين',
        targetType: 'BOOKING',
        targetId: 'booking_001',
        targetName: 'حجز - جوزفين',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0'
      },
      {
        userId: adminUser.id,
        action: 'BOOKING_CONFIRMED',
        description: 'تم تأكيد الحجز وإرسال التفاصيل',
        targetType: 'BOOKING',
        targetId: 'booking_002',
        targetName: 'حجز - ماريا',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0'
      },
      // CV activities
      {
        userId: adminUser.id,
        action: 'CV_CREATED',
        description: 'تم إضافة سيرة ذاتية جديدة',
        targetType: 'CV',
        targetId: cvs[0]?.id?.toString() || 'cv_001',
        targetName: cvs[0]?.fullName || 'سيرة ذاتية جديدة',
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0'
      },
      {
        userId: adminUser.id,
        action: 'CV_UPDATED',
        description: 'تم تحديث بيانات السيرة الذاتية',
        targetType: 'CV',
        targetId: cvs[1]?.id?.toString() || 'cv_002',
        targetName: cvs[1]?.fullName || 'سيرة محدثة',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0'
      },
      // System activities
      {
        userId: adminUser.id,
        action: 'SYSTEM_BACKUP',
        description: 'تم عمل نسخة احتياطية من البيانات',
        targetType: 'SYSTEM',
        targetId: 'backup_001',
        targetName: 'نسخة احتياطية يومية',
        ipAddress: '192.168.1.106',
        userAgent: 'Mozilla/5.0'
      },
      // User activities
      {
        userId: adminUser.id,
        action: 'USER_LOGIN',
        description: 'تم تسجيل الدخول بنجاح',
        targetType: 'USER',
        targetId: adminUser.id.toString(),
        targetName: adminUser.name || 'المدير',
        ipAddress: '192.168.1.107',
        userAgent: 'Mozilla/5.0'
      }
    ]
    
    // Add activities with varying timestamps
    const now = new Date()
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i]
      const createdAt = new Date(now)
      createdAt.setHours(now.getHours() - i * 2) // Spread over last 16 hours
      
      await prisma.activityLog.create({
        data: {
          ...activity,
          createdAt
        }
      })
      
      console.log(`✅ تم إضافة نشاط: ${activity.action} - ${activity.description}`)
    }
    
    console.log('✅ تم إضافة جميع الأنشطة التجريبية بنجاح!')
    
  } catch (error) {
    console.error('❌ خطأ:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleActivities()
