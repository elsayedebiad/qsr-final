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
  Archive,
  SlidersHorizontal,
  Star,
  Heart,
  Globe,
  Calendar,
  BookOpen,
  DollarSign,
  X,
  ChevronDown,
  Share2,
  Copy,
  ExternalLink,
  Play
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
  // خصائص اختيارية ذكرتها في الفلاتر
  experience?: string
  arabicLevel?: SkillLevel
  englishLevel?: SkillLevel
  // خصائص إضافية للفلاتر المتقدمة
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
  cvImageUrl?: string
}

export default function Sales3Page() {
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
  const [experienceFilter, setExperienceFilter] = useState<string>('ALL')
  const [languageFilter, setLanguageFilter] = useState<string>('ALL')
  
  // فلاتر إضافية شاملة
  const [religionFilter, setReligionFilter] = useState<string>('ALL')
  const [educationFilter, setEducationFilter] = useState<string>('ALL')
  const [salaryFilter, setSalaryFilter] = useState<string>('ALL')
  const [contractPeriodFilter, setContractPeriodFilter] = useState<string>('ALL')
  const [passportStatusFilter, setPassportStatusFilter] = useState<string>('ALL')
  const [heightFilter, setHeightFilter] = useState<string>('ALL')
  const [weightFilter, setWeightFilter] = useState<string>('ALL')
  const [childrenFilter, setChildrenFilter] = useState<string>('ALL')
  const [locationFilter, setLocationFilter] = useState<string>('ALL')
  
  // حالة التحميل والتحديد
  const [selectedCvs, setSelectedCvs] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [currentDownloadName, setCurrentDownloadName] = useState('')
  
  // رقم الواتساب المخصص لهذه الصفحة
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const salesPageId = 'sales3'

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
      } else {
        setIsLoggedIn(false)
      }
    }
    
    checkAuthStatus()
  }, [])

  useEffect(() => {
    const fetchCVs = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/gallery/cvs')
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
  }, [])

  // فلترة السير الذاتية - نظام شامل مثل الداشبورد
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
      const matchesMaritalStatus = maritalStatusFilter === 'ALL' || cv.maritalStatus === maritalStatusFilter
      
      // فلتر العمر
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

      // فلتر المهارات
      const matchesSkill = skillFilter === 'ALL' || (() => {
        switch (skillFilter) {
          case 'babySitting': return cv.babySitting && cv.babySitting !== SkillLevel.NO
          case 'childrenCare': return cv.childrenCare && cv.childrenCare !== SkillLevel.NO
          case 'cleaning': return cv.cleaning && cv.cleaning !== SkillLevel.NO
          case 'arabicCooking': return cv.arabicCooking && cv.arabicCooking !== SkillLevel.NO
          case 'driving': return cv.driving && cv.driving !== SkillLevel.NO
          case 'washing': return cv.washing && cv.washing !== SkillLevel.NO
          case 'ironing': return cv.ironing && cv.ironing !== SkillLevel.NO
          case 'tutoring': return cv.tutoring && cv.tutoring !== SkillLevel.NO
          case 'disabledCare': return cv.disabledCare && cv.disabledCare !== SkillLevel.NO
          case 'sewing': return cv.sewing && cv.sewing !== SkillLevel.NO
          default: return true
        }
      })()

      // فلتر الخبرة
      const matchesExperience = experienceFilter === 'ALL' || cv.experience === experienceFilter

      // فلتر اللغة
      const matchesLanguage = languageFilter === 'ALL' || (() => {
        switch (languageFilter) {
          case 'arabic': return cv.arabicLevel && cv.arabicLevel !== SkillLevel.NO
          case 'english': return cv.englishLevel && cv.englishLevel !== SkillLevel.NO
          default: return true
        }
      })()

      // فلتر الديانة
      const matchesReligion = religionFilter === 'ALL' || cv.religion === religionFilter

      // فلتر التعليم
      const matchesEducation = educationFilter === 'ALL' || cv.educationLevel === educationFilter

      // فلتر الراتب
      const matchesSalary = salaryFilter === 'ALL' || (() => {
        if (!cv.monthlySalary) return false
        const salary = parseInt(cv.monthlySalary.replace(/[^0-9]/g, ''))
        switch (salaryFilter) {
          case '0-500': return salary >= 0 && salary <= 500
          case '501-1000': return salary >= 501 && salary <= 1000
          case '1001-1500': return salary >= 1001 && salary <= 1500
          case '1501+': return salary >= 1501
          default: return true
        }
      })()

      // فلتر فترة العقد
      const matchesContractPeriod = contractPeriodFilter === 'ALL' || cv.contractPeriod === contractPeriodFilter

      // فلتر حالة الجواز
      const matchesPassportStatus = passportStatusFilter === 'ALL' || (() => {
        switch (passportStatusFilter) {
          case 'valid': return cv.passportNumber && cv.passportExpiryDate
          case 'expired': return cv.passportNumber && !cv.passportExpiryDate
          case 'none': return !cv.passportNumber
          default: return true
        }
      })()

      // فلتر الطول
      const matchesHeight = heightFilter === 'ALL' || (() => {
        if (!cv.height) return false
        const height = parseInt(cv.height)
        switch (heightFilter) {
          case 'short': return height < 160
          case 'medium': return height >= 160 && height <= 170
          case 'tall': return height > 170
          default: return true
        }
      })()

      // فلتر الوزن
      const matchesWeight = weightFilter === 'ALL' || (() => {
        if (!cv.weight) return false
        const weight = parseInt(cv.weight)
        switch (weightFilter) {
          case 'light': return weight < 60
          case 'medium': return weight >= 60 && weight <= 80
          case 'heavy': return weight > 80
          default: return true
        }
      })()

      // فلتر عدد الأطفال
      const matchesChildren = childrenFilter === 'ALL' || (() => {
        switch (childrenFilter) {
          case '0': return cv.numberOfChildren === 0
          case '1-2': return cv.numberOfChildren && cv.numberOfChildren >= 1 && cv.numberOfChildren <= 2
          case '3+': return cv.numberOfChildren && cv.numberOfChildren >= 3
          default: return true
        }
      })()

      // فلتر الموقع
      const matchesLocation = locationFilter === 'ALL' || 
        cv.livingTown?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        cv.placeOfBirth?.toLowerCase().includes(locationFilter.toLowerCase())

      return matchesSearch && matchesStatus && matchesNationality && matchesMaritalStatus && 
             matchesAge && matchesSkill && matchesExperience && matchesLanguage && 
             matchesReligion && matchesEducation && matchesSalary && matchesContractPeriod && 
             matchesPassportStatus && matchesHeight && matchesWeight && matchesChildren && matchesLocation
    })

    setFilteredCvs(filtered)
  }, [cvs, searchTerm, statusFilter, nationalityFilter, maritalStatusFilter, ageFilter, 
      skillFilter, experienceFilter, languageFilter, religionFilter, educationFilter, 
      salaryFilter, contractPeriodFilter, passportStatusFilter, heightFilter, weightFilter, 
      childrenFilter, locationFilter])

  // إرسال رسالة واتساب
  const sendWhatsAppMessage = (cv: CV) => {
    const message = `مرحباً، أريد الاستفسار عن السيرة الذاتية:
الاسم: ${cv.fullName}
${cv.fullNameArabic ? `الاسم بالعربية: ${cv.fullNameArabic}` : ''}
الكود المرجعي: ${cv.referenceCode}
الجنسية: ${cv.nationality || 'غير محدد'}
الوظيفة: ${cv.position || 'غير محدد'}

من صفحة Sales 1`

    const encodedMessage = encodeURIComponent(message)
    if (!whatsappNumber) {
      toast.error('لم يتم تعيين رقم واتساب لهذه الصفحة. يرجى التواصل مع الإدارة.')
      return
    }
    
    const phoneNumber = whatsappNumber.replace(/^\+/, '') // إزالة + من بداية الرقم
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  // مشاركة سيرة ذاتية واحدة
  const shareSingleCV = async (cv: CV) => {
    const shareUrl = `${window.location.origin}/cv/${cv.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `سيرة ذاتية - ${cv.fullName}`,
          text: `تحقق من هذه السيرة الذاتية: ${cv.fullName} (${cv.nationality})`,
          url: shareUrl,
        })
      } catch (error) {
        console.log('مشاركة ملغاة')
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('تم نسخ الرابط!')
      } catch (error) {
        toast.error('فشل في نسخ الرابط')
      }
    }
  }

  // تحميل سيرة ذاتية واحدة
  const downloadSingleCV = async (cv: CV) => {
    try {
      setCurrentDownloadName(cv.fullName || cv.referenceCode || 'السيرة الذاتية')
      toast.loading('جاري إنشاء صورة السيرة الذاتية...')
      
      // فتح الصفحة في نافذة مخفية للتحميل
      const cvUrl = `/cv/${cv.id}?hideUI=true&autoDownload=true`
      const popup = window.open(cvUrl, '_blank', 'width=1200,height=1600,left=-9999,top=-9999')
      
      // إغلاق النافذة بعد 10 ثوان
      setTimeout(() => {
        if (popup) {
          popup.close()
        }
        toast.dismiss()
        toast.success('تم بدء التحميل')
      }, 10000)
      
    } catch (error) {
      toast.dismiss()
      toast.error('حدث خطأ أثناء التحميل')
    } finally {
      setCurrentDownloadName('')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل السير الذاتية...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header - يظهر فقط للمستخدمين المسجلين */}
        {isLoggedIn && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="العودة للداشبورد"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </button>
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                  Sales 1 - معرض السير الذاتية
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">صفحة مبيعات مخصصة مع رقم واتساب منفصل</p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {filteredCvs.length} سيرة
                  </span>
                </div>
                
                <div className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-shrink-0 ${
                  whatsappNumber ? 'bg-purple-100' : 'bg-red-100'
                }`}>
                  <span className={`text-xs sm:text-sm font-medium ${
                    whatsappNumber ? 'text-purple-700' : 'text-red-700'
                  }`}>
                    {whatsappNumber ? `واتساب: ${whatsappNumber}` : 'لم يتم تعيين رقم واتساب'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm flex-1 sm:flex-initial justify-center"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">العودة للداشبورد</span>
                  <span className="sm:hidden">الداشبورد</span>
                </button>
                
                <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-pink-600 shadow-sm' 
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
                        ? 'bg-white text-pink-600 shadow-sm' 
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
          </div>
        )}

        {/* شريط تحكم بسيط للزوار */}
        {!isLoggedIn && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
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
                        ? 'bg-white text-pink-600 shadow-sm' 
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
                        ? 'bg-white text-pink-600 shadow-sm' 
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
            <div className="bg-pink-100 p-2 sm:p-3 rounded-lg ml-3 sm:ml-4 flex-shrink-0">
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
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
              <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 sm:h-6 sm:w-6 group-focus-within:text-pink-500 transition-colors" />
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
                  ? 'bg-pink-600 text-white border-pink-600'
                  : 'bg-white text-pink-700 border-pink-200 hover:bg-pink-50'
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
                  <label className="text-sm font-medium text-purple-700 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    اللغة
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                {/* فلتر الخبرة */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-pink-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    الخبرة
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="BEGINNER">مبتدئ</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">متقدم</option>
                  </select>
                </div>

                {/* فلتر الراتب */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-purple-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    الراتب الشهري
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={salaryFilter}
                    onChange={(e) => setSalaryFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الرواتب</option>
                    <option value="0-500">0-500 ريال</option>
                    <option value="501-1000">501-1000 ريال</option>
                    <option value="1001-1500">1001-1500 ريال</option>
                    <option value="1501+">1501+ ريال</option>
                  </select>
                </div>

                {/* فلتر عدد الأطفال */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    عدد الأطفال
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={childrenFilter}
                    onChange={(e) => setChildrenFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="0">بدون أطفال</option>
                    <option value="1-2">1-2 أطفال</option>
                    <option value="3+">3+ أطفال</option>
                  </select>
                </div>

                {/* فلتر الديانة */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-teal-700 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    الديانة
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={religionFilter}
                    onChange={(e) => setReligionFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الديانات</option>
                    <option value="MUSLIM">مسلم</option>
                    <option value="CHRISTIAN">مسيحي</option>
                    <option value="BUDDHIST">بوذي</option>
                    <option value="HINDU">هندوسي</option>
                    <option value="OTHER">أخرى</option>
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
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6'
              : 'space-y-4'
          }>
            {filteredCvs.map((cv) => (
              <div
                key={cv.id}
                className={`bg-white rounded-lg shadow-lg border ${selectedCvs.includes(cv.id) ? 'border-pink-500 ring-2 ring-pink-500' : 'border-gray-200'} overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center p-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* صورة السيرة الذاتية */}
                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-200">
                      {cv.profileImage ? (
                        <img
                          src={processImageUrl(cv.profileImage)}
                          alt={cv.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
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
                          className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 bg-white"
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
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 sm:py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
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
                          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-1.5 sm:py-2 px-1 sm:px-2 rounded text-[10px] sm:text-xs flex items-center justify-center transition-colors"
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
                          onClick={() => router.push(`/cv/${cv.id}`)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1.5 sm:py-2 px-1 sm:px-2 rounded text-[10px] sm:text-xs flex items-center justify-center transition-colors"
                          title="عرض السيرة الكاملة"
                        >
                          <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden sm:inline ml-1">عرض</span>
                        </button>
                        <button
                          onClick={() => {
                            if (cv.videoLink && cv.videoLink.trim() !== '') {
                              setSelectedVideo(cv.videoLink);
                            } else {
                              alert('لا يوجد رابط فيديو لهذه السيرة');
                            }
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 sm:py-2 px-1 sm:px-2 rounded text-[10px] sm:text-xs flex items-center justify-center transition-colors"
                          title="مشاهدة الفيديو"
                        >
                          <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden sm:inline ml-1">فيديو</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // عرض القائمة
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {cv.profileImage ? (
                        <img src={processImageUrl(cv.profileImage)} alt={cv.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
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
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
