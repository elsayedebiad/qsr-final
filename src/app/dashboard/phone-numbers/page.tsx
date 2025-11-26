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
      'التاريخ': new Date(item.createdAt).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'أرقام الهواتف')
    
    const fileName = `phone-numbers-${selectedSalesPage}-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    toast.success('تم تصدير البيانات بنجاح')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animated-bg-theme relative">
        <div className="bg-aurora"></div>
        <div className="bg-grid"></div>
        {/* Header */}
        <div className="card-gradient-primary rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Phone className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">سجل أرقام الهواتف</h1>
                <p className="text-white/80 text-sm">إدارة أرقام الهواتف من صفحات المبيعات</p>
              </div>
            </div>
            <button
              onClick={exportToExcel}
              disabled={phoneNumbers.length === 0}
              className="btn-gradient-success disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover-lift"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {salesPages.slice(1).map(page => (
            <div key={page.id} className="card hover-lift rounded-lg p-4 shadow-sm border border-border animate-fade-in">
              <div className="text-sm text-muted-foreground mb-1">{page.name}</div>
              <div className="text-2xl font-bold text-primary">{stats[page.id] || 0}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="form-label">
                <Filter className="w-4 h-4 inline-block mr-2" />
                تصفية حسب الصفحة
              </label>
              <select
                value={selectedSalesPage}
                onChange={(e) => {
                  setSelectedSalesPage(e.target.value)
                  setPage(1)
                }}
                className="form-input"
              >
                {salesPages.map(page => (
                  <option key={page.id} value={page.id}>{page.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`btn px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover-lift ${
                  showArchived 
                    ? 'btn-secondary' 
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                <Archive className="w-5 h-5" />
                {showArchived ? 'إخفاء المؤرشفة' : 'عرض المؤرشفة'}
              </button>

              <button
                onClick={() => fetchPhoneNumbers()}
                className="btn btn-primary hover-lift"
              >
                <RefreshCw className="w-5 h-5" />
                تحديث
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card rounded-xl shadow-sm border border-border overflow-hidden animate-fade-in">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner w-12 h-12 mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : phoneNumbers.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-float" />
              <p className="text-foreground text-lg">لا توجد أرقام هواتف</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      رقم الهاتف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      الصفحة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      الموقع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      الجهاز
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {phoneNumbers.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground" dir="ltr">{item.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-primary">
                          {item.salesPageId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{item.city || item.country || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {item.deviceType === 'MOBILE' ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Monitor className="w-4 h-4" />
                          )}
                          <span>{item.deviceType === 'MOBILE' ? 'موبايل' : 'حاسوب'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">{formatDate(item.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleArchive(item.id, !item.isArchived)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all duration-200 hover-lift"
                            title={item.isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all duration-200 hover-lift"
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
            <div className="bg-muted/50 px-6 py-4 border-t border-border flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
              >
                السابق
              </button>
              <span className="text-foreground font-medium">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
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
