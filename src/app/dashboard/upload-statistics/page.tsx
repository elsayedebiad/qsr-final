'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatEgyptDateTime, getCurrentEgyptTime } from '@/lib/date-utils'
import CVStatisticsCard from '@/components/CVStatisticsCard'
import { toast } from 'react-hot-toast'
import {
  Upload,
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  Eye,
  Filter,
  Zap,
  Clock,
  ChartLine,
  DollarSign,
  Target,
  Award,
  Globe,
  Percent,
  Timer,
  CheckCircle
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'

interface CVData {
  id: string
  referenceCode: string | null
  fullName: string
  fullNameArabic: string | null
  nationality: string | null
  status: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface UploadStatistics {
  summary: {
    totalUploaded: number
    totalUpdated: number
    filterType: string
    startDate: string | null
    endDate: string | null
    isUsingFallback?: boolean
    fallbackMessage?: string | null
  }
  uploadedCVs: CVData[]
  updatedCVs: CVData[]
  userStats: Array<{
    userId: string
    userName: string
    userEmail: string
    userRole: string
    count: number
  }>
  statusStats: Array<{
    status: string
    count: number
  }>
  priorityStats: Array<{
    priority: string
    count: number
  }>
  nationalityStats: Array<{
    nationality: string
    count: number
  }>
  chartData: Array<{
    date: string
    count: number
  }>
}

export default function UploadStatisticsPage() {
  const [statistics, setStatistics] = useState<UploadStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState<'uploaded' | 'updated'>('uploaded')
  const [showDetails, setShowDetails] = useState(false)
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'stats'>('chart')

  const fetchStatistics = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('يجب تسجيل الدخول أولاً')
        return
      }
      
      let url = `/api/upload-statistics?filterType=${filterType}`
      if (filterType === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }

      console.log('Fetching statistics from:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: `HTTP Error ${response.status}: ${response.statusText}` }
        }
        
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        })
        
        const errorMessage = errorData.details || errorData.error || `فشل في جلب الإحصائيات (${response.status})`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Successfully received statistics data:', {
        totalUploaded: data.summary?.totalUploaded,
        totalUpdated: data.summary?.totalUpdated,
        userStatsCount: data.userStats?.length
      })
      setStatistics(data)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في جلب الإحصائيات'
      console.error('Error fetching statistics:', error)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [filterType, startDate, endDate])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  const handleCustomDateFilter = () => {
    if (!startDate || !endDate) {
      toast.error('الرجاء اختيار تاريخ البداية والنهاية')
      return
    }
    fetchStatistics()
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'AVAILABLE': 'متاح',
      'BOOKED': 'محجوز',
      'HIRED': 'متعاقد',
      'RETURNED': 'معاد',
      'ARCHIVED': 'مؤرشف'
    }
    return statusMap[status] || status
  }

  const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'HIGH': 'عالية',
      'MEDIUM': 'متوسطة',
      'LOW': 'منخفضة'
    }
    return priorityMap[priority] || priority
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}/${month}/${day} ${hours}:${minutes}`
    } catch {
      return dateString
    }
  }

  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${month}/${day}`
    } catch {
      return dateString
    }
  }

  return (
    <DashboardLayout>
      {(user) => {
        if (user?.role !== 'ADMIN') {
          return (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">غير مصرح لك بالوصول</h2>
                <p className="text-muted-foreground">هذه الصفحة متاحة للمديرين العامين فقط</p>
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="card p-6 bg-gradient-to-br from-primary/20 to-purple-600/20 border-primary/30">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 backdrop-blur-sm p-3 rounded-lg border border-primary/30">
                    <BarChart3 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">إحصائيات الرفع والتحديث</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      تتبع دقيق وشامل لجميع العمليات
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchStatistics}
                  disabled={isLoading}
                  className="btn-primary px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                  تحديث البيانات
                </button>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                اختر فترة الإحصائيات
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setFilterType('daily')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    filterType === 'daily'
                      ? 'border-primary bg-primary/10 shadow-lg'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <Calendar className={`h-6 w-6 mx-auto mb-2 ${filterType === 'daily' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`font-bold ${filterType === 'daily' ? 'text-primary' : 'text-foreground'}`}>
                    يومي
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">اليوم فقط</div>
                </button>

                <button
                  onClick={() => setFilterType('weekly')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    filterType === 'weekly'
                      ? 'border-success bg-success/10 shadow-lg'
                      : 'border-border hover:border-success/50 hover:bg-success/5'
                  }`}
                >
                  <Calendar className={`h-6 w-6 mx-auto mb-2 ${filterType === 'weekly' ? 'text-success' : 'text-muted-foreground'}`} />
                  <div className={`font-bold ${filterType === 'weekly' ? 'text-success' : 'text-foreground'}`}>
                    أسبوعي
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">آخر 7 أيام</div>
                </button>

                <button
                  onClick={() => setFilterType('monthly')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    filterType === 'monthly'
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg'
                      : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5'
                  }`}
                >
                  <Calendar className={`h-6 w-6 mx-auto mb-2 ${filterType === 'monthly' ? 'text-purple-500' : 'text-muted-foreground'}`} />
                  <div className={`font-bold ${filterType === 'monthly' ? 'text-purple-500' : 'text-foreground'}`}>
                    شهري
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">آخر 30 يوم</div>
                </button>

                <button
                  onClick={() => setFilterType('custom')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    filterType === 'custom'
                      ? 'border-warning bg-warning/10 shadow-lg'
                      : 'border-border hover:border-warning/50 hover:bg-warning/5'
                  }`}
                >
                  <Filter className={`h-6 w-6 mx-auto mb-2 ${filterType === 'custom' ? 'text-warning' : 'text-muted-foreground'}`} />
                  <div className={`font-bold ${filterType === 'custom' ? 'text-warning' : 'text-foreground'}`}>
                    مخصص
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">حدد فترة</div>
                </button>
              </div>

              {filterType === 'custom' && (
                <div className="mt-6 p-5 bg-warning/5 rounded-lg border-2 border-warning/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">من تاريخ</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">إلى تاريخ</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input w-full"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleCustomDateFilter}
                        className="w-full bg-warning hover:bg-warning/90 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <Zap className="h-5 w-5" />
                        تطبيق الفلتر
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="min-h-[400px] flex items-center justify-center card p-8">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-bold text-foreground">جاري تحميل الإحصائيات...</p>
                  <p className="text-sm text-muted-foreground mt-1">الرجاء الانتظار</p>
                </div>
              </div>
            ) : statistics ? (
              <>
                {/* Summary Cards - Enhanced with Animations */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1 - السير المرفوعة */}
                  <div className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all text-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                          <Upload className="h-8 w-8" />
                        </div>
                        <span className="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-xs font-bold">
                          {filterType === 'daily' ? '📅 اليوم' : filterType === 'weekly' ? '📆 الأسبوع' : filterType === 'monthly' ? '📈 الشهر' : '⚙️ مخصص'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-5xl font-bold drop-shadow-md">
                          {statistics.summary.totalUploaded.toLocaleString('ar-SA')}
                        </div>
                        <div className="text-base font-semibold opacity-95">سيرة ذاتية مرفوعة</div>
                        <div className="text-sm opacity-80">في الفترة المحددة</div>
                      </div>
                      {statistics.summary.totalUploaded > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-green-400/30 rounded">
                                <TrendingUp className="h-4 w-4 text-green-100" />
                              </div>
                              <span className="text-green-100 font-bold text-lg">
                                {Math.round((statistics.summary.totalUploaded / (statistics.summary.totalUploaded + statistics.summary.totalUpdated)) * 100)}%
                              </span>
                            </div>
                            <span className="text-sm opacity-80">من الإجمالي</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2 - السير المحدثة */}
                  <div className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all text-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:rotate-180 transition-transform duration-500">
                          <RefreshCw className="h-8 w-8" />
                        </div>
                        <span className="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-xs font-bold">
                          ✨ محدث
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-5xl font-bold drop-shadow-md">
                          {statistics.summary.totalUpdated.toLocaleString('ar-SA')}
                        </div>
                        <div className="text-base font-semibold opacity-95">سيرة ذاتية محدثة</div>
                        <div className="text-sm opacity-80">تم تعديلها</div>
                      </div>
                      {statistics.summary.totalUpdated > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-yellow-400/30 rounded">
                                <Percent className="h-4 w-4 text-yellow-100" />
                              </div>
                              <span className="text-yellow-100 font-bold text-lg">
                                {Math.round((statistics.summary.totalUpdated / (statistics.summary.totalUploaded + statistics.summary.totalUpdated)) * 100)}%
                              </span>
                            </div>
                            <span className="text-sm opacity-80">نسبة التحديث</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 3 - المستخدمون النشطون */}
                  <div className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300"></div>
                    <div className="relative bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all text-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                          <Users className="h-8 w-8" />
                        </div>
                        <div className="p-2 bg-yellow-400/30 backdrop-blur-sm rounded-lg">
                          <Award className="h-5 w-5 text-yellow-300" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-5xl font-bold drop-shadow-md">
                          {statistics.userStats.length}
                        </div>
                        <div className="text-base font-semibold opacity-95">مستخدم نشط</div>
                        <div className="text-sm opacity-80">قام بالرفع</div>
                      </div>
                      {statistics.userStats.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/30">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-yellow-200">🏆</span>
                              <span className="font-bold">الأعلى:</span>
                              <span className="text-yellow-100">{statistics.userStats[0]?.userName}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 4 - المتوسط اليومي */}
                  <div className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300"></div>
                    <div className="relative bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all text-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                          <ChartLine className="h-8 w-8" />
                        </div>
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                          <Target className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-5xl font-bold drop-shadow-md">
                          {Math.round(statistics.summary.totalUploaded / Math.max(statistics.chartData.filter(d => d.count > 0).length, 1))}
                        </div>
                        <div className="text-base font-semibold opacity-95">متوسط يومي</div>
                        <div className="text-sm opacity-80">للرفع</div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/30">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4 text-yellow-200" />
                              <span className="font-bold text-yellow-100">{statistics.chartData.filter(d => d.count > 0).length}</span>
                            </div>
                            <span className="opacity-80">يوم نشط</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CV Statistics Card */}
                <CVStatisticsCard />

                {/* Fallback Message */}
                {statistics.summary.isUsingFallback && (
                  <div className="card p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 animate-pulse" />
                      <div>
                        <p className="text-yellow-800 font-semibold text-sm">
                          {statistics.summary.fallbackMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Statistics Row - Redesigned */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* إجمالي العمليات */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-600/10 to-blue-700/10 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                          <Activity className="h-6 w-6 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">
                          📊 إجمالي
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-foreground">
                          {(statistics.summary.totalUploaded + statistics.summary.totalUpdated).toLocaleString('ar-SA')}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">إجمالي العمليات</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-blue-500/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{width: '100%'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* الجنسيات */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-green-600/10 to-green-700/10 border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
                          <Globe className="h-6 w-6 text-green-500" />
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                          🌍 دولي
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-foreground">
                          {statistics.nationalityStats.length}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">جنسية مختلفة</div>
                        <div className="mt-2 flex items-center gap-1">
                          {[...Array(Math.min(statistics.nationalityStats.length, 5))].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: `${i * 100}ms`}}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* الحالات */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-600/10 to-purple-700/10 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                          <CheckCircle className="h-6 w-6 text-purple-500" />
                        </div>
                        <span className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded-full">
                          ✅ حالات
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-foreground">
                          {statistics.statusStats.length}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">حالات مختلفة</div>
                        <div className="mt-2 flex gap-1">
                          {statistics.statusStats.slice(0, 3).map((_, i) => (
                            <div key={i} className="flex-1 h-1 bg-purple-500/30 rounded-full"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* الأولويات */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-600/10 to-orange-700/10 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-orange-500/20 rounded-xl group-hover:scale-110 transition-transform">
                          <Award className="h-6 w-6 text-orange-500" />
                        </div>
                        <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                          ⭐ أولويات
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-foreground">
                          {statistics.priorityStats.length}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">مستويات أولوية</div>
                        <div className="mt-2 flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full" title="عالية"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" title="متوسطة"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full" title="منخفضة"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Mode Switcher */}
                <div className="card p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Eye className="h-5 w-5 text-indigo-500" />
                      طريقة العرض
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewMode('chart')}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          viewMode === 'chart'
                            ? 'bg-indigo-500 text-white shadow-lg'
                            : 'bg-indigo-500/20 text-foreground hover:bg-indigo-500/30'
                        }`}
                      >
                        <BarChart3 className="h-4 w-4 inline ml-2" />
                        مخططات
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          viewMode === 'table'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-purple-500/20 text-foreground hover:bg-purple-500/30'
                        }`}
                      >
                        <FileText className="h-4 w-4 inline ml-2" />
                        جدول
                      </button>
                      <button
                        onClick={() => setViewMode('stats')}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          viewMode === 'stats'
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-green-500/20 text-foreground hover:bg-green-500/30'
                        }`}
                      >
                        <TrendingUp className="h-4 w-4 inline ml-2" />
                        إحصائيات مفصلة
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chart View - Enhanced */}
                {viewMode === 'chart' && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                          <BarChart3 className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">الإحصائيات اليومية</h2>
                          <p className="text-sm text-muted-foreground mt-1">آخر 30 يوم من النشاط</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-lg">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">مباشر</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chart Container */}
                    <div className="relative bg-white dark:bg-gray-950 rounded-xl p-6 shadow-inner">
                      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                        <div className="flex items-end gap-2 h-64 min-w-[800px]">
                          {statistics.chartData.map((data, index) => {
                            const maxCount = Math.max(...statistics.chartData.map(d => d.count), 1)
                            const height = (data.count / maxCount) * 100
                            const isToday = index === statistics.chartData.length - 1
                            const isActive = data.count > 0
                            
                            return (
                              <div key={data.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                                {/* Value Label */}
                                {isActive && (
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                                      {data.count} سيرة
                                    </div>
                                    <div className="w-2 h-2 bg-gray-900 transform rotate-45 -mt-1 mx-auto"></div>
                                  </div>
                                )}
                                
                                {/* Bar */}
                                <div className="w-full flex items-end" style={{ height: '200px' }}>
                                  <div
                                    className={`w-full rounded-t-xl transition-all duration-500 relative overflow-hidden ${
                                      isToday
                                        ? 'bg-gradient-to-t from-green-500 via-green-400 to-green-300 shadow-lg shadow-green-500/30'
                                        : isActive
                                        ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 shadow-md hover:shadow-lg'
                                        : 'bg-gray-200 dark:bg-gray-800'
                                    } cursor-pointer group-hover:scale-105`}
                                    style={{ 
                                      height: `${height}%`, 
                                      minHeight: isActive ? '20px' : '4px',
                                      animation: isActive ? 'slideUp 0.5s ease-out' : 'none',
                                      animationDelay: `${index * 30}ms`
                                    }}
                                  >
                                    {isActive && (
                                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Date Label */}
                                <div className="text-center mt-2">
                                  <div className={`text-xs font-bold ${
                                    isToday ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                                  }`}>
                                    {new Date(data.date).getDate()}
                                  </div>
                                  {(index % 5 === 0 || isToday) && (
                                    <div className="text-[10px] text-muted-foreground mt-1">
                                      {new Date(data.date).toLocaleDateString('ar-SA', { month: 'short' })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      
                      {/* Chart Footer Stats */}
                      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {statistics.chartData.reduce((sum, d) => sum + d.count, 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">إجمالي الشهر</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {Math.max(...statistics.chartData.map(d => d.count))}
                          </div>
                          <div className="text-xs text-muted-foreground">أعلى يوم</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {Math.round(statistics.chartData.reduce((sum, d) => sum + d.count, 0) / statistics.chartData.length)}
                          </div>
                          <div className="text-xs text-muted-foreground">المتوسط</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Animation Styles */}
                    <style jsx>{`
                      @keyframes slideUp {
                        from {
                          transform: scaleY(0);
                          transform-origin: bottom;
                        }
                        to {
                          transform: scaleY(1);
                          transform-origin: bottom;
                        }
                      }
                    `}</style>
                  </div>
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                  <div className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-500/30 px-6 py-4">
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <FileText className="h-6 w-6 text-purple-500" />
                        عرض جدولي للإحصائيات
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* جدول الحالات */}
                        <div className="overflow-x-auto rounded-lg border-2 border-purple-500/30">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-purple-500/10 border-b border-purple-500/30">
                                <th className="text-right py-3 px-4 font-bold text-foreground">الحالة</th>
                                <th className="text-center py-3 px-4 font-bold text-foreground">العدد</th>
                                <th className="text-center py-3 px-4 font-bold text-foreground">النسبة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {statistics.statusStats.map((stat) => {
                                const total = statistics.statusStats.reduce((sum, s) => sum + s.count, 0)
                                const percentage = Math.round((stat.count / total) * 100)
                                return (
                                  <tr key={stat.status} className="hover:bg-purple-500/5 border-b border-purple-500/20">
                                    <td className="py-3 px-4 font-bold text-foreground">{getStatusText(stat.status)}</td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="font-bold text-purple-600">{stat.count}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 h-2 bg-purple-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600" style={{width: `${percentage}%`}}></div>
                                        </div>
                                        <span className="text-sm font-bold">{percentage}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* جدول الأولويات */}
                        <div className="overflow-x-auto rounded-lg border-2 border-pink-500/30">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-pink-500/10 border-b border-pink-500/30">
                                <th className="text-right py-3 px-4 font-bold text-foreground">الأولوية</th>
                                <th className="text-center py-3 px-4 font-bold text-foreground">العدد</th>
                                <th className="text-center py-3 px-4 font-bold text-foreground">النسبة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {statistics.priorityStats.map((stat) => {
                                const total = statistics.priorityStats.reduce((sum, s) => sum + s.count, 0)
                                const percentage = Math.round((stat.count / total) * 100)
                                return (
                                  <tr key={stat.priority} className="hover:bg-pink-500/5 border-b border-pink-500/20">
                                    <td className="py-3 px-4 font-bold text-foreground">{getPriorityText(stat.priority)}</td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="font-bold text-pink-600">{stat.count}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 h-2 bg-pink-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600" style={{width: `${percentage}%`}}></div>
                                        </div>
                                        <span className="text-sm font-bold">{percentage}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats View */}
                {viewMode === 'stats' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* معدل النمو */}
                      <div className="card p-6 border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-foreground">معدل النمو</h3>
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {statistics.chartData.length > 1 ? (
                            Math.round(((statistics.chartData[statistics.chartData.length - 1].count - statistics.chartData[0].count) / Math.max(statistics.chartData[0].count, 1)) * 100)
                          ) : 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">مقارنة بأول يوم</p>
                      </div>

                      {/* أكثر يوم نشاطاً */}
                      <div className="card p-6 border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-foreground">أكثر يوم نشاطاً</h3>
                          <Award className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="text-3xl font-bold text-orange-600 mb-2">
                          {Math.max(...statistics.chartData.map(d => d.count))}
                        </div>
                        <p className="text-sm text-muted-foreground">سيرة ذاتية في يوم واحد</p>
                      </div>

                      {/* معدل التحديث */}
                      <div className="card p-6 border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-sky-500/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-foreground">معدل التحديث</h3>
                          <RefreshCw className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {statistics.summary.totalUploaded + statistics.summary.totalUpdated > 0 ? 
                            Math.round((statistics.summary.totalUpdated / (statistics.summary.totalUploaded + statistics.summary.totalUpdated)) * 100) 
                          : 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">من إجمالي العمليات</p>
                      </div>
                    </div>

                    {/* توزيع الجنسيات التفصيلي */}
                    {statistics.nationalityStats.length > 0 && (
                      <div className="card overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-teal-500/30 px-6 py-4">
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Globe className="h-6 w-6 text-teal-500" />
                            توزيع الجنسيات التفصيلي
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="space-y-3">
                            {statistics.nationalityStats.slice(0, 15).map((stat, index) => {
                              const maxCount = Math.max(...statistics.nationalityStats.map(s => s.count))
                              const percentage = Math.round((stat.count / maxCount) * 100)
                              return (
                                <div key={stat.nationality} className="group">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      {index < 3 && (
                                        <span className={`text-lg ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'}`}>
                                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                        </span>
                                      )}
                                      <span className="font-bold text-foreground">{stat.nationality}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                                      <span className="font-bold text-teal-600">{stat.count}</span>
                                    </div>
                                  </div>
                                  <div className="w-full h-3 bg-teal-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500 group-hover:from-teal-600 group-hover:to-cyan-600"
                                      style={{width: `${percentage}%`}}
                                    ></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User Stats */}
                {viewMode === 'chart' && statistics.userStats.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="bg-primary/10 border-b border-primary/30 px-6 py-4">
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        إحصائيات المستخدمين
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-right py-4 px-6 font-bold text-foreground text-sm">اسم المستخدم</th>
                            <th className="text-right py-4 px-6 font-bold text-foreground text-sm">البريد الإلكتروني</th>
                            <th className="text-center py-4 px-6 font-bold text-foreground text-sm">الصلاحية</th>
                            <th className="text-center py-4 px-6 font-bold text-foreground text-sm">عدد السير</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {statistics.userStats.map((user) => (
                            <tr key={user.userId} className="hover:bg-primary/5 transition-colors">
                              <td className="py-4 px-6 font-bold text-foreground">{user.userName}</td>
                              <td className="py-4 px-6 text-muted-foreground">{user.userEmail}</td>
                              <td className="py-4 px-6 text-center">
                                <span className="inline-block px-4 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                                  {user.userRole}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-lg shadow-lg">
                                  {user.count}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Status & Priority */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {statistics.statusStats.length > 0 && (
                    <div className="card overflow-hidden">
                      <div className="bg-success/10 border-b border-success/30 px-6 py-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <PieChart className="h-6 w-6 text-success" />
                          توزيع الحالات
                        </h3>
                      </div>
                      <div className="p-6 space-y-3">
                        {statistics.statusStats.map((stat) => (
                          <div key={stat.status} className="flex items-center justify-between p-4 bg-success/5 hover:bg-success/10 rounded-lg border-2 border-success/30 hover:border-success/50 transition-all cursor-pointer shadow-md hover:shadow-lg">
                            <span className="font-bold text-foreground text-lg">{getStatusText(stat.status)}</span>
                            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-success to-success/80 text-white font-bold text-xl shadow-lg">
                              {stat.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {statistics.priorityStats.length > 0 && (
                    <div className="card overflow-hidden">
                      <div className="bg-warning/10 border-b border-warning/30 px-6 py-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <Activity className="h-6 w-6 text-warning" />
                          توزيع الأولويات
                        </h3>
                      </div>
                      <div className="p-6 space-y-3">
                        {statistics.priorityStats.map((stat) => (
                          <div key={stat.priority} className="flex items-center justify-between p-4 bg-warning/5 hover:bg-warning/10 rounded-lg border-2 border-warning/30 hover:border-warning/50 transition-all cursor-pointer shadow-md hover:shadow-lg">
                            <span className="font-bold text-foreground text-lg">{getPriorityText(stat.priority)}</span>
                            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-warning to-warning/80 text-white font-bold text-xl shadow-lg">
                              {stat.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Nationalities */}
                {statistics.nationalityStats.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="bg-info/10 border-b border-info/30 px-6 py-4">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Users className="h-6 w-6 text-info" />
                        أعلى 10 جنسيات
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {statistics.nationalityStats.slice(0, 10).map((stat, index) => (
                          <div key={stat.nationality} className={`p-4 text-center rounded-lg border-2 transition-all hover:shadow-xl cursor-pointer ${
                            index === 0 
                              ? 'bg-warning/10 border-warning hover:border-warning/80 hover:scale-105' 
                              : 'bg-info/5 border-info/30 hover:border-info hover:scale-105'
                          }`}>
                            <div className={`text-3xl font-bold mb-2 ${index === 0 ? 'text-warning' : 'text-info'}`}>
                              {stat.count}
                            </div>
                            <div className="text-sm font-bold text-foreground truncate" title={stat.nationality}>
                              {stat.nationality}
                            </div>
                            {index === 0 && (
                              <div className="text-xs text-warning font-bold mt-1">🏆 الأول</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Details */}
                {(statistics.uploadedCVs.length > 0 || statistics.updatedCVs.length > 0) && (
                  <div className="card overflow-hidden">
                    <div className="bg-muted/30 border-b border-border px-6 py-4">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        تفاصيل السير الذاتية
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <button
                          onClick={() => setActiveTab('uploaded')}
                          className={`flex-1 py-4 px-6 rounded-lg font-bold transition-all shadow-md hover:shadow-xl border-2 ${
                            activeTab === 'uploaded'
                              ? 'bg-primary/10 border-primary text-primary scale-105'
                              : 'bg-card border-border text-muted-foreground hover:bg-primary/5 hover:border-primary/50'
                          }`}
                        >
                          <Upload className="h-5 w-5 inline-block ml-2" />
                          السير المرفوعة
                          <span className="inline-block mr-2 px-3 py-1 rounded-full bg-primary/20 text-sm">
                            {statistics.summary.totalUploaded}
                          </span>
                        </button>
                        <button
                          onClick={() => setActiveTab('updated')}
                          className={`flex-1 py-4 px-6 rounded-lg font-bold transition-all shadow-md hover:shadow-xl border-2 ${
                            activeTab === 'updated'
                              ? 'bg-success/10 border-success text-success scale-105'
                              : 'bg-card border-border text-muted-foreground hover:bg-success/5 hover:border-success/50'
                          }`}
                        >
                          <RefreshCw className="h-5 w-5 inline-block ml-2" />
                          السير المحدثة
                          <span className="inline-block mr-2 px-3 py-1 rounded-full bg-success/20 text-sm">
                            {statistics.summary.totalUpdated}
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className={`w-full mb-6 px-6 py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl border-2 ${
                          showDetails 
                            ? 'bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20' 
                            : 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                        }`}
                      >
                        <Eye className="h-5 w-5" />
                        {showDetails ? 'إخفاء التفاصيل الكاملة' : 'عرض التفاصيل الكاملة'}
                      </button>

                      {showDetails && (
                        <div className="overflow-x-auto rounded-lg border-2 border-border">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-muted/30 border-b-2 border-border">
                                <th className="text-right py-4 px-4 font-bold text-foreground text-sm">الكود</th>
                                <th className="text-right py-4 px-4 font-bold text-foreground text-sm">الاسم بالإنجليزي</th>
                                <th className="text-right py-4 px-4 font-bold text-foreground text-sm">الاسم بالعربي</th>
                                <th className="text-right py-4 px-4 font-bold text-foreground text-sm">الجنسية</th>
                                <th className="text-center py-4 px-4 font-bold text-foreground text-sm">الحالة</th>
                                <th className="text-center py-4 px-4 font-bold text-foreground text-sm">
                                  {activeTab === 'uploaded' ? 'تاريخ الرفع' : 'تاريخ التحديث'}
                                </th>
                                <th className="text-right py-4 px-4 font-bold text-foreground text-sm">رفع بواسطة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {(activeTab === 'uploaded' ? statistics.uploadedCVs : statistics.updatedCVs).map((cv) => (
                                <tr key={cv.id} className="hover:bg-primary/5 transition-colors">
                                  <td className="py-4 px-4">
                                    <code className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded-lg font-bold">
                                      {cv.referenceCode || 'N/A'}
                                    </code>
                                  </td>
                                  <td className="py-4 px-4 font-bold text-foreground">{cv.fullName}</td>
                                  <td className="py-4 px-4 font-bold text-foreground">{cv.fullNameArabic || '-'}</td>
                                  <td className="py-4 px-4 font-bold text-foreground">{cv.nationality || '-'}</td>
                                  <td className="py-4 px-4 text-center">
                                    <span className="inline-block px-4 py-2 bg-success text-white rounded-lg text-xs font-bold">
                                      {getStatusText(cv.status)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    <div className="text-sm font-bold text-foreground">
                                      {formatDate(activeTab === 'uploaded' ? cv.createdAt : cv.updatedAt)}
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 font-bold text-foreground">{cv.createdBy.name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="min-h-[400px] flex items-center justify-center card p-8">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-bold text-foreground">لا توجد بيانات</p>
                  <p className="text-sm text-muted-foreground mt-1">لم يتم العثور على أي إحصائيات</p>
                </div>
              </div>
            )}
          </div>
        )
      }}
    </DashboardLayout>
  )
}
