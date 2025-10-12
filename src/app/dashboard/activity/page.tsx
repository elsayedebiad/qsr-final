'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ActivityType } from '@prisma/client'
import { 
  Activity, 
  Filter, 
  Calendar,
  User,
  FileText,
  Upload,
  Download,
  Edit,
  Trash2,
  UserPlus,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'

interface ActivityLog {
  id: string
  action: ActivityType
  description: string
  metadata?: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  cv?: {
    fullName: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function ActivityLogPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchActivities()
    }
  }, [pagination.page, filter, user])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    }
  }

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filter !== 'ALL') {
        params.append('action', filter)
      }

      const response = await fetch(`/api/activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
        setPagination(data.pagination)
      } else {
        toast.error('فشل في تحميل سجل النشاط')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (action: ActivityType) => {
    switch (action) {
      case ActivityType.CV_CREATED:
        return <FileText className="h-4 w-4 text-info" />
      case ActivityType.CV_UPDATED:
        return <Edit className="h-4 w-4 text-orange-600" />
      case ActivityType.CV_DELETED:
        return <Trash2 className="h-4 w-4 text-destructive" />
      case ActivityType.CV_STATUS_CHANGED:
        return <Activity className="h-4 w-4 text-purple-600" />
      case ActivityType.CV_EXPORTED:
        return <Download className="h-4 w-4 text-success" />
      case ActivityType.USER_LOGIN:
        return <LogIn className="h-4 w-4 text-info" />
      case ActivityType.USER_LOGOUT:
        return <LogOut className="h-4 w-4 text-muted-foreground" />
      case ActivityType.EXCEL_IMPORT:
        return <Upload className="h-4 w-4 text-primary" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityColor = (action: ActivityType) => {
    switch (action) {
      case ActivityType.CV_CREATED:
        return 'bg-info/10 border-info/30'
      case ActivityType.CV_UPDATED:
        return 'bg-orange-50 border-orange-200'
      case ActivityType.CV_DELETED:
        return 'bg-destructive/10 border-destructive/30'
      case ActivityType.CV_STATUS_CHANGED:
        return 'bg-purple-50 border-purple-200'
      case ActivityType.CV_EXPORTED:
        return 'bg-success/10 border-success/30'
      case ActivityType.USER_LOGIN:
        return 'bg-info/10 border-info/30'
      case ActivityType.USER_LOGOUT:
        return 'bg-background border-border'
      case ActivityType.EXCEL_IMPORT:
        return 'bg-primary/10 border-indigo-200'
      default:
        return 'bg-background border-border'
    }
  }

  const getActionText = (action: ActivityType) => {
    switch (action) {
      case ActivityType.CV_CREATED:
        return 'إنشاء سيرة ذاتية'
      case ActivityType.CV_UPDATED:
        return 'تحديث سيرة ذاتية'
      case ActivityType.CV_DELETED:
        return 'حذف سيرة ذاتية'
      case ActivityType.CV_STATUS_CHANGED:
        return 'تغيير حالة'
      case ActivityType.CV_EXPORTED:
        return 'تصدير PDF'
      case ActivityType.USER_LOGIN:
        return 'تسجيل دخول'
      case ActivityType.USER_LOGOUT:
        return 'تسجيل خروج'
      case ActivityType.EXCEL_IMPORT:
        return 'استيراد Excel'
      default:
        return action
    }
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

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const createTestActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('غير مصرح لك')
        return
      }

      const response = await fetch('/api/test-activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('تم إنشاء البيانات التجريبية بنجاح')
        fetchActivities() // Refresh the activities list
      } else {
        toast.error('فشل في إنشاء البيانات التجريبية')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء البيانات التجريبية')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-32 h-32"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-primary ml-3" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">سجل النشاط</h1>
              <p className="text-sm text-muted-foreground">تتبع جميع العمليات والأنشطة في النظام</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={createTestActivities}
              className="bg-success text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-colors"
            >
              إنشاء بيانات تجريبية
            </button>
            <div className="bg-primary/10 text-indigo-800 px-4 py-2 rounded-lg">
              <span className="font-medium">{pagination.total} نشاط</span>
            </div>
          </div>
        </div>
        {/* Filters */}
        <div className="mb-8 bg-card rounded-lg shadow p-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ActivityType | 'ALL')}
              className="border border-border rounded-md px-3 py-2 focus:ring-ring focus:border-ring"
            >
              <option value="ALL">جميع الأنشطة</option>
              <option value={ActivityType.CV_CREATED}>إنشاء سيرة ذاتية</option>
              <option value={ActivityType.CV_UPDATED}>تحديث سيرة ذاتية</option>
              <option value={ActivityType.CV_DELETED}>حذف سيرة ذاتية</option>
              <option value={ActivityType.CV_STATUS_CHANGED}>تغيير حالة</option>
              <option value={ActivityType.CV_EXPORTED}>تصدير PDF</option>
              <option value={ActivityType.EXCEL_IMPORT}>استيراد Excel</option>
              <option value={ActivityType.USER_LOGIN}>تسجيل دخول</option>
              <option value={ActivityType.USER_LOGOUT}>تسجيل خروج</option>
            </select>
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">الأنشطة الحديثة</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className={`p-6 hover:bg-background transition-colors ${getActivityColor(activity.action)}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {getActionText(activity.action)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        {activity.cv && (
                          <p className="text-xs text-muted-foreground mt-1">
                            السيرة الذاتية: {activity.cv.fullName}
                          </p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center mt-2 space-x-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {activity.user.name}
                      </span>
                      {activity.metadata && (
                        <span className="text-xs text-muted-foreground">
                          • {JSON.parse(activity.metadata).source || ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-foreground">
                  عرض {((pagination.page - 1) * pagination.limit) + 1} إلى{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} من{' '}
                  {pagination.total} نشاط
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium text-foreground">
                    {pagination.page} من {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">لا توجد أنشطة</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter !== 'ALL' ? 'لا توجد أنشطة تطابق الفلتر المحدد' : 'لم يتم تسجيل أي أنشطة بعد'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
