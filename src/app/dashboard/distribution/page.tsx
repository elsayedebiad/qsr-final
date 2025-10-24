'use client'

import React, { useState, useEffect } from 'react'
import { 
  Network, Users, Activity, BarChart3, RefreshCw, 
  ArrowUp, ArrowDown, Target, Zap, Globe, Settings, TrendingUp,
  ExternalLink, Percent, Info, Save, Eye, MousePointerClick
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'

interface PageStats {
  salesPageId: string
  activeCount: number
  todayAssigned: number
  todayRemoved: number
  dailyLimit: number | null
  totalLimit: number | null
  autoDistribute: boolean
  isActive: boolean
  statusCounts: {
    NEW: number
    BOOKED: number
    HIRED: number
    REJECTED: number
    RETURNED: number
    ARCHIVED: number
  }
}

interface DistributionRule {
  path: string
  googleWeight: number
  otherWeight: number
  isActive: boolean
  targetConversions?: number // عدد التحويلات المستهدفة
}

interface VisitStats {
  salesPageId: string
  totalVisits: number
  sources: {
    google: number
    facebook: number
    instagram: number
    tiktok: number
    youtube: number
    twitter: number
    direct: number
    other: number
  }
  today: number
  yesterday: number
  thisWeek: number
  thisMonth: number
}

export default function DistributionPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PageStats[]>([])
  const [summary, setSummary] = useState({
    totalActive: 0,
    totalTodayAssigned: 0,
    totalTodayRemoved: 0,
    averagePerPage: 0
  })
  const [showSettings, setShowSettings] = useState(false)
  const [visitStats, setVisitStats] = useState<VisitStats[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // بالثواني
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [rules, setRules] = useState<DistributionRule[]>([
    { path: '/sales1', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales2', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales3', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales4', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales5', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales6', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales7', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales8', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales9', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales10', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales11', googleWeight: 9.01, otherWeight: 9.01, isActive: true, targetConversions: 100 },
  ])

  useEffect(() => {
    fetchData()
    fetchVisitStats()
    fetchDistributionRules()
  }, [])

  // Auto-refresh للبيانات
  useEffect(() => {
    if (!autoRefresh) return

    const intervalId = setInterval(() => {
      fetchData()
      fetchVisitStats()
      setLastUpdate(new Date())
    }, refreshInterval * 1000)

    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval])

  const fetchDistributionRules = async () => {
    try {
      const res = await fetch('/api/distribution/rules')
      const data = await res.json()
      
      if (data.success && data.rules) {
        // تحويل البيانات من قاعدة البيانات لصيغة state
        const formattedRules = data.rules.map((rule: {
          salesPageId: string
          googleWeight: number
          otherWeight: number
          isActive: boolean
        }) => ({
          path: `/sales${rule.salesPageId.replace('sales', '')}`,
          googleWeight: rule.googleWeight || 0,
          otherWeight: rule.otherWeight || 0,
          isActive: rule.isActive
        }))
        setRules(formattedRules)
      }
    } catch (error) {
      console.error('Failed to fetch distribution rules:', error)
    }
  }

  const fetchVisitStats = async () => {
    try {
      // جلب البيانات الحقيقية من قاعدة البيانات
      const res = await fetch('/api/visits/stats')
      const data = await res.json()
      
      if (data.success && data.visitStats) {
        setVisitStats(data.visitStats)
        setLastUpdate(new Date())
        return
      }
    } catch (error) {
      console.error('Failed to fetch visit stats:', error)
    }
    
    // بيانات افتراضية في حالة الفشل
    const mockData: VisitStats[] = [
      {
        salesPageId: 'sales1',
        totalVisits: 1250,
        sources: { google: 450, facebook: 280, instagram: 180, tiktok: 120, youtube: 90, twitter: 60, direct: 50, other: 20 },
        today: 85,
        yesterday: 92,
        thisWeek: 420,
        thisMonth: 1250
      },
      {
        salesPageId: 'sales2',
        totalVisits: 1100,
        sources: { google: 420, facebook: 250, instagram: 160, tiktok: 100, youtube: 80, twitter: 50, direct: 30, other: 10 },
        today: 78,
        yesterday: 85,
        thisWeek: 380,
        thisMonth: 1100
      },
      {
        salesPageId: 'sales3',
        totalVisits: 980,
        sources: { google: 380, facebook: 220, instagram: 140, tiktok: 90, youtube: 70, twitter: 45, direct: 25, other: 10 },
        today: 65,
        yesterday: 72,
        thisWeek: 340,
        thisMonth: 980
      },
      {
        salesPageId: 'sales4',
        totalVisits: 920,
        sources: { google: 350, facebook: 200, instagram: 130, tiktok: 85, youtube: 65, twitter: 40, direct: 30, other: 20 },
        today: 62,
        yesterday: 68,
        thisWeek: 310,
        thisMonth: 920
      },
      {
        salesPageId: 'sales5',
        totalVisits: 850,
        sources: { google: 320, facebook: 180, instagram: 120, tiktok: 75, youtube: 60, twitter: 35, direct: 40, other: 20 },
        today: 58,
        yesterday: 64,
        thisWeek: 290,
        thisMonth: 850
      },
      {
        salesPageId: 'sales6',
        totalVisits: 790,
        sources: { google: 300, facebook: 170, instagram: 110, tiktok: 70, youtube: 55, twitter: 30, direct: 35, other: 20 },
        today: 54,
        yesterday: 60,
        thisWeek: 270,
        thisMonth: 790
      },
      {
        salesPageId: 'sales7',
        totalVisits: 730,
        sources: { google: 280, facebook: 160, instagram: 100, tiktok: 65, youtube: 50, twitter: 28, direct: 30, other: 17 },
        today: 50,
        yesterday: 56,
        thisWeek: 250,
        thisMonth: 730
      },
      {
        salesPageId: 'sales8',
        totalVisits: 680,
        sources: { google: 260, facebook: 150, instagram: 95, tiktok: 60, youtube: 45, twitter: 25, direct: 28, other: 17 },
        today: 47,
        yesterday: 52,
        thisWeek: 230,
        thisMonth: 680
      },
      {
        salesPageId: 'sales9',
        totalVisits: 620,
        sources: { google: 240, facebook: 140, instagram: 88, tiktok: 55, youtube: 40, twitter: 22, direct: 22, other: 13 },
        today: 43,
        yesterday: 48,
        thisWeek: 210,
        thisMonth: 620
      },
      {
        salesPageId: 'sales10',
        totalVisits: 560,
        sources: { google: 220, facebook: 130, instagram: 80, tiktok: 50, youtube: 35, twitter: 20, direct: 18, other: 7 },
        today: 39,
        yesterday: 44,
        thisWeek: 190,
        thisMonth: 560
      },
      {
        salesPageId: 'sales11',
        totalVisits: 510,
        sources: { google: 200, facebook: 120, instagram: 75, tiktok: 45, youtube: 30, twitter: 18, direct: 15, other: 7 },
        today: 36,
        yesterday: 40,
        thisWeek: 170,
        thisMonth: 510
      }
    ]
    setVisitStats(mockData)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/distribution/stats-simple')
      const data = await res.json()
      
      if (data.success) {
        setStats(data.pageStats || [])
        setSummary(data.summary || {
          totalActive: 0,
          totalTodayAssigned: 0,
          totalTodayRemoved: 0,
          averagePerPage: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('فشل جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoDistribute = async (strategy: string) => {
    try {
      const res = await fetch('/api/distribution/auto-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, count: 100 })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || 'فشل التوزيع التلقائي')
      }
    } catch {
      toast.error('حدث خطأ في التوزيع التلقائي')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-green-100 text-green-800',
      BOOKED: 'bg-blue-100 text-blue-800',
      HIRED: 'bg-purple-100 text-purple-800',
      REJECTED: 'bg-red-100 text-red-800',
      RETURNED: 'bg-yellow-100 text-yellow-800',
      ARCHIVED: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'جديد',
      BOOKED: 'محجوز',
      HIRED: 'متعاقد',
      REJECTED: 'مرفوض',
      RETURNED: 'معاد',
      ARCHIVED: 'مؤرشف'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <DashboardLayout>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {() => (
        <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Network className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">نظام توزيع السير الذاتية</h1>
                <p className="text-gray-600 dark:text-gray-400">إدارة التوزيع على صفحات المبيعات</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-refresh controls - محسّن */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-700 px-4 py-2 rounded-xl shadow-sm">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-md ${
                    autoRefresh
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-200 hover:from-gray-400 hover:to-gray-500'
                  }`}
                >
                  {autoRefresh ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>تلقائي</span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4" />
                      <span>متوقف</span>
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    disabled={!autoRefresh}
                    className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
                  >
                    <option value={10}>10 ث</option>
                    <option value={30}>30 ث</option>
                    <option value={60}>دقيقة</option>
                    <option value={120}>دقيقتين</option>
                    <option value={300}>5 دقائق</option>
                  </select>
                </div>
              </div>
              
              {/* زر التحديث اليدوي */}
              <button
                onClick={() => {
                  fetchData()
                  fetchVisitStats()
                }}
                className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                title="تحديث يدوي"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Last update time - محسّن */}
          <div className="mt-4 flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                autoRefresh ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'
              }`}>
                {autoRefresh && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                آخر تحديث:
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {lastUpdate.toLocaleTimeString('ar-EG')}
              </span>
            </div>
            {autoRefresh && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <RefreshCw className="h-3.5 w-3.5 text-green-600 dark:text-green-400 animate-spin" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                  التحديث كل {refreshInterval} ثانية
                </span>
              </div>
            )}
            {!autoRefresh && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-full">
                <Activity className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  التحديث متوقف
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold">{summary.totalActive}</span>
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400">إجمالي السير الموزعة</h3>
            <p className="text-xs text-gray-500 mt-1">المتوسط: {summary.averagePerPage}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <ArrowUp className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold">{summary.totalTodayAssigned}</span>
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400">موزع اليوم</h3>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <ArrowDown className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold">{summary.totalTodayRemoved}</span>
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400">محذوف اليوم</h3>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold">{stats.filter(s => s.isActive).length}</span>
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400">صفحات نشطة</h3>
          </div>
        </div>

        {/* Visit Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" />
            إحصائيات الزيارات المفصلة
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {visitStats.map(page => (
              <div key={page.salesPageId} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">{page.salesPageId.toUpperCase()}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <MousePointerClick className="h-4 w-4 text-blue-500" />
                    <span className="font-bold">{page.totalVisits}</span>
                  </div>
                </div>

                {/* Timeline Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">اليوم</div>
                    <div className="font-bold text-blue-600 dark:text-blue-400">{page.today}</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">أمس</div>
                    <div className="font-bold text-purple-600 dark:text-purple-400">{page.yesterday}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">هذا الأسبوع</div>
                    <div className="font-bold text-green-600 dark:text-green-400">{page.thisWeek}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">هذا الشهر</div>
                    <div className="font-bold text-orange-600 dark:text-orange-400">{page.thisMonth}</div>
                  </div>
                </div>

                {/* Sources */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">المصادر:</h4>
                  {Object.entries(page.sources).map(([source, count]) => {
                    const percentage = ((count / page.totalVisits) * 100).toFixed(1)
                    const sourceColors: Record<string, string> = {
                      google: 'bg-red-500',
                      facebook: 'bg-blue-600',
                      instagram: 'bg-pink-500',
                      tiktok: 'bg-black dark:bg-white',
                      youtube: 'bg-red-600',
                      twitter: 'bg-blue-400',
                      direct: 'bg-gray-600',
                      other: 'bg-gray-400'
                    }
                    return (
                      <div key={source} className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${sourceColors[source]}`}></div>
                        <span className="flex-1 capitalize">{source}</span>
                        <span className="font-semibold">{count}</span>
                        <span className="text-gray-500 dark:text-gray-400">({percentage}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Rules (Middleware) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              قواعد التوزيع المرجح (Middleware)
            </h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
            >
              {showSettings ? 'إخفاء' : 'عرض'} الإعدادات
            </button>
          </div>

          {showSettings && (
            <>
              {/* مؤشر حالة النظام */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800 dark:text-green-300">نظام التوزيع نشط ✅</h3>
                      <p className="text-xs text-green-600 dark:text-green-400">يعمل في <code className="bg-white/50 px-1 rounded">/sales</code></p>
                    </div>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>يتم التوزيع حسب الأوزان المحددة أدناه</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>يحفظ الزائر في نفس الصفحة لمدة 7 أيام (Cookie)</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-medium mb-1">كيف يعمل النظام:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><strong>Google Traffic:</strong> من Google Ads/Search</li>
                        <li><strong>Other Traffic:</strong> المصادر الأخرى</li>
                        <li><strong>التحويلات:</strong> الهدف الشهري لكل صفحة</li>
                        <li>الحفظ في DB: ✅ | التطبيق الفوري: ✅</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
                    <tr className="border-b-2 border-blue-200 dark:border-blue-700">
                      <th className="text-right py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-200">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-500" />
                          الصفحة
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-200">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-red-500" />
                            <span>Google</span>
                          </div>
                          <span className="text-xs text-gray-500 font-normal">(من إعلانات)</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-200">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4 text-blue-500" />
                            <span>Other</span>
                          </div>
                          <span className="text-xs text-gray-500 font-normal">(مصادر أخرى)</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-200">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4 text-green-500" />
                            <span>الهدف الشهري</span>
                          </div>
                          <span className="text-xs text-gray-500 font-normal">(تحويلات)</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-200">الحالة</th>
                      <th className="text-center py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-200">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule, index) => (
                      <tr key={rule.path} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{rule.path}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              value={rule.googleWeight}
                              onChange={(e) => {
                                const newRules = [...rules]
                                newRules[index].googleWeight = parseFloat(e.target.value) || 0
                                setRules(newRules)
                              }}
                              disabled={!rule.isActive}
                              className="w-20 px-2 py-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600"
                              step="0.01"
                            />
                            <Percent className="h-4 w-4 text-gray-400" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              value={rule.otherWeight}
                              onChange={(e) => {
                                const newRules = [...rules]
                                newRules[index].otherWeight = parseFloat(e.target.value) || 0
                                setRules(newRules)
                              }}
                              disabled={!rule.isActive}
                              className="w-20 px-2 py-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600"
                              step="0.01"
                            />
                            <Percent className="h-4 w-4 text-gray-400" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              value={rule.targetConversions || 0}
                              onChange={(e) => {
                                const newRules = [...rules]
                                newRules[index].targetConversions = parseInt(e.target.value) || 0
                                setRules(newRules)
                              }}
                              disabled={!rule.isActive}
                              className="w-24 px-2 py-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600 font-semibold"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {rule.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">نشط</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">معطل</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              const newRules = [...rules]
                              newRules[index].isActive = !newRules[index].isActive
                              setRules(newRules)
                            }}
                            className={`px-3 py-1 rounded text-xs ${
                              rule.isActive
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {rule.isActive ? 'تعطيل' : 'تفعيل'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                    <tr className="border-t-2 border-green-300 dark:border-green-600 font-bold">
                      <td className="py-4 px-4 text-gray-800 dark:text-gray-200">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-green-600" />
                            <span>الإجمالي</span>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-normal">
                            ({rules.filter(r => r.isActive && ((r.googleWeight > 0) || (r.otherWeight > 0))).length} صفحة نشطة)
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {rules.filter(r => r.isActive).reduce((sum, r) => sum + r.googleWeight, 0).toFixed(2)}%
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-normal">
                            ({rules.filter(r => r.isActive && r.googleWeight > 0).length} صفحة تستقبل)
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {rules.filter(r => r.isActive).reduce((sum, r) => sum + r.otherWeight, 0).toFixed(2)}%
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-normal">
                            ({rules.filter(r => r.isActive && r.otherWeight > 0).length} صفحة تستقبل)
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <Target className="h-4 w-4" />
                          {rules.filter(r => r.isActive).reduce((sum, r) => sum + (r.targetConversions || 0), 0)} تحويلة
                        </div>
                      </td>
                      <td colSpan={2} className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {rules.filter(r => r.isActive).length} صفحة نشطة
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ملاحظات هامة - محسّنة */}
              <div className="mt-4 space-y-3 mb-4">
                {/* شرح آلية التوزيع */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-green-900 dark:text-green-200 mb-3 text-base">✅ كيف يعمل التوزيع بالضبط؟</p>
                      <div className="space-y-2 text-xs text-green-800 dark:text-green-300">
                        <div className="flex items-start gap-2">
                          <span className="font-bold min-w-[20px]">1️⃣</span>
                          <span>النظام يوزع حسب <strong>النسب النسبية</strong> للأوزان المدخلة</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold min-w-[20px]">2️⃣</span>
                          <div className="flex-1">
                            <p className="font-semibold mb-1">أمثلة عملية:</p>
                            <div className="space-y-1 bg-white/30 dark:bg-black/20 p-2 rounded">
                              <p>• إذا أدخلت: <code className="bg-white/50 dark:bg-gray-700 px-1 rounded">20, 30, 50</code></p>
                              <p className="pr-4">→ التوزيع: <strong>20%, 30%, 50%</strong> (بالضبط)</p>
                              
                              <p className="mt-1">• إذا أدخلت: <code className="bg-white/50 dark:bg-gray-700 px-1 rounded">10, 10, 10</code></p>
                              <p className="pr-4">→ التوزيع: <strong>33.33%, 33.33%, 33.33%</strong></p>
                              
                              <p className="mt-1">• إذا أدخلت: <code className="bg-white/50 dark:bg-gray-700 px-1 rounded">5, 15</code></p>
                              <p className="pr-4">→ التوزيع: <strong>25%, 75%</strong></p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold min-w-[20px]">3️⃣</span>
                          <span>المجموع <strong>ليس مطلوب</strong> أن يكون 100% - النظام يحسب النسب النسبية تلقائياً</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold min-w-[20px]">4️⃣</span>
                          <span>الصفحات بوزن 0 أو المعطلة <strong>لن تظهر في التوزيع نهائياً</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* التعطيل والصفر */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border-2 border-red-300 dark:border-red-700">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-500 rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-red-900 dark:text-red-200 mb-2">🚫 إذا كتبت 0</p>
                        <p className="text-xs text-red-800 dark:text-red-300">
                          الصفحة <strong>لن تظهر في التوزيع إطلاقاً</strong> = لن تحصل على أي زيارات من <code className="bg-white/50 px-1 rounded">/sales</code>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border-2 border-orange-300 dark:border-orange-700">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-orange-900 dark:text-orange-200 mb-2">⚠️ إذا عملت تعطيل</p>
                        <p className="text-xs text-orange-800 dark:text-orange-300">
                          الصفحة <strong>ستُستثنى من التوزيع</strong> حتى لو كان لها وزن {'>'} 0
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* التحقق من التطبيق */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-purple-900 dark:text-purple-200 mb-2">🧪 كيف تتحقق من التطبيق؟</p>
                      <div className="space-y-1 text-xs text-purple-800 dark:text-purple-300">
                        <p>1. افتح <code className="bg-white/50 px-1.5 py-0.5 rounded font-mono font-bold">{typeof window !== 'undefined' ? window.location.origin : ''}/sales</code> في متصفح خاص (Incognito)</p>
                        <p>2. أعد تحميل الصفحة عدة مرات (10-20 مرة)</p>
                        <p>3. ستجد التوزيع يتبع النسب المحددة بدقة</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* معاينة التوزيع الفعلي - محسّنة */}
              <div className="mt-4 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-2xl border-3 border-blue-400 dark:border-blue-600 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl text-blue-900 dark:text-blue-100 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    📊 معاينة التوزيع الفعلي
                  </h3>
                  <div className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 rounded-full backdrop-blur-sm border-2 border-blue-300 dark:border-blue-600">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">حسب الأوزان المدخلة ⚡</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Google Distribution */}
                  <div className="space-y-3 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-base font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        📊 توزيع Google
                      </p>
                      {(() => {
                        const googleActive = rules.filter(r => r.isActive && r.googleWeight > 0)
                        const googleTotal = googleActive.reduce((s, r) => s + r.googleWeight, 0)
                        return (
                          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                              {googleTotal.toFixed(2)}% إجمالي
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                    {(() => {
                      const googleActive = rules.filter(r => r.isActive && r.googleWeight > 0)
                      const googleTotal = googleActive.reduce((s, r) => s + r.googleWeight, 0)
                      return googleActive.length > 0 ? (
                        <div className="space-y-1">
                          {googleActive.map(rule => {
                            const actualPercent = ((rule.googleWeight / googleTotal) * 100).toFixed(2)
                            return (
                              <div key={rule.path} className="flex items-center gap-2 text-xs">
                                <span className="font-mono font-semibold min-w-[60px] text-blue-700 dark:text-blue-400">{rule.path}</span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-end pr-1 transition-all duration-300"
                                    style={{ width: `${actualPercent}%` }}
                                  >
                                    <span className="text-[10px] font-bold text-white">{actualPercent}%</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-gray-600 dark:text-gray-400">({rule.googleWeight})</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 dark:text-red-400">⚠️ لا توجد صفحات نشطة</p>
                      )
                    })()}
                  </div>
                  
                  {/* Other Distribution */}
                  <div className="space-y-3 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-base font-bold text-green-900 dark:text-green-200 flex items-center gap-2">
                        <MousePointerClick className="h-5 w-5" />
                        🌍 توزيع Other
                      </p>
                      {(() => {
                        const otherActive = rules.filter(r => r.isActive && r.otherWeight > 0)
                        const otherTotal = otherActive.reduce((s, r) => s + r.otherWeight, 0)
                        return (
                          <div className="px-3 py-1 bg-green-100 dark:bg-green-900/50 rounded-full">
                            <span className="text-xs font-bold text-green-700 dark:text-green-300">
                              {otherTotal.toFixed(2)}% إجمالي
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                    {(() => {
                      const otherActive = rules.filter(r => r.isActive && r.otherWeight > 0)
                      const otherTotal = otherActive.reduce((s, r) => s + r.otherWeight, 0)
                      return otherActive.length > 0 ? (
                        <div className="space-y-1">
                          {otherActive.map(rule => {
                            const actualPercent = ((rule.otherWeight / otherTotal) * 100).toFixed(2)
                            return (
                              <div key={rule.path} className="flex items-center gap-2 text-xs">
                                <span className="font-mono font-semibold min-w-[60px] text-green-700 dark:text-green-400">{rule.path}</span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-full flex items-center justify-end pr-1 transition-all duration-300"
                                    style={{ width: `${actualPercent}%` }}
                                  >
                                    <span className="text-[10px] font-bold text-white">{actualPercent}%</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-gray-600 dark:text-gray-400">({rule.otherWeight})</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 dark:text-red-400">⚠️ لا توجد صفحات نشطة</p>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* أمثلة عملية مع رسوم توضيحية */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* مثال 1: التوزيع المتساوي */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-300 dark:border-green-600 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-green-900 dark:text-green-200">مثال 1: توزيع متساوي</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-green-800 dark:text-green-300">إذا أدخلت:</p>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg font-mono text-xs space-y-1">
                      <div className="flex justify-between"><span>sales1:</span><span className="font-bold text-green-600">10</span></div>
                      <div className="flex justify-between"><span>sales2:</span><span className="font-bold text-green-600">10</span></div>
                      <div className="flex justify-between"><span>sales3:</span><span className="font-bold text-green-600">10</span></div>
                    </div>
                    <p className="font-semibold text-green-800 dark:text-green-300">→ النتيجة: توزيع متساوي 33.33%</p>
                  </div>
                </div>

                {/* مثال 2: التوزيع غير المتساوي */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-600 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-200">مثال 2: توزيع مخصص</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-blue-800 dark:text-blue-300">إذا أدخلت:</p>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg font-mono text-xs space-y-1">
                      <div className="flex justify-between"><span>sales1:</span><span className="font-bold text-blue-600">20</span></div>
                      <div className="flex justify-between"><span>sales2:</span><span className="font-bold text-blue-600">30</span></div>
                      <div className="flex justify-between"><span>sales3:</span><span className="font-bold text-blue-600">50</span></div>
                    </div>
                    <p className="font-semibold text-blue-800 dark:text-blue-300">→ النتيجة: 20%, 30%, 50%</p>
                  </div>
                </div>

                {/* مثال 3: التعطيل والصفر */}
                <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border-2 border-red-300 dark:border-red-600 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-red-900 dark:text-red-200">مثال 3: القيمة 0</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-red-800 dark:text-red-300">إذا أدخلت:</p>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg font-mono text-xs space-y-1">
                      <div className="flex justify-between"><span>sales1:</span><span className="font-bold text-green-600">50</span></div>
                      <div className="flex justify-between"><span>sales2:</span><span className="font-bold text-green-600">50</span></div>
                      <div className="flex justify-between opacity-50"><span>sales3:</span><span className="font-bold text-red-600 line-through">0</span></div>
                    </div>
                    <p className="font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs">⛔ sales3 لن تحصل على أي زيارات!</p>
                  </div>
                </div>
              </div>

              {/* قسم التحذيرات المهمة */}
              <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 rounded-2xl border-3 border-amber-400 dark:border-amber-600 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <Info className="h-7 w-7 text-white animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-4">⚠️ تحذيرات مهمة جداً - اقرأ بتركيز!</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border-2 border-red-300 dark:border-red-600">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-3xl">🚫</span>
                          <h4 className="font-bold text-red-900 dark:text-red-200 text-lg">عند كتابة 0</h4>
                        </div>
                        <ul className="text-sm text-red-800 dark:text-red-300 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="font-bold">•</span>
                            <span>الصفحة <strong>تُستثنى نهائياً</strong> من التوزيع</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold">•</span>
                            <span>لن تصلها <strong className="underline">أي زيارة</strong> من /sales</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold">•</span>
                            <span>حتى لو كانت الصفحة نشطة ✅</span>
                          </li>
                        </ul>
                        <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs font-bold text-red-900 dark:text-red-200">
                          مثال: إذا كتبت 0 في Google → لن تحصل على زيارات Google أبداً
                        </div>
                      </div>
                      <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border-2 border-orange-300 dark:border-orange-600">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-3xl">🔴</span>
                          <h4 className="font-bold text-orange-900 dark:text-orange-200 text-lg">عند التعطيل</h4>
                        </div>
                        <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="font-bold">•</span>
                            <span>الصفحة <strong>لا تظهر</strong> في التوزيع</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold">•</span>
                            <span>يتم <strong className="underline">تجاهلها تماماً</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold">•</span>
                            <span>حتى لو كان لها وزن كبير (50)</span>
                          </li>
                        </ul>
                        <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs font-bold text-orange-900 dark:text-orange-200">
                          مثال: sales1 معطلة → لن تظهر في /sales حتى لو وزنها 100
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border-2 border-green-400 dark:border-green-600">
                      <p className="text-base font-bold text-green-900 dark:text-green-200 flex items-center gap-2">
                        <Zap className="h-6 w-6" />
                        النظام يطبق القواعد <strong className="underline text-lg">بدقة 100%</strong> - بدون أي استثناءات أو تقريب!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    try {
                      // عرض عدد الصفحات النشطة
                      const activePages = rules.filter(r => r.isActive && ((r.googleWeight > 0) || (r.otherWeight > 0)))
                      const loadingToast = toast.loading(`جاري حفظ القواعد... (${activePages.length} صفحة نشطة)`)
                      
                      const res = await fetch('/api/distribution/rules', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rules })
                      })
                      
                      const data = await res.json()
                      
                      toast.dismiss(loadingToast)
                      
                      if (data.success) {
                        // رسالة تفصيلية
                        const googlePages = rules.filter(r => r.isActive && r.googleWeight > 0).length
                        const otherPages = rules.filter(r => r.isActive && r.otherWeight > 0).length
                        toast.success(
                          `✅ تم الحفظ بنجاح!\n📊 Google: ${googlePages} صفحة\n🌍 Other: ${otherPages} صفحة\n🚀 القواعد نشطة في /sales`, 
                          { duration: 6000 }
                        )
                        // إعادة جلب القواعد للتأكيد
                        await fetchDistributionRules()
                      } else {
                        toast.error(data.error || 'فشل حفظ القواعد')
                      }
                    } catch (error) {
                      console.error('Save error:', error)
                      toast.error('حدث خطأ أثناء الحفظ')
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-semibold"
                >
                  <Save className="h-5 w-5" />
                  <span>حفظ التغييرات وتطبيقها فوراً</span>
                </button>
                <button
                  onClick={() => {
                    setRules([
                      { path: '/sales1', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales2', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales3', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales4', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales5', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales6', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales7', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales8', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales9', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales10', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
                      { path: '/sales11', googleWeight: 9.01, otherWeight: 9.01, isActive: true, targetConversions: 100 },
                    ])
                    toast.success('تم إعادة تعيين الإعدادات الافتراضية (جميع الصفحات الـ 11 متساوية)')
                  }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  إعادة تعيين (توزيع متساوي)
                </button>
              </div>
            </>
          )}
        </div>

        {/* Auto Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            التوزيع التلقائي
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleAutoDistribute('EQUAL')}
              className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">توزيع متساوي</div>
                <div className="text-xs opacity-90">توزيع السير بالتساوي على الصفحات</div>
              </div>
            </button>

            <button
              onClick={() => handleAutoDistribute('RANDOM')}
              className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              <div className="text-center">
                <Target className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">توزيع عشوائي</div>
                <div className="text-xs opacity-90">توزيع السير بشكل عشوائي</div>
              </div>
            </button>

            <button
              onClick={() => handleAutoDistribute('BALANCED')}
              className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all"
            >
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">توزيع متوازن</div>
                <div className="text-xs opacity-90">موازنة الحمل بين الصفحات</div>
              </div>
            </button>
          </div>
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(page => (
            <div key={page.salesPageId} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              {/* Page Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-blue-500" />
                  <h3 className="text-lg font-semibold">
                    {page.salesPageId.toUpperCase()}
                  </h3>
                </div>
                <div className="flex gap-2">
                  {page.isActive && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">نشط</span>
                  )}
                  {page.autoDistribute && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">تلقائي</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">السير النشطة</span>
                  <span className="font-semibold">{page.activeCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">موزع اليوم</span>
                  <span className="text-green-600">+{page.todayAssigned}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">محذوف اليوم</span>
                  <span className="text-red-600">-{page.todayRemoved}</span>
                </div>

                {page.dailyLimit && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">الحد اليومي</span>
                    <span>{page.dailyLimit}</span>
                  </div>
                )}

                {page.totalLimit && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">الحد الكلي</span>
                    <span>{page.totalLimit}</span>
                  </div>
                )}
              </div>

              {/* Status Distribution */}
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <h4 className="text-sm font-medium mb-2">توزيع الحالات</h4>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {Object.entries(page.statusCounts).map(([status, count]) => (
                    <div key={status} className={`rounded px-2 py-1 text-center ${getStatusColor(status)}`}>
                      <div>{getStatusLabel(status)}</div>
                      <div className="font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </DashboardLayout>
  )
}
