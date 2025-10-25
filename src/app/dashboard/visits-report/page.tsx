'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { 
  Eye, Globe, MousePointerClick, TrendingUp, MapPin, 
  Calendar, Link as LinkIcon, RefreshCw, Users, BarChart3,
  Filter, X, Archive, CheckSquare, Square, ChevronLeft, ChevronRight,
  FileSpreadsheet, Trash2, AlertTriangle
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
  filterOptions?: {
    countries: string[]
    pages: string[]
    campaigns: string[]
  }
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
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [deleteStatus, setDeleteStatus] = useState('')
  const [deleteType, setDeleteType] = useState<'selected' | 'filtered' | 'single'>('selected')
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmType, setDeleteConfirmType] = useState<'selected' | 'filtered' | 'single'>('selected')
  const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)
  const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  
  // Filters
  const [countryFilter, setCountryFilter] = useState<string>('ALL')
  const [pageFilter, setPageFilter] = useState<string>('ALL')
  const [campaignFilter, setCampaignFilter] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  
  // Export state
  const [exporting, setExporting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Jump to page state
  const [jumpToPage, setJumpToPage] = useState('')

  // استخدام useRef لتخزين current values دون إعادة render
  const currentPageRef = useRef(currentPage)
  const itemsPerPageRef = useRef(itemsPerPage)
  
  // تحديث الـ refs عند تغيير القيم
  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])
  
  useEffect(() => {
    itemsPerPageRef.current = itemsPerPage
  }, [itemsPerPage])
  
  const fetchStatsInProgress = useRef(false)
  
  const fetchStats = useCallback(async (page: number, resetToFirstPage = false) => {
    // منع استدعاءات متعددة متزامنة
    if (fetchStatsInProgress.current) {
      return
    }
    
    fetchStatsInProgress.current = true
    
    try {
      // إذا كان resetToFirstPage = true، نرجع للصفحة الأولى
      const targetPage = resetToFirstPage ? 1 : page
      
      // بناء query string مع الفلاتر
      const params = new URLSearchParams()
      params.append('page', targetPage.toString())
      params.append('limit', itemsPerPageRef.current.toString())
      
      // إضافة الفلاتر إلى API
      if (countryFilter !== 'ALL') params.append('country', countryFilter)
      if (pageFilter !== 'ALL') params.append('targetPage', pageFilter)
      if (campaignFilter !== 'ALL') params.append('campaign', campaignFilter)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      
      const res = await fetch(`/api/visits/stats?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setStats(data)
        // فقط حدث currentPage إذا كانت مختلفة لتجنب re-render غير ضروري
        if (targetPage !== currentPageRef.current) {
          setCurrentPage(targetPage)
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
      setIsNavigating(false)
      fetchStatsInProgress.current = false
    }
  }, [countryFilter, pageFilter, campaignFilter, dateFrom, dateTo])

  // البيانات تأتي مفلترة من API
  const filteredVisits = useMemo(() => {
    if (!stats) return []
    // البيانات مفلترة ومرتبة من السيرفر
    return stats.recentVisits
  }, [stats])
  
  // الحصول على قوائم الفلاتر من جميع البيانات (بدون فلتر)
  const uniqueCountries = useMemo(() => {
    if (!stats || !stats.filterOptions) return []
    return stats.filterOptions.countries || []
  }, [stats])
  
  const uniquePages = useMemo(() => {
    if (!stats || !stats.filterOptions) return []
    return stats.filterOptions.pages || []
  }, [stats])
  
  const uniqueCampaigns = useMemo(() => {
    if (!stats || !stats.filterOptions) return []
    return stats.filterOptions.campaigns || []
  }, [stats])
  
  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setCountryFilter('ALL')
    setPageFilter('ALL')
    setCampaignFilter('ALL')
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
  
  // عرض popup التأكيد للحذف المحدد
  const showDeleteConfirmation = (type: 'selected' | 'filtered' | 'single', count: number, singleId?: number) => {
    setDeleteConfirmType(type)
    setDeleteConfirmCount(count)
    if (singleId) {
      setSingleDeleteId(singleId)
    }
    setShowDeleteConfirm(true)
  }

  // تنفيذ الحذف بعد التأكيد
  const executeDelete = async () => {
    setShowDeleteConfirm(false)
    
    if (deleteConfirmType === 'single' && singleDeleteId) {
      setSelectedVisits([singleDeleteId])
      performDeleteSelected([singleDeleteId])
    } else if (deleteConfirmType === 'selected') {
      performDeleteSelected(selectedVisits)
    } else if (deleteConfirmType === 'filtered') {
      performDeleteFiltered()
    }
  }

  // إلغاء الحذف
  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setSingleDeleteId(null)
    setDeleteConfirmCount(0)
  }

  // حذف الزيارات المحددة نهائياً
  const deleteSelected = () => {
    if (selectedVisits.length === 0) {
      toast.error('يرجى تحديد زيارات للحذف')
      return
    }
    showDeleteConfirmation('selected', selectedVisits.length)
  }

  // الدالة الفعلية لتنفيذ الحذف المحدد
  const performDeleteSelected = async (visitsToDelete: number[]) => {
    setDeleteType('selected')
    setShowDeleteModal(true)
    setDeleting(true)
    setDeleteProgress(0)
    setDeleteStatus('جاري تجهيز الحذف...')
    
    try {
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      
      setDeleteStatus(`جاري حذف ${visitsToDelete.length} زيارة نهائياً...`)
      
      const res = await fetch('/api/visits/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitIds: visitsToDelete })
      })
      
      const data = await res.json()
      
      clearInterval(progressInterval)
      setDeleteProgress(100)
      
      if (data.success) {
        setDeleteStatus('✅ تم الحذف بنجاح!')
        setTimeout(() => {
          setShowDeleteModal(false)
          setSelectedVisits([])
          fetchStats(currentPage)
          toast.success(data.message)
        }, 1500)
      } else {
        setDeleteStatus('❌ فشل الحذف')
        toast.error(data.error || 'فشل الحذف')
        setTimeout(() => setShowDeleteModal(false), 2000)
      }
    } catch (error) {
      console.error('Delete error:', error)
      setDeleteStatus('❌ حدث خطأ أثناء الحذف')
      toast.error('حدث خطأ أثناء الحذف')
      setTimeout(() => setShowDeleteModal(false), 2000)
    } finally {
      setDeleting(false)
    }
  }
  
  // حذف جميع الزيارات المفلترة نهائياً
  const deleteFiltered = () => {
    if (filteredVisits.length === 0) {
      toast.error('لا توجد زيارات للحذف')
      return
    }
    showDeleteConfirmation('filtered', filteredVisits.length)
  }

  // الدالة الفعلية لتنفيذ الحذف المفلتر
  const performDeleteFiltered = async () => {
    setDeleteType('filtered')
    setShowDeleteModal(true)
    setDeleting(true)
    setDeleteProgress(0)
    setDeleteStatus('جاري تجهيز الحذف...')
    
    try {
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      
      setDeleteStatus(`جاري حذف ${filteredVisits.length} زيارة نهائياً...`)
      
      const res = await fetch('/api/visits/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deleteAll: true,
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
      setDeleteProgress(100)
      
      if (data.success) {
        setDeleteStatus('✅ تم الحذف بنجاح!')
        setTimeout(() => {
          setShowDeleteModal(false)
          setSelectedVisits([])
          fetchStats(currentPage)
          toast.success(data.message)
        }, 1500)
      } else {
        setDeleteStatus('❌ فشل الحذف')
        toast.error(data.error || 'فشل الحذف')
        setTimeout(() => setShowDeleteModal(false), 2000)
      }
    } catch (error) {
      console.error('Delete error:', error)
      setDeleteStatus('❌ حدث خطأ أثناء الحذف')
      toast.error('حدث خطأ أثناء الحذف')
      setTimeout(() => setShowDeleteModal(false), 2000)
    } finally {
      setDeleting(false)
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
  
  // Ref لتخزين fetchStats لتجنب re-renders
  const fetchStatsRef = useRef(fetchStats)
  
  useEffect(() => {
    fetchStatsRef.current = fetchStats
  }, [fetchStats])
  
  // Initial load and when filters change - نرجع للصفحة الأولى
  useEffect(() => {
    setCurrentPage(1)
  }, [countryFilter, pageFilter, campaignFilter, dateFrom, dateTo, itemsPerPage])
  
  // Load data when page changes
  useEffect(() => {
    setIsNavigating(true)
    fetchStatsRef.current(currentPage)
  }, [currentPage])
  
  // Auto refresh effect - منفصل لتجنب التداخل
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // في التحديث التلقائي، نبقى في نفس الصفحة لكن نتحقق من الزيارات الجديدة
        // لا نستخدم isNavigating في التحديث التلقائي
        const params = new URLSearchParams()
        params.append('page', currentPageRef.current.toString())
        params.append('limit', itemsPerPageRef.current.toString())
        
        if (countryFilter !== 'ALL') params.append('country', countryFilter)
        if (pageFilter !== 'ALL') params.append('targetPage', pageFilter)
        if (campaignFilter !== 'ALL') params.append('campaign', campaignFilter)
        if (dateFrom) params.append('dateFrom', dateFrom)
        if (dateTo) params.append('dateTo', dateTo)
        
        fetch(`/api/visits/stats?${params.toString()}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setStats(data)
            }
          })
          .catch(err => console.error('Auto refresh error:', err))
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, countryFilter, pageFilter, campaignFilter, dateFrom, dateTo])
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return // Don't handle if user is typing in an input
      }
      
      if (!stats || !stats.pagination) return
      
      if (e.key === 'ArrowRight' && stats.pagination.hasPreviousPage && !isNavigating) {
        e.preventDefault()
        setIsNavigating(true)
        setCurrentPage(prev => prev - 1)
      } else if (e.key === 'ArrowLeft' && stats.pagination.hasNextPage && !isNavigating) {
        e.preventDefault()
        setIsNavigating(true)
        setCurrentPage(prev => prev + 1)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [stats, isNavigating])
  
  // Handle jump to page
  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage)
    if (!isNaN(pageNum) && stats && stats.pagination) {
      if (pageNum >= 1 && pageNum <= stats.pagination.totalPages) {
        if (!isNavigating) {
          setIsNavigating(true)
          setCurrentPage(pageNum)
          setJumpToPage('')
        }
      } else {
        toast.error(`الرجاء إدخال رقم صفحة بين 1 و ${stats.pagination.totalPages}`)
      }
    }
  }

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
                  onClick={() => {
                    if (!isNavigating) {
                      setIsNavigating(true)
                      setCurrentPage(1)
                    }
                  }}
                  disabled={isNavigating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="تحديث وعرض أحدث الزيارات"
                >
                  <RefreshCw className={`h-5 w-5 ${isNavigating ? 'animate-spin' : ''}`} />
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
                      <div key={page} className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span 
                          className="font-medium text-sm break-all overflow-hidden" 
                          style={{ 
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word',
                            maxWidth: 'calc(100% - 50px)',
                            lineHeight: '1.3'
                          }}
                          title={page}
                        >
                          {page.length > 40 ? page.substring(0, 40) + '...' : page}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0 text-sm">{count}</span>
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
                    <div key={country} className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span 
                        className="font-medium text-sm break-all overflow-hidden" 
                        style={{ 
                          wordBreak: 'break-all',
                          overflowWrap: 'break-word',
                          maxWidth: 'calc(100% - 50px)',
                          lineHeight: '1.3'
                        }}
                        title={country}
                      >
                        {country.length > 30 ? country.substring(0, 30) + '...' : country}
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 text-sm">{count}</span>
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
                    <div key={source} className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span 
                        className="font-medium capitalize text-sm break-all overflow-hidden" 
                        style={{ 
                          wordBreak: 'break-all',
                          overflowWrap: 'break-word',
                          maxWidth: 'calc(100% - 50px)',
                          lineHeight: '1.3'
                        }}
                        title={source}
                      >
                        {source.length > 30 ? source.substring(0, 30) + '...' : source}
                      </span>
                      <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0 text-sm">{count}</span>
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
                    <div key={campaign} className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span 
                        className="font-medium text-sm break-all overflow-hidden" 
                        style={{ 
                          wordBreak: 'break-all',
                          overflowWrap: 'break-word',
                          maxWidth: 'calc(100% - 50px)',
                          lineHeight: '1.3'
                        }}
                        title={campaign}
                      >
                        {campaign.length > 50 ? campaign.substring(0, 50) + '...' : campaign}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400 font-bold flex-shrink-0 text-sm">{count}</span>
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
              <div className="flex items-center gap-2 flex-wrap">
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
                
                {/* أزرار الأرشفة */}
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
                
                {/* أزرار الحذف النهائي */}
                {selectedVisits.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                    title="حذف نهائي - لا يمكن التراجع"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف المحدد ({selectedVisits.length})
                  </button>
                )}
                <button
                  onClick={deleteFiltered}
                  disabled={deleting || filteredVisits.length === 0}
                  className="px-3 py-1.5 bg-red-700 text-white rounded-lg hover:bg-red-800 text-sm flex items-center gap-1 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                  title="حذف نهائي - لا يمكن التراجع"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف الكل ({filteredVisits.length})
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
            
            {/* Filters - محسّن */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-6 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              {/* فلتر الدولة */}
              <div className="group">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  الدولة
                </label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium hover:border-green-400 dark:hover:border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <option value="ALL" className="font-bold bg-gray-50 dark:bg-gray-800">🌍 جميع الدول ({stats?.summary.totalVisits || 0})</option>
                  {uniqueCountries.map(country => (
                    <option key={country} value={country} className="py-2 hover:bg-blue-50">
                      📍 {country} ({stats?.countryStats[country] || 0})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* فلتر الصفحة */}
              <div className="group">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <MousePointerClick className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  الصفحة
                </label>
                <select
                  value={pageFilter}
                  onChange={(e) => setPageFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <option value="ALL" className="font-bold bg-gray-50 dark:bg-gray-800">📄 جميع الصفحات ({stats?.summary.totalVisits || 0})</option>
                  {uniquePages.map(page => {
                    // جمع العدد من جميع النسخ المختلفة من نفس الصفحة (مع تنظيف شامل)
                    const count = Object.entries(stats?.pageStats || {})
                      .filter(([key]) => key.trim().toLowerCase().replace(/^\/+/, '') === page)
                      .reduce((sum, [, value]) => sum + value, 0)
                    
                    return (
                      <option key={page} value={page} className="py-2 hover:bg-blue-50">
                        🔗 {page} ({count})
                      </option>
                    )
                  })}
                </select>
              </div>
              
              {/* فلتر الحملة */}
              <div className="group">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <LinkIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  الحملة الإعلانية
                </label>
                <select
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium hover:border-orange-400 dark:hover:border-orange-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <option value="ALL" className="font-bold bg-gray-50 dark:bg-gray-800">🎯 جميع الحملات ({stats?.summary.totalVisits || 0})</option>
                  {uniqueCampaigns.map(campaign => (
                    <option key={campaign} value={campaign} className="py-2 hover:bg-orange-50">
                      📢 {campaign} ({stats?.campaignStats[campaign] || 0})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* فلتر من تاريخ */}
              <div className="group">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium hover:border-purple-400 dark:hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm hover:shadow-md"
                />
              </div>
              
              {/* فلتر إلى تاريخ */}
              <div className="group">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Calendar className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium hover:border-pink-400 dark:hover:border-pink-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>
            <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
              <table className="w-full min-w-[1200px]" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="border-b dark:border-gray-700 text-sm">
                    <th className="text-center py-3 px-2" style={{ width: '50px' }}>
                      <button onClick={toggleAllVisits} className="hover:text-blue-500">
                        {selectedVisits.length === filteredVisits.length && filteredVisits.length > 0 ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4" style={{ width: '140px' }}>التاريخ والوقت</th>
                    <th className="text-right py-3 px-4" style={{ width: '110px' }}>IP</th>
                    <th className="text-right py-3 px-4" style={{ width: '100px' }}>الدولة</th>
                    <th className="text-right py-3 px-4" style={{ width: '100px' }}>المدينة</th>
                    <th className="text-right py-3 px-4" style={{ width: '100px' }}>الصفحة</th>
                    <th className="text-right py-3 px-4" style={{ width: '120px' }}>الجهاز</th>
                    <th className="text-right py-3 px-4" style={{ width: '110px' }}>المصدر</th>
                    <th className="text-right py-3 px-4" style={{ width: '180px' }}>الحملة</th>
                    <th className="text-center py-3 px-4" style={{ width: '60px' }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500 dark:text-gray-400">
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
                      <td className="py-3 px-4" title={visit.ipAddress}>
                        <span className="font-mono text-xs block overflow-hidden text-ellipsis whitespace-nowrap">{visit.ipAddress}</span>
                      </td>
                      <td className="py-3 px-4" title={visit.country || '-'}>
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{visit.country || '-'}</span>
                      </td>
                      <td className="py-3 px-4" title={visit.city || '-'}>
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{visit.city || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs block overflow-hidden text-ellipsis whitespace-nowrap" title={visit.targetPage}>
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
                            <span className="text-xs text-gray-500 dark:text-gray-400 block overflow-hidden text-ellipsis whitespace-nowrap">
                              {visit.browser} • {visit.os}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs block overflow-hidden text-ellipsis whitespace-nowrap ${
                          visit.isGoogle
                            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`} title={visit.utmSource || (visit.isGoogle ? 'Google' : 'Direct')}>
                          {visit.utmSource || (visit.isGoogle ? 'Google' : 'Direct')}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ maxWidth: '180px', overflow: 'hidden' }}>
                        <div className="w-full" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                          {visit.gclid && (
                            <div className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded w-full" title={`Google Ads: ${visit.gclid}`} style={{ wordBreak: 'break-all' }}>
                              <div className="font-semibold mb-0.5">🎯 Google Ads</div>
                              <div className="font-mono text-[9px] leading-tight opacity-70" style={{ wordBreak: 'break-all', maxWidth: '100%' }}>
                                {visit.gclid.substring(0, 25)}...
                              </div>
                            </div>
                          )}
                          {visit.fbclid && (
                            <div className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded w-full" title={`Facebook Ads: ${visit.fbclid}`} style={{ wordBreak: 'break-all' }}>
                              <div className="font-semibold mb-0.5">📘 Facebook Ads</div>
                              <div className="font-mono text-[9px] leading-tight opacity-70" style={{ wordBreak: 'break-all', maxWidth: '100%' }}>
                                {visit.fbclid.substring(0, 25)}...
                              </div>
                            </div>
                          )}
                          {visit.utmCampaign && !visit.gclid && !visit.fbclid && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded block w-full" title={visit.utmCampaign} style={{ wordBreak: 'break-all', overflowWrap: 'break-word', maxWidth: '100%' }}>
                              {visit.utmCampaign.length > 30 ? visit.utmCampaign.substring(0, 30) + '...' : visit.utmCampaign}
                            </span>
                          )}
                          {!visit.utmCampaign && !visit.gclid && !visit.fbclid && (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            showDeleteConfirmation('single', 1, visit.id)
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="حذف نهائي"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls - محسّن */}
            {stats && stats.pagination && stats.pagination.totalPages > 1 && (
              <div className="mt-6 border-t dark:border-gray-700 pt-6">
                {/* معلومات الصفحة وعدد العناصر */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, stats.pagination.totalItems)} من {stats.pagination.totalItems} زيارة
                      </span>
                    </div>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      <option value="25">25 / صفحة</option>
                      <option value="50">50 / صفحة</option>
                      <option value="100">100 / صفحة</option>
                      <option value="200">200 / صفحة</option>
                    </select>
                  </div>
                  
                  {/* القفز إلى صفحة محددة */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      الانتقال إلى:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={stats.pagination.totalPages}
                      value={jumpToPage}
                      onChange={(e) => setJumpToPage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleJumpToPage()
                        }
                      }}
                      placeholder={`1-${stats.pagination.totalPages}`}
                      className="w-20 px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-center font-medium hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      onClick={handleJumpToPage}
                      disabled={!jumpToPage || isNavigating}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      انتقل
                    </button>
                  </div>
                </div>
                
                {/* أزرار التنقل */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* زر الصفحة الأولى */}
                  <button
                    onClick={() => {
                      if (!isNavigating && currentPage !== 1) {
                        setIsNavigating(true)
                        setCurrentPage(1)
                      }
                    }}
                    disabled={currentPage === 1 || isNavigating}
                    className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                    title="الصفحة الأولى"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -mr-4" />
                    <span className="hidden sm:inline">الأولى</span>
                  </button>
                  
                  {/* زر السابق */}
                  <button
                    onClick={() => {
                      if (!isNavigating && stats.pagination.hasPreviousPage) {
                        setIsNavigating(true)
                        setCurrentPage(prev => prev - 1)
                      }
                    }}
                    disabled={!stats.pagination.hasPreviousPage || isNavigating}
                    className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                    title="السابق (→)"
                  >
                    <ChevronRight className="h-5 w-5" />
                    <span>السابق</span>
                  </button>
                  
                  {/* أرقام الصفحات */}
                  <div className="flex items-center gap-1.5 px-2">
                    {Array.from({ length: Math.min(7, stats.pagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (stats.pagination.totalPages <= 7) {
                        pageNum = i + 1
                      } else if (currentPage <= 4) {
                        pageNum = i + 1
                      } else if (currentPage >= stats.pagination.totalPages - 3) {
                        pageNum = stats.pagination.totalPages - 6 + i
                      } else {
                        pageNum = currentPage - 3 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            if (!isNavigating && pageNum !== currentPage) {
                              setIsNavigating(true)
                              setCurrentPage(pageNum)
                            }
                          }}
                          disabled={isNavigating}
                          className={`min-w-[40px] h-11 px-3 rounded-xl text-sm font-bold transition-all ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-110 border-2 border-blue-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    {stats.pagination.totalPages > 7 && currentPage < stats.pagination.totalPages - 3 && (
                      <>
                        <span className="px-2 text-gray-500 dark:text-gray-400 font-bold">...</span>
                        <button
                          onClick={() => {
                            if (!isNavigating && stats.pagination.totalPages !== currentPage) {
                              setIsNavigating(true)
                              setCurrentPage(stats.pagination.totalPages)
                            }
                          }}
                          disabled={isNavigating}
                          className="min-w-[40px] h-11 px-3 rounded-xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50 transition-all"
                        >
                          {stats.pagination.totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* زر التالي */}
                  <button
                    onClick={() => {
                      if (!isNavigating && stats.pagination.hasNextPage) {
                        setIsNavigating(true)
                        setCurrentPage(prev => prev + 1)
                      }
                    }}
                    disabled={!stats.pagination.hasNextPage || isNavigating}
                    className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                    title="التالي (←)"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* زر الصفحة الأخيرة */}
                  <button
                    onClick={() => {
                      if (!isNavigating && currentPage !== stats.pagination.totalPages) {
                        setIsNavigating(true)
                        setCurrentPage(stats.pagination.totalPages)
                      }
                    }}
                    disabled={currentPage === stats.pagination.totalPages || isNavigating}
                    className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                    title="الصفحة الأخيرة"
                  >
                    <span className="hidden sm:inline">الأخيرة</span>
                    <ChevronLeft className="h-4 w-4 -ml-4" />
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
                
                {/* تلميح اختصارات لوحة المفاتيح */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">←</kbd>
                      التالي
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">→</kbd>
                      السابق
                    </span>
                  </p>
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

        {/* Delete Confirmation Popup */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all animate-scaleIn">
              {/* Close Button */}
              <button
                onClick={cancelDelete}
                className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <AlertTriangle className="h-10 w-10 text-white animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  تأكيد الحذف النهائي
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm font-semibold">
                  ⚠️ تحذير: لا يمكن التراجع عن هذا الإجراء
                </p>
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-gray-700 dark:text-gray-300 text-center text-lg">
                    {deleteConfirmType === 'single' && (
                      <>هل أنت متأكد من حذف هذه الزيارة نهائياً؟</>
                    )}
                    {deleteConfirmType === 'selected' && (
                      <>
                        هل أنت متأكد من حذف 
                        <span className="font-bold text-red-600 dark:text-red-400 mx-1">
                          {deleteConfirmCount}
                        </span>
                        زيارة محددة نهائياً؟
                      </>
                    )}
                    {deleteConfirmType === 'filtered' && (
                      <>
                        هل أنت متأكد من حذف جميع الزيارات المفلترة 
                        <span className="font-bold text-red-600 dark:text-red-400 mx-1">
                          ({deleteConfirmCount} زيارة)
                        </span>
                        نهائياً؟
                      </>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-3">
                    سيتم حذف البيانات من قاعدة البيانات بشكل نهائي
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={executeDelete}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  نعم، احذف نهائياً
                </button>
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <X className="h-5 w-5" />
                  إلغاء
                </button>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-t-2xl"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  حذف نهائي
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-2">
                  ⚠️ تحذير: لا يمكن التراجع عن هذا الإجراء
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {deleteStatus}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>التقدم</span>
                  <span className="font-bold">{deleteProgress}%</span>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${deleteProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Status Icon */}
              <div className="text-center">
                {deleteProgress < 100 ? (
                  <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">جاري الحذف...</span>
                  </div>
                ) : deleteStatus.includes('✅') ? (
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <CheckSquare className="h-5 w-5" />
                    <span className="text-sm font-medium">تم الحذف بنجاح!</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                    <X className="h-5 w-5" />
                    <span className="text-sm font-medium">فشلت العملية</span>
                  </div>
                )}
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-t-2xl"></div>
            </div>
          </div>
        )}
        </>
      )}
    </DashboardLayout>
  )
}
