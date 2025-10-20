// نظام تتبع الأنشطة المحسّن
import { toast } from 'react-hot-toast'

export type ActivityType = 
  // أنشطة السير الذاتية
  | 'CV_CREATED' | 'CV_UPDATED' | 'CV_DELETED' | 'CV_VIEWED' 
  | 'CV_DOWNLOADED' | 'CV_SHARED' | 'CV_ARCHIVED' | 'CV_RESTORED'
  | 'CV_IMPORTED' | 'CV_EXPORTED' | 'CV_STATUS_CHANGED'
  // أنشطة العقود
  | 'CONTRACT_CREATED' | 'CONTRACT_UPDATED' | 'CONTRACT_DELETED' 
  | 'CONTRACT_SIGNED' | 'CONTRACT_CANCELLED'
  // أنشطة المستخدمين
  | 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_CREATED' | 'USER_UPDATED' 
  | 'USER_DELETED' | 'USER_PASSWORD_CHANGED' | 'USER_ROLE_CHANGED'
  // أنشطة النظام
  | 'SYSTEM_BACKUP' | 'SYSTEM_RESTORE' | 'SYSTEM_ERROR' 
  | 'SYSTEM_WARNING' | 'SYSTEM_UPDATE' | 'SYSTEM_MAINTENANCE'
  // أنشطة الإشعارات
  | 'NOTIFICATION_SENT' | 'EMAIL_SENT' | 'SMS_SENT'
  // أنشطة البحث والتقارير
  | 'SEARCH_PERFORMED' | 'FILTER_APPLIED' | 'REPORT_GENERATED'
  // أنشطة جماعية
  | 'BULK_DELETE' | 'BULK_UPDATE' | 'BULK_DOWNLOAD' | 'BULK_ARCHIVE'
  // أنشطة أخرى
  | 'STATUS_CHANGED' | 'PRIORITY_CHANGED' | 'DATA_IMPORTED' | 'DATA_EXPORTED'

export interface ActivityDetails {
  type: ActivityType
  action: string
  description: string
  details?: string
  userId?: string
  userName?: string
  userEmail?: string
  userRole?: string
  targetType?: 'CV' | 'CONTRACT' | 'USER' | 'SYSTEM' | 'REPORT' | 'NOTIFICATION'
  targetId?: string
  targetName?: string
  targetDetails?: Record<string, any>
  metadata?: {
    ipAddress?: string
    userAgent?: string
    browser?: string
    os?: string
    device?: string
    location?: string
    duration?: number
    changes?: { field: string; oldValue: any; newValue: any }[]
    tags?: string[]
    importance?: 'low' | 'medium' | 'high' | 'critical'
    category?: string
    sessionId?: string
    referrer?: string
  }
  relatedActivities?: string[]
  isNew?: boolean
  isRead?: boolean
}

// دالة الحصول على معلومات المتصفح والجهاز
function getBrowserInfo(): { browser: string; os: string; device: string } {
  const userAgent = navigator.userAgent
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  // تحديد المتصفح
  if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox'
  else if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome'
  else if (userAgent.indexOf('Safari') > -1) browser = 'Safari'
  else if (userAgent.indexOf('Edge') > -1) browser = 'Edge'
  else if (userAgent.indexOf('Opera') > -1) browser = 'Opera'

  // تحديد نظام التشغيل
  if (userAgent.indexOf('Windows') > -1) os = 'Windows'
  else if (userAgent.indexOf('Mac') > -1) os = 'MacOS'
  else if (userAgent.indexOf('Linux') > -1) os = 'Linux'
  else if (userAgent.indexOf('Android') > -1) os = 'Android'
  else if (userAgent.indexOf('iOS') > -1) os = 'iOS'

  // تحديد نوع الجهاز
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    device = /iPad|Tablet/i.test(userAgent) ? 'Tablet' : 'Mobile'
  }

  return { browser, os, device }
}

// دالة الحصول على موقع IP
async function getIPInfo(): Promise<{ ip: string; location?: string }> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return { ip: data.ip }
  } catch {
    return { ip: 'Unknown' }
  }
}

// دالة تسجيل النشاط الرئيسية
export async function trackActivity(details: Partial<ActivityDetails>): Promise<void> {
  try {
    // الحصول على معلومات المستخدم من localStorage
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
    const token = localStorage.getItem('token')
    
    // الحصول على معلومات المتصفح
    const { browser, os, device } = getBrowserInfo()
    
    // الحصول على معلومات IP (اختياري)
    const { ip, location } = await getIPInfo()
    
    // بناء كائن النشاط الكامل
    const activity: ActivityDetails = {
      type: details.type || 'CV_VIEWED',
      action: details.action || '',
      description: details.description || '',
      details: details.details,
      userId: details.userId || userInfo.id,
      userName: details.userName || userInfo.name || 'Unknown',
      userEmail: details.userEmail || userInfo.email || '',
      userRole: details.userRole || userInfo.role,
      targetType: details.targetType,
      targetId: details.targetId,
      targetName: details.targetName,
      targetDetails: details.targetDetails,
      metadata: {
        ipAddress: ip,
        userAgent: navigator.userAgent,
        browser,
        os,
        device,
        location,
        sessionId: sessionStorage.getItem('sessionId') || '',
        referrer: document.referrer,
        ...details.metadata
      },
      relatedActivities: details.relatedActivities,
      isNew: true,
      isRead: false
    }
    
    // إرسال النشاط إلى الخادم
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(activity)
    })
    
    if (!response.ok) {
      console.error('Failed to track activity:', await response.text())
    }
    
    // حفظ نسخة محلية للوصول السريع
    const localActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]')
    localActivities.unshift({
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    })
    
    // الاحتفاظ بآخر 50 نشاط فقط
    if (localActivities.length > 50) {
      localActivities.splice(50)
    }
    
    localStorage.setItem('recentActivities', JSON.stringify(localActivities))
    
    // إرسال حدث مخصص للتحديث الفوري
    window.dispatchEvent(new CustomEvent('activityTracked', { detail: activity }))
    
  } catch (error) {
    console.error('Error tracking activity:', error)
  }
}

// دوال مساعدة لأنواع الأنشطة الشائعة
export const ActivityTracker = {
  // تتبع السير الذاتية
  cvCreated: (cvName: string, cvId: string) => trackActivity({
    type: 'CV_CREATED',
    action: 'CREATE',
    description: `تم إنشاء سيرة ذاتية جديدة: ${cvName}`,
    targetType: 'CV',
    targetId: cvId,
    targetName: cvName,
    metadata: { importance: 'high', tags: ['cv', 'create'] }
  }),
  
  cvUpdated: (cvName: string, cvId: string, changes?: any[]) => trackActivity({
    type: 'CV_UPDATED',
    action: 'UPDATE',
    description: `تم تحديث السيرة الذاتية: ${cvName}`,
    targetType: 'CV',
    targetId: cvId,
    targetName: cvName,
    metadata: { importance: 'medium', changes, tags: ['cv', 'update'] }
  }),
  
  cvDeleted: (cvName: string, cvId: string) => trackActivity({
    type: 'CV_DELETED',
    action: 'DELETE',
    description: `تم حذف السيرة الذاتية: ${cvName}`,
    targetType: 'CV',
    targetId: cvId,
    targetName: cvName,
    metadata: { importance: 'high', tags: ['cv', 'delete'] }
  }),
  
  cvViewed: (cvName: string, cvId: string) => trackActivity({
    type: 'CV_VIEWED',
    action: 'VIEW',
    description: `تم عرض السيرة الذاتية: ${cvName}`,
    targetType: 'CV',
    targetId: cvId,
    targetName: cvName,
    metadata: { importance: 'low', tags: ['cv', 'view'] }
  }),
  
  cvDownloaded: (cvName: string, cvId: string) => trackActivity({
    type: 'CV_DOWNLOADED',
    action: 'DOWNLOAD',
    description: `تم تحميل السيرة الذاتية: ${cvName}`,
    targetType: 'CV',
    targetId: cvId,
    targetName: cvName,
    metadata: { importance: 'medium', tags: ['cv', 'download'] }
  }),
  
  cvShared: (cvName: string, cvId: string, sharedWith: string) => trackActivity({
    type: 'CV_SHARED',
    action: 'SHARE',
    description: `تم مشاركة السيرة الذاتية: ${cvName} مع ${sharedWith}`,
    targetType: 'CV',
    targetId: cvId,
    targetName: cvName,
    targetDetails: { sharedWith },
    metadata: { importance: 'medium', tags: ['cv', 'share'] }
  }),
  
  cvStatusChanged: (cvName: string, cvId: string, oldStatus: string, newStatus: string) => trackActivity({
    type: 'CV_STATUS_CHANGED',
    action: 'STATUS_CHANGE',
    description: `تم تغيير حالة السيرة الذاتية: ${cvName} من ${oldStatus} إلى ${newStatus}`,
    targetType: 'CV',
    targetId: cvId,
    targetName: cvName,
    metadata: { 
      importance: 'medium', 
      changes: [{ field: 'status', oldValue: oldStatus, newValue: newStatus }],
      tags: ['cv', 'status'] 
    }
  }),
  
  // تتبع المستخدمين
  userLogin: (userName: string, userId: string) => trackActivity({
    type: 'USER_LOGIN',
    action: 'LOGIN',
    description: `${userName} قام بتسجيل الدخول`,
    targetType: 'USER',
    targetId: userId,
    targetName: userName,
    metadata: { importance: 'low', tags: ['user', 'login'] }
  }),
  
  userLogout: (userName: string, userId: string) => trackActivity({
    type: 'USER_LOGOUT',
    action: 'LOGOUT',
    description: `${userName} قام بتسجيل الخروج`,
    targetType: 'USER',
    targetId: userId,
    targetName: userName,
    metadata: { importance: 'low', tags: ['user', 'logout'] }
  }),
  
  userCreated: (userName: string, userId: string, role: string) => trackActivity({
    type: 'USER_CREATED',
    action: 'CREATE',
    description: `تم إنشاء مستخدم جديد: ${userName} بصلاحية ${role}`,
    targetType: 'USER',
    targetId: userId,
    targetName: userName,
    targetDetails: { role },
    metadata: { importance: 'high', tags: ['user', 'create'] }
  }),
  
  userRoleChanged: (userName: string, userId: string, oldRole: string, newRole: string) => trackActivity({
    type: 'USER_ROLE_CHANGED',
    action: 'ROLE_CHANGE',
    description: `تم تغيير صلاحيات ${userName} من ${oldRole} إلى ${newRole}`,
    targetType: 'USER',
    targetId: userId,
    targetName: userName,
    metadata: { 
      importance: 'high', 
      changes: [{ field: 'role', oldValue: oldRole, newValue: newRole }],
      tags: ['user', 'role'] 
    }
  }),
  
  // تتبع العمليات الجماعية
  bulkOperation: (operation: string, count: number, type: string) => trackActivity({
    type: `BULK_${operation.toUpperCase()}` as ActivityType,
    action: `BULK_${operation.toUpperCase()}`,
    description: `تم تنفيذ عملية ${operation} على ${count} ${type}`,
    metadata: { 
      importance: 'high', 
      tags: ['bulk', operation.toLowerCase()],
      targetDetails: { count, type }
    }
  }),
  
  // تتبع البحث والفلاتر
  searchPerformed: (searchTerm: string, resultsCount: number) => trackActivity({
    type: 'SEARCH_PERFORMED',
    action: 'SEARCH',
    description: `تم البحث عن: "${searchTerm}" - النتائج: ${resultsCount}`,
    targetDetails: { searchTerm, resultsCount },
    metadata: { importance: 'low', tags: ['search'] }
  }),
  
  filterApplied: (filters: Record<string, any>) => trackActivity({
    type: 'FILTER_APPLIED',
    action: 'FILTER',
    description: `تم تطبيق فلاتر البحث`,
    targetDetails: filters,
    metadata: { importance: 'low', tags: ['filter'] }
  }),
  
  // تتبع الأخطاء والتحذيرات
  systemError: (error: string, details?: any) => trackActivity({
    type: 'SYSTEM_ERROR',
    action: 'ERROR',
    description: `خطأ في النظام: ${error}`,
    targetType: 'SYSTEM',
    targetDetails: details,
    metadata: { importance: 'critical', tags: ['system', 'error'] }
  }),
  
  systemWarning: (warning: string, details?: any) => trackActivity({
    type: 'SYSTEM_WARNING',
    action: 'WARNING',
    description: `تحذير من النظام: ${warning}`,
    targetType: 'SYSTEM',
    targetDetails: details,
    metadata: { importance: 'high', tags: ['system', 'warning'] }
  })
}

// التصدير الافتراضي
export default ActivityTracker
