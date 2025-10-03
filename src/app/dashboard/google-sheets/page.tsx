'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { autoSyncService, SyncStats } from '@/lib/auto-sync-service'
import { 
  RefreshCw, 
  Download, 
  Upload, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Clock
} from 'lucide-react'

interface SyncResult {
  synced: number
  updated: number
  errors: string[]
  totalProcessed: number
}

export default function GoogleSheetsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [autoSync, setAutoSync] = useState(false)
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [syncInterval, setSyncInterval] = useState(0.5) // ثواني

  useEffect(() => {
    // جلب آخر وقت مزامنة من localStorage
    const lastSyncTime = localStorage.getItem('lastGoogleSheetsSync')
    if (lastSyncTime) {
      setLastSync(lastSyncTime)
    }

    // التحقق من إعداد المزامنة التلقائية
    const autoSyncSetting = localStorage.getItem('googleSheetsAutoSync')
    const savedInterval = localStorage.getItem('googleSheetsSyncInterval')
    
    setAutoSync(autoSyncSetting === 'true')
    setSyncInterval(savedInterval ? parseFloat(savedInterval) : 0.5)
    
    // بدء المزامنة التلقائية إذا كانت مفعلة
    if (autoSyncSetting === 'true') {
      const interval = savedInterval ? parseFloat(savedInterval) : 0.5
      autoSyncService.startAutoSync(interval)
      autoSyncService.requestNotificationPermission()
    }
    
    // تحديث الإحصائيات كل ثانية للحصول على تحديثات فورية
    const statsInterval = setInterval(() => {
      setSyncStats(autoSyncService.getStats())
    }, 1000)
    
    return () => {
      clearInterval(statsInterval)
    }
  }, [])

  const handleSync = async () => {
    setIsLoading(true)
    setSyncResult(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('يرجى تسجيل الدخول أولاً')
        return
      }

      const response = await fetch('/api/google-sheets/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setSyncResult(data)
        const now = new Date().toLocaleString('ar-EG')
        setLastSync(now)
        localStorage.setItem('lastGoogleSheetsSync', now)
        
        if (data.errors && data.errors.length === 0) {
          toast.success(`تمت المزامنة بنجاح! ${data.synced} جديد، ${data.updated} محدث`)
        } else if (data.errors) {
          toast.success(`تمت المزامنة مع ${data.errors.length} أخطاء`)
        }
      } else {
        if (data.setupRequired) {
          toast.error('يرجى إعداد Google Sheets أولاً')
        } else {
          toast.error(data.error || 'فشل في المزامنة')
        }
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء المزامنة')
      console.error('Sync error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAutoSync = async () => {
    const newAutoSync = !autoSync
    setAutoSync(newAutoSync)
    localStorage.setItem('googleSheetsAutoSync', newAutoSync.toString())
    localStorage.setItem('googleSheetsSyncInterval', syncInterval.toString())
    
    if (newAutoSync) {
      // طلب إذن الإشعارات
      await autoSyncService.requestNotificationPermission()
      
      // بدء المزامنة التلقائية
      autoSyncService.startAutoSync(syncInterval)
      const displayTime = syncInterval < 1 ? 
        `${syncInterval * 1000} ميلي ثانية` : 
        `${syncInterval} ثانية`
      toast.success(`تم تفعيل المزامنة الفورية كل ${displayTime}`)
    } else {
      // إيقاف المزامنة التلقائية
      autoSyncService.stopAutoSync()
      toast.success('تم إيقاف المزامنة التلقائية')
    }
  }

  const handleIntervalChange = (newInterval: number) => {
    setSyncInterval(newInterval)
    localStorage.setItem('googleSheetsSyncInterval', newInterval.toString())
    
    // إذا كانت المزامنة مفعلة، أعد تشغيلها بالفترة الجديدة
    if (autoSync) {
      autoSyncService.changeInterval(newInterval)
      const displayTime = newInterval < 1 ? 
        `${newInterval * 1000} ميلي ثانية` : 
        `${newInterval} ثانية`
      toast.success(`تم تغيير فترة المزامنة إلى ${displayTime}`)
    }
  }

  const downloadTemplate = async () => {
    try {
      // تحميل ملف Excel الجاهز
      const response = await fetch('/قالب_السير_الذاتية_الكامل.xlsx')
      
      if (response.ok) {
        const blob = await response.blob()
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'قالب_السير_الذاتية_الكامل.xlsx')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('تم تحميل قالب Excel بنجاح!')
      } else {
        // إذا لم يكن الملف متوفراً، أنشئ CSV بسيط
        const csvData = `الاسم الكامل,الاسم بالعربية,البريد الإلكتروني,رقم الهاتف,رمز المرجع,الراتب الشهري,فترة العقد,المنصب,رقم جواز السفر,تاريخ إصدار الجواز,تاريخ انتهاء الجواز,مكان إصدار الجواز,الجنسية,الديانة,تاريخ الميلاد,مكان الميلاد,مكان السكن,الحالة الاجتماعية,عدد الأطفال,الوزن,الطول,لون البشرة,العمر,مستوى الإنجليزية,مستوى العربية,رعاية الأطفال,رعاية الأطفال المتقدمة,التدريس,رعاية ذوي الاحتياجات الخاصة,التنظيف,الغسيل,الكي,الطبخ العربي,الخياطة,القيادة,الخبرة السابقة,الخبرة,التعليم,المهارات,الملخص,الأولوية,ملاحظات,رابط الفيديو
فاطمة أحمد محمد,فاطمة أحمد محمد,fatima@email.com,+201234567890,FA001,2500,24 شهر,مربية أطفال,A12345678,2020-01-15,2030-01-15,القاهرة,مصرية,مسلمة,1990-05-20,القاهرة,الجيزة,متزوجة,2,65 كيلو,165 سم,سمراء,34,نعم,نعم,نعم,نعم,مستعدة,لا,نعم,نعم,نعم,نعم,مستعدة,لا,السعودية 2018-2020,6 سنوات في رعاية الأطفال,دبلوم تجارة,رعاية الأطفال والطبخ,مربية محترفة,عالية,خبرة ممتازة,https://youtube.com/watch?v=example1`

        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'قالب_السير_الذاتية.csv')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('تم تحميل قالب CSV بنجاح!')
      }
    } catch (error) {
      toast.error('فشل في تحميل القالب')
      console.error('Download error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <FileSpreadsheet className="h-6 w-6 text-success ml-3" />
              <h1 className="text-xl font-semibold text-foreground">مزامنة Google Sheets</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* إعدادات المزامنة التلقائية */}
              <div className="flex items-center space-x-3 bg-background rounded-lg p-3">
                <button
                  onClick={toggleAutoSync}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors ${
                    autoSync 
                      ? 'text-success bg-success/10 hover:bg-green-200' 
                      : 'text-foreground bg-muted hover:bg-gray-200'
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ml-2 ${autoSync ? 'animate-spin' : ''}`} />
                  {autoSync ? 'مزامنة تلقائية مفعلة' : 'تفعيل المزامنة التلقائية'}
                </button>
                
                {autoSync && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">كل</span>
                    <select
                      value={syncInterval}
                      onChange={(e) => handleIntervalChange(parseFloat(e.target.value))}
                      className="text-sm border border-border rounded px-2 py-1 bg-card"
                    >
                      <option value={0.5}>500 ميلي ثانية ⚡</option>
                      <option value={1}>1 ثانية ⚡</option>
                      <option value={2}>2 ثانية</option>
                      <option value={5}>5 ثواني</option>
                      <option value={10}>10 ثواني</option>
                      <option value={30}>30 ثانية</option>
                      <option value={60}>1 دقيقة</option>
                      <option value={300}>5 دقائق</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* إعدادات المزامنة */}
          <div className="bg-card shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-foreground mb-6">
                أدوات Google Sheets
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* بطاقة فتح Google Sheets */}
                <div className="text-center">
                  <button
                    onClick={() => window.open('https://docs.google.com/spreadsheets', '_blank')}
                    className="w-full inline-flex flex-col items-center justify-center px-6 py-8 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <FileSpreadsheet className="h-12 w-12 mb-3" />
                    <span className="text-lg font-semibold">فتح Google Sheets</span>
                    <span className="text-sm opacity-90 mt-1">إنشاء أو تعديل الشيت</span>
                  </button>
                </div>

                {/* بطاقة تحميل القالب */}
                <div className="text-center">
                  <button
                    onClick={downloadTemplate}
                    className="w-full inline-flex flex-col items-center justify-center px-6 py-8 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <Download className="h-12 w-12 mb-3" />
                    <span className="text-lg font-semibold">تحميل القالب</span>
                    <span className="text-sm opacity-90 mt-1">Excel مع 43 حقل + فيديو</span>
                  </button>
                </div>

                {/* بطاقة المزامنة */}
                <div className="text-center">
                  <button
                    onClick={handleSync}
                    disabled={isLoading}
                    className="w-full inline-flex flex-col items-center justify-center px-6 py-8 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-12 w-12 mb-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-12 w-12 mb-3" />
                    )}
                    <span className="text-lg font-semibold">
                      {isLoading ? 'جاري المزامنة...' : 'مزامنة البيانات'}
                    </span>
                    <span className="text-sm opacity-90 mt-1">
                      {isLoading ? 'يرجى الانتظار' : 'استيراد من الشيت'}
                    </span>
                  </button>
                </div>
              </div>
              
              {/* تعليمات سريعة */}
              <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-border">
                <h4 className="text-md font-semibold text-foreground mb-4 flex items-center">
                  <Settings className="h-5 w-5 ml-2 text-info" />
                  خطوات الاستخدام السريع
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-success/10 text-success rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium text-foreground">حمل القالب</p>
                      <p className="text-muted-foreground">احصل على ملف Excel مع 43 حقل جاهز</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium text-foreground">أضف البيانات</p>
                      <p className="text-muted-foreground">املأ الحقول في Google Sheets</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-info/10 text-info rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium text-foreground">زامن البيانات</p>
                      <p className="text-muted-foreground">استورد السير الذاتية للنظام</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* إحصائيات المزامنة التلقائية */}
          {syncStats && autoSync && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-info/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <RefreshCw className="h-5 w-5 text-info ml-2 animate-spin" />
                إحصائيات المزامنة التلقائية
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-success">{syncStats.totalSynced}</div>
                  <div className="text-sm text-muted-foreground">سير ذاتية جديدة</div>
                </div>
                
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-info">{syncStats.totalUpdated}</div>
                  <div className="text-sm text-muted-foreground">سير ذاتية محدثة</div>
                </div>
                
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-destructive">{syncStats.errors.length}</div>
                  <div className="text-sm text-muted-foreground">أخطاء</div>
                </div>
                
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-medium text-foreground">آخر مزامنة</div>
                  <div className="text-xs text-muted-foreground">{syncStats.lastSync.toLocaleString('ar-EG')}</div>
                </div>
              </div>
              
              {syncStats.errors.length > 0 && (
                <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-destructive mb-2">آخر الأخطاء:</h4>
                  <ul className="text-xs text-destructive space-y-1 max-h-20 overflow-y-auto">
                    {syncStats.errors.slice(-3).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* معلومات آخر مزامنة يدوية */}
          {lastSync && !autoSync && (
            <div className="bg-info/10 border border-info/30 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-info ml-2" />
                <span className="text-sm text-info">
                  آخر مزامنة يدوية: {lastSync}
                </span>
              </div>
            </div>
          )}

          {/* نتائج المزامنة */}
          {syncResult && (
            <div className="bg-card shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
                  نتائج المزامنة
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-success ml-2" />
                      <div>
                        <p className="text-sm font-medium text-success">سير ذاتية جديدة</p>
                        <p className="text-2xl font-bold text-green-900">{syncResult.synced}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-info/10 border border-info/30 rounded-lg p-4">
                    <div className="flex items-center">
                      <RefreshCw className="h-5 w-5 text-info ml-2" />
                      <div>
                        <p className="text-sm font-medium text-info">سير ذاتية محدثة</p>
                        <p className="text-2xl font-bold text-blue-900">{syncResult.updated}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-destructive ml-2" />
                      <div>
                        <p className="text-sm font-medium text-destructive">أخطاء</p>
                        <p className="text-2xl font-bold text-red-900">{syncResult.errors.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* عرض الأخطاء */}
                {syncResult.errors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-destructive mb-2">الأخطاء:</h4>
                    <ul className="text-sm text-destructive space-y-1">
                      {syncResult.errors.map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 ml-2">•</span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* تعليمات الاستخدام */}
          <div className="bg-card shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
                كيفية الاستخدام
              </h3>
              
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start">
                  <span className="bg-info/10 text-info text-xs font-medium px-2 py-1 rounded ml-3 mt-0.5">1</span>
                  <div>
                    <p className="font-medium text-foreground">إنشاء Google Sheet</p>
                    <p>قم بإنشاء Google Sheet جديد وتأكد من أن العمود الأول يحتوي على العناوين المطلوبة</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="bg-info/10 text-info text-xs font-medium px-2 py-1 rounded ml-3 mt-0.5">2</span>
                  <div>
                    <p className="font-medium text-foreground">إعداد المشاركة</p>
                    <p>شارك الشيت مع البريد الإلكتروني الخاص بالخدمة وامنحه صلاحية التحرير</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="bg-info/10 text-info text-xs font-medium px-2 py-1 rounded ml-3 mt-0.5">3</span>
                  <div>
                    <p className="font-medium text-foreground">إضافة البيانات</p>
                    <p>أضف البيانات في الشيت واضغط على "مزامنة من Google Sheets" لاستيرادها</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="bg-info/10 text-info text-xs font-medium px-2 py-1 rounded ml-3 mt-0.5">4</span>
                  <div>
                    <p className="font-medium text-foreground">المزامنة التلقائية</p>
                    <p>فعل المزامنة التلقائية لتحديث البيانات كل فترة زمنية محددة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
