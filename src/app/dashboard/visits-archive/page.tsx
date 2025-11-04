'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Archive, MapPin, Calendar, MousePointerClick, Filter, X,
  RefreshCw, Trash2, Eye, ChevronLeft, ChevronRight, FileDown, Undo2, CheckSquare, Square
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { formatSalesPageName } from '@/lib/sales-pages-config'

interface ArchivedVisit {
  id: number
  ipAddress: string
  country: string | null
  city: string | null
  targetPage: string
  utmSource: string | null
  utmCampaign: string | null
  isGoogle: boolean
  timestamp: string
  archivedAt: string
}

export default function VisitsArchivePage() {
  const router = useRouter()
  const [visits, setVisits] = useState<ArchivedVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [selectedVisits, setSelectedVisits] = useState<number[]>([])
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [countryFilter, setCountryFilter] = useState<string>('ALL')
  const [pageFilter, setPageFilter] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  
  // Stats
  const [stats, setStats] = useState({
    totalArchived: 0,
    uniqueCountries: 0,
    uniquePages: 0
  })

  const fetchArchivedVisits = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })
      
      if (countryFilter !== 'ALL') params.append('country', countryFilter)
      if (pageFilter !== 'ALL') params.append('targetPage', pageFilter)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      
      const res = await fetch(`/api/visits/archive?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setVisits(data.visits || [])
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching archived visits:', error)
      toast.error('فشل جلب الزيارات المؤرشفة')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchivedVisits()
  }, [page, countryFilter, pageFilter, dateFrom, dateTo])

  // الحصول على قائمة الدول الفريدة
  const uniqueCountries = useMemo(() => {
    const countries = visits.map(v => v.country).filter((c): c is string => c !== null && c !== 'Unknown')
    return Array.from(new Set(countries)).sort()
  }, [visits])
  
  // الحصول على قائمة الصفحات الفريدة
  const uniquePages = useMemo(() => {
    const pages = visits.map(v => v.targetPage)
    return Array.from(new Set(pages)).sort()
  }, [visits])
  
  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setCountryFilter('ALL')
    setPageFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }
  
  // استعادة الزيارات المحددة
  const restoreSelectedVisits = async () => {
    if (selectedVisits.length === 0) {
      toast.error('يرجى تحديد زيارات للاستعادة')
      return
    }
    
    setRestoring(true)
    try {
      const res = await fetch('/api/visits/archive', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitIds: selectedVisits })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success(data.message)
        setSelectedVisits([])
        fetchArchivedVisits()
      } else {
        toast.error(data.error || 'فشل الاستعادة')
      }
    } catch (error) {
      console.error('Restore error:', error)
      toast.error('حدث خطأ أثناء الاستعادة')
    } finally {
      setRestoring(false)
    }
  }
  
  // تبديل اختيار زيارة
  const toggleVisit = (id: number) => {
    setSelectedVisits(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }
  
  // تبديل اختيار الكل
  const toggleAllVisits = () => {
    if (selectedVisits.length === visits.length) {
      setSelectedVisits([])
    } else {
      setSelectedVisits(visits.map(v => v.id))
    }
  }
  
  // حذف جميع الزيارات المؤرشفة نهائياً (Developer only)
  const deleteAllArchived = async () => {
    if (!confirm('⚠️ تحذير: سيتم حذف جميع الزيارات المؤرشفة نهائياً! هل أنت متأكد؟')) {
      return
    }
    
    if (!confirm('هذا الإجراء لا يمكن التراجع عنه! تأكيد نهائي؟')) {
      return
    }
    
    setDeleting(true)
    try {
      const res = await fetch('/api/visits/archive', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchArchivedVisits()
      } else {
        toast.error(data.error || 'فشل الحذف')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('حدث خطأ أثناء الحذف')
    } finally {
      setDeleting(false)
    }
  }
  
  // تصدير البيانات إلى CSV
  const exportToCSV = () => {
    if (visits.length === 0) {
      toast.error('لا توجد بيانات للتصدير')
      return
    }
    
    const headers = ['ID', 'IP', 'الدولة', 'المدينة', 'الصفحة', 'المصدر', 'Google', 'تاريخ الزيارة', 'تاريخ الأرشفة']
    const rows = visits.map(v => [
      v.id,
      v.ipAddress,
      v.country || '-',
      v.city || '-',
      v.targetPage,
      v.utmSource || (v.isGoogle ? 'Google' : 'Direct'),
      v.isGoogle ? 'نعم' : 'لا',
      new Date(v.timestamp).toLocaleString('ar-EG'),
      new Date(v.archivedAt).toLocaleString('ar-EG')
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `archived-visits-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('تم تصدير البيانات!')
  }

  if (loading && visits.length === 0) {
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
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <Archive className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    أرشيف تقارير الزيارات
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    الزيارات المؤرشفة ({total} زيارة)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard/visits-report')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Eye className="h-5 w-5 inline mr-2" />
                  التقارير المباشرة
                </button>
                <button
                  onClick={fetchArchivedVisits}
                  className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Archive className="h-8 w-8" />
                <span className="text-3xl font-bold">{stats.totalArchived}</span>
              </div>
              <h3 className="text-sm opacity-90">إجمالي المؤرشف</h3>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-8 w-8" />
                <span className="text-3xl font-bold">{stats.uniqueCountries}</span>
              </div>
              <h3 className="text-sm opacity-90">عدد الدول</h3>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <MousePointerClick className="h-8 w-8" />
                <span className="text-3xl font-bold">{stats.uniquePages}</span>
              </div>
              <h3 className="text-sm opacity-90">عدد الصفحات</h3>
            </div>
          </div>

          {/* Archived Visits Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Archive className="h-5 w-5 text-purple-500" />
                الزيارات المؤرشفة
                <span className="text-sm font-normal text-gray-500">({visits.length} في الصفحة)</span>
                {selectedVisits.length > 0 && (
                  <span className="text-sm font-normal text-blue-500">
                    ({selectedVisits.length} محدد)
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {selectedVisits.length > 0 && (
                  <button
                    onClick={restoreSelectedVisits}
                    disabled={restoring}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <Undo2 className="h-4 w-4" />
                    استعادة المحدد ({selectedVisits.length})
                  </button>
                )}
                <button
                  onClick={exportToCSV}
                  disabled={visits.length === 0}
                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <FileDown className="h-4 w-4" />
                  تصدير CSV
                </button>
                <button
                  onClick={deleteAllArchived}
                  disabled={deleting || stats.totalArchived === 0}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف الكل
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
                  onChange={(e) => { setCountryFilter(e.target.value); setPage(1) }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                >
                  <option value="ALL">جميع الدول ({stats.totalArchived})</option>
                  {uniqueCountries.map(country => (
                    <option key={country} value={country}>
                      {country}
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
                  onChange={(e) => { setPageFilter(e.target.value); setPage(1) }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                >
                  <option value="ALL">جميع الصفحات ({stats.totalArchived})</option>
                  {uniquePages.map(page => (
                    <option key={page} value={page}>
                      {formatSalesPageName(page)}
                    </option>
                  ))}
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
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
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
                  onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
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
                        {selectedVisits.length === visits.length && visits.length > 0 ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4">الوقت</th>
                    <th className="text-right py-3 px-4">IP</th>
                    <th className="text-right py-3 px-4">الدولة</th>
                    <th className="text-right py-3 px-4">المدينة</th>
                    <th className="text-right py-3 px-4">الصفحة</th>
                    <th className="text-right py-3 px-4">المصدر</th>
                    <th className="text-right py-3 px-4">تاريخ الأرشفة</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        <Filter className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>لا توجد زيارات مؤرشفة</p>
                      </td>
                    </tr>
                  ) : (
                    visits.map((visit) => (
                      <tr key={visit.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
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
                        <td className="py-3 px-4">
                          {new Date(visit.timestamp).toLocaleString('ar-EG', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
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
                          <span className={`px-2 py-1 rounded text-xs ${
                            visit.isGoogle
                              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {visit.utmSource || (visit.isGoogle ? 'Google' : 'Direct')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-purple-600 dark:text-purple-400">
                          {new Date(visit.archivedAt).toLocaleString('ar-EG', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t dark:border-gray-700 pt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  صفحة {page} من {totalPages} ({total} زيارة)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
