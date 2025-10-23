'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe, MapPin, Monitor, Calendar, Filter, Download,
  Eye, Users, TrendingUp, Clock, ExternalLink, Search,
  RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import toast from 'react-hot-toast'

interface Visit {
  id: number
  ipAddress: string
  country: string | null
  city: string | null
  userAgent: string | null
  referer: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  targetPage: string
  isGoogle: boolean
  timestamp: string
}

interface VisitStats {
  totalVisits: number
  uniqueVisitors: number
  countries: Array<{ country: string; count: number }>
  pages: Array<{ page: string; count: number }>
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    targetPage: '',
    country: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchVisits()
  }, [page, filters])

  const fetchVisits = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      })

      const res = await fetch(`/api/visits/list?${params}`)
      const data = await res.json()

      if (data.success) {
        setVisits(data.visits)
        setStats(data.stats)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching visits:', error)
      toast.error('فشل جلب الزيارات')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['ID', 'IP', 'الدولة', 'المدينة', 'الصفحة', 'المصدر', 'الوقت']
    const rows = visits.map(v => [
      v.id,
      v.ipAddress,
      v.country || '-',
      v.city || '-',
      v.targetPage,
      v.isGoogle ? 'Google' : v.utmSource || 'Direct',
      new Date(v.timestamp).toLocaleString('ar-EG')
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `visits-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('تم تصدير البيانات!')
  }

  const getCountryFlag = (country: string | null) => {
    if (!country) return '🌍'
    const countryFlags: Record<string, string> = {
      'Saudi Arabia': '🇸🇦',
      'Egypt': '🇪🇬',
      'United Arab Emirates': '🇦🇪',
      'Kuwait': '🇰🇼',
      'Qatar': '🇶🇦',
      'Bahrain': '🇧🇭',
      'Oman': '🇴🇲',
      'Jordan': '🇯🇴',
      'Lebanon': '🇱🇧',
      'Iraq': '🇮🇶',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
    }
    return countryFlags[country] || '🌍'
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                  <Eye className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">سجل الزيارات</h1>
                  <p className="text-blue-100">تتبع مفصل لجميع الزيارات مع IP والدولة</p>
                </div>
              </div>
              <button
                onClick={fetchVisits}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <span className="text-3xl font-bold">{stats.totalVisits}</span>
                </div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400">إجمالي الزيارات</h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8 text-green-500" />
                  <span className="text-3xl font-bold">{stats.uniqueVisitors}</span>
                </div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400">زوار فريدين (IP)</h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <Globe className="h-8 w-8 text-purple-500" />
                  <span className="text-3xl font-bold">{stats.countries.length}</span>
                </div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400">دول مختلفة</h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <Monitor className="h-8 w-8 text-orange-500" />
                  <span className="text-3xl font-bold">{stats.pages.length}</span>
                </div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400">صفحات مختلفة</h3>
              </div>
            </div>
          )}

          {/* Filters & Export */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  تصفية بالصفحة
                </label>
                <select
                  value={filters.targetPage}
                  onChange={(e) => setFilters({ ...filters, targetPage: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">جميع الصفحات</option>
                  {stats?.pages.map(p => (
                    <option key={p.page} value={p.page}>
                      {p.page} ({p.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2">
                  <Globe className="inline h-4 w-4 mr-1" />
                  تصفية بالدولة
                </label>
                <select
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">جميع الدول</option>
                  {stats?.countries.map(c => (
                    <option key={c.country} value={c.country}>
                      {getCountryFlag(c.country)} {c.country} ({c.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <button
                onClick={() => {
                  setFilters({ targetPage: '', country: '', startDate: '', endDate: '' })
                  setPage(1)
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                إعادة تعيين
              </button>

              <button
                onClick={exportToCSV}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                تصدير CSV
              </button>
            </div>
          </div>

          {/* Top Countries */}
          {stats && stats.countries.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                أكثر الدول زيارة
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stats.countries.slice(0, 10).map((country, index) => (
                  <div
                    key={country.country}
                    className="p-4 border dark:border-gray-700 rounded-lg hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCountryFlag(country.country)}</span>
                      {index < 3 && (
                        <span className="text-xs">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm truncate">{country.country}</h3>
                    <p className="text-2xl font-bold text-blue-600">{country.count}</p>
                    <p className="text-xs text-gray-500">
                      {((country.count / stats.totalVisits) * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visits Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">ID</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">IP Address</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">الدولة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">المدينة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">الصفحة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">المصدر</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">الوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-mono">{visit.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm">{visit.ipAddress}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCountryFlag(visit.country)}</span>
                          <span className="text-sm">{visit.country || 'غير معروف'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {visit.city || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          {visit.targetPage}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {visit.isGoogle ? (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs">
                            🔴 Google
                          </span>
                        ) : visit.utmSource ? (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs">
                            {visit.utmSource}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                            مباشر
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(visit.timestamp).toLocaleString('ar-EG', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                صفحة {page} من {totalPages}
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
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
