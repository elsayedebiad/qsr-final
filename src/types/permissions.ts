// أنواع الصلاحيات المتاحة في النظام
export enum Permission {
  // السير الذاتية
  VIEW_CVS = 'view_cvs',               // مشاهدة السير في الداش بورد
  UPLOAD_CVS = 'upload_cvs',           // رفع سير بكل الطرق
  
  // العقود
  CREATE_CONTRACT = 'create_contract',  // عمل عقد
  VIEW_CONTRACTS = 'view_contracts',    // مشاهدة صفحة العقود
  RESTORE_CONTRACT = 'restore_contract', // استرجاع عقد
  
  // الحجوزات
  CREATE_BOOKING = 'create_booking',    // عمل حجز
  VIEW_BOOKINGS = 'view_bookings',      // مشاهدة صفحة الحجوزات
  RESTORE_BOOKING = 'restore_booking',  // استرجاع حجز
  
  // المستخدمين
  MANAGE_USERS = 'manage_users',        // إضافة وإدارة المستخدمين
  
  // التحليلات والأنشطة
  VIEW_ANALYTICS = 'view_analytics',    // رؤية التحليلات
  VIEW_ACTIVITIES = 'view_activities',  // رؤية سجل الأنشطة
  
  // صلاحيات إدارية
  ADMIN = 'admin'                       // صلاحية كاملة
}

// واجهة الصلاحيات
export interface PermissionSet {
  permissions: Permission[]
}

// واجهة المستخدم مع الصلاحيات
export interface UserWithPermissions {
  id: string
  name: string
  email: string
  role: string
  permissions: Permission[]
  createdAt: Date
  updatedAt: Date
}

// مجموعات الصلاحيات المسبقة
export const PERMISSION_PRESETS = {
  ADMIN: {
    name: 'مدير النظام',
    description: 'صلاحيات كاملة على جميع أجزاء النظام',
    permissions: Object.values(Permission)
  },
  MANAGER: {
    name: 'مدير',
    description: 'إدارة السير والعقود والحجوزات',
    permissions: [
      Permission.VIEW_CVS,
      Permission.UPLOAD_CVS,
      Permission.CREATE_CONTRACT,
      Permission.VIEW_CONTRACTS,
      Permission.RESTORE_CONTRACT,
      Permission.CREATE_BOOKING,
      Permission.VIEW_BOOKINGS,
      Permission.RESTORE_BOOKING,
      Permission.VIEW_ANALYTICS,
      Permission.VIEW_ACTIVITIES
    ]
  },
  EMPLOYEE: {
    name: 'موظف',
    description: 'عمليات أساسية على السير والعقود',
    permissions: [
      Permission.VIEW_CVS,
      Permission.CREATE_CONTRACT,
      Permission.VIEW_CONTRACTS,
      Permission.CREATE_BOOKING,
      Permission.VIEW_BOOKINGS
    ]
  },
  VIEWER: {
    name: 'مشاهد',
    description: 'مشاهدة فقط بدون تعديل',
    permissions: [
      Permission.VIEW_CVS,
      Permission.VIEW_CONTRACTS,
      Permission.VIEW_BOOKINGS
    ]
  }
}

// وصف الصلاحيات بالعربية
export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.VIEW_CVS]: 'مشاهدة السير في الداش بورد',
  [Permission.UPLOAD_CVS]: 'رفع سير بكل الطرق',
  [Permission.CREATE_CONTRACT]: 'عمل عقد',
  [Permission.VIEW_CONTRACTS]: 'مشاهدة صفحة العقود',
  [Permission.RESTORE_CONTRACT]: 'استرجاع عقد',
  [Permission.CREATE_BOOKING]: 'عمل حجز',
  [Permission.VIEW_BOOKINGS]: 'مشاهدة صفحة الحجوزات',
  [Permission.RESTORE_BOOKING]: 'استرجاع حجز',
  [Permission.MANAGE_USERS]: 'إضافة وإدارة المستخدمين',
  [Permission.VIEW_ANALYTICS]: 'رؤية التحليلات',
  [Permission.VIEW_ACTIVITIES]: 'رؤية سجل الأنشطة',
  [Permission.ADMIN]: 'صلاحيات المدير الكاملة'
}

// فئات الصلاحيات للتنظيم في الواجهة
export const PERMISSION_CATEGORIES = {
  'السير الذاتية': [Permission.VIEW_CVS, Permission.UPLOAD_CVS],
  'العقود': [Permission.CREATE_CONTRACT, Permission.VIEW_CONTRACTS, Permission.RESTORE_CONTRACT],
  'الحجوزات': [Permission.CREATE_BOOKING, Permission.VIEW_BOOKINGS, Permission.RESTORE_BOOKING],
  'الإدارة': [Permission.MANAGE_USERS],
  'التقارير': [Permission.VIEW_ANALYTICS, Permission.VIEW_ACTIVITIES]
}

// دالة للتحقق من الصلاحية
export function hasPermission(
  userPermissions: Permission[], 
  requiredPermission: Permission
): boolean {
  // المدير له كل الصلاحيات
  if (userPermissions.includes(Permission.ADMIN)) return true
  
  // التحقق من الصلاحية المطلوبة
  return userPermissions.includes(requiredPermission)
}

// دالة للتحقق من مجموعة صلاحيات
export function hasAnyPermission(
  userPermissions: Permission[], 
  requiredPermissions: Permission[]
): boolean {
  if (userPermissions.includes(Permission.ADMIN)) return true
  
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  )
}

// دالة للتحقق من كل الصلاحيات
export function hasAllPermissions(
  userPermissions: Permission[], 
  requiredPermissions: Permission[]
): boolean {
  if (userPermissions.includes(Permission.ADMIN)) return true
  
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  )
}
