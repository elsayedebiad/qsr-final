'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Eye, Globe, MousePointerClick, TrendingUp, MapPin, 
  Calendar, Link as LinkIcon, RefreshCw, Users, BarChart3,
  Filter, X, Archive, CheckSquare, Square, ChevronLeft, ChevronRight,
  FileSpreadsheet
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

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
  gclid: string | null
  fbclid: string | null
  device: string | null
  browser: string | null
  os: string | null
  language: string | null
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
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
  pagination: Pagination
}

export default function VisitsReportPage() {
  const router = useRouter()
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedVisits, setSelectedVisits] = useState<number[]>([])
  const [archiving, setArchiving] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveProgress, setArchiveProgress] = useState(0)
  const [archiveStatus, setArchiveStatus] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  
  // Filters
  const [countryFilter, setCountryFilter] = useState<string>('ALL')
  const [pageFilter, setPageFilter] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  
  // Export state
  const [exporting, setExporting] = useState(false)

  const fetchStats = useCallback(async (page: number, resetToFirstPage = false) => {
    try {
      // إذا كان resetToFirstPage = true، نرجع للصفحة الأولى
      const targetPage = resetToFirstPage ? 1 : page
      const res = await fetch(`/api/visits/stats?page=${targetPage}&limit=${itemsPerPage}`)
      const data = await res.json()
      if (data.success) {
        // تأكيد الترتيب من API (الأحدث أولاً)
        if (data.recentVisits && data.recentVisits.length > 0) {
          console.log('أول زيارة (يجب أن تكون الأحدث):', {
            id: data.recentVisits[0].id,
            timestamp: data.recentVisits[0].timestamp,
            page: data.recentVisits[0].targetPage
          })
          console.log('آخر زيارة (يجب أن تكون الأقدم):', {
            id: data.recentVisits[data.recentVisits.length - 1].id,
            timestamp: data.recentVisits[data.recentVisits.length - 1].timestamp,
            page: data.recentVisits[data.recentVisits.length - 1].targetPage
          })
        }
        
        setStats(data)
        // فقط حدث currentPage إذا كانت مختلفة لتجنب re-render غير ضروري
        setCurrentPage(prev => prev !== targetPage ? targetPage : prev)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }, [itemsPerPage])

  // تطبيق الفلاتر على الزيارات (البيانات تأتي مرتبة من API)
  const filteredVisits = useMemo(() => {
    if (!stats) return []
    
    // الفلترة فقط، الترتيب يأتي من API
    const filtered = stats.recentVisits.filter(visit => {
      // فلتر الدولة (مع تنظيف للتأكد من التطابق)
      if (countryFilter !== 'ALL') {
        const visitCountry = (visit.country || 'Unknown').trim()
        if (visitCountry !== countryFilter) {
          return false
        }
      }
      
      // فلتر الصفحة (مع تنظيف شامل للتأكد من التطابق)
      if (pageFilter !== 'ALL') {
        const visitPage = visit.targetPage.trim().toLowerCase().replace(/^\/+/, '')
        if (visitPage !== pageFilter) {
          return false
        }
      }
      
      // فلتر التاريخ
      const visitDate = new Date(visit.timestamp)
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        if (visitDate < fromDate) return false
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (visitDate > toDate) return false
      }
      
      return true
    })
    
    // ترتيب تنازلي صريح (الأحدث أولاً - timestamp الأكبر أولاً)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      
      // ترتيب تنازلي: الأكبر (الأحدث) أولاً
      // timeB - timeA: إذا كان موجب يعني b أحدث فيأتي قبل a
      const timeDiff = timeB - timeA
      if (timeDiff !== 0) return timeDiff
      
      // إذا كان الوقت متساوي، نرتب حسب ID (الأكبر = الأحدث)
      return b.id - a.id
    })
  }, [stats, countryFilter, pageFilter, dateFrom, dateTo])
  
  // الحصول على قائمة الدول الفريدة من الإحصائيات الكلية
  const uniqueCountries = useMemo(() => {
    if (!stats) return []
    // استخدام Set لضمان عدم التكرار
    const countriesSet = new Set<string>()
    
    // جمع جميع أسماء الدول من countryStats
    Object.keys(stats.countryStats).forEach(country => {
      const cleanCountry = country.trim()
      if (cleanCountry && cleanCountry !== 'Unknown') {
        countriesSet.add(cleanCountry)
      }
    })
    
    // تحويل Set إلى مصفوفة مرتبة
    return Array.from(countriesSet).sort()
  }, [stats])
  
  // الحصول على قائمة الصفحات الفريدة من الإحصائيات الكلية
  const uniquePages = useMemo(() => {
    if (!stats) return []
    // استخدام Set لضمان عدم التكرار
    const pagesSet = new Set<string>()
    
    // جمع جميع أسماء الصفحات من pageStats
    Object.keys(stats.pageStats).forEach(page => {
      // تنظيف شامل: إزالة / من البداية، المسافات، وتحويل لأحرف صغيرة
      const cleanPage = page.trim().toLowerCase().replace(/^\/+/, '')
      if (cleanPage) {
        pagesSet.add(cleanPage)
      }
    })
    
    // تحويل Set إلى مصفوفة مرتبة
    return Array.from(pagesSet).sort()
  }, [stats])
  
  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setCountryFilter('ALL')
    setPageFilter('ALL')
    setDateFrom('')
    setDateTo('')
  }
  
  // تحديد/إلغاء تحديد زيارة
  const toggleVisit = (visitId: number) => {
    setSelectedVisits(prev => 
      prev.includes(visitId) 
        ? prev.filter(id => id !== visitId)
        : [...prev, visitId]
    )
  }
  
  // تحديد/إلغاء تحديد جميع الزيارات المفلترة
  const toggleAllVisits = () => {
    if (selectedVisits.length === filteredVisits.length) {
      setSelectedVisits([])
    } else {
      setSelectedVisits(filteredVisits.map(v => v.id))
    }
  }
  
  // أرشفة الزيارات المحددة
  const archiveSelected = async () => {
    if (selectedVisits.length === 0) {
      toast.error('يرجى تحديد زيارات للأرشفة')
      return
    }
    
    // فتح المودال
    setShowArchiveModal(true)
    setArchiving(true)
    setArchiveProgress(0)
    setArchiveStatus('جاري تجهيز الأرشفة...')
    
    try {
      // محاكاة progress
      const progressInterval = setInterval(() => {
        setArchiveProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      
      setArchiveStatus(`جاري أرشفة ${selectedVisits.length} زيارة...`)
      
      const res = await fetch('/api/visits/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitIds: selectedVisits })
      })
      
      const data = await res.json()
      
      clearInterval(progressInterval)
      setArchiveProgress(100)
      
      if (data.success) {
        setArchiveStatus('✅ تم الأرشفة بنجاح!')
        setTimeout(() => {
          setShowArchiveModal(false)
          setSelectedVisits([])
          fetchStats(currentPage)
          toast.success(data.message)
        }, 1500)
      } else {
        setArchiveStatus('❌ فشل الأرشفة')
        toast.error(data.error || 'فشل الأرشفة')
        setTimeout(() => setShowArchiveModal(false), 2000)
      }
    } catch (error) {
      console.error('Archive error:', error)
      setArchiveStatus('❌ حدث خطأ أثناء الأرشفة')
      toast.error('حدث خطأ أثناء الأرشفة')
      setTimeout(() => setShowArchiveModal(false), 2000)
    } finally {
      setArchiving(false)
    }
  }
  
  // تصدير الزيارات إلى Excel
  const exportToExcel = async () => {
    if (filteredVisits.length === 0) {
      toast.error('لا توجد زيارات للتصدير')
      return
    }
    
    setExporting(true)
    toast.loading('جاري تصدير الزيارات...', { id: 'export-visits' })
    
    try {
      // بناء query parameters للفلاتر
      const params = new URLSearchParams()
      if (countryFilter !== 'ALL') params.append('country', countryFilter)
      if (pageFilter !== 'ALL') params.append('targetPage', pageFilter)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      params.append('limit', '5000') // حد أقصى للتصدير
      
      const res = await fetch(`/api/visits/export-excel?${params.toString()}`)
      
      if (!res.ok) {
        throw new Error('فشل التصدير')
      }
      
      // تحميل الملف
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `visits-report-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('✅ تم تصدير الزيارات بنجاح!', { id: 'export-visits' })
    } catch (error) {
      console.error('Export error:', error)
      toast.error('❌ فشل تصدير الزيارات', { id: 'export-visits' })
    } finally {
      setExporting(false)
    }
  }
  
  // أرشفة جميع الزيارات المفلترة
  const archiveFiltered = async () => {
    if (filteredVisits.length === 0) {
      toast.error('لا توجد زيارات للأرشفة')
      return
    }
    
    // فتح المودال
    setShowArchiveModal(true)
    setArchiving(true)
    setArchiveProgress(0)
    setArchiveStatus('جاري تجهيز الأرشفة...')
    
    try {
      // محاكاة progress
      const progressInterval = setInterval(() => {
        setArchiveProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      
      setArchiveStatus(`جاري أرشفة ${filteredVisits.length} زيارة...`)
      
      const res = await fetch('/api/visits/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          archiveAll: true,
          filters: {
            country: countryFilter !== 'ALL' ? countryFilter : undefined,
            targetPage: pageFilter !== 'ALL' ? pageFilter : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined
          }
        })
      })
      
      const data = await res.json()
      
      clearInterval(progressInterval)
      setArchiveProgress(100)
      
      if (data.success) {
        setArchiveStatus('✅ تم الأرشفة بنجاح!')
        setTimeout(() => {
          setShowArchiveModal(false)
          setSelectedVisits([])
          fetchStats(currentPage)
          toast.success(data.message)
        }, 1500)
      } else {
        setArchiveStatus('❌ فشل الأرشفة')
        toast.error(data.error || 'فشل الأرشفة')
        setTimeout(() => setShowArchiveModal(false), 2000)
      }
    } catch (error) {
      console.error('Archive error:', error)
      setArchiveStatus('❌ حدث خطأ أثناء الأرشفة')
      toast.error('حدث خطأ أثناء الأرشفة')
      setTimeout(() => setShowArchiveModal(false), 2000)
    } finally {
      setArchiving(false)
    }
  }
  
  useEffect(() => {
    fetchStats(currentPage)
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        // في التحديث التلقائي، نبقى في نفس الصفحة لكن نتحقق من الزيارات الجديدة
        fetchStats(currentPage, false)
      }, 5000) // تحديث كل 5 ثواني
      return () => clearInterval(interval)
    }
  }, [autoRefresh, currentPage, itemsPerPage, fetchStats])

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
        <>
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
                  onClick={() => fetchStats(1, true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                  title="تحديث وعرض أحدث الزيارات"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span className="text-sm font-medium">أحدث الزيارات</span>
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
                {(() => {
                  // دمج الصفحات المكررة (حالة مختلفة و / في البداية)
                  const mergedPages = new Map<string, number>()
                  
                  Object.entries(stats.pageStats).forEach(([page, count]) => {
                    // تنظيف شامل: إزالة / من البداية، المسافات، وتحويل لأحرف صغيرة
                    const normalizedPage = page.trim().toLowerCase().replace(/^\/+/, '')
                    const currentCount = mergedPages.get(normalizedPage) || 0
                    mergedPages.set(normalizedPage, currentCount + count)
                  })
                  
                  // تحويل إلى مصفوفة وترتيب
                  return Array.from(mergedPages.entries())
                    .sort(([, a], [, b]) => b - a)
                    .map(([page, count]) => (
                      <div key={page} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="font-medium">{page}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{count}</span>
                      </div>
                    ))
                })()}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                آخر الزيارات (Live)
                <span className="text-sm font-normal text-gray-500">({filteredVisits.length} زيارة)</span>
                {selectedVisits.length > 0 && (
                  <span className="text-sm font-normal text-blue-500">
                    ({selectedVisits.length} محدد)
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToExcel}
                  disabled={exporting || filteredVisits.length === 0}
                  className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 text-sm flex items-center gap-1 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                  title="تصدير إلى Excel مع إحصائيات مفصلة"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      جاري التصدير...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      تصدير Excel
                    </>
                  )}
                </button>
                {selectedVisits.length > 0 && (
                  <button
                    onClick={archiveSelected}
                    disabled={archiving}
                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <Archive className="h-4 w-4" />
                    أرشفة المحدد ({selectedVisits.length})
                  </button>
                )}
                <button
                  onClick={archiveFiltered}
                  disabled={archiving || filteredVisits.length === 0}
                  className="px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <Archive className="h-4 w-4" />
                  أرشفة الكل ({filteredVisits.length})
                </button>
                <button
                  onClick={() => router.push('/dashboard/visits-archive')}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center gap-1"
                >
                  <Archive className="h-4 w-4" />
                  الأرشيف
                </button>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  إعادة تعيين
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-green-500" />
                  الدولة
                </label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                >
                  <option value="ALL">جميع الدول ({stats?.summary.totalVisits || 0})</option>
                  {uniqueCountries.map(country => (
                    <option key={country} value={country}>
                      {country} ({stats?.countryStats[country] || 0})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <MousePointerClick className="h-4 w-4 text-blue-500" />
                  الصفحة
                </label>
                <select
                  value={pageFilter}
                  onChange={(e) => setPageFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                >
                  <option value="ALL">جميع الصفحات ({stats?.summary.totalVisits || 0})</option>
                  {uniquePages.map(page => {
                    // جمع العدد من جميع النسخ المختلفة من نفس الصفحة (مع تنظيف شامل)
                    const count = Object.entries(stats?.pageStats || {})
                      .filter(([key]) => key.trim().toLowerCase().replace(/^\/+/, '') === page)
                      .reduce((sum, [, value]) => sum + value, 0)
                    
                    return (
                      <option key={page} value={page}>
                        {page} ({count})
                      </option>
                    )
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-sm">
                    <th className="text-center py-3 px-2 w-12">
                      <button onClick={toggleAllVisits} className="hover:text-blue-500">
                        {selectedVisits.length === filteredVisits.length && filteredVisits.length > 0 ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4">التاريخ والوقت</th>
                    <th className="text-right py-3 px-4">IP</th>
                    <th className="text-right py-3 px-4">الدولة</th>
                    <th className="text-right py-3 px-4">المدينة</th>
                    <th className="text-right py-3 px-4">الصفحة</th>
                    <th className="text-right py-3 px-4">الجهاز</th>
                    <th className="text-right py-3 px-4">المصدر</th>
                    <th className="text-right py-3 px-4">الحملة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        <Filter className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>لا توجد زيارات تطابق الفلاتر المحددة</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((visit, index) => (
                    <tr key={visit.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm ${
                      index === 0 ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500' : ''
                    }`}>
                      <td className="py-3 px-2 text-center">
                        <button 
                          onClick={() => toggleVisit(visit.id)}
                          className="hover:text-blue-500"
                        >
                          {selectedVisits.includes(visit.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm">
                              {new Date(visit.timestamp).toLocaleDateString('ar-EG', { 
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(visit.timestamp).toLocaleTimeString('ar-EG', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </div>
                          {index === 0 && currentPage === 1 && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-bold animate-pulse">
                              أحدث
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs break-all min-w-[120px]">{visit.ipAddress}</td>
                      <td className="py-3 px-4">{visit.country || '-'}</td>
                      <td className="py-3 px-4">{visit.city || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                          {visit.targetPage}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium">
                            {visit.device === 'mobile' && '📱 Mobile'}
                            {visit.device === 'tablet' && '📱 Tablet'}
                            {visit.device === 'desktop' && '💻 Desktop'}
                            {!visit.device && '-'}
                          </span>
                          {visit.browser && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {visit.browser} • {visit.os}
                            </span>
                          )}
                        </div>
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
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          {visit.gclid && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                              🎯 Google Ads
                            </span>
                          )}
                          {visit.fbclid && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                              📘 Facebook Ads
                            </span>
                          )}
                          {visit.utmCampaign && !visit.gclid && !visit.fbclid && (
                            <span className="text-xs truncate max-w-[150px]" title={visit.utmCampaign}>
                              {visit.utmCampaign}
                            </span>
                          )}
                          {!visit.utmCampaign && !visit.gclid && !visit.fbclid && '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {stats && stats.pagination && stats.pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t dark:border-gray-700 pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, stats.pagination.totalItems)} من {stats.pagination.totalItems} زيارة
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    <option value="25">25 / صفحة</option>
                    <option value="50">50 / صفحة</option>
                    <option value="100">100 / صفحة</option>
                    <option value="200">200 / صفحة</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* زر السابق */}
                  <button
                    onClick={() => fetchStats(currentPage - 1)}
                    disabled={!stats.pagination.hasPreviousPage}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </button>
                  
                  {/* أرقام الصفحات */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, stats.pagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (stats.pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= stats.pagination.totalPages - 2) {
                        pageNum = stats.pagination.totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchStats(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white shadow-lg'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    {stats.pagination.totalPages > 5 && currentPage < stats.pagination.totalPages - 2 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => fetchStats(stats.pagination.totalPages)}
                          className="w-10 h-10 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {stats.pagination.totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* زر التالي */}
                  <button
                    onClick={() => fetchStats(currentPage + 1)}
                    disabled={!stats.pagination.hasNextPage}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Archive Modal */}
        {showArchiveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Archive className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  جاري الأرشفة
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {archiveStatus}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>التقدم</span>
                  <span className="font-bold">{archiveProgress}%</span>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${archiveProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Status Icon */}
              <div className="text-center">
                {archiveProgress < 100 ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">جاري المعالجة...</span>
                  </div>
                ) : archiveStatus.includes('✅') ? (
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <CheckSquare className="h-5 w-5" />
                    <span className="text-sm font-medium">تم بنجاح!</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                    <X className="h-5 w-5" />
                    <span className="text-sm font-medium">فشلت العملية</span>
                  </div>
                )}
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 rounded-t-2xl"></div>
            </div>
          </div>
        )}
        </>
      )}
    </DashboardLayout>
  )
}
