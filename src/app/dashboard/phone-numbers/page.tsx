'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { Phone, Download, Archive, Trash2, RefreshCw, Filter, Calendar, MapPin, Smartphone, Monitor, MessageCircle, Send, X, Check, Clock, AlertCircle, Ban } from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import CountdownTimer from '@/components/CountdownTimer'

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
  isTransferred?: boolean
  originalSalesPageId?: string
  transferredToUserId?: number
  transferredBy?: number
  transferredAt?: string
  transferReason?: string
  deadlineHours?: number
  deadlineMinutes?: number
  deadlineSeconds?: number
  deadlineAt?: string
  isExpired?: boolean
  expiredAt?: string
  transferredToUser?: {
    id: number
    name: string
    email: string
  }
}

interface UserOption {
  id: number
  name: string
  email: string
}

interface Stats {
  [key: string]: number
}

export default function PhoneNumbersPage() {
  const { user } = useAuth()
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSalesPage, setSelectedSalesPage] = useState<string>('ALL')
  const [showArchived, setShowArchived] = useState(false)
  const [stats, setStats] = useState<Stats>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [transferReason, setTransferReason] = useState('تأخير في التواصل')
  const [isTransferring, setIsTransferring] = useState(false)
  const [deadlineHours, setDeadlineHours] = useState('0')
  const [deadlineMinutes, setDeadlineMinutes] = useState('0')
  const [deadlineSeconds, setDeadlineSeconds] = useState('0')
  const [showExpired, setShowExpired] = useState(false)
  const [contactFilter, setContactFilter] = useState<'all' | 'contacted' | 'not-contacted'>('all')
  const [transferredCount, setTransferredCount] = useState(0)

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
    { id: 'sales11', name: 'صفحة المبيعات 11' },
    { id: 'transfer-services', name: 'نقل الخدمات' }
  ]

  useEffect(() => {
    fetchPhoneNumbers()
  }, [selectedSalesPage, showArchived, page, showExpired, contactFilter])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  // تم نقل فحص الأرقام المنتهية إلى GlobalNotifications component

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.users) {
        setUsers(data.users.filter((u: any) => u.role !== 'DEVELOPER' && u.isActive))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSelectNumber = (id: number) => {
    setSelectedNumbers(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedNumbers.length === phoneNumbers.length) {
      setSelectedNumbers([])
    } else {
      setSelectedNumbers(phoneNumbers.map(p => p.id))
    }
  }

  const handleTransfer = async () => {
    if (!selectedUserId) {
      toast.error('يرجى اختيار المستخدم المستهدف')
      return
    }

    if (selectedNumbers.length === 0) {
      toast.error('يرجى اختيار رقم واحد على الأقل')
      return
    }

    setIsTransferring(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/phone-numbers/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumberIds: selectedNumbers,
          targetUserId: selectedUserId,
          reason: transferReason,
          deadlineHours: deadlineHours,
          deadlineMinutes: deadlineMinutes,
          deadlineSeconds: deadlineSeconds
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setShowTransferModal(false)
        setSelectedNumbers([])
        setSelectedUserId('')
        setTransferReason('تأخير في التواصل')
        setDeadlineHours('0')
        setDeadlineMinutes('0')
        setDeadlineSeconds('0')
        fetchPhoneNumbers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error transferring numbers:', error)
      toast.error('حدث خطأ أثناء التحويل')
    } finally {
      setIsTransferring(false)
    }
  }

  const isNumberBlocked = (item: PhoneNumberData): boolean => {
    // الحماية أصبحت من الـ Backend
    // إذا كان الرقم يحتوي على "******" يعني محجوب
    return item.phoneNumber.includes('******')
  }

  // تحديد نوع العلاقة مع الرقم المحول
  const getTransferRelation = (item: PhoneNumberData) => {
    if (!item.isTransferred) return null
    
    const isCurrentRecipient = item.transferredToUserId === user?.id
    const isOriginalOwner = user?.salesPages?.includes(item.originalSalesPageId || item.salesPageId)
    
    if (isCurrentRecipient) return 'current_recipient' // المحول إليه حالياً
    if (isOriginalOwner) return 'original_owner' // المالك الأصلي
    return 'previous_recipient' // محول سابق (مخفي)
  }

  const handleExpiredNumber = async (id: number) => {
    // تحديث الرقم ليظهر كمنتهي
    fetchPhoneNumbers()
  }

  const handleReactivateNumber = async (id: number) => {
    if (!confirm('هل تريد إعادة تفعيل هذا الرقم؟')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/phone-numbers/check-expired', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumberId: id })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('تم إعادة تفعيل الرقم بنجاح')
        fetchPhoneNumbers()
      } else {
        toast.error(data.message || 'حدث خطأ أثناء إعادة التفعيل')
      }
    } catch (error) {
      console.error('Error reactivating number:', error)
      toast.error('حدث خطأ أثناء إعادة التفعيل')
    }
  }

  const isNumberTransferredToMe = (item: PhoneNumberData): boolean => {
    // الرقم محول لي
    return item.isTransferred === true && item.transferredToUserId === user?.id
  }

  const fetchPhoneNumbers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        salesPageId: selectedSalesPage,
        isArchived: showArchived.toString(),
        showExpired: showExpired.toString(),
        contactFilter: contactFilter,
        page: page.toString(),
        limit: '50'
      })

      const response = await fetch(`/api/phone-numbers/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setPhoneNumbers(data.data)
        setStats(data.stats || {})
        setTotalPages(data.pagination.totalPages)
        setTransferredCount(data.transferredCount || 0)
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
            <div />
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

          {/* المحولة - للأدمن فقط */}
          {isAdmin && (
            <div
              className="card hover-lift rounded-lg p-4 shadow-sm border-2 border-red-500/50 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 animate-fade-in cursor-pointer"
              onClick={() => setShowExpired(!showExpired)}
            >
              <div className="text-sm text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                المحولة
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                {transferredCount}
              </div>
            </div>
          )}

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

            <div className="flex-1 min-w-[200px]">
              <label className="form-label">
                <MessageCircle className="w-4 h-4 inline-block mr-2" />
                حالة التواصل
              </label>
              <select
                value={contactFilter}
                onChange={(e) => {
                  setContactFilter(e.target.value as 'all' | 'contacted' | 'not-contacted')
                  setPage(1)
                }}
                className="form-input"
              >
                <option value="all">الكل</option>
                <option value="contacted">تم التواصل</option>
                <option value="not-contacted">لم يتم التواصل</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`btn px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover-lift ${showArchived
                  ? 'btn-secondary'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
              >
                <Archive className="w-5 h-5" />
                {showArchived ? 'إخفاء المؤرشفة' : 'عرض المؤرشفة'}
              </button>

              {isAdmin && (
                <button
                  onClick={() => setShowExpired(!showExpired)}
                  className={`btn px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover-lift ${showExpired
                    ? 'bg-red-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                >
                  <AlertCircle className="w-5 h-5" />
                  {showExpired ? 'إخفاء المحولة' : 'عرض المحولة'}
                </button>
              )}

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

        {/* Action Buttons - أعلى الجدول */}
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-4 rounded-xl border-2 border-primary/20">
          <div className="flex items-center gap-2">
            {isAdmin && selectedNumbers.length > 0 ? (
              <div className="flex items-center gap-2 animate-fade-in">
                <div className="bg-primary/10 px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-primary">{selectedNumbers.length} محدد</span>
                </div>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="btn-gradient-primary px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover-lift shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  <span>تحويل الأرقام</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-5 h-5" />
                <span className="text-sm font-medium">إجمالي {phoneNumbers.length} رقم</span>
              </div>
            )}
          </div>

          <button
            onClick={exportToExcel}
            disabled={phoneNumbers.length === 0}
            className="btn-gradient-success disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover-lift shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span>تصدير Excel</span>
          </button>
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
                    {isAdmin && (
                      <th className="px-4 py-3 text-right">
                        <input
                          type="checkbox"
                          checked={selectedNumbers.length === phoneNumbers.length && phoneNumbers.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </th>
                    )}
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
                  {phoneNumbers.map((item) => {
                    const isBlocked = isNumberBlocked(item)
                    const isTransferred = isNumberTransferredToMe(item)

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-muted/50 transition-colors ${isTransferred ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border-r-4 border-green-500' : ''
                          }`}
                      >
                        {isAdmin && (
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedNumbers.includes(item.id)}
                              onChange={() => handleSelectNumber(item.id)}
                              className="w-4 h-4 text-primary rounded cursor-pointer"
                              disabled={isBlocked || item.isContacted}
                              title={item.isContacted ? 'لا يمكن تحويل رقم تم التواصل معه' : (isBlocked ? 'الرقم محجوب' : '')}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {isBlocked ? (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
                                  <div className="flex items-center justify-center w-6 h-6 bg-red-500 dark:bg-red-600 rounded-full">
                                    <Ban className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-mono text-sm font-bold text-red-700 dark:text-red-400" dir="ltr">
                                      {item.phoneNumber}
                                    </span>
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                      تم السحب بسبب التأخير في الرد
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="font-medium text-foreground" dir="ltr">{formatPhoneNumber(item.phoneNumber)}</span>
                            )}
                            {(() => {
                              const relation = getTransferRelation(item)
                              if (relation === 'current_recipient') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <Check className="w-3 h-3" />
                                    محول إليك
                                  </span>
                                )
                              }
                              if (relation === 'original_owner' && item.deadlineAt && !item.isExpired) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                    <Clock className="w-3 h-3" />
                                    محول مؤقتاً
                                  </span>
                                )
                              }
                              return null
                            })()}
                            {item.isContacted && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                <MessageCircle className="w-3 h-3" />
                                تم التواصل
                              </span>
                            )}
                            {item.deadlineAt && !item.isExpired && (
                              <CountdownTimer
                                deadlineAt={item.deadlineAt}
                                onExpired={() => handleExpiredNumber(item.id)}
                              />
                            )}
                            {item.isExpired && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                <AlertCircle className="w-3 h-3" />
                                محول
                              </span>
                            )}
                          </div>
                          {/* رسالة تحذيرية: مؤقت نشط */}
                          {item.deadlineAt && !item.isExpired && item.isTransferred && item.transferredToUserId !== user?.id && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>يجب التواصل خلال الوقت المحدد وإلا سيتم سحب الرقم</span>
                            </p>
                          )}
                          {/* رسالة بعد انتهاء المؤقت */}
                          {isBlocked && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>
                                {item.isExpired ? 'تم سحب الرقم' : `تم حجب الرقم بسبب: ${item.transferReason || 'تأخير التواصل'}`}
                              </span>
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="badge badge-primary">
                              {item.originalSalesPageId || item.salesPageId}
                            </span>
                            {/* معلومات التحويل: تظهر فقط للأدمن أو المستلم، وليس للشخص الأصلي بعد السحب */}
                            {item.isTransferred && item.transferredToUser && (
                              // الأدمن يرى كل شيء
                              isAdmin ? (
                                item.isContacted ? (
                                  // إذا تم التواصل - رسالة بدلاً من اسم المستلم
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-muted-foreground">✅</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      تم التواصل - لم يتم التحويل
                                    </span>
                                  </div>
                                ) : (
                                  // لم يتم التواصل - نعرض اسم المستلم
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-muted-foreground">→</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                      {item.transferredToUser.name}
                                    </span>
                                  </div>
                                )
                              ) : (
                                // المستخدم العادي: إذا كان المستلم فقط يرى الاسم
                                item.transferredToUserId === user?.id && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-muted-foreground">←</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      محول إليك
                                    </span>
                                  </div>
                                )
                              )
                            )}
                          </div>
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
                              disabled={isBlocked}
                              className="p-2 text-muted-foreground hover:text-[#25d366] hover:bg-[#25d366]/10 rounded transition-all duration-200 hover-lift disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isBlocked ? 'الرقم محجوب' : 'فتح واتساب'}
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.14 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleArchive(item.id, !item.isArchived)}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all duration-200 hover-lift"
                              title={item.isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}
                            >
                              <Archive className="w-5 h-5" />
                            </button>
                            {isAdmin && item.isExpired && (
                              <button
                                onClick={() => handleReactivateNumber(item.id)}
                                className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-all duration-200 hover-lift"
                                title="إعادة تفعيل الرقم"
                              >
                                <RefreshCw className="w-5 h-5" />
                              </button>
                            )}
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
                    )
                  })}
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

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">تحويل الأرقام</h2>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    عدد الأرقام المحددة: <span className="font-bold text-primary">{selectedNumbers.length}</span>
                  </p>
                </div>

                <div>
                  <label className="form-label">المستخدم المستهدف</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">اختر مستخدم...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">سبب التحويل</label>
                  <input
                    type="text"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="form-input"
                    placeholder="تأخير في التواصل"
                  />
                </div>

                <div>
                  <label className="form-label">المدة الزمنية للتواصل (اختياري)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">الساعات</label>
                      <input
                        type="number"
                        min="0"
                        value={deadlineHours}
                        onChange={(e) => setDeadlineHours(e.target.value)}
                        className="form-input"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">الدقائق</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={deadlineMinutes}
                        onChange={(e) => setDeadlineMinutes(e.target.value)}
                        className="form-input"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">الثواني</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={deadlineSeconds}
                        onChange={(e) => setDeadlineSeconds(e.target.value)}
                        className="form-input"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ترك الكل صفر = بدون حد زمني
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring || !selectedUserId}
                    className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTransferring ? 'جاري التحويل...' : 'تحويل الأرقام'}
                  </button>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    disabled={isTransferring}
                    className="flex-1 btn btn-secondary"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
