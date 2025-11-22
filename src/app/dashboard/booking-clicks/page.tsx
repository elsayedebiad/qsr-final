'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  MousePointerClick, TrendingUp, MessageSquare, Phone, 
  Calendar, Users, CheckCircle, XCircle, Eye, Download,
  RefreshCw, Search, Filter, BarChart3
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ar } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

interface ClickData {
  id: number
  salesPageId: string
  cvId?: string
  cvName?: string
  action: 'BOOKING_CLICK' | 'WHATSAPP_SENT' | 'PHONE_CALL'
  userAgent?: string
  ipAddress?: string
  deviceType?: string
  messageSent: boolean
  createdAt: string
}

interface PageStats {
  salesPageId: string
  totalClicks: number
  messageSentCount: number
  messageNotSentCount: number
  conversionRate: number
  uniqueUsers: number
  recentClicks: ClickData[]
}

export default function BookingClicksPage() {
  const router = useRouter()
  const [stats, setStats] = useState<PageStats[]>([])
  const [allClicks, setAllClicks] = useState<ClickData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPage, setSelectedPage] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<string>('ALL')
  const [messageSentFilter, setMessageSentFilter] = useState<string>('ALL')

  // تحميل البيانات
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/booking-clicks', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAllClicks(data.clicks || [])
        calculateStats(data.clicks || [])
      } else {
        toast.error('فشل في تحميل البيانات')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('حدث خطأ')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // حساب الإحصائيات
  const calculateStats = (clicks: ClickData[]) => {
    const pageGroups = clicks.reduce((acc, click) => {
      if (!acc[click.salesPageId]) {
        acc[click.salesPageId] = []
      }
      acc[click.salesPageId].push(click)
      return acc
    }, {} as Record<string, ClickData[]>)

    const statsArray = Object.entries(pageGroups).map(([pageId, pageClicks]) => {
      const messageSent = pageClicks.filter(c => c.messageSent).length
      const messageNotSent = pageClicks.filter(c => !c.messageSent).length
      const uniqueIPs = new Set(pageClicks.map(c => c.ipAddress)).size

      return {
        salesPageId: pageId,
        totalClicks: pageClicks.length,
        messageSentCount: messageSent,
        messageNotSentCount: messageNotSent,
        conversionRate: pageClicks.length > 0 ? (messageSent / pageClicks.length) * 100 : 0,
        uniqueUsers: uniqueIPs,
        recentClicks: pageClicks.slice(0, 10)
      }
    })

    setStats(statsArray.sort((a, b) => b.totalClicks - a.totalClicks))
  }

  // الفلترة
  const filteredClicks = allClicks.filter(click => {
    const matchesSearch = !searchTerm || 
      click.salesPageId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      click.cvName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPage = selectedPage === 'ALL' || click.salesPageId === selectedPage
    
    const matchesMessageSent = messageSentFilter === 'ALL' ||
      (messageSentFilter === 'SENT' && click.messageSent) ||
      (messageSentFilter === 'NOT_SENT' && !click.messageSent)

    return matchesSearch && matchesPage && matchesMessageSent
  })

  // تصدير
  const exportData = () => {
    const dataStr = JSON.stringify(filteredClicks, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const link = document.createElement('a')
    link.setAttribute('href', dataUri)
    link.setAttribute('download', `booking_clicks_${new Date().toISOString()}.json`)
    link.click()
    toast.success('تم التصدير بنجاح')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <MousePointerClick className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const totalClicks = allClicks.length
  const totalMessagesSent = allClicks.filter(c => c.messageSent).length
  const overallConversionRate = totalClicks > 0 ? (totalMessagesSent / totalClicks) * 100 : 0

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        {/* الرأس */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">تتبع نقرات الحجز والاستفسار</h1>
              <p className="text-green-100">متابعة نقرات زر الحجز في صفحات السيلز</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchData}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <RefreshCw className="h-5 w-5" />
                تحديث
              </button>
              <button
                onClick={exportData}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Download className="h-5 w-5" />
                تصدير
              </button>
            </div>
          </div>

          {/* إحصائيات عامة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick className="h-5 w-5" />
                <span className="text-sm">إجمالي النقرات</span>
              </div>
              <div className="text-3xl font-bold">{totalClicks}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">رسائل مرسلة</span>
              </div>
              <div className="text-3xl font-bold">{totalMessagesSent}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5" />
                <span className="text-sm">بدون رسالة</span>
              </div>
              <div className="text-3xl font-bold">{totalClicks - totalMessagesSent}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm">معدل التحويل</span>
              </div>
              <div className="text-3xl font-bold">{overallConversionRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* الفلاتر */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">الفلاتر</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">جميع الصفحات</option>
              {stats.map(s => (
                <option key={s.salesPageId} value={s.salesPageId}>
                  {s.salesPageId} ({s.totalClicks})
                </option>
              ))}
            </select>

            <select
              value={messageSentFilter}
              onChange={(e) => setMessageSentFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="SENT">رسالة مرسلة ✓</option>
              <option value="NOT_SENT">بدون رسالة ✗</option>
            </select>

            <div className="text-sm text-muted-foreground flex items-center justify-center">
              {filteredClicks.length} نتيجة
            </div>
          </div>
        </div>

        {/* إحصائيات الصفحات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map(stat => (
            <div key={stat.salesPageId} className="bg-card rounded-xl p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">{stat.salesPageId}</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  stat.conversionRate >= 50 ? 'bg-green-100 text-green-800' :
                  stat.conversionRate >= 25 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {stat.conversionRate.toFixed(1)}%
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">إجمالي النقرات</span>
                  <span className="font-bold text-foreground">{stat.totalClicks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    رسائل مرسلة
                  </span>
                  <span className="font-bold text-green-600">{stat.messageSentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    بدون رسالة
                  </span>
                  <span className="font-bold text-red-600">{stat.messageNotSentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    مستخدمين فريدين
                  </span>
                  <span className="font-bold text-foreground">{stat.uniqueUsers}</span>
                </div>
              </div>

              {/* شريط التقدم */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stat.conversionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* جدول التفاصيل */}
        <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              سجل النقرات التفصيلي
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold">الصفحة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">السيرة الذاتية</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">الجهاز</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClicks.slice(0, 50).map((click) => (
                  <tr key={click.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{click.salesPageId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {click.cvName || 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {click.messageSent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          <CheckCircle className="h-3 w-3" />
                          تم الإرسال
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          <XCircle className="h-3 w-3" />
                          لم يرسل
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {click.deviceType || 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                      {format(parseISO(click.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClicks.length === 0 && (
            <div className="p-12 text-center">
              <MousePointerClick className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد نقرات</h3>
              <p className="text-muted-foreground">لم يتم تسجيل أي نقرات حتى الآن</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
