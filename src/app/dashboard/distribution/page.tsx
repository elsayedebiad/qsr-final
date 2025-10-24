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

  const fetchDistributionRules = async () => {
    try {
      const res = await fetch('/api/distribution/rules')
      const data = await res.json()
      
      if (data.success && data.rules) {
        // تحويل البيانات من قاعدة البيانات لصيغة state
        const formattedRules = data.rules.map((rule: any) => ({
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
    // بيانات تجريبية - سيتم استبدالها بـ API حقيقي لاحقاً
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
            <button
              onClick={fetchData}
              className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
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
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium mb-1">نظام التوزيع المرجح:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>Google Traffic:</strong> الزيارات القادمة من Google (إعلانات، بحث، gclid)</li>
                      <li><strong>Other Traffic:</strong> باقي المصادر (مباشر، سوشيال ميديا، إلخ)</li>
                      <li><strong>عدد التحويلات:</strong> العدد المستهدف من التحويلات (حجوزات/عقود) لكل صفحة شهرياً</li>
                      <li><strong>sales7:</strong> معطل عمداً حسب المتطلبات</li>
                      <li>يتم التوزيع تلقائياً عند زيارة <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">/sales</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-right py-2 px-4 text-sm font-medium">الصفحة</th>
                      <th className="text-center py-2 px-4 text-sm font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Google %
                        </div>
                      </th>
                      <th className="text-center py-2 px-4 text-sm font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <Globe className="h-4 w-4" />
                          Other %
                        </div>
                      </th>
                      <th className="text-center py-2 px-4 text-sm font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <Target className="h-4 w-4" />
                          عدد التحويلات
                        </div>
                      </th>
                      <th className="text-center py-2 px-4 text-sm font-medium">الحالة</th>
                      <th className="text-center py-2 px-4 text-sm font-medium">إجراءات</th>
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
                  <tfoot>
                    <tr className="border-t-2 dark:border-gray-600 font-bold">
                      <td className="py-3 px-4">الإجمالي</td>
                      <td className="py-3 px-4 text-center">
                        {rules.filter(r => r.isActive).reduce((sum, r) => sum + r.googleWeight, 0).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rules.filter(r => r.isActive).reduce((sum, r) => sum + r.otherWeight, 0).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-center text-blue-600 dark:text-blue-400">
                        {rules.filter(r => r.isActive).reduce((sum, r) => sum + (r.targetConversions || 0), 0)} تحويلة
                      </td>
                      <td colSpan={2} className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/distribution/rules', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rules })
                      })
                      
                      const data = await res.json()
                      
                      if (data.success) {
                        toast.success('✅ تم حفظ قواعد التوزيع بنجاح! سيتم تطبيقها فوراً على /sales')
                      } else {
                        toast.error(data.error || 'فشل حفظ القواعد')
                      }
                    } catch (error) {
                      console.error('Save error:', error)
                      toast.error('حدث خطأ أثناء الحفظ')
                    }
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  حفظ التغييرات
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
