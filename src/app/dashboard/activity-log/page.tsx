'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { LucideIcon } from 'lucide-react'
import {
  Activity,
  Clock,
  User,
  FileText,
  Trash2,
  Edit,
  UserPlus,
  FileSignature,
  Download,
  Search,
  Filter,
  Calendar,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'

interface ActivityLog {
  id: string
  action: string
  description: string
  userId: string
  userName: string
  userEmail: string
  targetType: 'CV' | 'CONTRACT' | 'USER' | 'SYSTEM'
  targetId?: string
  targetName?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

const actionIcons: Record<string, LucideIcon> = {
  'CV_CREATED': FileText,
  'CV_UPDATED': Edit,
  'CV_DELETED': Trash2,
  'CV_VIEWED': Eye,
  'CONTRACT_CREATED': FileSignature,
  'CONTRACT_UPDATED': Edit,
  'CONTRACT_DELETED': Trash2,
  'USER_LOGIN': UserPlus,
  'USER_LOGOUT': User,
  'BULK_DELETE': Trash2,
  'BULK_DOWNLOAD': Download,
  'BULK_ARCHIVE': FileText,
  'STATUS_CHANGED': RefreshCw,
  'SYSTEM_BACKUP': CheckCircle,
  'SYSTEM_ERROR': XCircle,
}

const actionColors: Record<string, string> = {
  'CV_CREATED': 'text-success bg-success/10',
  'CV_UPDATED': 'text-info bg-info/10',
  'CV_DELETED': 'text-destructive bg-destructive/10',
  'CV_VIEWED': 'text-muted-foreground bg-muted',
  'CONTRACT_CREATED': 'text-purple-600 bg-purple-100',
  'CONTRACT_UPDATED': 'text-primary bg-primary/10',
  'CONTRACT_DELETED': 'text-destructive bg-destructive/10',
  'USER_LOGIN': 'text-emerald-600 bg-emerald-100',
  'USER_LOGOUT': 'text-orange-600 bg-orange-100',
  'BULK_DELETE': 'text-destructive bg-destructive/10',
  'BULK_DOWNLOAD': 'text-info bg-info/10',
  'BULK_ARCHIVE': 'text-warning bg-warning/10',
  'STATUS_CHANGED': 'text-warning bg-warning/10',
  'SYSTEM_BACKUP': 'text-success bg-success/10',
  'SYSTEM_ERROR': 'text-destructive bg-destructive/10',
}

const actionLabels: Record<string, string> = {
  'CV_CREATED': 'إنشاء سيرة ذاتية',
  'CV_UPDATED': 'تحديث سيرة ذاتية',
  'CV_DELETED': 'حذف سيرة ذاتية',
  'CV_VIEWED': 'عرض سيرة ذاتية',
  'CONTRACT_CREATED': 'إنشاء عقد',
  'CONTRACT_UPDATED': 'تحديث عقد',
  'CONTRACT_DELETED': 'حذف عقد',
  'USER_LOGIN': 'تسجيل دخول',
  'USER_LOGOUT': 'تسجيل خروج',
  'BULK_DELETE': 'حذف جماعي',
  'BULK_DOWNLOAD': 'تحميل جماعي',
  'BULK_ARCHIVE': 'أرشفة جماعية',
  'STATUS_CHANGED': 'تغيير الحالة',
  'SYSTEM_BACKUP': 'نسخ احتياطي',
  'SYSTEM_ERROR': 'خطأ في النظام',
}
function ActivityLogPageContent() {
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState<string>('ALL')
  const [filterUser, setFilterUser] = useState<string>('ALL')
  const [filterDate, setFilterDate] = useState<string>('ALL')
  const [filterMonth, setFilterMonth] = useState<string>('ALL')
  const [filterYear, setFilterYear] = useState<string>('ALL')
  const [filterTargetType, setFilterTargetType] = useState<string>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [cvStats, setCvStats] = useState({ uploaded: 0, created: 0, updated: 0 })
  const itemsPerPage = 20

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          // Allow all authenticated users to view activity log
          setUserRole(data.user.role)
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (userRole) {
      fetchActivities()
    }
  }, [currentPage, searchTerm, filterAction, filterUser, filterDate, filterMonth, filterYear, filterTargetType, startDate, endDate, userRole])

  const fetchActivities = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (filterAction !== 'ALL') params.append('action', filterAction)
      if (filterUser !== 'ALL') params.append('userId', filterUser)
      if (filterTargetType !== 'ALL') params.append('targetType', filterTargetType)
      if (filterMonth !== 'ALL') params.append('month', filterMonth)
      if (filterYear !== 'ALL') params.append('year', filterYear)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (filterDate !== 'ALL') params.append('dateRange', filterDate)

      const response = await fetch(`/api/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log('Activity API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Activities data received:', data.activities?.length || 0, 'activities')
        setActivities(data.activities || [])
        setTotalPages(data.pagination?.pages || 1)
        setCvStats(data.cvStats || { uploaded: 0, created: 0, updated: 0 })
        
        if (data.debug) {
          console.log('Debug info:', data.debug)
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch activities:', response.status, errorText)
        setActivities([])
        toast.error('فشل في تحميل سجل الأنشطة')
      }
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    } finally {
      setIsLoading(false)
    }
  }

  const clearActivityLog = () => {
    if (confirm('هل أنت متأكد من مسح جميع سجلات الأنشطة؟')) {
      localStorage.removeItem('activityLog')
      setActivities([])
      toast.success('تم مسح سجل الأنشطة')
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.targetName && activity.targetName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesAction = filterAction === 'ALL' || activity.action === filterAction
    const matchesUser = filterUser === 'ALL' || activity.userId === filterUser
    const matchesTargetType = filterTargetType === 'ALL' || activity.targetType === filterTargetType
    
    const activityDate = new Date(activity.createdAt)
    const today = new Date()
    
    const matchesMonth = filterMonth === 'ALL' || activityDate.getMonth() === parseInt(filterMonth)
    const matchesYear = filterYear === 'ALL' || activityDate.getFullYear() === parseInt(filterYear)
    
    const matchesDateRange = (() => {
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // Include the entire end date
        return activityDate >= start && activityDate <= end
      }
      
      if (filterDate === 'ALL') return true
      
      switch (filterDate) {
        case 'TODAY':
          return activityDate.toDateString() === today.toDateString()
        case 'YESTERDAY':
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          return activityDate.toDateString() === yesterday.toDateString()
        case 'WEEK':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return activityDate >= weekAgo
        case 'MONTH':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          return activityDate >= monthAgo
        case 'LAST_3_MONTHS':
          const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          return activityDate >= threeMonthsAgo
        default:
          return true
      }
    })()

    return matchesSearch && matchesAction && matchesUser && matchesTargetType && matchesMonth && matchesYear && matchesDateRange
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('ar-SA'),
      time: date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const uniqueUsers = Array.from(new Set(activities.map(a => a.userId)))
    .map(userId => activities.find(a => a.userId === userId))
    .filter(Boolean) as ActivityLog[]

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <div className="text-muted-foreground">جاري تحميل سجل الأنشطة...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 shadow-lg border border-border">
        <div className="flex items-center gap-4">
          <div className="bg-info/10 rounded-lg p-4">
            <Activity className="h-8 w-8 text-info" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground mb-2">سجل الأنشطة المفصل</h1>
            <p className="text-muted-foreground">تتبع جميع الأنشطة والعمليات من جميع المستخدمين في النظام</p>
          </div>
          
          {/* Debug buttons for admin */}
          {userRole === 'ADMIN' && (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token')
                    const response = await fetch('/api/activity', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        action: 'TEST_ACTIVITY',
                        description: 'نشاط تجريبي تم إنشاؤه للاختبار',
                        targetType: 'SYSTEM',
                        targetId: 'test-activity',
                        targetName: 'اختبار النشاط'
                      })
                    })
                    
                    if (response.ok) {
                      toast.success('تم إنشاء نشاط تجريبي')
                      fetchActivities()
                    } else {
                      toast.error('فشل في إنشاء النشاط التجريبي')
                    }
                  } catch (error) {
                    toast.error('حدث خطأ')
                  }
                }}
                className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors text-sm"
              >
                إنشاء نشاط تجريبي
              </button>
              
              <button
                onClick={fetchActivities}
                className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info/90 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                تحديث
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CV Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg p-6 shadow-lg border border-border hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-success/10 rounded-lg p-3">
              <Download className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">السير المرفوعة</h3>
              <p className="text-2xl font-bold text-success">{cvStats.uploaded || 0}</p>
              <p className="text-sm text-muted-foreground">سيرة ذاتية تم رفعها</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-lg border border-border hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-lg p-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">السير الجديدة</h3>
              <p className="text-2xl font-bold text-primary">{cvStats.created || 0}</p>
              <p className="text-sm text-muted-foreground">سيرة ذاتية تم إنشاؤها</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-lg border border-border hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-warning/10 rounded-lg p-3">
              <Edit className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">السير المحدثة</h3>
              <p className="text-2xl font-bold text-warning">{cvStats.updated || 0}</p>
              <p className="text-sm text-muted-foreground">سيرة ذاتية تم تحديثها</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-lg border border-border hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-info/10 rounded-lg p-3">
              <FileText className="h-6 w-6 text-info" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">إجمالي السير</h3>
              <p className="text-2xl font-bold text-info">{cvStats.total || 0}</p>
              <p className="text-sm text-muted-foreground">في قاعدة البيانات</p>
            </div>
          </div>
        </div>
      </div>

          {/* Filters */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              خيارات التصفية المتقدمة
            </h3>
            
            {/* Basic Filters Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* البحث */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  type="text"
                  placeholder="البحث في الأنشطة..."
                  className="w-full pr-10 pl-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* نوع العملية */}
              <select
                className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="ALL">جميع العمليات</option>
                {Object.entries(actionLabels).map(([action, label]) => (
                  <option key={action} value={action}>{label}</option>
                ))}
              </select>

              {/* نوع الهدف */}
              <select
                className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                value={filterTargetType}
                onChange={(e) => setFilterTargetType(e.target.value)}
              >
                <option value="ALL">جميع الأهداف</option>
                <option value="CV">السير الذاتية</option>
                <option value="CONTRACT">العقود</option>
                <option value="USER">المستخدمين</option>
                <option value="SYSTEM">النظام</option>
              </select>

              {/* المستخدم */}
              <select
                className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              >
                <option value="ALL">جميع المستخدمين</option>
                {uniqueUsers.map((activity) => (
                  <option key={activity.userId} value={activity.userId}>
                    {activity.userName} ({activity.userEmail})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* فترة زمنية سريعة */}
              <select
                className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="ALL">جميع التواريخ</option>
                <option value="TODAY">اليوم</option>
                <option value="YESTERDAY">أمس</option>
                <option value="WEEK">آخر أسبوع</option>
                <option value="MONTH">آخر شهر</option>
                <option value="LAST_3_MONTHS">آخر 3 أشهر</option>
              </select>

              {/* الشهر */}
              <select
                className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="ALL">جميع الأشهر</option>
                <option value="0">يناير</option>
                <option value="1">فبراير</option>
                <option value="2">مارس</option>
                <option value="3">أبريل</option>
                <option value="4">مايو</option>
                <option value="5">يونيو</option>
                <option value="6">يوليو</option>
                <option value="7">أغسطس</option>
                <option value="8">سبتمبر</option>
                <option value="9">أكتوبر</option>
                <option value="10">نوفمبر</option>
                <option value="11">ديسمبر</option>
              </select>

              {/* السنة */}
              <select
                className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="ALL">جميع السنوات</option>
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>

              {/* زر مسح الفلاتر */}
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterAction('ALL')
                  setFilterUser('ALL')
                  setFilterDate('ALL')
                  setFilterMonth('ALL')
                  setFilterYear('ALL')
                  setFilterTargetType('ALL')
                  setStartDate('')
                  setEndDate('')
                  setCurrentPage(1)
                }}
                className="px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                مسح الفلاتر
              </button>
            </div>

            {/* Custom Date Range Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">من تاريخ</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <div className="bg-info/10 text-info px-4 py-3 rounded-lg text-sm">
                  <strong>إجمالي النتائج:</strong> {filteredActivities.length}
                </div>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="bg-card rounded-2xl shadow-lg p-12 text-center">
                <Activity className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
                <div className="text-muted-foreground">جاري تحميل سجل الأنشطة...</div>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="bg-card rounded-2xl shadow-lg p-12 text-center">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">لا توجد أنشطة</h3>
                <p className="text-muted-foreground">لم يتم العثور على أنشطة تطابق المعايير المحددة</p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const IconComponent = actionIcons[activity.action] || Activity
                const colorClass = actionColors[activity.action] || 'text-muted-foreground bg-muted'
                const { date, time } = formatDate(activity.createdAt)
                const isExpanded = expandedActivity === activity.id

                return (
                  <div key={activity.id} className="bg-card rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-xl ${colorClass} flex-shrink-0`}>
                          <IconComponent className="h-6 w-6" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-1">
                                {actionLabels[activity.action] || activity.action}
                              </h3>
                              <p className="text-muted-foreground">{activity.description}</p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground flex-shrink-0 mr-4">
                              <div className="flex items-center gap-1 mb-1">
                                <Calendar className="h-4 w-4" />
                                {date}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {time}
                              </div>
                            </div>
                          </div>

                          {/* User Info */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{activity.userName}</span>
                            <span>({activity.userEmail})</span>
                          </div>

                          {/* Target Info */}
                          {activity.targetName && (
                            <div className="text-sm text-muted-foreground mb-3">
                              <span className="font-medium">الهدف:</span> {activity.targetName}
                            </div>
                          )}

                          {/* Expand Button */}
                          {(activity.metadata || activity.ipAddress) && (
                            <button
                              onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
                              className="flex items-center gap-2 text-sm text-primary hover:text-indigo-800 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {activity.ipAddress && (
                              <div>
                                <span className="font-medium text-foreground">عنوان IP:</span>
                                <span className="text-muted-foreground mr-2">{activity.ipAddress}</span>
                              </div>
                            )}
                            {activity.userAgent && (
                              <div>
                                <span className="font-medium text-foreground">المتصفح:</span>
                                <span className="text-muted-foreground mr-2 truncate">{activity.userAgent}</span>
                              </div>
                            )}
                            {activity.metadata && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-foreground">بيانات إضافية:</span>
                                <pre className="text-muted-foreground bg-background p-3 rounded-lg mt-2 text-xs overflow-x-auto">
                                  {JSON.stringify(activity.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-border rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-muted-foreground">
                صفحة {currentPage} من {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-border rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )
    }

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Default page with authentication check
export default function ActivityLogPage() {
  return (
    <DashboardLayout>
      <ActivityLogPageContent />
    </DashboardLayout>
  )
}
