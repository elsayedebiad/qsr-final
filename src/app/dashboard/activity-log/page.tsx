'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Activity, Clock, Filter, Search, 
  Download, ChevronLeft, ChevronRight,
  AlertTriangle, 
  Eye, RefreshCw, Bell } from 'lucide-react'
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
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
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
        activity.targetName?.toLowerCase().includes(search) ||
        (activity.changes && activity.changes.length > 0 && 
          activity.changes.some(change => 
            `${change.field} ${change.oldValue || ''} ${change.newValue || ''}`.toLowerCase().includes(search)
          )) ||
        (activity.targetDetails && 
          Object.values(activity.targetDetails).join(' ').toLowerCase().includes(search))
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

  // الحصول على قائمة المستخدمين الفريدة
  interface UniqueUser {
    id: string
    name: string
    email: string
    role?: string
  }
  
  const uniqueUsers: UniqueUser[] = Array.from(new Set(activities.map(a => a.userId)))
    .map(id => {
      const activity = activities.find(a => a.userId === id)
      if (activity) {
        return {
          id: activity.userId,
          name: activity.userName,
          email: activity.userEmail,
          role: activity.userRole
        }
      }
      return null
    })
    .filter((user): user is NonNullable<typeof user> => user !== null) as UniqueUser[]

  // الحصول على أنواع الأنشطة المستخدمة
  const usedActivityTypes = Array.from(new Set(activities.map(a => a.type)))

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

  // حذف الأنشطة القديمة
  // const clearOldActivities = async () => {
  //   if (!confirm('هل أنت متأكد من حذف الأنشطة القديمة (أكثر من 30 يوم)؟')) return
  //   
  //   const thirtyDaysAgo = new Date()
  //   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  //   
  //   setActivities(prev => prev.filter(a => new Date(a.createdAt) > thirtyDaysAgo))
  //   toast.success('تم حذف الأنشطة القديمة')
  // }

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
      {() => (
        <div className="space-y-6">
          {/* الرأس */}
          <div className="flex items-center justify-between">
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
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <div className="bg-primary/10 px-4 py-2 rounded-lg">
                <span className="text-primary font-semibold">
                  {activities.length} نشاط
                </span>
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

              {/* التحديث التلقائي */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm text-muted-foreground">تحديث تلقائي</label>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoRefresh ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {autoRefresh && (
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="px-3 py-1 border border-border rounded-lg text-sm"
                  >
                    <option value="5000">كل 5 ثوان</option>
                    <option value="10000">كل 10 ثوان</option>
                    <option value="30000">كل 30 ثانية</option>
                    <option value="60000">كل دقيقة</option>
                  </select>
                )}

                <button
                  onClick={fetchActivities}
                  className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                  title="تحديث الآن"
                >
                  <RefreshCw className="h-4 w-4" />
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

            {/* فلتر أنواع الأنشطة */}
            {usedActivityTypes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">أنواع الأنشطة:</p>
                <div className="flex flex-wrap gap-2">
                  {usedActivityTypes.map(type => {
                    const config = ActivityTypeConfig[type]
                    const Icon = config?.icon || Activity
                    const isSelected = selectedTypes.includes(type)

                    return (
                      <button
                        key={type}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTypes(prev => prev.filter(t => t !== type))
                          } else {
                            setSelectedTypes(prev => [...prev, type])
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? `${config?.bgColor} ${config?.color}`
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {config?.label}
                        <span className="text-xs">
                          ({activities.filter(a => a.type === type).length})
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* فلتر المستخدمين */}
            {uniqueUsers.length > 1 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">المستخدمون:</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueUsers.map((user) => {
                    const isSelected = selectedUsers.includes(user.id)

                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id))
                          } else {
                            setSelectedUsers(prev => [...prev, user.id])
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-xs font-bold">
                          {user.name.charAt(0) || 'U'}
                        </div>
                        {user.name}
                        {user.role && (
                          <span className="text-xs opacity-75">({user.role})</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* مسح الفلاتر */}
            {(searchTerm || selectedTypes.length > 0 || selectedUsers.length > 0 ||
              selectedImportance !== 'ALL' || dateFilter !== 'ALL' || showOnlyNew) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedTypes([])
                  setSelectedUsers([])
                  setSelectedImportance('ALL')
                  setDateFilter('ALL')
                  setShowOnlyNew(false)
                }}
                className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                مسح جميع الفلاتر
              </button>
            )}
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

              {/* التصفح */}
              {totalPages > 1 && (
                <div className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      صفحة {currentPage} من {totalPages}
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="10">10 نشاط</option>
                      <option value="20">20 نشاط</option>
                      <option value="50">50 نشاط</option>
                      <option value="100">100 نشاط</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </DashboardLayout>
  )
}
