'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { Phone, Download, Archive, Trash2, RefreshCw, Filter, Calendar, MapPin, Smartphone, Monitor, MessageCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { useActivityLogger } from '@/hooks/useActivityLogger'

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
  isContacted: boolean
  contactedAt?: string
  createdAt: string
}

interface Stats {
  [key: string]: number
}

export default function PhoneNumbersPage() {
  const { user } = useAuth()
  const { logAction, logFileDownload } = useActivityLogger({
    pageName: 'أرقام الهواتف المجمعة',
    autoLogPageView: true
  })
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSalesPage, setSelectedSalesPage] = useState<string>('ALL')
  const [showArchived, setShowArchived] = useState(false)
  const [stats, setStats] = useState<Stats>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // حماية الصفحة: ADMIN له وصول كامل، SALES يصل لصفحاته فقط
  if (user && user.role !== 'ADMIN') {
    // السماح للمستخدمين العاديين (SALES/USER) فقط
    if (user.role !== 'USER' && user.role !== 'SALES') {
      return (
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-4">غير مصرح</h1>
              <p className="text-muted-foreground">ليس لديك صلاحية الوصول لهذه الصفحة</p>
            </div>
          </div>
        </DashboardLayout>
      )
    }
  }
  
  // تحديد صفحات السيلز المتاحة حسب صلاحيات المستخدم
  const userSalesPages = user?.role === 'ADMIN' ? null : (user?.salesPages || [])
  const isAdmin = user?.role === 'ADMIN'

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
        setPhoneNumbers(prev => 
          prev.map(item => 
            item.id === id ? { ...item, isArchived } : item
          )
        )
        toast.success(isArchived ? 'تم الأرشفة بنجاح' : 'تم الاستعادة بنجاح')
        
        // تسجيل النشاط
        logAction(
          isArchived ? 'PHONE_ARCHIVE' : 'PHONE_RESTORE',
          `${isArchived ? 'أرشفة' : 'استعادة'} رقم هاتف #${id}`,
          { phoneNumberId: id, isArchived }
        )
        
        fetchPhoneNumbers()
      } else {
        toast.error(data.message || 'حدث خطأ')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('حدث خطأ أثناء العملية')
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
      'رقم الهاتف': formatPhoneNumber(item.phoneNumber),
      'الصفحة': item.salesPageId,
      'المصدر': item.source || '-',
      'الموقع': item.city || item.country || '-',
      'الجهاز': item.deviceType || '-',
      'التاريخ': formatDate(item.createdAt)
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'أرقام الهواتف')
    
    const fileName = `phone-numbers-${selectedSalesPage}-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    toast.success('تم تصدير البيانات بنجاح')
    
    // تسجيل النشاط
    logFileDownload(fileName, 'excel')
    logAction(
      'PHONE_EXPORT',
      `تصدير ${exportData.length} رقم هاتف إلى Excel`,
      { 
        count: exportData.length, 
        salesPage: selectedSalesPage,
        fileName 
      }
    )
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

  // تنسيق رقم الهاتف وإضافة كود السعودية إذا لم يكن موجود
  const formatPhoneNumber = (phoneNumber: string): string => {
    // إزالة المسافات والرموز الزائدة
    let cleanNumber = phoneNumber.replace(/[^0-9+]/g, '')
    
    // إذا كان الرقم يبدأ بـ 0، نزيل الصفر ونضيف +966
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '+966' + cleanNumber.substring(1)
    }
    // إذا كان الرقم لا يبدأ بـ + أو 966، نضيف +966
    else if (!cleanNumber.startsWith('+') && !cleanNumber.startsWith('966')) {
      cleanNumber = '+966' + cleanNumber
    }
    // إذا كان يبدأ بـ 966 بدون +، نضيف +
    else if (cleanNumber.startsWith('966') && !cleanNumber.startsWith('+')) {
      cleanNumber = '+' + cleanNumber
    }
    
    return cleanNumber
  }

  // فتح محادثة واتساب مع الرقم وتسجيل التواصل
  const openWhatsApp = async (phoneNumber: string, id: number) => {
    const formattedNumber = formatPhoneNumber(phoneNumber)
    // إزالة + و أي رموز أخرى للرقم النظيف
    const cleanNumber = formattedNumber.replace(/[^0-9]/g, '')
    const whatsappUrl = `https://wa.me/${cleanNumber}`
    window.open(whatsappUrl, '_blank')
    
    // تسجيل النشاط
    logAction(
      'WHATSAPP_OPEN',
      `فتح واتساب للرقم: ${formattedNumber}`,
      { phoneNumberId: id, phoneNumber: formattedNumber }
    )
    
    // تحديث حالة التواصل
    try {
      const response = await fetch('/api/phone-numbers/list', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, isContacted: true })
      })

      const data = await response.json()

      if (data.success) {
        // تحديث البيانات المحلية
        setPhoneNumbers(prev => 
          prev.map(item => 
            item.id === id 
              ? { ...item, isContacted: true, contactedAt: new Date().toISOString() } 
              : item
          )
        )
      }
    } catch (error) {
      console.error('Error updating contact status:', error)
    }
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
          {/* إجمالي الأرقام */}
          <div className="card hover-lift rounded-lg p-4 shadow-sm border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 animate-fade-in">
            <div className="text-sm text-muted-foreground mb-1">إجمالي الأرقام</div>
            <div className="text-2xl font-bold text-primary">
              {Object.values(stats).reduce((sum, count) => sum + count, 0)}
            </div>
          </div>
          
          {salesPages.slice(1)
            .filter(page => !userSalesPages || userSalesPages.includes(page.id))
            .map(page => (
              <div key={page.id} className="card hover-lift rounded-lg p-4 shadow-sm border border-border animate-fade-in">
                <div className="text-sm text-muted-foreground mb-1">{page.name}</div>
                <div className="text-2xl font-bold text-primary">{stats[page.id] || 0}</div>
              </div>
            ))
          }
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
                {salesPages
                  .filter(page => page.id === 'ALL' || !userSalesPages || userSalesPages.includes(page.id))
                  .map(page => (
                    <option key={page.id} value={page.id}>{page.name}</option>
                  ))
                }
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
                      حالة التواصل
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
                          <span className="font-medium text-foreground" dir="ltr">{formatPhoneNumber(item.phoneNumber)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-primary">
                          {item.salesPageId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isContacted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            تم التواصل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            لم يتم التواصل
                          </span>
                        )}
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
                            onClick={() => openWhatsApp(item.phoneNumber, item.id)}
                            className="p-2 text-muted-foreground hover:text-[#25d366] hover:bg-[#25d366]/10 rounded transition-all duration-200 hover-lift"
                            title="فتح واتساب"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.14 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleArchive(item.id, !item.isArchived)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all duration-200 hover-lift"
                            title={item.isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all duration-200 hover-lift"
                              title="حذف"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
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
