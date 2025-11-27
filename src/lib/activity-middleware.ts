/**
 * نظام تسجيل شامل لجميع الأنشطة
 * يتتبع دخول الصفحات، طلبات API، والإجراءات المختلفة
 */

import { db } from '@/lib/db'

export interface ActivityLogInput {
  userId: number
  userRole?: string
  action: string
  description: string
  targetType?: string
  targetId?: string
  targetName?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * تسجيل نشاط في قاعدة البيانات
 * يستثني حساب DEVELOPER من التسجيل
 */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    // استثناء حساب DEVELOPER من التسجيل
    if (input.userRole === 'DEVELOPER') {
      console.log('🚫 Activity logging skipped for DEVELOPER account')
      return
    }

    // تسجيل النشاط في قاعدة البيانات
    await db.activityLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        description: input.description,
        targetType: input.targetType,
        targetId: input.targetId,
        targetName: input.targetName,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      }
    })

    console.log(`✅ Activity logged: ${input.action} by user ${input.userId}`)
  } catch (error) {
    console.error('❌ Error logging activity:', error)
    // لا نرمي الخطأ لتجنب تعطيل الوظيفة الأساسية
  }
}

/**
 * تسجيل دخول صفحة
 */
export async function logPageView(
  userId: number,
  userRole: string,
  pagePath: string,
  pageTitle: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logActivity({
    userId,
    userRole,
    action: 'PAGE_VIEW',
    description: `دخول صفحة: ${pageTitle} (${pagePath})`,
    targetType: 'SYSTEM',
    targetName: pageTitle,
    metadata: { pagePath, pageTitle },
    ipAddress,
    userAgent
  })
}

/**
 * تسجيل طلب API
 */
export async function logAPIRequest(
  userId: number,
  userRole: string,
  method: string,
  endpoint: string,
  statusCode: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logActivity({
    userId,
    userRole,
    action: 'API_REQUEST',
    description: `${method} ${endpoint} - Status: ${statusCode}`,
    targetType: 'SYSTEM',
    metadata: { method, endpoint, statusCode },
    ipAddress,
    userAgent
  })
}

/**
 * تسجيل رفع ملف
 */
export async function logFileUpload(
  userId: number,
  userRole: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  targetType?: string,
  targetId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logActivity({
    userId,
    userRole,
    action: 'FILE_UPLOAD',
    description: `رفع ملف: ${fileName} (${(fileSize / 1024).toFixed(2)} KB)`,
    targetType: targetType || 'SYSTEM',
    targetId,
    targetName: fileName,
    metadata: { fileName, fileSize, fileType },
    ipAddress,
    userAgent
  })
}

/**
 * تسجيل عملية CRUD
 */
export async function logCRUDOperation(
  userId: number,
  userRole: string,
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  resourceType: string,
  resourceId: string,
  resourceName: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const actionMap = {
    CREATE: 'إنشاء',
    READ: 'عرض',
    UPDATE: 'تحديث',
    DELETE: 'حذف'
  }

  await logActivity({
    userId,
    userRole,
    action: `${resourceType}_${operation}`,
    description: `${actionMap[operation]} ${resourceType}: ${resourceName}`,
    targetType: resourceType,
    targetId: resourceId,
    targetName: resourceName,
    metadata: changes ? { changes } : undefined,
    ipAddress,
    userAgent
  })
}

/**
 * تسجيل تغيير حالة
 */
export async function logStatusChange(
  userId: number,
  userRole: string,
  resourceType: string,
  resourceId: string,
  resourceName: string,
  oldStatus: string,
  newStatus: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logActivity({
    userId,
    userRole,
    action: 'STATUS_CHANGE',
    description: `تغيير حالة ${resourceType}: ${resourceName} من ${oldStatus} إلى ${newStatus}`,
    targetType: resourceType,
    targetId: resourceId,
    targetName: resourceName,
    metadata: { oldStatus, newStatus },
    ipAddress,
    userAgent
  })
}

/**
 * تسجيل عملية جماعية
 */
export async function logBulkOperation(
  userId: number,
  userRole: string,
  operation: string,
  resourceType: string,
  count: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logActivity({
    userId,
    userRole,
    action: `BULK_${operation.toUpperCase()}`,
    description: `عملية جماعية: ${operation} على ${count} ${resourceType}`,
    targetType: 'SYSTEM',
    metadata: { operation, resourceType, count },
    ipAddress,
    userAgent
  })
}

/**
 * تسجيل تسجيل دخول/خروج
 */
export async function logAuthActivity(
  userId: number,
  userRole: string,
  action: 'LOGIN' | 'LOGOUT',
  userName: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const actionMap = {
    LOGIN: 'تسجيل دخول',
    LOGOUT: 'تسجيل خروج'
  }

  await logActivity({
    userId,
    userRole,
    action: `USER_${action}`,
    description: `${actionMap[action]}: ${userName}`,
    targetType: 'USER',
    targetId: userId.toString(),
    targetName: userName,
    ipAddress,
    userAgent
  })
}

/**
 * تسجيل خطأ أو تحذير
 */
export async function logSystemEvent(
  userId: number,
  userRole: string,
  level: 'ERROR' | 'WARNING' | 'INFO',
  message: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logActivity({
    userId,
    userRole,
    action: `SYSTEM_${level}`,
    description: message,
    targetType: 'SYSTEM',
    metadata: details,
    ipAddress,
    userAgent
  })
}
