'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import DashboardLayout from '../../../components/DashboardLayout'
import { 
  Bell, 
  BellRing,
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  RefreshCw,
  Calendar,
  User,
  FileText,
  Users,
  Settings,
  Upload,
  Download,
  BarChart3,
  Clock,
  ChevronLeft,
  ChevronRight,
  Key,
  Copy,
  X
} from 'lucide-react'

interface ActivationData {
  activationCode: string
  userEmail: string
  userName: string
  expiresAt: string
  requestTime: string
}

interface Notification {
  id: number
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  category: string
  data?: string
  isRead: boolean
  createdAt: string
  user: {
    id: number
    name: string
    email: string
  }
}

interface NotificationData {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  unreadCount: number
}

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [expandedNotification, setExpandedNotification] = useState<number | null>(null)
  const [activationPopup, setActivationPopup] = useState<{code: string, user: string, email: string} | null>(null)
  const [lastNotificationId, setLastNotificationId] = useState<number>(0)
  const [processedCodes, setProcessedCodes] = useState<Set<string>>(new Set())
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [closedCodes, setClosedCodes] = useState<Set<string>>(new Set())
  const [isClient, setIsClient] = useState(false)

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
    // Load permanently closed codes from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('closedActivationCodes')
      if (saved) {
        setClosedCodes(new Set(JSON.parse(saved)))
      }
    }
  }, [])

  useEffect(() => {
    if (!isClient) return // Don't run until client-side
    
    fetchNotifications()
    // Auto-refresh every 5 seconds to check for new activation codes
    const interval = setInterval(checkForNewActivationCodes, 5000)
    return () => clearInterval(interval)
  }, [pagination.page, selectedCategory, selectedType, closedCodes, isClient]) // Add isClient dependency

  const checkForNewActivationCodes = async () => {
    if (typeof window === 'undefined') return // Skip on server-side
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/notifications?limit=5&page=1`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data: NotificationData = await response.json()
        const latestNotifications = data.notifications || []
        
        // Check for new activation code notifications
        const newActivationCodes = latestNotifications.filter(notification => 
          notification.id > lastNotificationId &&
          notification.title.includes('كود تفعيل تسجيل دخول')
        )

        if (newActivationCodes.length > 0) {
          const latestActivation = newActivationCodes[0]
          const notificationData = parseNotificationData(latestActivation.data)
          
          if (notificationData && notificationData.activationCode && 
              !processedCodes.has(notificationData.activationCode) && 
              !closedCodes.has(notificationData.activationCode) && !isPopupOpen) {
            // Mark code as processed
            setProcessedCodes(prev => new Set([...prev, notificationData.activationCode]))
            
            // Show popup immediately
            setActivationPopup({
              code: notificationData.activationCode,
              user: notificationData.userName,
              email: notificationData.userEmail
            })
            setIsPopupOpen(true)
            
            // Update last notification ID
            setLastNotificationId(Math.max(...latestNotifications.map(n => n.id)))
            
            // Refresh notifications list
            fetchNotifications()
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error)
    }
  }

  const fetchNotifications = async () => {
    if (typeof window === 'undefined') return // Skip on server-side
    
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedType) params.append('type', selectedType)

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data: NotificationData = await response.json()
        setNotifications(data.notifications || [])
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
        setUnreadCount(data.unreadCount || 0)
      } else {
        toast.error('فشل في جلب الإشعارات')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب الإشعارات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationAction = async (action: string, notificationId?: number) => {
    if (typeof window === 'undefined') return // Skip on server-side
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, notificationId })
      })

      if (response.ok) {
        fetchNotifications()
        switch (action) {
          case 'markAsRead':
            toast.success('تم تحديد الإشعار كمقروء')
            break
          case 'markAllAsRead':
            toast.success('تم تحديد جميع الإشعارات كمقروءة')
            break
          case 'delete':
            toast.success('تم حذف الإشعار')
            break
        }
      } else {
        toast.error('فشل في تنفيذ العملية')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تنفيذ العملية')
    }
  }

  const getNotificationIcon = (type: string, category: string) => {
    if (category === 'import') return <Upload className="w-5 h-5" />
    if (category === 'cv') return <FileText className="w-5 h-5" />
    if (category === 'user') return <Users className="w-5 h-5" />
    if (category === 'contract') return <FileText className="w-5 h-5" />
    if (category === 'system') return <Settings className="w-5 h-5" />

    switch (type) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5" />
      case 'WARNING': return <AlertTriangle className="w-5 h-5" />
      case 'ERROR': return <XCircle className="w-5 h-5" />
      default: return <Info className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'text-success bg-success/10 border-success/30'
      case 'WARNING': return 'text-warning bg-warning/10 border-warning/30'
      case 'ERROR': return 'text-destructive bg-destructive/10 border-destructive/30'
      default: return 'text-info bg-info/10 border-info/30'
    }
  }

  const getCategoryName = (category: string) => {
    const names = {
      'import': 'استيراد',
      'cv': 'السير الذاتية',
      'user': 'المستخدمين',
      'contract': 'العقود',
      'system': 'النظام'
    }
    return names[category as keyof typeof names] || category
  }

  const getTypeName = (type: string) => {
    const names = {
      'INFO': 'معلومات',
      'SUCCESS': 'نجاح',
      'WARNING': 'تحذير',
      'ERROR': 'خطأ'
    }
    return names[type as keyof typeof names] || type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays < 7) return `منذ ${diffDays} يوم`
    
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseNotificationData = (dataString?: string) => {
    try {
      return dataString ? JSON.parse(dataString) : null
    } catch {
      return null
    }
  }

  const copyActivationCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('تم نسخ كود التفعيل', {
      style: {
        background: 'var(--success)',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600'
      }
    })
  }

  const closeActivationPopup = () => {
    if (activationPopup) {
      // Mark this code as permanently closed
      const newClosedCodes = new Set([...closedCodes, activationPopup.code])
      setClosedCodes(newClosedCodes)
      
      // Save to localStorage for persistence across sessions
      if (typeof window !== 'undefined') {
        localStorage.setItem('closedActivationCodes', JSON.stringify([...newClosedCodes]))
      }
    }
    setActivationPopup(null)
    setIsPopupOpen(false)
  }

  const showActivationCode = (notification: Notification) => {
    const data = parseNotificationData(notification.data)
    if (data && data.activationCode) {
      toast(`🔐 كود التفعيل: ${data.activationCode}`, {
        duration: 15000,
        style: {
          background: '#f59e0b',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      })
      copyActivationCode(data.activationCode)
    }
  }

  return (
    <DashboardLayout>
      {(user) => (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-card rounded-2xl shadow-xl border border-blue-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-info/10 rounded-full p-3">
                  <Bell className="w-8 h-8 text-info" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    🔔 مركز الإشعارات
                  </h1>
                  <p className="text-muted-foreground">
                    جميع الأنشطة والتحديثات في النظام
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <div className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-medium">
                    {unreadCount} غير مقروء
                  </div>
                )}
                <button
                  onClick={() => handleNotificationAction('markAllAsRead')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={unreadCount === 0}
                >
                  <CheckCircle className="w-4 h-4" />
                  تحديد الكل كمقروء
                </button>
                <button
                  onClick={fetchNotifications}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
                
                {/* Test Button for Demo */}
                <button
                  onClick={() => {
                    if (!isPopupOpen) {
                      setActivationPopup({
                        code: '123456',
                        user: 'مستخدم تجريبي',
                        email: 'test@example.com'
                      })
                      setIsPopupOpen(true)
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/80 transition-colors disabled:opacity-50"
                  disabled={isPopupOpen}
                >
                  <Key className="w-4 h-4" />
                  اختبار البوب أب
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  تصفية حسب الفئة
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">جميع الفئات</option>
                  <option value="import">استيراد</option>
                  <option value="cv">السير الذاتية</option>
                  <option value="user">المستخدمين</option>
                  <option value="contract">العقود</option>
                  <option value="system">النظام</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  تصفية حسب النوع
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">جميع الأنواع</option>
                  <option value="INFO">معلومات</option>
                  <option value="SUCCESS">نجاح</option>
                  <option value="WARNING">تحذير</option>
                  <option value="ERROR">خطأ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-card rounded-2xl shadow-xl border border-blue-100">
            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-info mx-auto mb-4" />
                <p className="text-muted-foreground">جاري تحميل الإشعارات...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">لا توجد إشعارات</p>
                <p className="text-muted-foreground">ستظهر جميع أنشطة النظام هنا</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => {
                  const isActivationCode = notification.title.includes('كود تفعيل تسجيل دخول')
                  return (
                    <div
                      key={notification.id}
                      className={`p-6 transition-colors ${
                        !notification.isRead ? 'bg-info/10' : 'hover:bg-background'
                      } ${isActivationCode ? 'border-l-4 border-warning bg-warning/5' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          isActivationCode 
                            ? 'bg-warning/20 text-warning animate-pulse' 
                            : getNotificationColor(notification.type)
                        }`}>
                          {isActivationCode ? (
                            <Key className="w-5 h-5" />
                          ) : (
                            getNotificationIcon(notification.type, notification.category)
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-foreground">
                                  {notification.title}
                                </h3>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                )}
                                {isActivationCode && (
                                  <span className="bg-warning text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                                    كود تفعيل!
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-foreground mb-3">
                                {notification.message}
                              </p>
                              
                              {/* Activation Code Button */}
                              {isActivationCode && (
                                <button
                                  onClick={() => showActivationCode(notification)}
                                  className="bg-warning hover:bg-warning/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-3 animate-pulse"
                                >
                                  <Key className="w-4 h-4" />
                                  عرض كود التفعيل
                                </button>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Filter className="w-3 h-3" />
                                  {getCategoryName(notification.category)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(notification.createdAt)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  notification.type === 'SUCCESS' ? 'bg-success/10 text-success' :
                                  notification.type === 'WARNING' ? 'bg-warning/10 text-warning' :
                                  notification.type === 'ERROR' ? 'bg-destructive/10 text-destructive' :
                                  'bg-info/10 text-info'
                                }`}>
                                  {getTypeName(notification.type)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleNotificationAction('markAsRead', notification.id)}
                                  className="p-2 text-blue-400 hover:text-info transition-colors"
                                  title="تحديد كمقروء"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleNotificationAction('delete', notification.id)}
                                className="p-2 text-red-400 hover:text-destructive transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="p-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    عرض {((pagination.page - 1) * pagination.limit) + 1} إلى {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total} إشعار
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 text-muted-foreground hover:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    <span className="px-4 py-2 bg-info/10 text-info rounded-lg font-medium">
                      {pagination.page} / {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="p-2 text-muted-foreground hover:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Professional Theme-Matching Activation Code Popup */}
          {activationPopup && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn p-4">
              <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-warning via-warning/90 to-warning/80 text-white p-6 relative overflow-hidden">
                  <div className="animated-bg-theme absolute inset-0 opacity-30">
                    <div className="bg-aurora"></div>
                    <div className="bg-grid"></div>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 animate-pulse">
                          <Key className="w-8 h-8" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">🔐 كود تفعيل جديد</h2>
                          <p className="text-warning-foreground/80">طلب تسجيل دخول</p>
                        </div>
                      </div>
                      <button
                        onClick={closeActivationPopup}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-2 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* User Info Card */}
                  <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                    <h3 className="font-semibold text-info flex items-center gap-2 mb-2 text-sm">
                      <User className="w-4 h-4" />
                      تفاصيل المستخدم
                    </h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الاسم:</span>
                        <span className="font-medium text-foreground">{activationPopup.user}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">البريد:</span>
                        <span className="font-medium text-foreground truncate ml-2">{activationPopup.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Activation Code Card */}
                  <div className="bg-gradient-to-br from-success/20 to-success/10 border border-success/30 rounded-lg p-4">
                    <p className="text-success font-semibold text-center mb-3 flex items-center justify-center gap-2 text-sm">
                      <Key className="w-4 h-4" />
                      كود التفعيل
                    </p>
                    <div className="bg-card border border-border rounded-lg p-3 mb-3">
                      <div className="text-2xl font-mono font-black text-success tracking-wider text-center animate-pulse">
                        {activationPopup.code}
                      </div>
                    </div>
                    <button
                      onClick={() => copyActivationCode(activationPopup.code)}
                      className="w-full bg-success hover:bg-success/90 text-white px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Copy className="w-3 h-3" />
                      نسخ الكود
                    </button>
                  </div>
                  
                  {/* Instructions Card */}
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <h4 className="font-medium text-warning mb-2 flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-3 h-3" />
                      تعليمات مهمة
                    </h4>
                    <ul className="text-muted-foreground text-xs space-y-1">
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-warning rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>ارسل هذا الكود للمستخدم فوراً</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-warning rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>الكود صالح لمدة 15 دقيقة فقط</span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={closeActivationPopup}
                      className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-lg font-medium transition-all text-sm"
                    >
                      إغلاق
                    </button>
                    <button
                      onClick={() => {
                        copyActivationCode(activationPopup.code)
                        closeActivationPopup()
                      }}
                      className="flex-1 bg-success hover:bg-success/90 text-white py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Copy className="w-3 h-3" />
                      نسخ وإغلاق
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}