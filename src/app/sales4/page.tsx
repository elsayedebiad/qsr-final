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
  cvImageUrl?: string
}

export default function Sales4Page() {
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
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const salesPageId = 'sales4'

  // جلب رقم الواتساب
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

  // جلب السير الذاتية
  useEffect(() => {
    const fetchCVs = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/gallery/cvs')
        if (!response.ok) throw new Error('فشل في جلب السير الذاتية')
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
الكود المرجعي: ${cv.referenceCode}
الجنسية: ${cv.nationality || 'غير محدد'}
من صفحة Sales 4`

    const encodedMessage = encodeURIComponent(message)
    if (!whatsappNumber) {
      toast.error('لم يتم تعيين رقم واتساب لهذه الصفحة.')
      return
    }
    
    const phoneNumber = whatsappNumber.replace(/^\+/, '')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  // تحميل سيرة ذاتية واحدة
  const downloadSingleCV = async (cv: CV) => {
    try {
      // فتح صفحة العرض مع التحميل التلقائي
      const cvUrl = `/cv/${cv.id}?autoDownload=true`
      const cvWindow = window.open(cvUrl, '_blank', 'width=1200,height=800')
      
      if (cvWindow) {
        // إغلاق تلقائي بعد 5 ثوان
        setTimeout(() => {
          try {
            cvWindow.close()
          } catch (e) {
            console.log('Could not close window automatically')
          }
        }, 5000)
        
        toast.success('تم فتح قالب القعيد - سيتم التحميل تلقائياً')
      } else {
        toast.error('يرجى السماح بالنوافذ المنبثقة لتحميل السيرة الذاتية')
      }
    } catch (error) {
      console.error('Error downloading CV:', error)
      toast.error('حدث خطأ أثناء تحميل السيرة الذاتية')
    }
  }

  // مشاركة سيرة ذاتية واحدة
  const shareSingleCV = (cv: CV) => {
    const shareText = `🔗 مشاركة سيرة ذاتية من الاسناد السريع

👤 الاسم: ${cv.fullName}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
${cv.age ? `🎂 العمر: ${cv.age} سنة` : ''}
🆔 الكود المرجعي: ${cv.referenceCode}

🌐 رابط السيرة: ${window.location.origin}/cv/${cv.id}
📱 للحجز عبر واتساب: ${whatsappNumber}

#الاسناد_السريع #عمالة_منزلية`

    if (navigator.share) {
      navigator.share({
        title: `سيرة ذاتية - ${cv.fullName} | الاسناد السريع`,
        text: shareText,
        url: `${window.location.origin}/cv/${cv.id}`
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success('تم نسخ معلومات السيرة الذاتية')
      }).catch(() => {
        toast.error('فشل في نسخ المعلومات')
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل السير الذاتية...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-3 rounded-lg">
                <Grid3X3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  معرض السير الذاتية
                </h1>
                <p className="text-gray-600">صفحة مبيعات مخصصة مع رقم واتساب منفصل</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{filteredCvs.length} سيرة</span>
              </div>
              <div className={`px-3 py-2 rounded-lg ${
                whatsappNumber ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className={`text-sm font-medium ${
                  whatsappNumber ? 'text-green-700' : 'text-red-700'
                }`}>
                  {whatsappNumber ? `واتساب: ${whatsappNumber}` : 'لم يتم تعيين رقم واتساب'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* البحث والفلاتر */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
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
              className="px-3 sm:px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium text-indigo-700 hover:bg-indigo-100 min-w-0 flex-1 sm:flex-initial"
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
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{showAdvancedFilters ? 'إخفاء الفلاتر' : 'فلاتر متقدمة'}</span>
              <span className="sm:hidden">فلاتر</span>
            </button>
          </div>

          {/* الفلاتر المتقدمة */}
          {showAdvancedFilters && (
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-indigo-100 mb-4 sm:mb-6">
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
                  <label className="text-sm font-medium text-blue-700 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    الحالة الاجتماعية
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="text-sm font-medium text-purple-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    التعليم
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  <label className="text-sm font-medium text-orange-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    الخبرة
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  <label className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    الراتب الشهري
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  <label className="text-sm font-medium text-pink-700 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    عدد الأطفال
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
            <Archive className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد سير ذاتية</h3>
            <p className="text-gray-600">لا توجد سير ذاتية متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredCvs.map((cv) => (
              <div key={cv.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all">
                <div className="aspect-[3/4] relative overflow-hidden bg-gray-200">
                  {cv.profileImage ? (
                    <img src={processImageUrl(cv.profileImage)} alt={cv.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
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
                  <div className="absolute top-2 right-2">
                    <CountryFlag nationality={cv.nationality || ''} size="sm" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-white font-semibold text-sm mb-1 truncate">{cv.fullName}</h3>
                    <p className="text-white/70 text-xs truncate">{cv.position || 'غير محدد'}</p>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{cv.referenceCode}</span>
                    {cv.age && <span className="text-xs text-gray-500">{cv.age} سنة</span>}
                  </div>
                  
                  <button
                    onClick={() => sendWhatsAppMessage(cv)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mb-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    للحجز والطلب
                  </button>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => router.push(`/cv/${cv.id}`)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-2 rounded text-xs flex items-center justify-center transition-colors"
                      title="عرض السيرة الكاملة"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (cv.videoLink && cv.videoLink.trim() !== '') {
                          setSelectedVideo(cv.videoLink);
                        } else {
                          alert('لا يوجد رابط فيديو لهذه السيرة');
                        }
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-2 rounded text-xs flex items-center justify-center transition-colors"
                      title="مشاهدة الفيديو"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => downloadSingleCV(cv)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-2 rounded text-xs flex items-center justify-center transition-colors"
                      title="تحميل السيرة الذاتية"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => shareSingleCV(cv)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded text-xs flex items-center justify-center transition-colors"
                      title="مشاركة السيرة الذاتية"
                    >
                      <Share2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
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
