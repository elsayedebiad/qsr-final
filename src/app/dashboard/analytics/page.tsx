'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Filter, Users, Calendar } from 'lucide-react'

interface AnalyticsData {
  analytics: any[]
  stats: {
    totalSearches: number
    topSearchTerms: Array<{ term: string; count: number }>
    topNationalities: Array<{ nationality: string; count: number }>
    topPositions: Array<{ position: string; count: number }>
    topSkills: Array<{ skill: string; count: number }>
    searchesByPage: Array<{ salesPageId: string; count: number }>
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPage, dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        salesPageId: selectedPage,
        startDate: dateRange.start,
        endDate: dateRange.end
      })
      
      const response = await fetch(`/api/analytics/search?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const nationalityArabicMap: { [key: string]: string } = {
    'FILIPINO': 'فلبينية',
    'INDONESIAN': 'إندونيسية',
    'BANGLADESHI': 'بنجلاديشية',
    'INDIAN': 'هندية',
    'SRI_LANKAN': 'سيريلانكية',
    'NEPALESE': 'نيبالية',
    'ETHIOPIAN': 'إثيوبية',
    'KENYAN': 'كينية',
    'UGANDAN': 'أوغندية'
  }

  const skillArabicMap: { [key: string]: string } = {
    'babySitting': 'رعاية الأطفال',
    'childrenCare': 'العناية بالأطفال',
    'cleaning': 'تنظيف',
    'arabicCooking': 'طبخ عربي',
    'driving': 'قيادة',
    'washing': 'غسيل',
    'ironing': 'كوي',
    'tutoring': 'تدريس',
    'disabledCare': 'رعاية كبار السن',
    'sewing': 'خياطة'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 تحليلات البحث</h1>
          <p className="text-gray-600">تتبع عمليات البحث والفلاتر في صفحات المبيعات</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 ml-1" />
                صفحة المبيعات
              </label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الصفحات</option>
                {[...Array(11)].map((_, i) => (
                  <option key={i + 1} value={`sales${i + 1}`}>صفحة {i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 ml-1" />
                من تاريخ
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 ml-1" />
                إلى تاريخ
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">إجمالي عمليات البحث</h3>
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.stats.totalSearches || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">كلمات البحث المختلفة</h3>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.stats.topSearchTerms.length || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">الجنسيات المطلوبة</h3>
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.stats.topNationalities.length || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">الوظائف المبحوثة</h3>
              <Filter className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.stats.topPositions.length || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Search Terms */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              أكثر كلمات البحث
            </h2>
            <div className="space-y-3">
              {data?.stats?.topSearchTerms?.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{item.term}</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
              {(!data?.stats?.topSearchTerms || data.stats.topSearchTerms.length === 0) && (
                <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
              )}
            </div>
          </div>

          {/* Top Nationalities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              أكثر الجنسيات بحثاً
            </h2>
            <div className="space-y-3">
              {data?.stats?.topNationalities?.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">
                    {nationalityArabicMap[item.nationality] || item.nationality}
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
              {(!data?.stats?.topNationalities || data.stats.topNationalities.length === 0) && (
                <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
              )}
            </div>
          </div>

          {/* Top Positions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-orange-600" />
              أكثر الوظائف بحثاً
            </h2>
            <div className="space-y-3">
              {data?.stats?.topPositions?.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{item.position}</span>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
              {data?.stats.topPositions.length === 0 && (
                <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
              )}
            </div>
          </div>

          {/* Top Skills */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              أكثر المهارات بحثاً
            </h2>
            <div className="space-y-3">
              {data?.stats.topSkills.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">
                    {skillArabicMap[item.skill] || item.skill}
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
              {(!data?.stats?.topSkills || data.stats.topSkills.length === 0) && (
                <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
              )}
            </div>
          </div>
        </div>

        {/* Searches by Page */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">عمليات البحث حسب الصفحة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data?.stats?.searchesByPage?.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">{item.salesPageId}</p>
                <p className="text-2xl font-bold text-blue-600">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
