'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CVStatus, Priority, SkillLevel } from '@prisma/client'
import { 
  ArrowLeft, 
  Eye, 
  MessageCircle, 
  Download, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Settings,
  Share2,
  Copy,
  ExternalLink,
  Play,
  X,
  LayoutDashboard
} from 'lucide-react'
import CountryFlag from '../../components/CountryFlag'
import { processImageUrl } from '@/lib/url-utils'

interface CV {
  id: string
  fullName: string
  fullNameArabic?: string
  email?: string
  phone?: string
  referenceCode?: string
  monthlySalary?: string
  contractPeriod?: string
  position?: string
  nationality?: string
  maritalStatus?: string
  age?: number
  profileImage?: string
  status: CVStatus
  priority: Priority
  // مهارات اختيارية
  babySitting?: SkillLevel
  childrenCare?: SkillLevel
  tutoring?: SkillLevel
  disabledCare?: SkillLevel
  cleaning?: SkillLevel
  washing?: SkillLevel
  ironing?: SkillLevel
  arabicCooking?: SkillLevel
  sewing?: SkillLevel
  driving?: SkillLevel
  elderCare?: SkillLevel
  housekeeping?: SkillLevel
  cooking?: SkillLevel
  // خصائص إضافية
  experience?: string
  arabicLevel?: SkillLevel
  englishLevel?: SkillLevel
  religion?: string
  educationLevel?: string
  passportNumber?: string
  passportExpiryDate?: string
  height?: string
  weight?: string
  numberOfChildren?: number
  livingTown?: string
  placeOfBirth?: string
  videoLink?: string
}

export default function GalleryPage() {
  const router = useRouter()
  const [cvs, setCvs] = useState<CV[]>([])
  const [filteredCvs, setFilteredCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<CVStatus | 'ALL'>('ALL')
  const [nationalityFilter, setNationalityFilter] = useState<string>('ALL')
  const [referenceCodeFilter, setReferenceCodeFilter] = useState<string>('ALL')
  const [availableReferenceCodes, setAvailableReferenceCodes] = useState<{referenceCode: string, count: number}[]>([])
  
  // رقم الواتساب المخصص للمعرض
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const salesPageId = 'gallery'

  // جلب رقم الواتساب المخصص
  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      try {
        const response = await fetch(`/api/sales-config/${salesPageId}`)
        if (response.ok) {
          const data = await response.json()
          setWhatsappNumber(data.whatsappNumber || '')
        }
      } catch (error) {
        console.error('Error fetching WhatsApp number:', error)
      }
    }

    fetchWhatsappNumber()
  }, [])

  // فحص حالة تسجيل الدخول
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            setIsLoggedIn(true)
          } else {
            setIsLoggedIn(false)
          }
        } catch (error) {
          setIsLoggedIn(false)
        }
      }
    }
    
    checkAuthStatus()
  }, [])

  // جلب الأرقام المرجعية المتاحة
  useEffect(() => {
    const fetchReferenceCodes = async () => {
      try {
        const response = await fetch('/api/gallery/reference-codes')
        if (response.ok) {
          const data = await response.json()
          setAvailableReferenceCodes(data.referenceCodes || [])
        }
      } catch (error) {
        console.error('Error fetching reference codes:', error)
      }
    }

    fetchReferenceCodes()
  }, [])

  // جلب السير الذاتية
  useEffect(() => {
    const fetchCVs = async () => {
      try {
        setIsLoading(true)
        let url = '/api/gallery'
        
        // إضافة فلتر الرقم المرجعي إلى URL
        if (referenceCodeFilter !== 'ALL') {
          url += `?referenceCode=${encodeURIComponent(referenceCodeFilter)}`
        }
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('فشل في جلب السير الذاتية')
        }
        
        const data = await response.json()
        
        // تجنب التكرار - تأكد من أن كل سيرة ذاتية لها id فريد
        const uniqueCvs = data.filter((cv: CV, index: number, self: CV[]) => 
          index === self.findIndex(c => c.id === cv.id)
        )
        
        setCvs(uniqueCvs)
        setFilteredCvs(uniqueCvs)
      } catch (error) {
        console.error('Error fetching CVs:', error)
        toast.error('فشل في جلب السير الذاتية')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCVs()
  }, [referenceCodeFilter])

  // فلترة السير الذاتية
  useEffect(() => {
    let filtered = cvs.filter(cv => {
      // البحث النصي
      const matchesSearch = searchTerm === '' || 
        cv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.fullNameArabic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.phone?.toLowerCase().includes(searchTerm.toLowerCase())

      // فلاتر أساسية
      const matchesStatus = statusFilter === 'ALL' || cv.status === statusFilter
      const matchesNationality = nationalityFilter === 'ALL' || cv.nationality === nationalityFilter

      return matchesSearch && matchesStatus && matchesNationality
    })

    setFilteredCvs(filtered)
  }, [cvs, searchTerm, statusFilter, nationalityFilter])

  // إرسال رسالة واتساب
  const sendWhatsAppMessage = (cv: CV) => {
    if (!whatsappNumber) {
      toast.error('لم يتم تعيين رقم واتساب للمعرض')
      return
    }

    const message = `مرحباً، أريد الاستفسار عن هذه السيرة الذاتية:

👤 الاسم: ${cv.fullName}
${cv.fullNameArabic ? `🏷️ الاسم العربي: ${cv.fullNameArabic}` : ''}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
${cv.age ? `🎂 العمر: ${cv.age} سنة` : ''}
${cv.referenceCode ? `🆔 الكود المرجعي: ${cv.referenceCode}` : ''}

من معرض الاسناد السريع`

    const cleanNumber = whatsappNumber.replace(/^\+/, '')
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // تحميل سيرة ذاتية واحدة - تحميل مباشر محسن
  const downloadSingleCV = async (cv: CV) => {
    const toastId = toast.loading('جاري إنشاء صورة السيرة الذاتية...')

    try {
      if (isLoggedIn) {
        // للمسجلين: محاولة تحميل مباشر من API أولاً
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/cv/${cv.id}/alqaeid-image`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const blob = await response.blob()
            if (blob.size > 5000) { // التحقق من أن الملف ليس فارغاً
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `AlQaeid_CV_${cv.fullName}_${cv.referenceCode}.png`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
              
              toast.success('تم تحميل قالب القعيد الكامل', { id: toastId })
              return
            }
          }
        } catch (apiError) {
          console.warn('API download failed, using fallback:', apiError)
        }
        
        // fallback: فتح صفحة العرض مع التحميل التلقائي
        const cvUrl = `/gallery/cv/${cv.id}?autoDownload=true`
        const cvWindow = window.open(cvUrl, '_blank', 'width=1200,height=800')
        
        setTimeout(() => {
          if (cvWindow) cvWindow.close()
        }, 5000)
        
        toast.success('تم فتح القالب للتحميل', { id: toastId })
      } else {
        // للزوار: إنشاء نسخة تجريبية مباشرة
        await createTrialCvImage(cv)
        toast.success('تم تحميل النسخة التجريبية', { id: toastId })
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('حدث خطأ أثناء التحميل', { id: toastId })
    }
  }

  // إنشاء نسخة تجريبية محسنة للزوار
  const createTrialCvImage = async (cv: CV) => {
    return new Promise<void>((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }

      // إعداد الكانفاس بالأبعاد الأصلية
      canvas.width = 1459  // الأبعاد الأصلية
      canvas.height = 2048  // الأبعاد الأصلية
      
      // خلفية بيضاء
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // رأس السيرة الذاتية مع تدرج
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      gradient.addColorStop(0, '#2563eb')
      gradient.addColorStop(1, '#3730a3')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, 300)
      
      // النص الأبيض في الرأس - مكبر للأبعاد الجديدة
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(cv.fullName || 'سيرة ذاتية', canvas.width / 2, 90)
      
      ctx.font = '36px Arial'
      ctx.fillText(cv.nationality || '', canvas.width / 2, 150)
      ctx.fillText(cv.position || 'عاملة منزلية', canvas.width / 2, 195)
      ctx.fillText(`كود مرجعي: ${cv.referenceCode || ''}`, canvas.width / 2, 240)
      
      // المحتوى الرئيسي مع مساحة أكبر - مكبر للأبعاد الجديدة
      ctx.fillStyle = '#1f2937'
      ctx.font = '32px Arial'
      ctx.textAlign = 'right'
      
      let y = 400
      const rightMargin = canvas.width - 80
      const lineHeight = 60
      
      // عنوان القسم
      ctx.fillStyle = '#2563eb'
      ctx.font = 'bold 36px Arial'
      ctx.fillText('المعلومات الشخصية', rightMargin, y)
      y += lineHeight + 20
      
      ctx.fillStyle = '#1f2937'
      ctx.font = '30px Arial'
      
      // معلومات أساسية مع مساحة أكبر
      if (cv.age) {
        ctx.fillText(`العمر: ${cv.age} سنة`, rightMargin, y)
        y += lineHeight
      }
      
      if (cv.maritalStatus) {
        ctx.fillText(`الحالة الاجتماعية: ${cv.maritalStatus}`, rightMargin, y)
        y += lineHeight
      }
      
      if (cv.religion) {
        ctx.fillText(`الديانة: ${cv.religion}`, rightMargin, y)
        y += lineHeight
      }
      
      if (cv.educationLevel) {
        ctx.fillText(`التعليم: ${cv.educationLevel}`, rightMargin, y)
        y += lineHeight
      }
      
      // إضافة معلومات إضافية
      if (cv.experience) {
        y += 30
        ctx.fillStyle = '#2563eb'
        ctx.font = 'bold 36px Arial'
        ctx.fillText('الخبرة', rightMargin, y)
        y += lineHeight
        
        ctx.fillStyle = '#1f2937'
        ctx.font = '30px Arial'
        ctx.fillText(`${cv.experience}`, rightMargin, y)
        y += lineHeight
      }
      
      // علامات مائية متعددة للنسخة التجريبية - مكبرة للأبعاد الجديدة
      ctx.save()
      ctx.globalAlpha = 0.15
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 60px Arial'
      ctx.textAlign = 'center'
      
      // علامة مائية مركزية
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(-Math.PI / 6)
      ctx.fillText('نسخة تجريبية', 0, -40)
      ctx.fillText('للنسخة الكاملة سجل دخولك', 0, 40)
      ctx.restore()
      
      // علامات مائية إضافية
      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.fillStyle = '#3730a3'
      ctx.font = 'bold 45px Arial'
      ctx.textAlign = 'center'
      
      // علامة علوية
      ctx.translate(canvas.width / 2, 500)
      ctx.rotate(-Math.PI / 8)
      ctx.fillText('الاسناد السريع', 0, 0)
      ctx.restore()
      
      // علامة سفلية
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height - 300)
      ctx.rotate(Math.PI / 8)
      ctx.fillText('نسخة تجريبية', 0, 0)
      ctx.restore()
      
      // تذييل محسن - مكبر للأبعاد الجديدة
      ctx.fillStyle = '#6b7280'
      ctx.font = 'bold 30px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('الاسناد السريع', canvas.width / 2, canvas.height - 100)
      
      ctx.font = '24px Arial'
      ctx.fillText('للحصول على النسخة الكاملة يرجى تسجيل الدخول', canvas.width / 2, canvas.height - 50)
      
      // تحميل الصورة
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `Trial_CV_${cv.fullName || 'Unknown'}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          resolve()
        } else {
          reject(new Error('Failed to create blob'))
        }
      }, 'image/png', 1.0)
    })
  }

  // مشاركة سيرة ذاتية
  const shareSingleCV = (cv: CV) => {
    const shareText = `🔗 مشاركة سيرة ذاتية من معرض الاسناد السريع

👤 الاسم: ${cv.fullName}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
${cv.age ? `🎂 العمر: ${cv.age} سنة` : ''}
${cv.referenceCode ? `🆔 الكود المرجعي: ${cv.referenceCode}` : ''}

🌐 رابط السيرة: ${window.location.origin}/gallery/cv/${cv.id}
${whatsappNumber ? `📱 للحجز عبر واتساب: ${whatsappNumber}` : ''}

#الاسناد_السريع #عمالة_منزلية`

    if (navigator.share) {
      navigator.share({
        title: `سيرة ذاتية - ${cv.fullName}`,
        text: shareText,
        url: `${window.location.origin}/gallery/cv/${cv.id}`
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success('تم نسخ رابط المشاركة')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل السير الذاتية...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">العودة للرئيسية</span>
              </button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <h1 className="text-xl font-bold text-foreground">معرض السير الذاتية</h1>
              
              {whatsappNumber && (
                <div className="bg-green-100 px-3 py-1 rounded-lg">
                  <span className="text-sm font-medium text-green-700">
                    واتساب: {whatsappNumber}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {filteredCvs.length} سيرة ذاتية
              </span>
              
              {isLoggedIn && (
                <>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">لوحة التحكم</span>
                  </button>
                  <button
                    onClick={() => router.push('/gallery/settings')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">الإعدادات</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="البحث في السير الذاتية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Reference Code Filter */}
            {availableReferenceCodes.length > 0 && (
              <select
                value={referenceCodeFilter}
                onChange={(e) => setReferenceCodeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">جميع الأرقام المرجعية</option>
                {availableReferenceCodes.map(({ referenceCode, count }) => (
                  <option key={referenceCode} value={referenceCode}>
                    {referenceCode} ({count})
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CVStatus | 'ALL')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="NEW">جديد</option>
              <option value="RETURNED">معاد</option>
            </select>

            {/* Nationality Filter */}
            <select
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">جميع الجنسيات</option>
              {Array.from(new Set(cvs.map(cv => cv.nationality).filter(Boolean))).map(nationality => (
                <option key={nationality} value={nationality}>{nationality}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                شبكة
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
                قائمة
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredCvs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
            <p className="text-gray-600">
              {searchTerm || referenceCodeFilter !== 'ALL' || statusFilter !== 'ALL' || nationalityFilter !== 'ALL'
                ? 'جرب تغيير معايير البحث أو الفلاتر'
                : 'لا توجد سير ذاتية متاحة حالياً'
              }
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredCvs.map((cv) => (
              <div
                key={cv.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${
                  viewMode === 'list' ? 'p-6' : 'p-4'
                }`}
              >
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="space-y-4">
                    {/* Profile Image */}
                    <div className="flex justify-center">
                      {cv.profileImage ? (
                        <img
                          src={processImageUrl(cv.profileImage)}
                          alt={cv.fullName}
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-2xl">👤</span>
                        </div>
                      )}
                    </div>

                    {/* CV Info */}
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{cv.fullName}</h3>
                      {cv.fullNameArabic && (
                        <p className="text-sm text-gray-600">{cv.fullNameArabic}</p>
                      )}
                      <div className="flex items-center justify-center gap-2">
                        <CountryFlag nationality={cv.nationality || ''} />
                        <span className="text-sm text-gray-600">{cv.nationality}</span>
                      </div>
                      <p className="text-sm text-gray-600">{cv.position}</p>
                      {cv.age && <p className="text-xs text-gray-500">{cv.age} سنة</p>}
                      {cv.referenceCode && (
                        <p className="text-xs text-blue-600 font-medium">{cv.referenceCode}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/gallery/cv/${cv.id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        عرض
                      </button>
                      
                      <button
                        onClick={() => downloadSingleCV(cv)}
                        className={`${
                          isLoggedIn 
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-gray-500 hover:bg-gray-600'
                        } text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center`}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => shareSingleCV(cv)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      {cv.videoLink && 
                       cv.videoLink.trim() !== '' && 
                       cv.videoLink !== 'undefined' && 
                       cv.videoLink !== 'null' &&
                       (cv.videoLink.includes('drive.google.com') || 
                        cv.videoLink.includes('youtube.com') || 
                        cv.videoLink.includes('youtu.be') || 
                        cv.videoLink.includes('vimeo.com') ||
                        cv.videoLink.includes('.mp4') ||
                        cv.videoLink.includes('.webm')) && (
                        <button
                          onClick={() => setSelectedVideo(cv.videoLink || null)}
                          className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                          title="مشاهدة الفيديو"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* WhatsApp Button */}
                    <button
                      onClick={() => sendWhatsAppMessage(cv)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      للحجز والطلب
                    </button>
                  </div>
                ) : (
                  // List View
                  <div className="flex items-center gap-4">
                    {/* Profile Image */}
                    {cv.profileImage ? (
                      <img
                        src={processImageUrl(cv.profileImage)}
                        alt={cv.fullName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xl">👤</span>
                      </div>
                    )}

                    {/* CV Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{cv.fullName}</h3>
                      <p className="text-sm text-gray-600">{cv.nationality} • {cv.position}</p>
                      {cv.referenceCode && <p className="text-xs text-blue-600">{cv.referenceCode}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/gallery/cv/${cv.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        عرض
                      </button>
                      <button
                        onClick={() => downloadSingleCV(cv)}
                        className={`${
                          isLoggedIn 
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-gray-500 hover:bg-gray-600'
                        } text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        {isLoggedIn ? 'تحميل قالب القعيد' : 'تحميل تجريبي'}
                      </button>
                      <button
                        onClick={() => shareSingleCV(cv)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        مشاركة
                      </button>
                      <button
                        onClick={() => sendWhatsAppMessage(cv)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        للحجز والطلب
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">فيديو السيرة الذاتية</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="aspect-video w-full">
                {selectedVideo.includes('youtube.com') || selectedVideo.includes('youtu.be') ? (
                  <iframe
                    src={selectedVideo.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allowFullScreen
                    title="فيديو السيرة الذاتية"
                  />
                ) : selectedVideo.includes('drive.google.com') ? (
                  <iframe
                    src={(() => {
                      // تحويل رابط Google Drive إلى embed
                      // مثال: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
                      // إلى: https://drive.google.com/file/d/FILE_ID/preview
                      const fileIdMatch = selectedVideo.match(/\/file\/d\/([^\/]+)/);
                      if (fileIdMatch && fileIdMatch[1]) {
                        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
                      }
                      // إذا كان الرابط بصيغة أخرى، حاول استخدامه كما هو
                      return selectedVideo.replace('/view', '/preview').replace('?usp=sharing', '');
                    })()}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allowFullScreen
                    title="فيديو السيرة الذاتية"
                  />
                ) : selectedVideo.includes('vimeo.com') ? (
                  <iframe
                    src={selectedVideo.replace('vimeo.com/', 'player.vimeo.com/video/')}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allowFullScreen
                    title="فيديو السيرة الذاتية"
                  />
                ) : (
                  <video
                    src={selectedVideo}
                    controls
                    className="w-full h-full rounded-lg"
                    preload="metadata"
                  >
                    متصفحك لا يدعم تشغيل الفيديو
                  </video>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
