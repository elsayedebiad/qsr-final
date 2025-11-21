'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  Search, 
  Filter, 
  Calendar, 
  Download,
  TrendingUp,
  Users,
  Eye,
  RefreshCw,
  BarChart3,
  Globe
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'

interface SearchRecord {
  id: number
  salesPageId: string
  searchTerm: string | null
  nationality: string | null
  position: string | null
  ageFilter: string | null
  experience: string | null
  arabicLevel: string | null
  englishLevel: string | null
  maritalStatus: string | null
  skills: string[]
  religion: string | null
  education: string | null
  ipAddress: string | null
  userAgent: string | null
  sessionId: string | null
  resultsCount: number | null
  timestamp: string
}

interface AnalyticsData {
  analytics: SearchRecord[]
  stats: {
    totalSearches: number
    topSearchTerms: Array<{ term: string; count: number }>
    topNationalities: Array<{ nationality: string; count: number }>
    topPositions: Array<{ position: string; count: number }>
    topSkills: Array<{ skill: string; count: number }>
    searchesByPage: Array<{ salesPageId: string; count: number }>
  }
}

// Dynamic export
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function SearchAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const router = useRouter()

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPage, dateRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams({
        salesPageId: selectedPage,
        startDate: dateRange.start,
        endDate: dateRange.end
      })
      
      const response = await fetch(`/api/analytics/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Analytics data:', result)
        setData(result)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, errorData)
        toast.error(`فشل في تحميل البيانات: ${errorData.details || response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('حدث خطأ أثناء تحميل البيانات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'))
    } finally {
      setIsLoading(false)
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
    'elderCare': 'رعاية كبار السن',
    'sewing': 'خياطة',
    'cooking': 'طبخ',
    'housekeeping': 'تدبير منزلي'
  }

  const exportToCSV = () => {
    if (!data || !data.analytics) return

    const headers = ['التاريخ', 'الوقت', 'صفحة المبيعات', 'كلمة البحث', 'الجنسية', 'الوظيفة', 'العمر', 'الخبرة', 'العربية', 'الإنجليزية', 'الحالة الاجتماعية', 'المهارات', 'الديانة', 'التعليم', 'عدد النتائج']
    const rows = data.analytics.map(item => [
      new Date(item.timestamp).toLocaleDateString('ar-SA'),
      new Date(item.timestamp).toLocaleTimeString('ar-SA'),
      item.salesPageId,
      item.searchTerm || '-',
      nationalityArabicMap[item.nationality || ''] || item.nationality || '-',
      item.position || '-',
      item.ageFilter || '-',
      item.experience || '-',
      item.arabicLevel || '-',
      item.englishLevel || '-',
      item.maritalStatus || '-',
      item.skills.map(s => skillArabicMap[s] || s).join(', ') || '-',
      item.religion || '-',
      item.education || '-',
      item.resultsCount || '-'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `search-analytics-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast.success('تم تصدير البيانات بنجاح')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-lg p-3">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">تحليلات البحث والفلاتر</h1>
              <p className="text-blue-100">تتبع جميع عمليات البحث والفلاتر من الزوار</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Filter className="inline h-4 w-4 ml-1" />
                صفحة المبيعات
              </label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
              >
                <option value="all">جميع الصفحات</option>
                {[...Array(11)].map((_, i) => (
                  <option key={i + 1} value={`sales${i + 1}`}>صفحة {i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="inline h-4 w-4 ml-1" />
                من تاريخ
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="inline h-4 w-4 ml-1" />
                إلى تاريخ
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={fetchAnalytics}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 bg-success hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                تصدير
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!isLoading && data && data.stats.totalSearches === 0 && (
          <div className="bg-card rounded-lg shadow-lg border border-border p-12 text-center">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد بيانات متاحة</h3>
            <p className="text-muted-foreground mb-4">
              لم يتم تسجيل أي عمليات بحث في الفترة المحددة.
              <br />
              جرب تغيير نطاق التاريخ أو اختيار صفحة مبيعات مختلفة.
            </p>
            <button
              onClick={fetchAnalytics}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث البيانات
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {data && data.stats.totalSearches > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">إجمالي عمليات البحث</h3>
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{data?.stats.totalSearches || 0}</p>
          </div>

          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">كلمات البحث</h3>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{data?.stats.topSearchTerms.length || 0}</p>
          </div>

          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">الجنسيات المطلوبة</h3>
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{data?.stats.topNationalities.length || 0}</p>
          </div>

          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">الوظائف المبحوثة</h3>
              <Filter className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{data?.stats.topPositions.length || 0}</p>
          </div>
        </div>
        )}

        {data && data.stats.totalSearches > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Search Terms */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              أكثر كلمات البحث
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data?.stats?.topSearchTerms?.slice(0, 20).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-foreground font-medium">{item.term}</span>
                  <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
              {(!data?.stats?.topSearchTerms || data.stats.topSearchTerms.length === 0) && (
                <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p>
              )}
            </div>
          </div>

          {/* Top Nationalities */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              أكثر الجنسيات بحثاً
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data?.stats?.topNationalities?.slice(0, 20).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-foreground font-medium">
                    {nationalityArabicMap[item.nationality] || item.nationality}
                  </span>
                  <span className="bg-purple-500/10 text-purple-600 px-3 py-1 rounded-full text-sm font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
              {(!data?.stats?.topNationalities || data.stats.topNationalities.length === 0) && (
                <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p>
              )}
            </div>
          </div>

          {/* Top Positions */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-orange-600" />
              أكثر الوظائف بحثاً
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data?.stats?.topPositions?.slice(0, 20).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-foreground font-medium">{item.position}</span>
                  <span className="bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
              {(!data?.stats?.topPositions || data.stats.topPositions.length === 0) && (
                <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p>
              )}
            </div>
          </div>

          {/* Top Skills */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              أكثر المهارات بحثاً
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data?.stats?.topSkills?.slice(0, 20).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-foreground font-medium">
                    {skillArabicMap[item.skill] || item.skill}
                  </span>
                  <span className="bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
              {(!data?.stats?.topSkills || data.stats.topSkills.length === 0) && (
                <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p>
              )}
            </div>
          </div>
        </div>
        )}

        {data && data.stats.totalSearches > 0 && (
        <>
        {/* Searches by Page */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">عمليات البحث حسب الصفحة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data?.stats?.searchesByPage?.map((item, index) => (
              <div key={index} className="bg-background rounded-lg p-4 text-center border border-border">
                <p className="text-sm text-muted-foreground mb-1">{item.salesPageId}</p>
                <p className="text-2xl font-bold text-blue-600">{item.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Search Records */}
        <div className="bg-card rounded-lg shadow-lg border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5 text-info" />
              سجل عمليات البحث التفصيلي ({data?.analytics.length || 0})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">الصفحة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">كلمة البحث</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">الجنسية</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">الوظيفة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">المهارات</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">النتائج</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.analytics.slice(0, 100).map((record) => (
                  <tr key={record.id} className="hover:bg-background">
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {new Date(record.timestamp).toLocaleString('ar-SA')}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                        {record.salesPageId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {record.searchTerm ? (
                        <span className="font-medium">{record.searchTerm}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {record.nationality ? nationalityArabicMap[record.nationality] || record.nationality : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {record.position || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {record.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {record.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-xs">
                              {skillArabicMap[skill] || skill}
                            </span>
                          ))}
                          {record.skills.length > 3 && (
                            <span className="text-muted-foreground text-xs">+{record.skills.length - 3}</span>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-center">
                      <span className="font-bold">{record.resultsCount || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {(!data?.analytics || data.analytics.length === 0) && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">لا توجد عمليات بحث مسجلة</p>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </DashboardLayout>
  )
}
