import React from 'react'
import { 
  Activity, Clock, User, FileText, Trash2, Edit, Edit2, UserPlus, 
  FileSignature, Download, Search, Filter, Calendar, Eye, 
  AlertCircle, CheckCircle, XCircle, RefreshCw, ChevronDown, 
  ChevronUp, Plus, LogIn, LogOut, Shield, Key, Upload, Archive, 
  Share2, Lock, Unlock, Database, Settings, Mail, Phone, MapPin,
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Info,
  Zap, Award, Target, Users, Briefcase, Home, Star, MessageSquare,
  BookOpen, Package, ShoppingCart, CreditCard, BarChart, PieChart,
  Layers, Grid, Hash, Globe, Wifi, WifiOff, Monitor, Smartphone,
  Bell, BellOff, Volume2, VolumeX, Camera, Image, Video, Mic
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { ActivityType } from '@/lib/activity-tracker'

// تعريف أنواع الأنشطة مع الأيقونات والألوان
export const ActivityTypeConfig: Record<ActivityType, {
  icon: React.ElementType
  color: string
  bgColor: string
  label: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}> = {
  // أنشطة السير الذاتية
  CV_CREATED: { 
    icon: FileText, 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
    label: 'سيرة جديدة', 
    priority: 'high' 
  },
  CV_UPDATED: { 
    icon: Edit, 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
    label: 'تحديث سيرة', 
    priority: 'medium' 
  },
  CV_DELETED: { 
    icon: Trash2, 
    color: 'text-red-600 dark:text-red-400', 
    bgColor: 'bg-red-500/10 dark:bg-red-400/10',
    label: 'حذف سيرة', 
    priority: 'high' 
  },
  CV_VIEWED: { 
    icon: Eye, 
    color: 'text-purple-600 dark:text-purple-400', 
    bgColor: 'bg-purple-500/10 dark:bg-purple-400/10',
    label: 'عرض سيرة', 
    priority: 'low' 
  },
  CV_DOWNLOADED: { 
    icon: Download, 
    color: 'text-indigo-600 dark:text-indigo-400', 
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    label: 'تحميل سيرة', 
    priority: 'medium' 
  },
  CV_SHARED: { 
    icon: Share2, 
    color: 'text-pink-600 dark:text-pink-400', 
    bgColor: 'bg-pink-500/10 dark:bg-pink-400/10',
    label: 'مشاركة سيرة', 
    priority: 'medium' 
  },
  CV_ARCHIVED: { 
    icon: Archive, 
    color: 'text-gray-600 dark:text-gray-400', 
    bgColor: 'bg-gray-500/10 dark:bg-gray-400/10',
    label: 'أرشفة سيرة', 
    priority: 'medium' 
  },
  CV_RESTORED: { 
    icon: RefreshCw, 
    color: 'text-teal-600 dark:text-teal-400', 
    bgColor: 'bg-teal-500/10 dark:bg-teal-400/10',
    label: 'استعادة سيرة', 
    priority: 'medium' 
  },
  CV_IMPORTED: { 
    icon: Upload, 
    color: 'text-cyan-600 dark:text-cyan-400', 
    bgColor: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    label: 'استيراد سيرة', 
    priority: 'high' 
  },
  CV_EXPORTED: { 
    icon: Package, 
    color: 'text-orange-600 dark:text-orange-400', 
    bgColor: 'bg-orange-500/10 dark:bg-orange-400/10',
    label: 'تصدير سيرة', 
    priority: 'medium' 
  },
  CV_STATUS_CHANGED: { 
    icon: RefreshCw, 
    color: 'text-yellow-600 dark:text-yellow-400', 
    bgColor: 'bg-yellow-500/10 dark:bg-yellow-400/10',
    label: 'تغيير حالة سيرة', 
    priority: 'medium' 
  },
  
  // أنشطة العقود
  CONTRACT_CREATED: { 
    icon: FileSignature, 
    color: 'text-purple-700 dark:text-purple-400', 
    bgColor: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 dark:from-purple-400/20 dark:to-purple-500/20',
    label: '🎯 إنشاء عقد جديد', 
    priority: 'critical' 
  },
  CONTRACT_UPDATED: { 
    icon: Edit, 
    color: 'text-blue-700 dark:text-blue-400', 
    bgColor: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 dark:from-blue-400/20 dark:to-blue-500/20',
    label: '✏️ تحديث عقد', 
    priority: 'high' 
  },
  CONTRACT_DELETED: { 
    icon: Trash2, 
    color: 'text-red-700 dark:text-red-400', 
    bgColor: 'bg-gradient-to-br from-red-500/20 to-red-600/20 dark:from-red-400/20 dark:to-red-500/20',
    label: '❌ حذف عقد', 
    priority: 'critical' 
  },
  CONTRACT_SIGNED: { 
    icon: CheckCircle, 
    color: 'text-green-700 dark:text-green-400', 
    bgColor: 'bg-gradient-to-br from-green-500/20 to-green-600/20 dark:from-green-400/20 dark:to-green-500/20',
    label: '✅ توقيع عقد', 
    priority: 'critical' 
  },
  CONTRACT_CANCELLED: { 
    icon: XCircle, 
    color: 'text-red-700 dark:text-red-400', 
    bgColor: 'bg-gradient-to-br from-red-500/20 to-red-600/20 dark:from-red-400/20 dark:to-red-500/20',
    label: '⛔ إلغاء عقد', 
    priority: 'critical' 
  },
  
  // أنشطة المستخدمين
  USER_LOGIN: { 
    icon: LogIn, 
    color: 'text-teal-600 dark:text-teal-400', 
    bgColor: 'bg-teal-500/10 dark:bg-teal-400/10',
    label: 'تسجيل دخول', 
    priority: 'low' 
  },
  USER_LOGOUT: { 
    icon: LogOut, 
    color: 'text-orange-600 dark:text-orange-400', 
    bgColor: 'bg-orange-500/10 dark:bg-orange-400/10',
    label: 'تسجيل خروج', 
    priority: 'low' 
  },
  USER_CREATED: { 
    icon: UserPlus, 
    color: 'text-green-600 dark:text-green-400', 
    bgColor: 'bg-green-500/10 dark:bg-green-400/10',
    label: 'إنشاء مستخدم', 
    priority: 'high' 
  },
  USER_UPDATED: { 
    icon: User, 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
    label: 'تحديث مستخدم', 
    priority: 'medium' 
  },
  USER_DELETED: { 
    icon: Trash2, 
    color: 'text-red-600 dark:text-red-400', 
    bgColor: 'bg-red-500/10 dark:bg-red-400/10',
    label: 'حذف مستخدم', 
    priority: 'high' 
  },
  USER_PASSWORD_CHANGED: { 
    icon: Key, 
    color: 'text-yellow-600 dark:text-yellow-400', 
    bgColor: 'bg-yellow-500/10 dark:bg-yellow-400/10',
    label: 'تغيير كلمة المرور', 
    priority: 'high' 
  },
  USER_ROLE_CHANGED: { 
    icon: Shield, 
    color: 'text-purple-600 dark:text-purple-400', 
    bgColor: 'bg-purple-500/10 dark:bg-purple-400/10',
    label: 'تغيير صلاحيات', 
    priority: 'high' 
  },
  
  // أنشطة النظام
  SYSTEM_BACKUP: { 
    icon: Database, 
    color: 'text-green-600 dark:text-green-400', 
    bgColor: 'bg-green-500/10 dark:bg-green-400/10',
    label: 'نسخ احتياطي', 
    priority: 'high' 
  },
  SYSTEM_RESTORE: { 
    icon: RefreshCw, 
    color: 'text-orange-600 dark:text-orange-400', 
    bgColor: 'bg-orange-500/10 dark:bg-orange-400/10',
    label: 'استعادة نظام', 
    priority: 'high' 
  },
  SYSTEM_ERROR: { 
    icon: AlertTriangle, 
    color: 'text-red-700 dark:text-red-400', 
    bgColor: 'bg-red-500/20 dark:bg-red-400/20',
    label: 'خطأ نظام', 
    priority: 'critical' 
  },
  SYSTEM_WARNING: { 
    icon: AlertCircle, 
    color: 'text-yellow-600 dark:text-yellow-400', 
    bgColor: 'bg-yellow-500/10 dark:bg-yellow-400/10',
    label: 'تحذير نظام', 
    priority: 'high' 
  },
  SYSTEM_UPDATE: { 
    icon: TrendingUp, 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
    label: 'تحديث نظام', 
    priority: 'medium' 
  },
  SYSTEM_MAINTENANCE: { 
    icon: Settings, 
    color: 'text-gray-600 dark:text-gray-400', 
    bgColor: 'bg-gray-500/10 dark:bg-gray-400/10',
    label: 'صيانة نظام', 
    priority: 'medium' 
  },
  
  // باقي الأنشطة
  NOTIFICATION_SENT: { 
    icon: Bell, 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
    label: 'إرسال إشعار', 
    priority: 'low' 
  },
  EMAIL_SENT: { 
    icon: Mail, 
    color: 'text-indigo-600 dark:text-indigo-400', 
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    label: 'إرسال بريد', 
    priority: 'medium' 
  },
  SMS_SENT: { 
    icon: MessageSquare, 
    color: 'text-green-600 dark:text-green-400', 
    bgColor: 'bg-green-500/10 dark:bg-green-400/10',
    label: 'إرسال رسالة', 
    priority: 'medium' 
  },
  SEARCH_PERFORMED: { 
    icon: Search, 
    color: 'text-purple-600 dark:text-purple-400', 
    bgColor: 'bg-purple-500/10 dark:bg-purple-400/10',
    label: 'عملية بحث', 
    priority: 'low' 
  },
  FILTER_APPLIED: { 
    icon: Filter, 
    color: 'text-indigo-600 dark:text-indigo-400', 
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    label: 'تطبيق فلتر', 
    priority: 'low' 
  },
  REPORT_GENERATED: { 
    icon: BarChart, 
    color: 'text-cyan-600 dark:text-cyan-400', 
    bgColor: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    label: 'إنشاء تقرير', 
    priority: 'medium' 
  },
  BULK_DELETE: { 
    icon: Trash2, 
    color: 'text-red-600 dark:text-red-400', 
    bgColor: 'bg-red-500/10 dark:bg-red-400/10',
    label: 'حذف جماعي', 
    priority: 'high' 
  },
  BULK_UPDATE: { 
    icon: Edit2, 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
    label: 'تحديث جماعي', 
    priority: 'high' 
  },
  BULK_DOWNLOAD: { 
    icon: Download, 
    color: 'text-indigo-600 dark:text-indigo-400', 
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    label: 'تحميل جماعي', 
    priority: 'medium' 
  },
  BULK_ARCHIVE: { 
    icon: Archive, 
    color: 'text-gray-600 dark:text-gray-400', 
    bgColor: 'bg-gray-500/10 dark:bg-gray-400/10',
    label: 'أرشفة جماعية', 
    priority: 'medium' 
  },
  STATUS_CHANGED: { 
    icon: RefreshCw, 
    color: 'text-yellow-600 dark:text-yellow-400', 
    bgColor: 'bg-yellow-500/10 dark:bg-yellow-400/10',
    label: 'تغيير الحالة', 
    priority: 'medium' 
  },
  PRIORITY_CHANGED: { 
    icon: Target, 
    color: 'text-orange-600 dark:text-orange-400', 
    bgColor: 'bg-orange-500/10 dark:bg-orange-400/10',
    label: 'تغيير الأولوية', 
    priority: 'medium' 
  },
  DATA_IMPORTED: { 
    icon: Upload, 
    color: 'text-cyan-600 dark:text-cyan-400', 
    bgColor: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    label: 'استيراد بيانات', 
    priority: 'high' 
  },
  DATA_EXPORTED: { 
    icon: Download, 
    color: 'text-indigo-600 dark:text-indigo-400', 
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    label: 'تصدير بيانات', 
    priority: 'medium' 
  },
  OTHER: { 
    icon: Info, 
    color: 'text-gray-600 dark:text-gray-400', 
    bgColor: 'bg-gray-500/10 dark:bg-gray-400/10',
    label: 'نشاط آخر', 
    priority: 'low' 
  }
}

// إضافة أنواع حجوزات
export const BookingActivityTypes = {
  BOOKING_CREATED: { 
    icon: ShoppingCart, 
    color: 'text-amber-700 dark:text-amber-400', 
    bgColor: 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 dark:from-amber-400/20 dark:to-amber-500/20',
    label: '🎊 حجز جديد', 
    priority: 'critical' 
  },
  BOOKING_UPDATED: { 
    icon: Edit2, 
    color: 'text-indigo-700 dark:text-indigo-400', 
    bgColor: 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 dark:from-indigo-400/20 dark:to-indigo-500/20',
    label: '📝 تحديث حجز', 
    priority: 'high' 
  },
  BOOKING_CANCELLED: { 
    icon: XCircle, 
    color: 'text-red-700 dark:text-red-400', 
    bgColor: 'bg-gradient-to-br from-red-500/20 to-red-600/20 dark:from-red-400/20 dark:to-red-500/20',
    label: '🚫 إلغاء حجز', 
    priority: 'critical' 
  },
  BOOKING_CONFIRMED: { 
    icon: CheckCircle, 
    color: 'text-emerald-700 dark:text-emerald-400', 
    bgColor: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 dark:from-emerald-400/20 dark:to-emerald-500/20',
    label: '💚 تأكيد حجز', 
    priority: 'critical' 
  },
  ...ActivityTypeConfig
}

// مكون بطاقة النشاط
export const ActivityCard: React.FC<{
  activity: any
  isExpanded: boolean
  onToggle: () => void
}> = ({ activity, isExpanded, onToggle }) => {
  // Check for booking activities
  const isBookingActivity = activity.action?.includes('BOOKING') || activity.targetType === 'BOOKING'
  const isContractActivity = activity.action?.includes('CONTRACT') || activity.targetType === 'CONTRACT'
  
  // Get config based on activity type
  let config = ActivityTypeConfig[activity.type as ActivityType] || ActivityTypeConfig.CV_VIEWED
  
  // Override config for booking activities
  if (isBookingActivity && activity.action) {
    config = BookingActivityTypes[activity.action as keyof typeof BookingActivityTypes] || config
  }
  
  const Icon = config.icon
  
  const relativeTime = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
    locale: ar
  })
  
  // Special styling for contracts and bookings
  const getSpecialStyling = () => {
    if (isContractActivity) {
      return 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-2 border-purple-400 dark:border-purple-600 shadow-purple-200 dark:shadow-purple-900/50'
    }
    if (isBookingActivity) {
      return 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-2 border-amber-400 dark:border-amber-600 shadow-amber-200 dark:shadow-amber-900/50'
    }
    return ''
  }
  
  return (
    <div
      className={`bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-border ${
        activity.isNew ? 'ring-2 ring-primary ring-opacity-50 animate-pulse-once' : ''
      } ${
        activity.metadata?.importance === 'critical' 
          ? 'border-red-500/50' 
          : activity.metadata?.importance === 'high' 
          ? 'border-yellow-500/50' 
          : ''
      } ${getSpecialStyling()}`}
    >
      {/* شريط الحالة للأنشطة الجديدة */}
      {activity.isNew && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60 animate-pulse" />
      )}
      
      <div className="p-6">
        <div className="flex items-start gap-4 relative">
          {/* الأيقونة */}
          <div className={`p-3 rounded-lg ${config.bgColor} flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          
          {/* المحتوى */}
          <div className="flex-1">
            {/* الرأس */}
            <div 
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={onToggle}
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {config.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
              </div>
              <div className="text-sm text-muted-foreground text-left">
                <div>{new Date(activity.createdAt).toLocaleDateString('ar-SA')}</div>
                <div>{new Date(activity.createdAt).toLocaleTimeString('ar-SA')}</div>
                <div className="text-xs mt-1">{relativeTime}</div>
              </div>
            </div>
            
            {/* معلومات المستخدم */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-bold">
                {activity.userName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-foreground">{activity.userName || 'مستخدم غير معروف'}</span>
                  {activity.userRole && (
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs rounded-full border border-purple-500/20">
                      {activity.userRole}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">{activity.action}</span>
                  <span className="text-sm text-muted-foreground ml-1">{activity.description}</span>
                </div>
              </div>
            </div>
            
            {/* معلومات الهدف */}
            {activity.targetName && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">الهدف:</span>
                <span className="text-sm font-medium text-foreground">{activity.targetName}</span>
                {activity.targetType && (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded border border-blue-500/20">
                    {activity.targetType}
                  </span>
                )}
              </div>
            )}
            
            {/* معلومات تقنية */}
            <div className="flex flex-wrap gap-2 mb-3">
              {activity.metadata?.ipAddress && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md border border-border">
                  <Wifi className="h-3 w-3" />
                  {activity.metadata.ipAddress}
                </span>
              )}
              {activity.metadata?.browser && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md border border-border">
                  <Globe className="h-3 w-3" />
                  {activity.metadata.browser}
                </span>
              )}
              {activity.metadata?.device && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md border border-border">
                  <Monitor className="h-3 w-3" />
                  {activity.metadata.device}
                </span>
              )}
            </div>
            
            {/* زر التوسيع */}
            <button
              onClick={onToggle}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  إخفاء التفاصيل
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  عرض التفاصيل
                </>
              )}
            </button>
            
            {/* التفاصيل الموسعة */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border mt-2 pt-4 space-y-3">
                {/* التغييرات */}
                {activity.metadata?.changes && activity.metadata.changes.length > 0 && (
                  <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs font-medium text-foreground mb-2">التغييرات:</p>
                    <div className="space-y-1">
                      {activity.metadata.changes.map((change: any, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          <span className="font-medium text-muted-foreground">{change.field}:</span>
                          <div className="flex gap-2">
                            <span className="text-red-600 dark:text-red-400 line-through">{change.oldValue || '-'}</span>
                            <span className="text-muted-foreground">←</span>
                            <span className="text-green-600 dark:text-green-400">{change.newValue || '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* معلومات إضافية */}
                {activity.targetDetails && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">تفاصيل إضافية:</h4>
                    <div className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg overflow-auto">
                      <pre>{JSON.stringify(activity.targetDetails, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                {/* الوسوم */}
                {activity.metadata?.tags && activity.metadata.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">الوسوم:</h4>
                    <div className="flex flex-wrap gap-2">
                      {activity.metadata.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-500/20">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// مكون إحصائيات الأنشطة
export const ActivityStats: React.FC<{
  activities: any[]
}> = ({ activities }) => {
  const today = activities.filter(a => {
    const date = new Date(a.createdAt)
    const now = new Date()
    return date.toDateString() === now.toDateString()
  }).length
  
  const critical = activities.filter(a => 
    (a.metadata?.importance || ActivityTypeConfig[a.type as ActivityType]?.priority) === 'critical'
  ).length
  
  const unread = activities.filter(a => a.isNew).length
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">إجمالي الأنشطة</p>
            <p className="text-2xl font-bold text-foreground">{activities.length}</p>
          </div>
          <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">أنشطة اليوم</p>
            <p className="text-2xl font-bold text-foreground">{today}</p>
          </div>
          <Calendar className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">أنشطة حرجة</p>
            <p className="text-2xl font-bold text-foreground">{critical}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">غير مقروءة</p>
            <p className="text-2xl font-bold text-foreground">{unread}</p>
          </div>
          <Bell className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </div>
  )
}
