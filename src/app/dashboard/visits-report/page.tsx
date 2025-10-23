'use client'

import { useState, useEffect } from 'react'
import { 
  Eye, Globe, MousePointerClick, TrendingUp, MapPin, 
  Calendar, Link as LinkIcon, RefreshCw, Users, BarChart3
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Visit {
  id: number
  ipAddress: string
  country: string | null
  city: string | null
  targetPage: string
  utmSource: string | null
  utmCampaign: string | null
  isGoogle: boolean
  timestamp: string
}

interface VisitStats {
  summary: {
    totalVisits: number
    todayVisits: number
    weekVisits: number
    googleVisits: number
    otherVisits: number
  }
  pageStats: Record<string, number>
  countryStats: Record<string, number>
  sourceStats: Record<string, number>
  campaignStats: Record<string, number>
  recentVisits: Visit[]
}

export default function VisitsReportPage() {
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/visits/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 5000) // تحديث كل 5 ثواني
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (loading || !stats) {
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    تقرير الزيارات المباشر
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    تتبع لحظي لجميع الزيارات والإعلانات
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    autoRefresh
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {autoRefresh ? '🟢 تحديث تلقائي' : '⚪ متوقف'}
                </button>
                <button
                  onClick={fetchStats}
                  className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8" />
                <span className="text-3xl font-bold">{stats.summary.totalVisits}</span>
              </div>
              <h3 className="text-sm opacity-90">إجمالي الزيارات</h3>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-8 w-8" />
                <span className="text-3xl font-bold">{stats.summary.todayVisits}</span>
              </div>
              <h3 className="text-sm opacity-90">زيارات اليوم</h3>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8" />
                <span className="text-3xl font-bold">{stats.summary.weekVisits}</span>
              </div>
              <h3 className="text-sm opacity-90">هذا الأسبوع</h3>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Globe className="h-8 w-8" />
                <span className="text-3xl font-bold">{stats.summary.googleVisits}</span>
              </div>
              <h3 className="text-sm opacity-90">من Google</h3>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-8 w-8" />
                <span className="text-3xl font-bold">{stats.summary.otherVisits}</span>
              </div>
              <h3 className="text-sm opacity-90">مصادر أخرى</h3>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pages */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-blue-500" />
                الزيارات حسب الصفحة
              </h2>
              <div className="space-y-2">
                {Object.entries(stats.pageStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([page, count]) => (
                    <div key={page} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium">{page}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Countries */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-500" />
                الزيارات حسب الدولة
              </h2>
              <div className="space-y-2">
                {Object.entries(stats.countryStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium">{country}</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Sources */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                المصادر
              </h2>
              <div className="space-y-2">
                {Object.entries(stats.sourceStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium capitalize">{source}</span>
                      <span className="text-purple-600 dark:text-purple-400 font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Campaigns */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-orange-500" />
                الحملات الإعلانية
              </h2>
              <div className="space-y-2">
                {Object.entries(stats.campaignStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([campaign, count]) => (
                    <div key={campaign} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium">{campaign}</span>
                      <span className="text-orange-600 dark:text-orange-400 font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recent Visits */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              آخر الزيارات (Live)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-sm">
                    <th className="text-right py-3 px-4">الوقت</th>
                    <th className="text-right py-3 px-4">IP</th>
                    <th className="text-right py-3 px-4">الدولة</th>
                    <th className="text-right py-3 px-4">المدينة</th>
                    <th className="text-right py-3 px-4">الصفحة</th>
                    <th className="text-right py-3 px-4">المصدر</th>
                    <th className="text-right py-3 px-4">الحملة</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentVisits.map((visit) => (
                    <tr key={visit.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                      <td className="py-3 px-4">
                        {new Date(visit.timestamp).toLocaleString('ar-EG', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{visit.ipAddress}</td>
                      <td className="py-3 px-4">{visit.country || '-'}</td>
                      <td className="py-3 px-4">{visit.city || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                          {visit.targetPage}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          visit.isGoogle
                            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {visit.utmSource || (visit.isGoogle ? 'Google' : 'Direct')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">{visit.utmCampaign || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
