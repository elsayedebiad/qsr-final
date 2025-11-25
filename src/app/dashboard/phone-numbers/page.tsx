'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Phone, Download, Archive, Trash2, RefreshCw, Filter, Calendar, MapPin, Smartphone, Monitor } from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface PhoneNumberData {
  id: number
  phoneNumber: string
  salesPageId: string
  source?: string
  ipAddress?: string
  userAgent?: string
  deviceType?: string
  country?: string
  city?: string
  notes?: string
  isArchived: boolean
  createdAt: string
}

interface Stats {
  [key: string]: number
}

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSalesPage, setSelectedSalesPage] = useState<string>('ALL')
  const [showArchived, setShowArchived] = useState(false)
  const [stats, setStats] = useState<Stats>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const salesPages = [
    { id: 'ALL', name: 'جميع الصفحات' },
    { id: 'sales1', name: 'صفحة المبيعات 1' },
    { id: 'sales2', name: 'صفحة المبيعات 2' },
    { id: 'sales3', name: 'صفحة المبيعات 3' },
    { id: 'sales4', name: 'صفحة المبيعات 4' },
    { id: 'sales5', name: 'صفحة المبيعات 5' },
    { id: 'sales6', name: 'صفحة المبيعات 6' },
    { id: 'sales7', name: 'صفحة المبيعات 7' },
    { id: 'sales8', name: 'صفحة المبيعات 8' },
    { id: 'sales9', name: 'صفحة المبيعات 9' },
    { id: 'sales10', name: 'صفحة المبيعات 10' },
    { id: 'sales11', name: 'صفحة المبيعات 11' }
  ]

  useEffect(() => {
    fetchPhoneNumbers()
  }, [selectedSalesPage, showArchived, page])

  const fetchPhoneNumbers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        salesPageId: selectedSalesPage,
        isArchived: showArchived.toString(),
        page: page.toString(),
        limit: '50'
      })

      const response = await fetch(`/api/phone-numbers/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setPhoneNumbers(data.data)
        setStats(data.stats || {})
        setTotalPages(data.pagination.totalPages)
      } else {
        toast.error(data.message || 'حدث خطأ أثناء جلب البيانات')
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error)
      toast.error('حدث خطأ أثناء جلب البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async (id: number, isArchived: boolean) => {
    try {
      const response = await fetch('/api/phone-numbers/list', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, isArchived })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchPhoneNumbers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error archiving phone number:', error)
      toast.error('حدث خطأ أثناء التحديث')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرقم نهائياً؟')) {
      return
    }

    try {
      const response = await fetch(`/api/phone-numbers/list?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchPhoneNumbers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error deleting phone number:', error)
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  const exportToExcel = () => {
    const exportData = phoneNumbers.map(item => ({
      'رقم الهاتف': item.phoneNumber,
      'الصفحة': item.salesPageId,
      'المصدر': item.source || '-',
      'الدولة': item.country || '-',
      'المدينة': item.city || '-',
      'نوع الجهاز': item.deviceType || '-',
      'التاريخ': new Date(item.createdAt).toLocaleString('ar-SA')
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'أرقام الهواتف')
    
    const fileName = `phone-numbers-${selectedSalesPage}-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    toast.success('تم تصدير البيانات بنجاح')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Phone className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">أرقام الهواتف المجمعة</h1>
                <p className="text-blue-100 text-sm">إدارة أرقام الهواتف من صفحات المبيعات</p>
              </div>
            </div>
            <button
              onClick={exportToExcel}
              disabled={phoneNumbers.length === 0}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {salesPages.slice(1).map(page => (
            <div key={page.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">{page.name}</div>
              <div className="text-2xl font-bold text-blue-600">{stats[page.id] || 0}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline-block mr-2" />
                تصفية حسب الصفحة
              </label>
              <select
                value={selectedSalesPage}
                onChange={(e) => {
                  setSelectedSalesPage(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {salesPages.map(page => (
                  <option key={page.id} value={page.id}>{page.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  showArchived 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Archive className="w-5 h-5" />
                {showArchived ? 'إخفاء المؤرشفة' : 'عرض المؤرشفة'}
              </button>

              <button
                onClick={() => fetchPhoneNumbers()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                تحديث
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : phoneNumbers.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">لا توجد أرقام هواتف</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الهاتف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الصفحة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الموقع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الجهاز
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {phoneNumbers.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900" dir="ltr">{item.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {item.salesPageId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{item.city || item.country || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {item.deviceType === 'MOBILE' ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Monitor className="w-4 h-4" />
                          )}
                          <span>{item.deviceType === 'MOBILE' ? 'موبايل' : 'حاسوب'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">{formatDate(item.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleArchive(item.id, !item.isArchived)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={item.isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                السابق
              </button>
              <span className="text-gray-700">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
