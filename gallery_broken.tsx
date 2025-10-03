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
  Grid3X3, 
  List, 
  Archive,
  SlidersHorizontal,
  Star,
  Heart,
  Globe,
  BookOpen,
  X,
  Settings,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react'
import CountryFlag from '../../components/CountryFlag'

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
  babySitting?: SkillLevel
  childrenCare?: SkillLevel
  cleaning?: SkillLevel
  arabicCooking?: SkillLevel
  driving?: SkillLevel
  experience?: string
  arabicLevel?: SkillLevel
  englishLevel?: SkillLevel
  religion?: string
  educationLevel?: string
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
  const [skillFilter, setSkillFilter] = useState<string>('ALL')
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<string>('ALL')
  const [ageFilter, setAgeFilter] = useState<string>('ALL')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [languageFilter, setLanguageFilter] = useState<string>('ALL')
  const [educationFilter, setEducationFilter] = useState<string>('ALL')
  
  const [selectedCvs, setSelectedCvs] = useState<string[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const salesPageId = 'gallery' // معرف صفحة المعرض للإعدادات

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
            localStorage.removeItem('token')
            setIsLoggedIn(false)
          }
        } catch (error) {
          localStorage.removeItem('token')
          setIsLoggedIn(false)
        }
      } else {
        setIsLoggedIn(false)
      }
    }
    
    checkAuthStatus()
  }, [])

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
        // في حالة عدم وجود إعدادات، استخدم رقم افتراضي
        setWhatsappNumber('')
      }
    }
    
    fetchWhatsappNumber()
  }, [])

  useEffect(() => {
    const fetchCVs = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/gallery')
        if (!response.ok) {
          throw new Error('فشل في جلب السير الذاتية')
        }
        const data = await response.json()
        setCvs(data)
        setFilteredCvs(data)
      } catch (error) {
        console.error('Error fetching CVs:', error)
        toast.error('فشل في جلب السير الذاتية')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCVs()
  }, [])

  useEffect(() => {
    filterCVs()
  }, [cvs, searchTerm, statusFilter, nationalityFilter, skillFilter, maritalStatusFilter, ageFilter, languageFilter, educationFilter])
  const filterCVs = () => {
    let filtered = cvs.filter(cv => {
      const matchesSearch = searchTerm === '' || 
        cv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.fullNameArabic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'ALL' || cv.status === statusFilter
      const matchesNationality = nationalityFilter === 'ALL' || cv.nationality === nationalityFilter
      const matchesMaritalStatus = maritalStatusFilter === 'ALL' || cv.maritalStatus === maritalStatusFilter
      
      const matchesAge = ageFilter === 'ALL' || (() => {
        if (!cv.age) return false
        switch (ageFilter) {
          case '18-25': return cv.age >= 18 && cv.age <= 25
          case '26-35': return cv.age >= 26 && cv.age <= 35
          case '36-45': return cv.age >= 36 && cv.age <= 45
          case '46+': return cv.age >= 46
          default: return true
        }
      })()

      const matchesSkill = skillFilter === 'ALL' || (() => {
        switch (skillFilter) {
          case 'babySitting': return cv.babySitting && cv.babySitting !== SkillLevel.NO
          case 'childrenCare': return cv.childrenCare && cv.childrenCare !== SkillLevel.NO
          case 'cleaning': return cv.cleaning && cv.cleaning !== SkillLevel.NO
          case 'cooking': return cv.arabicCooking && cv.arabicCooking !== SkillLevel.NO
          case 'driving': return cv.driving && cv.driving !== SkillLevel.NO
          default: return true
        }
      })()

      const matchesLanguage = languageFilter === 'ALL' || (() => {
        switch (languageFilter) {
          case 'arabic': return cv.arabicLevel && cv.arabicLevel !== SkillLevel.NO
          case 'english': return cv.englishLevel && cv.englishLevel !== SkillLevel.NO
          default: return true
        }
      })()

      const matchesEducation = educationFilter === 'ALL' || cv.educationLevel === educationFilter

      return matchesSearch && matchesStatus && matchesNationality && matchesMaritalStatus && 
             matchesAge && matchesSkill && matchesLanguage && matchesEducation
    })

    setFilteredCvs(filtered)
  }

  const sendWhatsAppMessage = (cv: CV) => {
    const message = `مرحباً، أريد الاستفسار عن هذه السيرة الذاتية:

👤 الاسم: ${cv.fullName}
${cv.fullNameArabic ? `🏷️ الاسم العربي: ${cv.fullNameArabic}` : ''}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
🎂 العمر: ${cv.age || 'غير محدد'} سنة
🆔 الكود المرجعي: ${cv.referenceCode || 'غير محدد'}

من معرض الاسناد السريع`

    const encodedMessage = encodeURIComponent(message)
    if (!whatsappNumber) {
      toast.error('لم يتم تعيين رقم واتساب للمعرض. يرجى التواصل مع الإدارة.')
      return
    }
    
    const phoneNumber = whatsappNumber.replace(/^\+/, '')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  const downloadSingleCV = async (cv: CV) => {
    try {
      if (isLoggedIn) {
        // محاولة تحميل قالب القعيد الكامل
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/cv/${cv.id}/alqaeid-image`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const blob = await response.blob()
          if (blob.size > 10000 && blob.type === 'image/png') {
            // تحميل قالب القعيد بنجاح
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `AlQaeid_CV_${cv.fullName.replace(/\s+/g, '_')}_${cv.referenceCode || 'NoRef'}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            
            toast.success(`✅ تم تحميل قالب القعيد الكامل لـ ${cv.fullName}`)
            return
          }
        }
        
        // Fallback للنسخة المميزة
        toast('⚠️ فشل في تحميل قالب القعيد، سيتم تحميل النسخة المميزة')
        // هنا يمكن إضافة منطق النسخة المميزة
        
      } else {
        toast('يرجى تسجيل الدخول للحصول على قالب القعيد الكامل', { icon: 'ℹ️' })
        // هنا يمكن إضافة منطق النسخة التجريبية
      }
    } catch (error) {
      console.error('Error downloading CV:', error)
      toast.error('حدث خطأ أثناء التحميل')
    }
  }

  // تبديل تحديد السيرة الذاتية
  const toggleCvSelection = (cvId: string) => {
    setSelectedCvs(prev => 
      prev.includes(cvId) 
        ? prev.filter(id => id !== cvId)
        : [...prev, cvId]
    )
  }

  // وظيفة مشاركة سيرة ذاتية واحدة
  const shareSingleCV = (cv: CV) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const cvUrl = `${origin}/gallery/cv/${cv.id}`
    
    const shareText = `🔗 مشاركة سيرة ذاتية من معرض الاسناد السريع

👤 الاسم: ${cv.fullName}
${cv.fullNameArabic ? `🏷️ الاسم العربي: ${cv.fullNameArabic}` : ''}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
🎂 العمر: ${cv.age || 'غير محدد'} سنة
🆔 الكود المرجعي: ${cv.referenceCode || 'غير محدد'}

🔗 رابط السيرة الذاتية: ${cvUrl}
🌐 المعرض الكامل: ${origin}/gallery
${whatsappNumber ? `📱 للحجز عبر واتساب: ${whatsappNumber}` : ''}

#الاسناد_السريع #عمالة_منزلية`

    // محاولة استخدام Web Share API
    if (navigator.share) {
      navigator.share({
        title: `سيرة ذاتية - ${cv.fullName} | الاسناد السريع`,
        text: shareText,
        url: cvUrl
      }).catch(error => {
        console.error('Error sharing:', error)
        copyToClipboard(shareText)
      })
    } else {
      // fallback: نسخ النص
      copyToClipboard(shareText)
    }
  }

  // وظيفة نسخ النص للحافظة
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('تم نسخ معلومات السيرة الذاتية')
      }).catch(() => {
        fallbackCopyTextToClipboard(text)
      })
    } else {
      fallbackCopyTextToClipboard(text)
    }
  }

  // fallback لنسخ النص في المتصفحات القديمة
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      toast.success('تم نسخ معلومات السيرة الذاتية')
    } catch (err) {
      toast.error('فشل في نسخ النص')
    }
    
    document.body.removeChild(textArea)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل السير الذاتية...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header - يظهر فقط للمستخدمين المسجلين */}
        {isLoggedIn && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </button>
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate">
                  المعرض الرئيسي - معرض السير الذاتية
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">عرض جميع السير الذاتية مع إمكانية الحجز عبر واتساب</p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {filteredCvs.length} سيرة
                  </span>
                </div>
                
                {/* زر الإعدادات */}
                <button
                  onClick={() => router.push('/gallery/settings')}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">إعدادات</span>
                </button>
                
                <div className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-shrink-0 ${
                  whatsappNumber ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className={`text-xs sm:text-sm font-medium ${
                    whatsappNumber ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {whatsappNumber ? `واتساب: ${whatsappNumber}` : 'لم يتم تعيين رقم واتساب'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {isLoggedIn ? (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm flex-1 sm:flex-initial justify-center"
                  >
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">العودة للداشبورد</span>
                    <span className="sm:hidden">الداشبورد</span>
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/login')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm flex-1 sm:flex-initial justify-center"
                  >
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">تسجيل الدخول للإدارة</span>
                    <span className="sm:hidden">تسجيل الدخول</span>
                  </button>
                )}
                
                <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <List className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* شريط تحكم بسيط للزوار */}
        {!isLoggedIn && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate">
                    معرض السير الذاتية
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">تصفح السير الذاتية المتاحة</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {filteredCvs.length} سيرة
                  </span>
                </div>
                
                <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="عرض شبكي"
                  >
                    <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="عرض قائمة"
                  >
                    <List className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* البحث والفلاتر */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg ml-3 sm:ml-4 flex-shrink-0">
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                البحث والتصفية
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 hidden sm:block">ابحث وصفي السير الذاتية</p>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <div className="relative group">
              <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 sm:h-6 sm:w-6 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الجنسية، الوظيفة..."
                className="w-full pr-10 sm:pr-14 pl-4 sm:pl-6 py-3 sm:py-5 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white text-sm sm:text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                dir="rtl"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>
          </div>

          {/* الفلاتر السريعة */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            <select
              className="px-3 sm:px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 min-w-0 flex-1 sm:flex-initial"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CVStatus | 'ALL')}
            >
              <option value="ALL">جميع الحالات</option>
              <option value={CVStatus.NEW}>جديد</option>
              <option value={CVStatus.BOOKED}>محجوز</option>
              <option value={CVStatus.REJECTED}>مرفوض</option>
              <option value={CVStatus.RETURNED}>معاد</option>
              <option value={CVStatus.ARCHIVED}>مؤرشف</option>
            </select>

            <select
              className="px-3 sm:px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium text-emerald-700 hover:bg-emerald-100 min-w-0 flex-1 sm:flex-initial"
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
            >
              <option value="ALL">جميع الجنسيات</option>
              <option value="FILIPINO">فلبينية</option>
              <option value="INDIAN">هندية</option>
              <option value="BANGLADESHI">بنغلاديشية</option>
              <option value="ETHIOPIAN">إثيوبية</option>
              <option value="KENYAN">كينية</option>
              <option value="UGANDAN">أوغندية</option>
            </select>

            <select
              className="px-3 sm:px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium text-purple-700 hover:bg-purple-100 min-w-0 flex-1 sm:flex-initial"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <option value="ALL">جميع الأعمار</option>
              <option value="18-25">18-25</option>
              <option value="26-35">26-35</option>
              <option value="36-45">36-45</option>
              <option value="46+">46+</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium transition-all border flex items-center gap-2 min-w-0 flex-1 sm:flex-initial justify-center ${
                showAdvancedFilters
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{showAdvancedFilters ? 'إخفاء الفلاتر' : 'فلاتر متقدمة'}</span>
              <span className="sm:hidden">فلاتر</span>
            </button>
          </div>

          {/* الفلاتر المتقدمة */}
          {showAdvancedFilters && (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border border-indigo-100 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* فلتر المهارات */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-700 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    المهارات
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المهارات</option>
                    <option value="babySitting">رعاية أطفال</option>
                    <option value="childrenCare">العناية بالأطفال</option>
                    <option value="cleaning">تنظيف</option>
                    <option value="arabicCooking">طبخ عربي</option>
                    <option value="driving">قيادة</option>
                    <option value="washing">غسيل</option>
                    <option value="ironing">كي</option>
                    <option value="tutoring">تدريس</option>
                    <option value="disabledCare">رعاية كبار السن</option>
                    <option value="sewing">خياطة</option>
                  </select>
                </div>

                {/* فلتر الحالة الاجتماعية */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-pink-700 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    الحالة الاجتماعية
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={maritalStatusFilter}
                    onChange={(e) => setMaritalStatusFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="SINGLE">أعزب</option>
                    <option value="MARRIED">متزوج</option>
                    <option value="DIVORCED">مطلق</option>
                    <option value="WIDOWED">أرمل</option>
                  </select>
                </div>

                {/* فلتر اللغة */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    اللغة
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                  >
                    <option value="ALL">جميع اللغات</option>
                    <option value="arabic">عربي</option>
                    <option value="english">إنجليزي</option>
                  </select>
                </div>

                {/* فلتر التعليم */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-orange-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    التعليم
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={educationFilter}
                    onChange={(e) => setEducationFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="PRIMARY">ابتدائي</option>
                    <option value="SECONDARY">ثانوي</option>
                    <option value="UNIVERSITY">جامعي</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* عرض السير الذاتية */}
        {filteredCvs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Archive className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد سير ذاتية</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'ALL' || nationalityFilter !== 'ALL' 
                ? 'لا توجد سير ذاتية تطابق معايير البحث الحالية'
                : 'لا توجد سير ذاتية متاحة حالياً'
              }
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6'
              : 'space-y-4'
          }>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-orange-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    التعليم
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={educationFilter}
                    onChange={(e) => setEducationFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="PRIMARY">ابتدائي</option>
                    <option value="SECONDARY">ثانوي</option>
                    <option value="UNIVERSITY">جامعي</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* عرض السير الذاتية */}
        {filteredCvs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Archive className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد سير ذاتية</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'ALL' || nationalityFilter !== 'ALL' 
                ? 'لا توجد سير ذاتية تطابق معايير البحث الحالية'
                : 'لا توجد سير ذاتية متاحة حالياً'
              }
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6'
              : 'space-y-4'
          }>
            {filteredCvs.map((cv) => (
              <div
                key={cv.id}
                className={`bg-white rounded-lg shadow-lg border ${selectedCvs.includes(cv.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'} overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center p-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-200">
                      {cv.profileImage ? (
                        <img
                          src={cv.profileImage}
                          alt={cv.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium">{cv.fullName}</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                        <CountryFlag nationality={cv.nationality || ''} size="sm" />
                      </div>
                      <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
                        <input
                          type="checkbox"
                          className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                          checked={selectedCvs.includes(cv.id)}
                          onChange={() => toggleCvSelection(cv.id)}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-4">
                        <h3 className="text-white font-semibold text-xs sm:text-sm mb-1 truncate">{cv.fullName}</h3>
                        {cv.fullNameArabic && (
                          <p className="text-white/80 text-[10px] sm:text-xs mb-1 truncate hidden sm:block">{cv.fullNameArabic}</p>
                        )}
                        <p className="text-white/70 text-[10px] sm:text-xs truncate">{cv.position || 'غير محدد'}</p>
                      </div>
                    </div>
                    
                    {/* معلومات السيرة */}
                    <div className="p-2 sm:p-4">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[10px] sm:text-xs font-mono bg-gray-100 text-gray-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                          {cv.referenceCode}
                        </span>
                        {cv.age && (
                          <span className="text-[10px] sm:text-xs text-gray-500">{cv.age} سنة</span>
                        )}
                      </div>
                      
                      {/* زر الحجز الرئيسي */}
                      <div className="mb-2">
                        <button
                          onClick={() => sendWhatsAppMessage(cv)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 sm:py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {/* أيقونة الواتساب */}
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                          </svg>
                          <span className="font-bold">للحجز والطلب</span>
                        </button>
                      </div>
                      
                      {/* باقي الأزرار */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => shareSingleCV(cv)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 px-1 sm:px-2 rounded text-[10px] sm:text-xs flex items-center justify-center transition-colors"
                          title="مشاركة السيرة الذاتية"
                        >
                          <Share2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden sm:inline ml-1">مشاركة</span>
                        </button>
                        <button
                          onClick={() => downloadSingleCV(cv)}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-1.5 sm:py-2 px-1 sm:px-2 rounded text-[10px] sm:text-xs flex items-center justify-center transition-colors"
                          title="تحميل السيرة الذاتية"
                        >
                          <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden sm:inline ml-1">تحميل</span>
                        </button>
                        <button
                          onClick={() => router.push(`/gallery/cv/${cv.id}`)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1.5 sm:py-2 px-1 sm:px-2 rounded text-[10px] sm:text-xs flex items-center justify-center transition-colors"
                          title="عرض السيرة الكاملة"
                        >
                          <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden sm:inline ml-1">عرض</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // عرض القائمة
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {cv.profileImage ? (
                        <img src={cv.profileImage} alt={cv.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{cv.fullName}</h3>
                      <p className="text-sm text-gray-600">{cv.nationality} • {cv.position}</p>
                      <p className="text-xs text-gray-500">{cv.referenceCode}</p>
                    </div>
                    <div className="flex items-center space-x-2">
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
      </div>
    </div>
  )
}
