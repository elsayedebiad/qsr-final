import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    // التحقق من التوكن
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user
    try {
      user = await AuthService.verifyToken(token)
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // التحقق من الصلاحيات - فقط DEVELOPER و ADMIN
    if (user.role !== 'DEVELOPER' && user.role !== 'ADMIN' && user.email !== 'developer@system.local') {
      return NextResponse.json({ 
        error: 'غير مصرح لك بإعادة تعيين النظام. هذه العملية متاحة فقط للمطورين والمدير العام.',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, { status: 403 })
    }
    
    console.log(`✅ User ${user.email} (${user.role}) is authorized to reset system`)

    // حذف جميع البيانات التجريبية والبدء من جديد
    console.log('🔥 Starting COMPLETE data reset...')
    
    // تسجيل النشاط قبل الحذف
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'SYSTEM_RESET',
          description: `قام ${user.name} (${user.email}) بإعادة تعيين كامل النظام وحذف جميع البيانات`,
          targetType: 'SYSTEM',
          targetName: 'Complete System Reset',
          metadata: {
            resetBy: user.email,
            userRole: user.role,
            timestamp: new Date().toISOString(),
            deletedData: [
              'All CVs',
              'All Contracts',
              'All Bookings', 
              'All Activities',
              'All Notifications',
              'All Banners',
              'All Settings',
              'Users are KEPT (not deleted)'
            ]
          }
        }
      })
    } catch (logError) {
      console.log('⚠️ Could not log reset activity (will be deleted anyway):', logError)
    }

    // حذف الأنشطة
    await prisma.activityLog.deleteMany({})
    console.log('✅ Activities deleted')

    // حذف الجلسات  
    await prisma.session.deleteMany({})
    console.log('✅ Sessions deleted')

    // حذف جلسات المستخدمين
    await prisma.userSession.deleteMany({})
    console.log('✅ User sessions deleted')

    // حذف الإشعارات
    await prisma.notification.deleteMany({})
    console.log('✅ Notifications deleted')

    // حذف تفعيلات الدخول
    await prisma.loginActivation.deleteMany({})
    console.log('✅ Login activations deleted')

    // حذف نسخ السير الذاتية
    await prisma.cVVersion.deleteMany({})
    console.log('✅ CV versions deleted')

    // حذف العقود
    await prisma.contract.deleteMany({})
    console.log('✅ Contracts deleted')

    // حذف الحجوزات
    await prisma.booking.deleteMany({})
    console.log('✅ Bookings deleted')

    // حذف السير الذاتية
    await prisma.cV.deleteMany({})
    console.log('✅ CVs deleted')

    // حذف البنرات الإعلانية
    await prisma.banner.deleteMany({})
    console.log('✅ Banners deleted')

    // حذف إعدادات المبيعات
    await prisma.salesConfig.deleteMany({})
    console.log('✅ Sales configs deleted')

    // حذف إعدادات النظام
    await prisma.systemSettings.deleteMany({})
    console.log('✅ System settings deleted')

    // لا نحذف المستخدمين - تم تعطيل حذف المستخدمين بناءً على طلب المستخدم
    console.log('ℹ️ Users kept - User deletion is disabled')

    // إعادة تعيين الـ auto-increment sequences
    try {
      await prisma.$executeRaw`ALTER SEQUENCE "CV_id_seq" RESTART WITH 1`
      // لا نعيد تعيين User_id_seq لأننا لا نحذف المستخدمين
      // await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 3`
      await prisma.$executeRaw`ALTER SEQUENCE "ActivityLog_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE "Notification_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE "Contract_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE "Booking_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE "Session_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE "Banner_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE "LoginActivation_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE "SystemSettings_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE "UserSession_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE "CVVersion_id_seq" RESTART WITH 1`
      console.log('✅ Sequences reset successfully')
    } catch {
      console.log('⚠️ Note: Some sequences may not exist yet, this is normal for new databases')
    }

    console.log('Data reset completed successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'تم إعادة تعيين البيانات بنجاح. النظام جاهز للبيانات الحقيقية.',
      resetBy: user.email,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error resetting data:', error)
    return NextResponse.json(
      { error: 'Failed to reset data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
