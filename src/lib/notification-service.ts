import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
export type NotificationCategory = 'import' | 'cv' | 'user' | 'system' | 'contract'

export interface NotificationData {
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  data?: any
}

export class NotificationService {
  // إرسال إشعار لجميع المديرين العامين
  static async notifyAllAdmins(notification: NotificationData) {
    try {
      // الحصول على جميع المديرين العامين
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true }
      })

      // إنشاء إشعار لكل مدير
      const notificationPromises = admins.map(admin =>
        prisma.notification.create({
          data: {
            title: notification.title,
            message: notification.message,
            type: notification.type,
            category: notification.category,
            data: notification.data ? JSON.stringify(notification.data) : null,
            userId: admin.id
          }
        })
      )

      await Promise.all(notificationPromises)
    } catch (error) {
      console.error('Error creating notifications:', error)
    }
  }

  // إرسال إشعار لمدير محدد
  static async notifyAdmin(userId: number, notification: NotificationData) {
    try {
      await prisma.notification.create({
        data: {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          data: notification.data ? JSON.stringify(notification.data) : null,
          userId
        }
      })
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  // إشعار عملية الاستيراد
  static async notifyImport(importData: {
    fileName: string
    totalRows: number
    newRecords: number
    updatedRecords: number
    skippedRecords: number
    errorRecords: number
    importType: string
    userId: number
    userName: string
  }) {
    const { fileName, totalRows, newRecords, updatedRecords, skippedRecords, errorRecords, importType, userId, userName } = importData
    
    const successRate = ((newRecords + updatedRecords) / totalRows) * 100
    const type: NotificationType = successRate >= 90 ? 'SUCCESS' : successRate >= 70 ? 'WARNING' : 'ERROR'
    
    await this.notifyAllAdmins({
      title: `📊 عملية استيراد جديدة - ${importType}`,
      message: `قام ${userName} برفع ملف "${fileName}" - ${totalRows} سجل: ${newRecords} جديد، ${updatedRecords} محدث، ${skippedRecords} متخطى، ${errorRecords} خطأ`,
      type,
      category: 'import',
      data: {
        fileName,
        totalRows,
        newRecords,
        updatedRecords,
        skippedRecords,
        errorRecords,
        successRate: Math.round(successRate),
        importType,
        executedBy: { id: userId, name: userName },
        timestamp: new Date().toISOString()
      }
    })
  }

  // إشعار إنشاء سيرة ذاتية جديدة
  static async notifyNewCV(cvData: {
    cvId: number
    fullName: string
    userId: number
    userName: string
    source: string
  }) {
    await this.notifyAllAdmins({
      title: '👤 سيرة ذاتية جديدة',
      message: `تم إنشاء سيرة ذاتية جديدة للمرشح "${cvData.fullName}" بواسطة ${cvData.userName}`,
      type: 'INFO',
      category: 'cv',
      data: {
        cvId: cvData.cvId,
        fullName: cvData.fullName,
        source: cvData.source,
        createdBy: { id: cvData.userId, name: cvData.userName },
        timestamp: new Date().toISOString()
      }
    })
  }

  // إشعار تحديث حالة السيرة الذاتية
  static async notifyStatusChange(statusData: {
    cvId: number
    fullName: string
    oldStatus: string
    newStatus: string
    userId: number
    userName: string
  }) {
    const statusMessages = {
      'NEW': 'جديد',
      'BOOKED': 'محجوز',
      'HIRED': 'متعاقد',
      'RETURNED': 'معاد'
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'BOOKED': return '📋'
        case 'HIRED': return '✅'
        case 'RETURNED': return '↩️'
        default: return '📄'
      }
    }

    await this.notifyAllAdmins({
      title: `${getStatusIcon(statusData.newStatus)} تغيير حالة السيرة الذاتية`,
      message: `تم تغيير حالة "${statusData.fullName}" من ${statusMessages[statusData.oldStatus as keyof typeof statusMessages] || statusData.oldStatus} إلى ${statusMessages[statusData.newStatus as keyof typeof statusMessages] || statusData.newStatus} بواسطة ${statusData.userName}`,
      type: 'INFO',
      category: 'cv',
      data: {
        cvId: statusData.cvId,
        fullName: statusData.fullName,
        oldStatus: statusData.oldStatus,
        newStatus: statusData.newStatus,
        changedBy: { id: statusData.userId, name: statusData.userName },
        timestamp: new Date().toISOString()
      }
    })
  }

  // إشعار إنشاء عقد جديد
  static async notifyNewContract(contractData: {
    cvId: number
    fullName: string
    identityNumber: string
    userId: number
    userName: string
  }) {
    await this.notifyAllAdmins({
      title: '📋 عقد جديد',
      message: `تم إنشاء عقد جديد للمرشح "${contractData.fullName}" (هوية: ${contractData.identityNumber}) بواسطة ${contractData.userName}`,
      type: 'SUCCESS',
      category: 'contract',
      data: {
        cvId: contractData.cvId,
        fullName: contractData.fullName,
        identityNumber: contractData.identityNumber,
        createdBy: { id: contractData.userId, name: contractData.userName },
        timestamp: new Date().toISOString()
      }
    })
  }

  // إشعار إنشاء مستخدم جديد
  static async notifyNewUser(userData: {
    newUserId: number
    newUserName: string
    newUserEmail: string
    newUserRole: string
    createdBy: number
    createdByName: string
  }) {
    const roleNames = {
      'ADMIN': 'مدير عام',
      'SUB_ADMIN': 'مدير فرعي',
      'USER': 'مستخدم عادي'
    }

    await this.notifyAllAdmins({
      title: '👥 مستخدم جديد',
      message: `تم إنشاء حساب جديد للمستخدم "${userData.newUserName}" بصلاحية ${roleNames[userData.newUserRole as keyof typeof roleNames] || userData.newUserRole} بواسطة ${userData.createdByName}`,
      type: 'INFO',
      category: 'user',
      data: {
        newUser: {
          id: userData.newUserId,
          name: userData.newUserName,
          email: userData.newUserEmail,
          role: userData.newUserRole
        },
        createdBy: { id: userData.createdBy, name: userData.createdByName },
        timestamp: new Date().toISOString()
      }
    })
  }

  // إشعار حذف سيرة ذاتية
  static async notifyDeleteCV(deleteData: {
    fullName: string
    userId: number
    userName: string
    reason?: string
  }) {
    await this.notifyAllAdmins({
      title: '🗑️ حذف سيرة ذاتية',
      message: `تم حذف السيرة الذاتية للمرشح "${deleteData.fullName}" بواسطة ${deleteData.userName}${deleteData.reason ? ` - السبب: ${deleteData.reason}` : ''}`,
      type: 'WARNING',
      category: 'cv',
      data: {
        fullName: deleteData.fullName,
        reason: deleteData.reason,
        deletedBy: { id: deleteData.userId, name: deleteData.userName },
        timestamp: new Date().toISOString()
      }
    })
  }

  // إشعار خطأ في النظام
  static async notifySystemError(errorData: {
    error: string
    details?: string
    userId?: number
    userName?: string
  }) {
    await this.notifyAllAdmins({
      title: '⚠️ خطأ في النظام',
      message: `حدث خطأ في النظام: ${errorData.error}${errorData.userName ? ` - المستخدم: ${errorData.userName}` : ''}`,
      type: 'ERROR',
      category: 'system',
      data: {
        error: errorData.error,
        details: errorData.details,
        user: errorData.userId ? { id: errorData.userId, name: errorData.userName } : null,
        timestamp: new Date().toISOString()
      }
    })
  }

  // الحصول على الإشعارات للمستخدم
  static async getUserNotifications(userId: number, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        prisma.notification.count({
          where: { userId }
        })
      ])

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      })

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  }

  // تحديد إشعار كمقروء
  static async markAsRead(notificationId: number, userId: number) {
    try {
      await prisma.notification.update({
        where: { 
          id: notificationId,
          userId // تأكد أن الإشعار يخص المستخدم
        },
        data: { isRead: true }
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  // تحديد جميع الإشعارات كمقروءة
  static async markAllAsRead(userId: number) {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  // حذف إشعار
  static async deleteNotification(notificationId: number, userId: number) {
    try {
      await prisma.notification.delete({
        where: { 
          id: notificationId,
          userId // تأكد أن الإشعار يخص المستخدم
        }
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }

  // حذف الإشعارات القديمة (أكثر من 30 يوم)
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          isRead: true
        }
      })
    } catch (error) {
      console.error('Error cleaning up old notifications:', error)
    }
  }
}

export default NotificationService
