'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Activity, AlertTriangle, Clock, Bell, Filter, RefreshCw, Search, Eye, Download, AlertCircle, FileText, TrendingUp, Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import { ActivityCard, ActivityTypeConfig } from '@/components/ActivityComponents'
import { ActivityType } from '@/lib/activity-tracker'
import { isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'react-hot-toast'

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
  changes?: Array<{
    field: string
    oldValue?: string | number | boolean | null
    newValue?: string | number | boolean | null
  }>
  metadata?: {
    ipAddress?: string
    userAgent?: string
    browser?: string
    os?: string
    device?: string
    location?: string
    duration?: number
    tags?: string[]
    importance?: 'low' | 'medium' | 'high' | 'critical'
    category?: string
  }
  createdAt: string
  isNew?: boolean
  isRead?: boolean
}

export default function EnhancedActivityLogPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // حالة الفلاتر
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedImportance, setSelectedImportance] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<string>('ALL')
  const [showOnlyNew, setShowOnlyNew] = useState(false)
  
  // حالة العرض
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  
  // التحديث التلقائي
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(10000)
  
  // تحميل الأنشطة
  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '100'
      })

      const response = await fetch(`/api/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setIsLoading(false)
        
        // عرض إشعار للأنشطة الجديدة
        const newActivities = data.activities?.filter((a: ActivityData) => a.isNew) || []
        if (newActivities.length > 0) {
          toast.success(`${newActivities.length} نشاط جديد`)
        }
      } else {
        toast.error('فشل في تحميل الأنشطة')
      }
    } catch (error) {
      console.error('Error loading activities:', error)
      toast.error('حدث خطأ في تحميل الأنشطة')
    } finally {
      setIsLoading(false)
    }
  }, [router, currentPage])

  // التحديث التلقائي
  useEffect(() => {
    fetchActivities()
    
    if (autoRefresh) {
      const interval = setInterval(fetchActivities, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchActivities, autoRefresh, refreshInterval])

  // الاستماع للأنشطة الجديدة
  useEffect(() => {
    const handleNewActivity = (event: CustomEvent) => {
      const newActivity = event.detail
      setActivities(prev => [newActivity, ...prev])
      toast.success('نشاط جديد: ' + newActivity.description)
    }

    window.addEventListener('activityTracked', handleNewActivity as EventListener)
    return () => window.removeEventListener('activityTracked', handleNewActivity as EventListener)
  }, [])

  // الفلترة
  useEffect(() => {
    let filtered = [...activities]

    // البحث
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(activity => 
        activity.description?.toLowerCase().includes(search) ||
        activity.userName?.toLowerCase().includes(search) ||
        activity.userEmail?.toLowerCase().includes(search) ||
        activity.targetName?.toLowerCase().includes(search)
      )
    }

    // فلتر الأنواع
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(activity => selectedTypes.includes(activity.type))
    }

    // فلتر المستخدمين
    if (selectedUsers.length > 0) {
      filtered = filtered.filter(activity => selectedUsers.includes(activity.userId))
    }

    // فلتر الأهمية
    if (selectedImportance !== 'ALL') {
      filtered = filtered.filter(activity => {
        const importance = activity.metadata?.importance || ActivityTypeConfig[activity.type]?.priority || 'medium'
        return importance === selectedImportance
      })
    }

    // فلتر التاريخ
    if (dateFilter !== 'ALL') {
      const now = new Date()
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.createdAt)
        switch (dateFilter) {
          case 'TODAY':
            return isToday(activityDate)
          case 'YESTERDAY':
            return isYesterday(activityDate)
          case 'THIS_WEEK':
            return activityDate >= startOfWeek(now, { weekStartsOn: 6 }) && activityDate <= endOfWeek(now, { weekStartsOn: 6 })
          case 'THIS_MONTH':
            return activityDate >= startOfMonth(now) && activityDate <= endOfMonth(now)
          default:
            return true
        }
      })
    }

    // فلتر الأنشطة الجديدة
    if (showOnlyNew) {
      filtered = filtered.filter(activity => activity.isNew)
    }

    // الترتيب حسب الأحدث
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredActivities(filtered)
  }, [activities, searchTerm, selectedTypes, selectedUsers, selectedImportance, dateFilter, showOnlyNew])

  // الصفحات
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // وضع علامة مقروء على الأنشطة
  const markAsRead = async (activityId: string) => {
    setActivities(prev => prev.map(a => 
      a.id === activityId ? { ...a, isNew: false, isRead: true } : a
    ))
  }

  // وضع علامة مقروء على الكل
  const markAllAsRead = () => {
    setActivities(prev => prev.map(a => ({ ...a, isNew: false, isRead: true })))
    toast.success('تم وضع علامة مقروء على جميع الأنشطة')
  }

  // تصدير الأنشطة
  const exportActivities = () => {
    const dataStr = JSON.stringify(filteredActivities, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `activities_${new Date().toISOString()}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('تم تصدير الأنشطة بنجاح')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Activity className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground text-lg">جاري تحميل سجل الأنشطة...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* الرأس */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-primary ml-3" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">سجل الأنشطة المفصل</h1>
              <p className="text-muted-foreground">تتبع جميع الأنشطة والعمليات من جميع المستخدمين في النظام</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchActivities}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث الآن
            </button>
          </div>
        </div>
        
        {/* بطاقات الإحصائيات المحسنة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* بطاقة إجمالي الأنشطة */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Activity className="h-10 w-10 text-white/90" />
                <span className="text-3xl font-bold">{activities.length}</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-90">متوسط يومي</p>
                <p className="text-xl font-semibold">للرفع</p>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">يوم نشط</span>
                  <span className="text-xs font-bold">2</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* بطاقة الأنشطة الجديدة */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Bell className="h-10 w-10 text-white/90" />
                <span className="text-3xl font-bold">{activities.filter(a => a.isNew).length}</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-90">الجديد فقط</p>
                <p className="text-xl font-semibold">غير مقروء</p>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">الأعلى: </span>
                  <span className="text-xs font-bold text-yellow-300">👑 المدير</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* بطاقة السير الذاتية المحدثة */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <FileText className="h-10 w-10 text-white/90" />
                <span className="text-3xl font-bold">0</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-90">سيرة ذاتية محدثة</p>
                <p className="text-xl font-semibold">تم تحديثها</p>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">نسبة التحديث</span>
                  <span className="text-xs font-bold">0%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* بطاقة السير الذاتية المرفوعة */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Upload className="h-10 w-10 text-white/90" />
                <span className="text-3xl font-bold">0</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-90">سيرة ذاتية مرفوعة</p>
                <p className="text-xl font-semibold">في الفترة المحددة</p>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">من الإجمالي</span>
                  <span className="text-xs font-bold">93%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* شريط البحث */}
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="البحث في الأنشطة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* شريط الفلاتر */}
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Filter className="h-5 w-5" />
              الفلاتر والبحث
            </h2>

            {/* التحديث التلقائي - تصميم محسن مع إصلاح الاتجاه */}
            <div className="flex items-center gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">تحديث تلقائي</label>
                </div>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                    autoRefresh 
                      ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-lg shadow-green-500/30' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  dir="ltr"
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                    autoRefresh ? 'translate-x-7' : 'translate-x-1'
                  }`}>
                    {autoRefresh && (
                      <span className="flex h-full w-full items-center justify-center">
                        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {autoRefresh && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="px-4 py-2 bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                  >
                    <option value="5000">⚡ كل 5 ثوان</option>
                    <option value="10000">🔄 كل 10 ثوان</option>
                    <option value="30000">⏱️ كل 30 ثانية</option>
                    <option value="60000">⏰ كل دقيقة</option>
                  </select>
                </div>
              )}

              <button
                onClick={fetchActivities}
                className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                title="تحديث الآن"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* صف البحث والفلاتر الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* فلتر التاريخ */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="ALL">جميع التواريخ</option>
              <option value="TODAY">اليوم</option>
              <option value="YESTERDAY">أمس</option>
              <option value="THIS_WEEK">هذا الأسبوع</option>
              <option value="THIS_MONTH">هذا الشهر</option>
            </select>

            {/* فلتر الأهمية */}
            <select
              value={selectedImportance}
              onChange={(e) => setSelectedImportance(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="ALL">جميع المستويات</option>
              <option value="critical">حرج</option>
              <option value="high">مرتفع</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>

            {/* عرض الجديد فقط */}
            <div className="flex items-center">
              <button
                onClick={() => setShowOnlyNew(!showOnlyNew)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showOnlyNew ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Bell className="h-4 w-4" />
                الجديد فقط ({activities.filter(a => a.isNew).length})
              </button>
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-2">
              <button
                onClick={markAllAsRead}
                className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-2"
                title="وضع علامة مقروء على الكل"
              >
                <Eye className="h-4 w-4" />
                <span className="text-sm">مقروء</span>
              </button>
              <button
                onClick={exportActivities}
                className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-2"
                title="تصدير الأنشطة"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">تصدير</span>
              </button>
            </div>
          </div>
        </div>

        {/* قائمة الأنشطة */}
        <div className="space-y-4">
          {paginatedActivities.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد أنشطة</h3>
              <p className="text-gray-600">لم يتم العثور على أنشطة تطابق معايير البحث</p>
            </div>
          ) : (
            <>
              {paginatedActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isExpanded={expandedActivity === activity.id}
                  onToggle={() => {
                    setExpandedActivity(expandedActivity === activity.id ? null : activity.id)
                    if (activity.isNew) {
                      markAsRead(activity.id)
                    }
                  }}
                />
              ))}
            </>
          )}
        </div>
        
        {/* Footer - Navigation Bar Style */}
        <div className="sticky bottom-0 bg-gray-800 text-white py-2 px-4 shadow-lg border-t border-gray-600 z-10 mt-6">
          <div className="flex items-center justify-between">
            {/* Left Navigation */}
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="text-sm">السابق</span>
            </button>
            
            {/* Center - Page Info */}
            <div className="flex items-center gap-4">
              <div className="bg-gray-700 px-3 py-1 rounded text-sm">
                صفحة {currentPage} من {totalPages}
              </div>
              <div className="bg-blue-600 px-3 py-1 rounded text-sm font-semibold">
                {filteredActivities.length} نشاط
              </div>
            </div>
            
            {/* Right Navigation */}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              <span className="text-sm">التالي</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
