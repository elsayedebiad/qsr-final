'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Activity, Clock, Search, RefreshCw, Download, Filter,
  User, FileText, Image, Layout, Upload, Trash2, Edit, Eye,
  CheckCircle, XCircle, AlertTriangle, Bell, TrendingUp,
  ChevronDown, ChevronRight, Calendar, Users
} from 'lucide-react'
import { ActivityType } from '@/lib/activity-tracker'
import { format, isToday, isYesterday, parseISO, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

// دالة تحويل الوقت لـ 12 ساعة مع AM/PM
const formatTime12Hour = (date: Date) => {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'م' : 'ص' // مساءً أو صباحاً
  const hour12 = hours % 12 || 12
  const minuteStr = minutes.toString().padStart(2, '0')
  return `${hour12}:${minuteStr} ${ampm}`
}

// دالة الوقت النسبي بالعربي
const getRelativeTime = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  // أقل من دقيقة
  if (diffInSeconds < 10) {
    return 'الآن'
  } else if (diffInSeconds < 60) {
    return `منذ ${diffInSeconds} ثانية`
  } 
  // دقائق
  else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    if (minutes === 1) return 'منذ دقيقة'
    if (minutes === 2) return 'منذ دقيقتين'
    if (minutes <= 10) return `منذ ${minutes} دقائق`
    return `منذ ${minutes} دقيقة`
  } 
  // ساعات
  else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    if (hours === 1) return 'منذ ساعة'
    if (hours === 2) return 'منذ ساعتين'
    if (hours <= 10) return `منذ ${hours} ساعات`
    return `منذ ${hours} ساعة`
  } 
  // أيام
  else if (diffInSeconds < 604800) { // أقل من أسبوع
    const days = Math.floor(diffInSeconds / 86400)
    if (days === 1) return 'منذ يوم'
    if (days === 2) return 'منذ يومين'
    if (days <= 10) return `منذ ${days} أيام`
    return `منذ ${days} يوم`
  }
  // أسابيع
  else if (diffInSeconds < 2592000) { // أقل من شهر
    const weeks = Math.floor(diffInSeconds / 604800)
    if (weeks === 1) return 'منذ أسبوع'
    if (weeks === 2) return 'منذ أسبوعين'
    return `منذ ${weeks} أسابيع`
  }
  // أشهر
  else if (diffInSeconds < 31536000) { // أقل من سنة
    const months = Math.floor(diffInSeconds / 2592000)
    if (months === 1) return 'منذ شهر'
    if (months === 2) return 'منذ شهرين'
    return `منذ ${months} أشهر`
  }
  // سنوات
  else {
    const years = Math.floor(diffInSeconds / 31536000)
    if (years === 1) return 'منذ سنة'
    if (years === 2) return 'منذ سنتين'
    return `منذ ${years} سنوات`
  }
}

interface ActivityData {
  id: string
  type: ActivityType
  action: string
  description: string
  details?: string
  userId: string
  userName: string
  userEmail: string
  userRole?: string
  targetType?: string
  targetId?: string
  targetName?: string
  targetDetails?: Record<string, unknown>
  metadata?: {
    importance?: 'low' | 'medium' | 'high' | 'critical'
    tags?: string[]
    browser?: string
    os?: string
    device?: string
  }
  createdAt: string
}

// أيقونات حسب نوع النشاط
const getActivityIcon = (type: ActivityType) => {
  if (type.includes('CV_')) return <FileText className="h-5 w-5" />
  if (type.includes('USER_')) return <User className="h-5 w-5" />
  if (type.includes('BANNER_')) return <Layout className="h-5 w-5" />
  if (type.includes('IMAGE_') || type.includes('GALLERY_')) return <Image className="h-5 w-5" />
  if (type.includes('FILE_') || type.includes('UPLOAD')) return <Upload className="h-5 w-5" />
  if (type.includes('CONTRACT_')) return <FileText className="h-5 w-5" />
  return <Activity className="h-5 w-5" />
}

// ألوان حسب نوع النشاط
const getActivityColor = (type: ActivityType, action: string) => {
  if (action === 'DELETE' || type.includes('DELETED')) return 'bg-red-500'
  if (action === 'CREATE' || type.includes('CREATED')) return 'bg-green-500'
  if (action === 'UPDATE' || type.includes('UPDATED')) return 'bg-blue-500'
  if (action === 'UPLOAD') return 'bg-purple-500'
  if (action === 'LOGIN') return 'bg-emerald-500'
  if (action === 'LOGOUT') return 'bg-gray-500'
  return 'bg-gray-400'
}

// ألوان حسب الأهمية
const getImportanceBadge = (importance: string) => {
  switch (importance) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-300'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'medium': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export default function ActivityLogPageNew() {
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // الفلاتر
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [selectedUser, setSelectedUser] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<string>('ALL')
  const [importanceFilter, setImportanceFilter] = useState<string>('ALL')
  
  // العرض
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [groupByDate, setGroupByDate] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // تحميل الأنشطة
  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/activity?limit=200', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      } else {
        toast.error('فشل في تحميل الأنشطة')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('حدث خطأ')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchActivities()
    
    if (autoRefresh) {
      const interval = setInterval(fetchActivities, 30000) // كل 30 ثانية
      return () => clearInterval(interval)
    }
  }, [fetchActivities, autoRefresh])

  // تحديث الوقت النسبي كل دقيقة
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // كل دقيقة
    
    return () => clearInterval(interval)
  }, [])

  // الفلترة
  useEffect(() => {
    let filtered = [...activities]

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(a => a.type === selectedType)
    }

    if (selectedUser !== 'ALL') {
      filtered = filtered.filter(a => a.userId === selectedUser)
    }

    if (importanceFilter !== 'ALL') {
      filtered = filtered.filter(a => a.metadata?.importance === importanceFilter)
    }

    if (dateFilter !== 'ALL') {
      const now = new Date()
      filtered = filtered.filter(a => {
        const activityDate = parseISO(a.createdAt)
        if (dateFilter === 'TODAY') return isToday(activityDate)
        if (dateFilter === 'YESTERDAY') return isYesterday(activityDate)
        if (dateFilter === 'WEEK') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return activityDate >= weekAgo
        }
        return true
      })
    }

    setFilteredActivities(filtered)
  }, [activities, searchTerm, selectedType, selectedUser, importanceFilter, dateFilter])

  // تجميع حسب التاريخ
  const groupedActivities = groupByDate
    ? filteredActivities.reduce((groups, activity) => {
        const date = parseISO(activity.createdAt)
        let dateLabel = format(date, 'yyyy-MM-dd')
        
        if (isToday(date)) dateLabel = 'اليوم'
        else if (isYesterday(date)) dateLabel = 'أمس'
        else dateLabel = format(date, 'dd MMMM yyyy', { locale: ar })
        
        if (!groups[dateLabel]) groups[dateLabel] = []
        groups[dateLabel].push(activity)
        return groups
      }, {} as Record<string, ActivityData[]>)
    : { 'الكل': filteredActivities }

  // المستخدمين الفريدين
  const uniqueUsers = Array.from(new Set(activities.map(a => a.userId)))
    .map(id => activities.find(a => a.userId === id))
    .filter((u): u is ActivityData => !!u)

  // الأنواع الفريدة
  const uniqueTypes = Array.from(new Set(activities.map(a => a.type)))

  // تصدير
  const exportActivities = () => {
    const dataStr = JSON.stringify(filteredActivities, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const link = document.createElement('a')
    link.setAttribute('href', dataUri)
    link.setAttribute('download', `activities_${new Date().toISOString()}.json`)
    link.click()
    toast.success('تم التصدير بنجاح')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Activity className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        {/* الرأس */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">سجل الأنشطة التفصيلي</h1>
              <p className="text-blue-100">تتبع جميع العمليات والأنشطة في النظام</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchActivities}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                onClick={exportActivities}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Download className="h-5 w-5" />
                تصدير
              </button>
            </div>
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold">{activities.length}</div>
              <div className="text-sm text-blue-100">إجمالي الأنشطة</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold">{uniqueUsers.length}</div>
              <div className="text-sm text-blue-100">المستخدمين</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold">
                {activities.filter(a => isToday(parseISO(a.createdAt))).length}
              </div>
              <div className="text-sm text-blue-100">أنشطة اليوم</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold">
                {activities.filter(a => a.metadata?.importance === 'high' || a.metadata?.importance === 'critical').length}
              </div>
              <div className="text-sm text-blue-100">مهمة/حرجة</div>
            </div>
          </div>
        </div>

        {/* الفلاتر */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">الفلاتر والبحث</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* نوع النشاط */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">جميع الأنواع</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* المستخدم */}
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">جميع المستخدمين</option>
              {uniqueUsers.map(user => (
                <option key={user.userId} value={user.userId}>{user.userName}</option>
              ))}
            </select>

            {/* التاريخ */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">جميع التواريخ</option>
              <option value="TODAY">اليوم</option>
              <option value="YESTERDAY">أمس</option>
              <option value="WEEK">آخر أسبوع</option>
            </select>

            {/* الأهمية */}
            <select
              value={importanceFilter}
              onChange={(e) => setImportanceFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">جميع المستويات</option>
              <option value="critical">حرج</option>
              <option value="high">مرتفع</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>
          </div>

          {/* خيارات العرض */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={groupByDate}
                onChange={(e) => setGroupByDate(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-sm">تجميع حسب التاريخ</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-sm">تحديث تلقائي</span>
            </label>
            <div className="mr-auto text-sm text-muted-foreground">
              {filteredActivities.length} نشاط
            </div>
          </div>
        </div>

        {/* قائمة الأنشطة */}
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([dateLabel, dateActivities]) => (
            <div key={dateLabel} className="space-y-3">
              {groupByDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{dateLabel}</h3>
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-sm text-muted-foreground">{dateActivities.length} نشاط</span>
                </div>
              )}

              <div className="space-y-2">
                {dateActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* الأيقونة */}
                        <div className={`${getActivityColor(activity.type, activity.action)} p-3 rounded-lg text-white flex-shrink-0`}>
                          {getActivityIcon(activity.type)}
                        </div>

                        {/* المحتوى */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-1">{activity.description}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {activity.userName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime12Hour(parseISO(activity.createdAt))}
                                </span>
                                <span className="text-xs font-semibold text-primary">
                                  {getRelativeTime(parseISO(activity.createdAt))}
                                </span>
                                {activity.metadata?.device && (
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                    {activity.metadata.device}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {activity.metadata?.importance && (
                                <span className={`text-xs px-2 py-1 rounded border ${getImportanceBadge(activity.metadata.importance)}`}>
                                  {activity.metadata.importance}
                                </span>
                              )}
                              <ChevronDown
                                className={`h-5 w-5 text-muted-foreground transition-transform ${
                                  expandedActivity === activity.id ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* التفاصيل الموسعة */}
                      {expandedActivity === activity.id && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          {/* التاريخ والوقت الكامل */}
                          <div className="text-sm bg-primary/5 p-2 rounded">
                            <span className="font-medium">التاريخ والوقت: </span>
                            <span className="text-muted-foreground">
                              {format(parseISO(activity.createdAt), 'dd MMMM yyyy', { locale: ar })}
                              {' - '}
                              {formatTime12Hour(parseISO(activity.createdAt))}
                              {' ('}
                              <span className="text-primary font-semibold">{getRelativeTime(parseISO(activity.createdAt))}</span>
                              {')'}
                            </span>
                          </div>
                          
                          {activity.targetName && (
                            <div className="text-sm">
                              <span className="font-medium">الهدف: </span>
                              <span className="text-muted-foreground">{activity.targetName}</span>
                            </div>
                          )}
                          {activity.details && (
                            <div className="text-sm">
                              <span className="font-medium">التفاصيل: </span>
                              <span className="text-muted-foreground">{activity.details}</span>
                            </div>
                          )}
                          {activity.metadata && (
                            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                              {activity.metadata.browser && (
                                <div><span className="font-medium">المتصفح:</span> {activity.metadata.browser}</div>
                              )}
                              {activity.metadata.os && (
                                <div><span className="font-medium">النظام:</span> {activity.metadata.os}</div>
                              )}
                              {activity.metadata.tags && activity.metadata.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-2">
                                  {activity.metadata.tags.map((tag, i) => (
                                    <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="bg-card rounded-xl p-12 text-center border border-border">
            <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد أنشطة</h3>
            <p className="text-muted-foreground">لم يتم العثور على أنشطة تطابق الفلاتر المحددة</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
