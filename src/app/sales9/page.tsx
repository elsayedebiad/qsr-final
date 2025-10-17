'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
  Play,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react'
import CountryFlag from '../../components/CountryFlag'
import { processImageUrl } from '@/lib/url-utils'
import SimpleImageCarousel from '@/components/SimpleImageCarousel'
import ClarityScript from '@/components/ClarityScript'

// إضافة أنيميشن CSS محسّن للأداء
const customStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-scaleIn {
    animation: scaleIn 0.2s ease-out;
  }

  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }

  /* تحسينات للموبايل */
  @media (max-width: 768px) {
    .animate-fadeIn,
    .animate-scaleIn,
    .animate-slideUp {
      animation-duration: 0.15s !important;
    }
    
    .transition-all,
    .transition-transform {
      transition-duration: 0.15s !important;
    }
  }

  .search-input::placeholder {
    color: black !important;
    opacity: 1 !important;
  }
  
  /* تحسين الصور للأداء */
  img {
    content-visibility: auto;
  }
`

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

export default function Sales1Page() {
  const router = useRouter()
  const [cvs, setCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [displayLimit, setDisplayLimit] = useState(20) // عرض 20 سيرة في البداية
  const [statusFilter, setStatusFilter] = useState<CVStatus | 'ALL'>('ALL')
  const [nationalityFilter, setNationalityFilter] = useState<string>('ALL')
  const [positionFilter, setPositionFilter] = useState<string>('ALL') // فلتر الوظيفة: سائق، خدمات
  const [skillFilter, setSkillFilter] = useState<string>('ALL')
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<string>('ALL')
  const [ageFilter, setAgeFilter] = useState<string>('ALL')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [experienceFilter, setExperienceFilter] = useState<string>('ALL')
  const [languageFilter, setLanguageFilter] = useState<string>('ALL')
  const cvsContainerRef = useRef<HTMLDivElement>(null)
  
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
  const [drivingFilter, setDrivingFilter] = useState<string>('ALL')
  
  // حالة التحميل والتحديد
  const [selectedCvs, setSelectedCvs] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [currentDownloadName, setCurrentDownloadName] = useState('')
  
  // رقم الواتساب المخصص لهذه الصفحة
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [selectedCVForView, setSelectedCVForView] = useState<CV | null>(null)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [sharePopupMessage, setSharePopupMessage] = useState('')
  const salesPageId = 'sales9'
  
  // إغلاق الـModal بزر Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCVForView(null)
        setSelectedVideo(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])
  
  // منع التمرير عند فتح الـModal
  useEffect(() => {
    if (selectedCVForView || selectedVideo) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedCVForView, selectedVideo])
  
  // حالة الـCarousel للبنرات
  const [desktopBanners, setDesktopBanners] = useState<string[]>([])
  const [mobileBanners, setMobileBanners] = useState<string[]>([])
  const [bannersLoading, setBannersLoading] = useState(true)
  
  // حالة البنرات الإضافية
  const [secondaryDesktopBanners, setSecondaryDesktopBanners] = useState<string[]>([])
  const [secondaryMobileBanners, setSecondaryMobileBanners] = useState<string[]>([])
  const [secondaryBannersLoading, setSecondaryBannersLoading] = useState(true)

  // جلب البنرات من API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setBannersLoading(true)
        const response = await fetch(`/api/banners?salesPageId=${salesPageId}`)
        if (response.ok) {
          const banners = await response.json()
          
          // فصل البنرات حسب نوع الجهاز (المفعلة فقط)
          const activeBanners = banners.filter((b: any) => b.isActive)
          const desktop = activeBanners
            .filter((b: any) => b.deviceType === 'DESKTOP')
            .sort((a: any, b: any) => a.order - b.order)
            .map((b: any) => b.imageUrl)
          const mobile = activeBanners
            .filter((b: any) => b.deviceType === 'MOBILE')
            .sort((a: any, b: any) => a.order - b.order)
            .map((b: any) => b.imageUrl)
          
          setDesktopBanners(desktop.length > 0 ? desktop : [])
          setMobileBanners(mobile.length > 0 ? mobile : [])
        } else {
          // لا توجد بنرات رئيسية
          setDesktopBanners([])
          setMobileBanners([])
        }
      } catch (error) {
        console.error('Error fetching banners:', error)
        // لا توجد بنرات رئيسية
        setDesktopBanners([])
        setMobileBanners([])
      } finally {
        setBannersLoading(false)
      }
    }
    
    fetchBanners()
  }, [])

  // جلب البنرات الإضافية من API
  useEffect(() => {
    const fetchSecondaryBanners = async () => {
      try {
        setSecondaryBannersLoading(true)
        const response = await fetch(`/api/secondary-banners?salesPageId=${salesPageId}`)
        if (response.ok) {
          const banners = await response.json()
          
          // فصل البنرات حسب نوع الجهاز (المفعلة فقط)
          const activeBanners = banners.filter((b: any) => b.isActive)
          const desktop = activeBanners
            .filter((b: any) => b.deviceType === 'DESKTOP')
            .sort((a: any, b: any) => a.order - b.order)
            .map((b: any) => b.imageUrl)
          const mobile = activeBanners
            .filter((b: any) => b.deviceType === 'MOBILE')
            .sort((a: any, b: any) => a.order - b.order)
            .map((b: any) => b.imageUrl)
          
          setSecondaryDesktopBanners(desktop.length > 0 ? desktop : [])
          setSecondaryMobileBanners(mobile.length > 0 ? mobile : [])
        } else {
          // لا توجد بنرات ثانوية
          setSecondaryDesktopBanners([])
          setSecondaryMobileBanners([])
        }
      } catch (error) {
        console.error('Error fetching secondary banners:', error)
        // لا توجد بنرات ثانوية
        setSecondaryDesktopBanners([])
        setSecondaryMobileBanners([])
      } finally {
        setSecondaryBannersLoading(false)
      }
    }
    
    fetchSecondaryBanners()
  }, [])

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
      } catch (error) {
        console.error('Error fetching CVs:', error)
        toast.error('فشل في جلب السير الذاتية')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCVs()
  }, [])

  // دالة حساب المسافة بين نصين (Levenshtein Distance)
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // استبدال
            matrix[i][j - 1] + 1,     // إضافة
            matrix[i - 1][j] + 1      // حذف
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // دالة البحث الذكي - تتعامل مع الأخطاء الإملائية
  const smartSearch = (text: string, searchTerm: string): boolean => {
    if (!text || !searchTerm) return false
    
    // تنظيف النصوص
    const cleanText = text.toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ىي]/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/\s+/g, '')
    
    const cleanSearch = searchTerm.toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ىي]/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/\s+/g, '')
    
    // البحث المباشر
    if (cleanText.includes(cleanSearch)) return true
    
    // البحث الضبابي - يسمح بخطأين كحد أقصى
    const words = cleanText.split(/\s+/)
    const maxDistance = Math.min(2, Math.floor(cleanSearch.length / 3)) // يسمح بخطأ واحد لكل 3 أحرف
    
    for (const word of words) {
      // إذا كانت الكلمة قريبة جداً من البحث
      if (word.includes(cleanSearch) || cleanSearch.includes(word)) {
        return true
      }
      
      // حساب المسافة
      const distance = levenshteinDistance(word, cleanSearch)
      if (distance <= maxDistance) {
        return true
      }
      
      // البحث في جزء من الكلمة
      for (let i = 0; i <= word.length - cleanSearch.length; i++) {
        const substring = word.substring(i, i + cleanSearch.length)
        const substringDistance = levenshteinDistance(substring, cleanSearch)
        if (substringDistance <= maxDistance) {
          return true
        }
      }
    }
    
    return false
  }

  // دالة تحويل الجنسية للعربي
  const getNationalityArabic = (nationality: string | null | undefined): string => {
    if (!nationality) return 'غير محدد'
    
    const nationalityArabicMap: { [key: string]: string } = {
      'FILIPINO': 'الفلبين',
      'INDIAN': 'الهند',
      'BANGLADESHI': 'بنغلاديش',
      'ETHIOPIAN': 'إثيوبيا',
      'KENYAN': 'كينيا',
      'UGANDAN': 'اوغندية'
    }
    
    return nationalityArabicMap[nationality] || nationality
  }

  // دالة مطابقة الجنسية المحسنة - تدعم البحث المباشر بالعربي
  const matchesNationalityFilter = (cvNationality: string | null | undefined, filter: string): boolean => {
    if (filter === 'ALL') return true
    if (!cvNationality) return false
    
    // البحث المباشر في النص (مثال: "فلبينية" تطابق "فلبينية")
    if (cvNationality.includes(filter)) return true
    
    // خريطة البحث للتعامل مع الاختلافات في الكتابة
    const nationalitySearchMap: { [key: string]: string[] } = {
      'فلبينية': ['فلبين'],
      'سريلانكية': ['سريلانك', 'سيريلانك'],
      'بنغلاديشية': ['بنغلاديش', 'بنجلاديش'],
      'إثيوبية': ['إثيوبي', 'اثيوبي'],
      'كينية': ['كيني'],
      'أوغندية': ['أوغند', 'اوغند'],
      'بوروندية': ['بوروندي', 'بروندي'],
      'هندي': ['هند'],
    }
    
    // البحث باستخدام الكلمات المفتاحية
    const searchTerms = nationalitySearchMap[filter] || []
    for (const term of searchTerms) {
      if (cvNationality.includes(term)) {
        return true
      }
    }
    
    return false
  }

  // فلترة السير الذاتية - تم تحسينها باستخدام useMemo للأداء
  const allFilteredCvs = useMemo(() => {
    return cvs.filter(cv => {
      // البحث النصي الذكي
      const matchesSearch = searchTerm === '' || 
        smartSearch(cv.fullName, searchTerm) ||
        smartSearch(cv.fullNameArabic || '', searchTerm) ||
        smartSearch(cv.nationality || '', searchTerm) ||
        smartSearch(cv.position || '', searchTerm) ||
        smartSearch(cv.referenceCode || '', searchTerm) ||
        smartSearch(cv.email || '', searchTerm) ||
        cv.phone?.includes(searchTerm)

      // فلاتر أساسية
      const matchesStatus = statusFilter === 'ALL' || cv.status === statusFilter
      
      // فلتر الوظيفة - تصنيف حسب الوظيفة (سائق، نقل خدمات)
      const matchesPosition = positionFilter === 'ALL' || (() => {
        const position = (cv.position || '').trim() // إزالة المسافات الزائدة
        switch (positionFilter) {
          case 'DRIVER':
            // السائقين: من لديهم "سائق" في الوظيفة بالضبط
            return position.includes('سائق') || position.includes('driver')
          case 'SERVICES':
            // نقل الخدمات: من لديهم "نقل خدمات" في الوظيفة بالضبط
            return position.includes('نقل خدمات') || position.includes('نقل الخدمات')
          default:
            return true
        }
      })()
      
      // فلتر الجنسية - يتم تجاهله عند اختيار سائق أو خدمات
      const matchesNationality = (positionFilter === 'DRIVER' || positionFilter === 'SERVICES')
        ? true
        : matchesNationalityFilter(cv.nationality, nationalityFilter)
      
      // استثناء السائقين ونقل الخدمات عند اختيار جنسية معينة
      const excludeFromNationality = nationalityFilter !== 'ALL' && (positionFilter === 'ALL') ? (() => {
        const position = (cv.position || '').trim()
        const isDriver = position.includes('سائق') || position.includes('driver')
        const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
        return !isDriver && !isService // استثناء السائقين ونقل الخدمات
      })() : true
      
      const matchesMaritalStatus = maritalStatusFilter === 'ALL' || cv.maritalStatus === maritalStatusFilter
      
      // فلتر العمر
      const matchesAge = ageFilter === 'ALL' || (() => {
        if (!cv.age) return false
        switch (ageFilter) {
          case '21-30': return cv.age >= 21 && cv.age <= 30
          case '30-40': return cv.age >= 30 && cv.age <= 40
          case '40-50': return cv.age >= 40 && cv.age <= 50
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
      const matchesReligion = religionFilter === 'ALL' || (() => {
        if (!cv.religion) return false
        const religion = cv.religion.toUpperCase()
        switch (religionFilter) {
          case 'MUSLIM': return religion.includes('MUSLIM') || cv.religion.includes('مسلم')
          case 'CHRISTIAN': return religion.includes('CHRISTIAN') || cv.religion.includes('مسيحي')
          case 'BUDDHIST': return religion.includes('BUDDHIST') || cv.religion.includes('بوذي')
          case 'HINDU': return religion.includes('HINDU') || cv.religion.includes('هندوسي')
          default: return cv.religion === religionFilter
        }
      })()

      // فلتر التعليم
      const matchesEducation = educationFilter === 'ALL' || cv.educationLevel === educationFilter

      // فلتر الراتب
      const matchesSalary = salaryFilter === 'ALL' || (() => {
        if (!cv.monthlySalary) return false
        const salary = parseInt(cv.monthlySalary.replace(/[^0-9]/g, ''))
        switch (salaryFilter) {
          case 'LOW': return salary >= 0 && salary <= 500
          case 'MEDIUM': return salary >= 501 && salary <= 1000
          case 'MEDIUM': return salary >= 1001 && salary <= 1500
          case '1501+': return salary >= 1501
          default: return true
        }
      })()

      // فلتر فترة العقد
      const matchesContractPeriod = contractPeriodFilter === 'ALL' || cv.contractPeriod === contractPeriodFilter

      // فلتر حالة الجواز
      const matchesPassportStatus = passportStatusFilter === 'ALL' || (() => {
        switch (passportStatusFilter) {
          case 'VALID': return cv.passportNumber && cv.passportExpiryDate
          case 'EXPIRED': return cv.passportNumber && !cv.passportExpiryDate
          case 'MISSING': return !cv.passportNumber
          default: return true
        }
      })()

      // فلتر الطول
      const matchesHeight = heightFilter === 'ALL' || (() => {
        if (!cv.height) return false
        const height = parseInt(cv.height)
        switch (heightFilter) {
          case 'SHORT': return height < 160
          case 'MEDIUM': return height >= 160 && height <= 170
          case 'TALL': return height > 170
          default: return true
        }
      })()

      // فلتر الوزن
      const matchesWeight = weightFilter === 'ALL' || (() => {
        if (!cv.weight) return false
        const weight = parseInt(cv.weight)
        switch (weightFilter) {
          case 'LIGHT': return weight < 60
          case 'MEDIUM': return weight >= 60 && weight <= 80
          case 'HEAVY': return weight > 80
          default: return true
        }
      })()

      // فلتر عدد الأطفال
      const matchesChildren = childrenFilter === 'ALL' || (() => {
        switch (childrenFilter) {
          case 'NONE': return children === 0
          case 'FEW': return children && cv.numberOfChildren >= 1 && cv.numberOfChildren <= 2
          case '3+': return cv.numberOfChildren && cv.numberOfChildren >= 3
          default: return true
        }
      })()

      // فلتر الموقع
      const matchesLocation = locationFilter === 'ALL' || 
        cv.livingTown?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        cv.placeOfBirth?.toLowerCase().includes(locationFilter.toLowerCase())

      // فلتر السائق الخاص
      const matchesDriving = drivingFilter === 'ALL' || cv.driving === drivingFilter

      return matchesSearch && matchesStatus && matchesPosition && matchesNationality && excludeFromNationality && 
             matchesMaritalStatus && matchesAge && matchesSkill && matchesExperience && matchesLanguage && 
             matchesReligion && matchesEducation && matchesSalary && matchesContractPeriod && 
             matchesPassportStatus && matchesHeight && matchesWeight && matchesChildren && matchesLocation &&
             matchesDriving
    })
  }, [cvs, searchTerm, statusFilter, positionFilter, nationalityFilter, maritalStatusFilter, ageFilter, 
      skillFilter, experienceFilter, languageFilter, religionFilter, educationFilter, 
      salaryFilter, contractPeriodFilter, passportStatusFilter, heightFilter, weightFilter, 
      childrenFilter, locationFilter, drivingFilter])

  // عرض عدد محدود من السير لتحسين الأداء
  const filteredCvs = useMemo(() => {
    return allFilteredCvs.slice(0, displayLimit)
  }, [allFilteredCvs, displayLimit])

  // دالة لتحميل المزيد
  const loadMore = useCallback(() => {
    setDisplayLimit(prev => prev + 20)
  }, [])

  // إعادة ضبط حد العرض عند تغيير الفلاتر
  useEffect(() => {
    setDisplayLimit(20) // إعادة تعيين إلى 20 عند تغيير الفلتر
  }, [searchTerm, statusFilter, nationalityFilter, skillFilter, maritalStatusFilter, ageFilter, 
      experienceFilter, languageFilter, religionFilter, educationFilter, salaryFilter, 
      contractPeriodFilter, passportStatusFilter, heightFilter, weightFilter, childrenFilter, 
      locationFilter, drivingFilter])

  // Scroll تلقائي عند تغيير الفلتر
  useEffect(() => {
    if (cvsContainerRef.current && (nationalityFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm)) {
      setTimeout(() => {
        cvsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [nationalityFilter, statusFilter, searchTerm])

  // إرسال رسالة واتساب
  const sendWhatsAppMessage = (cv: CV) => {
    try {
      if (!whatsappNumber) {
        toast.error('لم يتم تعيين رقم واتساب لهذه الصفحة. يرجى التواصل مع الإدارة.');
        return;
      }

      // تنظيف رقم الهاتف (إزالة أي أحرف غير رقمية)
      const cleanPhone = whatsappNumber.replace(/\D/g, '');
      
      // إنشاء الرسالة مع تنسيق محسن
      const message = `مرحباً، أريد الاستفسار عن السيرة الذاتية:
الاسم: ${cv.fullName || 'غير محدد'}
${cv.fullNameArabic ? `الاسم بالعربية: ${cv.fullNameArabic}\n` : ''}${cv.referenceCode ? `الكود المرجعي: ${cv.referenceCode}\n` : ''}${cv.nationality ? `الجنسية: ${cv.nationality}\n` : ''}${cv.position ? `الوظيفة: ${cv.position}\n` : ''}${cv.experience ? `الخبرة: ${cv.experience}\n` : ''}${cv.age ? `العمر: ${cv.age} سنة\n` : ''}${cv.monthlySalary ? `الراتب المطلوب: ${cv.monthlySalary} ريال\n` : ''}
من صفحة: Sales 9`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      
      // فتح الرابط في نافذة جديدة
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      // تتبع الحدث في Google Analytics (اختياري)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'whatsapp_click', {
          'event_category': 'engagement',
          'event_label': `CV: ${cv.fullName || 'Unknown'}`,
          'page_title': 'Sales 9',
          'cv_id': cv.id
        });
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      toast.error('حدث خطأ أثناء فتح الواتساب. يرجى المحاولة مرة أخرى.');
    }
  }

  // مشاركة سيرة ذاتية واحدة
  const shareSingleCV = async (cv: CV) => {
    const shareUrl = `${window.location.origin}/cv/${cv.id}?from=sales9`
    
    // التحقق من دعم Web Share API
    if (!navigator.share) {
      // Fallback: نسخ الرابط
      try {
        await navigator.clipboard.writeText(shareUrl)
        setSharePopupMessage('✅ تم نسخ الرابط بنجاح!')
        setShowSharePopup(true)
        setTimeout(() => setShowSharePopup(false), 3000)
      } catch (error) {
        setSharePopupMessage('❌ فشل في نسخ الرابط')
        setShowSharePopup(true)
        setTimeout(() => setShowSharePopup(false), 3000)
      }
      return
    }

    try {
      // محاولة مشاركة الصورة إذا كانت متوفرة
      if (cv.cvImageUrl) {
        // عرض popup التحميل
        setSharePopupMessage('⏳ جاري تحضير الصورة للمشاركة...')
        setShowSharePopup(true)
        
        try {
          // تحميل الصورة
          const imageUrl = processImageUrl(cv.cvImageUrl)
          
          // Fetch الصورة
          const response = await fetch(imageUrl, { mode: 'cors' })
          
          if (!response.ok) {
            throw new Error('فشل في تحميل الصورة')
          }
          
          const blob = await response.blob()
          
          // إنشاء ملف من الـBlob
          const fileName = `${cv.fullName}_${cv.referenceCode || cv.id}.jpg`
            .replace(/[\\/:*?"<>|]+/g, '-')
            .replace(/\s+/g, '_')
          
          const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' })
          
          // تحديث الرسالة
          setSharePopupMessage('📤 جاهز! اختر التطبيق للمشاركة...')
          
          // التحقق من دعم مشاركة الملفات
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `سيرة ذاتية - ${cv.fullName}`,
              text: `${cv.fullName} - ${cv.nationality || ''} - ${cv.position || ''}`,
              files: [file]
            })
            // نجحت المشاركة
            setSharePopupMessage('✅ تمت المشاركة بنجاح!')
            setTimeout(() => setShowSharePopup(false), 2000)
          } else {
            // المتصفح لا يدعم مشاركة الملفات - مشاركة الرابط بدلاً
            setSharePopupMessage('📤 مشاركة الرابط...')
            await navigator.share({
              title: `سيرة ذاتية - ${cv.fullName}`,
              text: `تحقق من هذه السيرة الذاتية: ${cv.fullName} (${cv.nationality})`,
              url: shareUrl,
            })
            setSharePopupMessage('✅ تمت المشاركة بنجاح!')
            setTimeout(() => setShowSharePopup(false), 2000)
          }
        } catch (imageError) {
          console.warn('فشل في تحميل الصورة، سيتم مشاركة الرابط بدلاً:', imageError)
          
          // Fallback: مشاركة الرابط
          setSharePopupMessage('📤 مشاركة الرابط...')
          await navigator.share({
            title: `سيرة ذاتية - ${cv.fullName}`,
            text: `تحقق من هذه السيرة الذاتية: ${cv.fullName} (${cv.nationality})`,
            url: shareUrl,
          })
          setSharePopupMessage('✅ تمت المشاركة بنجاح!')
          setTimeout(() => setShowSharePopup(false), 2000)
        }
      } else {
        // لا توجد صورة - مشاركة الرابط فقط
        setSharePopupMessage('📤 جاري المشاركة...')
        setShowSharePopup(true)
        await navigator.share({
          title: `سيرة ذاتية - ${cv.fullName}`,
          text: `تحقق من هذه السيرة الذاتية: ${cv.fullName} (${cv.nationality})`,
          url: shareUrl,
        })
        setSharePopupMessage('✅ تمت المشاركة بنجاح!')
        setTimeout(() => setShowSharePopup(false), 2000)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('خطأ في المشاركة:', error)
        setSharePopupMessage('❌ حدث خطأ أثناء المشاركة')
        setShowSharePopup(true)
        setTimeout(() => setShowSharePopup(false), 3000)
      } else {
        // المستخدم ألغى المشاركة
        setShowSharePopup(false)
      }
    }
  }

  // تحميل سيرة ذاتية واحدة
  const downloadSingleCV = async (cv: CV) => {
    try {
      setCurrentDownloadName(cv.fullName || cv.referenceCode || 'السيرة الذاتية')
      const loadingToast = toast.loading('جاري تحميل الصورة...')
      
      // استخدام API endpoint مباشر للتحميل
      const response = await fetch(`/api/cv/${cv.id}/download-image`)
      
      if (!response.ok) {
        throw new Error('فشل تحميل الصورة')
      }
      
      // الحصول على الصورة كـ blob
      const blob = await response.blob()
      
      // إنشاء رابط تحميل
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `CV_${cv.fullName || cv.referenceCode || 'السيرة'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.dismiss(loadingToast)
      toast.success('تم تحميل الصورة بنجاح!')
      
    } catch (error) {
      console.error('خطأ في التحميل:', error)
      toast.dismiss()
      toast.error('حدث خطأ أثناء التحميل. يرجى المحاولة مرة أخرى')
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center" dir="rtl">
        <style>{customStyles}</style>
      <div className="text-center animate-scaleIn">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Grid3X3 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">جاري تحميل السير الذاتية</h3>
          <p className="text-gray-600">الرجاء الانتظار...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      {/* Microsoft Clarity Analytics */}
      <ClarityScript />
      <style>{customStyles}</style>
        {/* Header بنفس تصميم qsr.sa */}
        <header className="bg-white shadow-md sticky top-0 z-50">
          {/* شريط علوي بمعلومات التواصل */}
          <div className="bg-[#1e3a8a] text-white py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span>التواصل مع الدعم</span>
                {whatsappNumber && (
                  <strong className="font-bold">{whatsappNumber}</strong>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
                  {filteredCvs.length} سيرة متاحة
                </span>
              </div>
            </div>
          </div>
          
          {/* شريط الشعار والقائمة */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                {/* الشعار */}
                <div className="flex items-center gap-3">
                  <img 
                    src="/logo-2.png" 
                    alt="الاسناد السريع" 
                    className="h-16 w-auto object-contain"
                  />
                  <div className="hidden md:block">
                    <h1 className="text-xl font-bold text-[#1e3a8a]">الاسناد السريع</h1>
                    <p className="text-sm text-gray-600">للاستقدام</p>
                  </div>
                </div>
                
                {/* أزرار التواصل */}
                <div className="flex items-center gap-3">
                  {isLoggedIn && (
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all text-sm"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">الداشبورد</span>
                    </button>
                  )}
                  {whatsappNumber && (
                    <a 
                      href={`https://wa.me/${whatsappNumber.replace(/^\+/, '')}`} 
                      className="bg-[#25d366] hover:bg-[#1fb855] text-white px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg font-bold text-sm sm:text-base"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        // Track with Google Analytics
                        if (typeof window !== 'undefined' && (window as any).gtag) {
                          (window as any).gtag('event', 'header_whatsapp_click', {
                            'event_category': 'engagement',
                            'event_label': 'Header WhatsApp Button',
                            'page_title': 'Sales 9',
                            'button_location': 'header'
                          });
                        }
                        // Track with Microsoft Clarity
                        if (typeof window !== 'undefined' && (window as any).clarity) {
                          (window as any).clarity('event', 'header_whatsapp_click');
                        }
                      }}
                    >
                      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                      </svg>
                      <span>اطلب عاملتك</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          {/* Header القديم للمستخدمين المسجلين - مخفي الآن */}
          {false && isLoggedIn && (
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
              <div className="bg-gradient-to-r from-green-100 to-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent truncate">
                  Sales 9 - معرض السير الذاتية
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
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm flex-1 sm:flex-initial justify-center"
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
          </div>
        )}

        {/* مساحة للفصل */}
        <div className="h-6"></div>

        {/* البحث والفلاتر - بتصميم qsr.sa */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#1e3a8a] p-3 rounded-lg">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1e3a8a]">البحث والتصفية</h3>
              <p className="text-sm text-gray-600">ابحث عن السيرة الذاتية المناسبة</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الجنسية، الوظيفة، الكود المرجعي..."
                className="search-input w-full pr-12 pl-12 py-4 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] hover:border-gray-400 transition-all text-base font-medium"
                style={{ color: 'black', backgroundColor: 'white' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                dir="rtl"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* كاروسل الصور الإضافي - الجديد فوق */}
          {!secondaryBannersLoading && (secondaryDesktopBanners.length > 0 || secondaryMobileBanners.length > 0) && (
            <div className="mb-6 px-4 md:px-6">
              <SimpleImageCarousel
                desktopImages={secondaryDesktopBanners}
                mobileImages={secondaryMobileBanners}
                autoPlay={true}
                autoPlayInterval={4000}
                className=""
              />
            </div>
          )}

          {/* الـCarousel للبنرات الإعلانية الرئيسية */}
          {!bannersLoading && (desktopBanners.length > 0 || mobileBanners.length > 0) && (
            <div className="mb-6 px-4 md:px-6">
              <SimpleImageCarousel
                desktopImages={desktopBanners}
                mobileImages={mobileBanners}
                autoPlay={true}
                autoPlayInterval={4000}
                className=""
              />
            </div>
          )}

          {/* نص توجيهي */}
          <div className="text-center mb-4">
            <p className="text-xl font-bold text-[#1e3a8a]">اضغط على الجنسية المطلوبة 👇</p>
          </div>

          {/* مربعات الفلاتر السريعة - بتصميم qsr.sa محسّن */}
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-2 sm:gap-4 mb-6">
            {/* فلتر الجنسية الالفلبين */}
            <div
              onClick={() => {
                if (nationalityFilter === 'فلبينية') {
                  setNationalityFilter('ALL');
                } else {
                  setNationalityFilter('فلبينية');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'فلبينية'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'فلبينية'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              
              {/* المحتوى */}
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">الفلبين</h3>
                
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => {
                      const position = (cv.position || '').trim()
                      const isDriver = position.includes('سائق') || position.includes('driver')
                      const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
                      return cv.nationality && cv.nationality.includes('فلبين') && !isDriver && !isService
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية السريلانكا */}
            <div
              onClick={() => {
                if (nationalityFilter === 'سريلانكية') {
                  setNationalityFilter('ALL');
                } else {
                  setNationalityFilter('سريلانكية');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'سريلانكية'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'سريلانكية'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">سريلانكا</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => {
                      const position = (cv.position || '').trim()
                      const isDriver = position.includes('سائق') || position.includes('driver')
                      const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
                      return cv.nationality && cv.nationality.includes('سريلانك') && !isDriver && !isService
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية البنغلاديش */}
            <div
              onClick={() => {
                if (nationalityFilter === 'بنغلاديشية') {
                  setNationalityFilter('ALL');
                } else {
                  setNationalityFilter('بنغلاديشية');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'بنغلاديشية'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'بنغلاديشية'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">بنغلاديش</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => {
                      const position = (cv.position || '').trim()
                      const isDriver = position.includes('سائق') || position.includes('driver')
                      const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
                      return cv.nationality && (cv.nationality.includes('بنغلاديش') || cv.nationality.includes('بنجلاديش')) && !isDriver && !isService
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية الإثيوبيا */}
            <div
              onClick={() => {
                if (nationalityFilter === 'إثيوبية') {
                  setNationalityFilter('ALL');
                } else {
                  setNationalityFilter('إثيوبية');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'إثيوبية'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'إثيوبية'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">إثيوبيا</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => {
                      const position = (cv.position || '').trim()
                      const isDriver = position.includes('سائق') || position.includes('driver')
                      const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
                      return cv.nationality && cv.nationality.includes('إثيوبي') && !isDriver && !isService
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية الكينيا */}
            <div
              onClick={() => {
                if (nationalityFilter === 'كينية') {
                  setNationalityFilter('ALL');
                } else {
                  setNationalityFilter('كينية');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'كينية'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'كينية'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">كينيا</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => {
                      const position = (cv.position || '').trim()
                      const isDriver = position.includes('سائق') || position.includes('driver')
                      const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
                      return cv.nationality && cv.nationality.includes('كيني') && !isDriver && !isService
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية الأوغندا */}
            <div
              onClick={() => {
                if (nationalityFilter === 'أوغندية') {
                  setNationalityFilter('ALL');
                } else {
                  setNationalityFilter('أوغندية');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'أوغندية'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'أوغندية'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">أوغندا</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => {
                      const position = (cv.position || '').trim()
                      const isDriver = position.includes('سائق') || position.includes('driver')
                      const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
                      return cv.nationality && cv.nationality.includes('أوغند') && !isDriver && !isService
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر سائقين */}
            <div
              onClick={() => {
                if (positionFilter === 'DRIVER') {
                  setPositionFilter('ALL');
                  setNationalityFilter('ALL'); // إعادة تفعيل فلتر الجنسية
                } else {
                  setPositionFilter('DRIVER');
                  setNationalityFilter('ALL'); // تجاهل فلتر الجنسية
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                positionFilter === 'DRIVER'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                positionFilter === 'DRIVER'
                  ? 'bg-gradient-to-br from-emerald-700 to-emerald-900'
                  : 'bg-gradient-to-br from-emerald-600 to-emerald-800 group-hover:from-emerald-500 group-hover:to-emerald-700'
              }`}></div>
              
              {/* المحتوى */}
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">سائقين</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => {
                      const position = (cv.position || '').trim()
                      return position.includes('سائق') || position.includes('driver')
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية البروندية */}
            <div
              onClick={() => {
                if (nationalityFilter === 'بوروندية') {
                  setNationalityFilter('ALL');
                } else {
                  setNationalityFilter('بوروندية');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'بوروندية'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'بوروندية'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">بروندية</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => {
                      const position = (cv.position || '').trim()
                      const isDriver = position.includes('سائق') || position.includes('driver')
                      const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
                      return cv.nationality && cv.nationality.includes('بوروندي') && !isDriver && !isService
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر نقل خدمات */}
            <div
              onClick={() => {
                if (positionFilter === 'SERVICES') {
                  setPositionFilter('ALL');
                  setNationalityFilter('ALL'); // إعادة تفعيل فلتر الجنسية
                } else {
                  setPositionFilter('SERVICES');
                  setNationalityFilter('ALL'); // تجاهل فلتر الجنسية
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                positionFilter === 'SERVICES'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                positionFilter === 'SERVICES'
                  ? 'bg-gradient-to-br from-amber-700 to-amber-900'
                  : 'bg-gradient-to-br from-amber-600 to-amber-800 group-hover:from-amber-500 group-hover:to-amber-700'
              }`}></div>
              
              {/* المحتوى */}
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">نقل خدمات</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => {
                      const position = (cv.position || '').trim()
                      return position.includes('نقل خدمات') || position.includes('نقل الخدمات')
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* الفلاتر السريعة */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <select
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400 focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all"
              value={religionFilter}
              onChange={(e) => setReligionFilter(e.target.value)}
            >
              <option value="ALL">اختر الديانة</option>
              <option value="MUSLIM">مسلم 🕌</option>
              <option value="CHRISTIAN">مسيحي ✝️</option>
            </select>

            <select
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400 focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all"
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
            >
              <option value="ALL">جميع الجنسيات</option>
              <option value="FILIPINO">الفلبين</option>
              <option value="INDIAN">الهند</option>
              <option value="BANGLADESHI">بنغلاديش</option>
              <option value="ETHIOPIAN">إثيوبيا</option>
              <option value="KENYAN">كينيا</option>
              <option value="UGANDAN">أوغندا</option>
            </select>

            <select
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400 focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <option value="ALL">جميع الأعمار</option>
              <option value="21-30">21-30 سنة</option>
              <option value="30-40">30-40 سنة</option>
              <option value="40-50">40-50 سنة</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                showAdvancedFilters
                  ? 'bg-[#1e3a8a] text-white hover:bg-[#1e40af]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{showAdvancedFilters ? 'إخفاء الفلاتر' : 'فلاتر متقدمة'}</span>
            </button>
          </div>

          {/* الفلاتر المتقدمة */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">المهارات</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">الحالة الاجتماعية</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">اللغة</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                  >
                    <option value="ALL">جميع اللغات</option>
                    <option value="arabic">عربي</option>
                    <option value="english">إنجليزي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">التعليم</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={educationFilter}
                    onChange={(e) => setEducationFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="PRIMARY">ابتدائي</option>
                    <option value="SECONDARY">ثانوي</option>
                    <option value="UNIVERSITY">جامعي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">الخبرة</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="BEGINNER">مبتدئ</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">متقدم</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">الراتب الشهري</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">عدد الأطفال</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={childrenFilter}
                    onChange={(e) => setChildrenFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="0">بدون أطفال</option>
                    <option value="1-2">1-2 أطفال</option>
                    <option value="3+">3+ أطفال</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">الديانة</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* ملاحظة حول الصور */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 md:p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <span className="text-2xl md:text-3xl leading-none">⭐</span>
            </div>
            <div className="flex-1">
              <p className="text-amber-900 font-semibold text-sm md:text-base leading-relaxed text-right m-0">
                <span className="font-bold">ملاحظة:</span> صور العاملات الموجودة على هذا الموقع معدّلة باستخدام الذكاء الاصطناعي، وهي للعرض التوضيحي فقط.
              </p>
            </div>
          </div>
        </div>

        {/* عرض السير الذاتية */}
        <div ref={cvsContainerRef} className="min-h-[400px]">
        {filteredCvs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
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
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6'
              : 'space-y-4'
          }>
            {filteredCvs.map((cv) => (
              <div
                key={cv.id}
                className={`group bg-white rounded-xl shadow-lg border-2 ${selectedCvs.includes(cv.id) ? 'border-[#1e3a8a] ring-4 ring-[#1e3a8a]/20' : 'border-gray-100'} overflow-hidden hover:shadow-2xl hover:border-[#1e3a8a]/30 transition-all duration-500 ${
                  viewMode === 'list' ? 'flex items-center p-4' : 'hover:-translate-y-1'
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* صورة السيرة الذاتية - مع معلومات احترافية */}
                    <div className="aspect-[3/4] relative overflow-hidden bg-white border-2 border-gray-100 rounded-t-lg">
                      {cv.cvImageUrl ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCVForView(cv);
                            }}
                            className="w-full h-full focus:outline-none cursor-pointer group relative"
                            title="اضغط لعرض السيرة الكاملة"
                          >
                            <img
                              src={processImageUrl(cv.cvImageUrl)}
                              alt={cv.fullName}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain transition-all duration-500 group-hover:brightness-110"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                if (!target.src.startsWith('data:')) {
                                  target.src = 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3C/svg%3E'
                                }
                              }}
                            />
                            {/* Overlay عند الـHover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <p className="text-[#1e3a8a] font-bold text-sm flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  <span>اضغط للعرض الكامل</span>
                                </p>
                              </div>
                            </div>
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-xl">
                              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="text-xs sm:text-base font-bold px-2">{cv.fullName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* أزرار التفاعل - تصميم محسن للموبايل */}
                    <div className="p-3 sm:p-4 bg-gradient-to-br from-white to-gray-50 border-t border-gray-100">
                      {/* زر الحجز الرئيسي - محسّن للموبايل */}
                      <div className="mb-2 sm:mb-3">
                        <button
                          onClick={() => sendWhatsAppMessage(cv)}
                          className="w-full bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#1fb855] hover:to-[#0e6f5c] text-white py-3 sm:py-3.5 px-2 sm:px-4 rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 hover:scale-[1.02]"
                        >
                          <svg className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                          </svg>
                          <span className="font-extrabold">حجز السيرة الذاتية</span>
                        </button>
                      </div>
                      
                      {/* باقي الأزرار - محسّنة للموبايل */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <button
                          onClick={() => shareSingleCV(cv)}
                          className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 sm:py-3.5 px-1 rounded-lg text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-300 min-h-[60px] sm:min-h-[70px] shadow-md hover:shadow-lg active:scale-95 hover:scale-[1.02]"
                          title="مشاركة السيرة الذاتية"
                        >
                          <Share2 className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
                          <span className="font-bold leading-tight">مشاركة</span>
                        </button>
                        <button
                          onClick={() => setSelectedCVForView(cv)}
                          className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-3 sm:py-3.5 px-1 rounded-lg text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-300 min-h-[60px] sm:min-h-[70px] shadow-md hover:shadow-lg active:scale-95 hover:scale-[1.02]"
                          title="عرض السيرة الكاملة"
                        >
                          <Eye className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
                          <span className="font-bold leading-tight">عرض</span>
                        </button>
                        <button
                          onClick={() => {
                            if (cv.videoLink && cv.videoLink.trim() !== '') {
                              setSelectedVideo(cv.videoLink);
                            } else {
                              toast.error('لا يوجد رابط فيديو لهذه السيرة');
                            }
                          }}
                          className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 sm:py-3.5 px-1 rounded-lg text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-300 min-h-[60px] sm:min-h-[70px] shadow-md hover:shadow-lg active:scale-95 hover:scale-[1.02]"
                          title="مشاهدة الفيديو"
                        >
                          <Play className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
                          <span className="font-bold leading-tight">فيديو</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // عرض القائمة - تصميم محسن
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border-2 border-gray-200 flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      {cv.cvImageUrl ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCVForView(cv);
                          }}
                          className="w-full h-full focus:outline-none cursor-pointer group/img relative"
                          title="اضغط لعرض السيرة الكاملة"
                        >
                          <img 
                            src={processImageUrl(cv.cvImageUrl)} 
                            alt={cv.fullName}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain transition-all duration-300 group-hover/img:brightness-110"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                if (!target.src.startsWith('data:')) {
                                  target.src = 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3C/svg%3E'
                                }
                              }}
                          />
                        </button>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{cv.fullName}</h3>
                        <CountryFlag nationality={cv.nationality || ''} size="sm" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">{getNationalityArabic(cv.nationality)} • {cv.position}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-md">{cv.referenceCode}</span>
                        {cv.age && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{cv.age} سنة</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => sendWhatsAppMessage(cv)}
                        className="bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#1fb855] hover:to-[#0e6f5c] text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                        </svg>
                        حجز السيرة الذاتية
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* زر عرض المزيد */}
        {!isLoading && filteredCvs.length > 0 && allFilteredCvs.length > displayLimit && (
          <div className="flex justify-center mt-8 mb-4">
            <button
              onClick={loadMore}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
            >
              <ChevronDown className="h-6 w-6 animate-bounce" />
              عرض المزيد ({allFilteredCvs.length - displayLimit} سيرة متبقية)
              <ChevronDown className="h-6 w-6 animate-bounce" />
            </button>
          </div>
        )}
        </div>

        {/* Footer - بتصميم qsr.sa */}
        <footer className="bg-[#1e3a8a] text-white py-8 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo-2.png" alt="الاسناد السريع" className="h-12 w-auto object-contain bg-white rounded-lg p-2" />
            <div>
              <h3 className="text-lg font-bold">الاسناد السريع للاستقدام</h3>
              <p className="text-sm text-blue-200">شريكك الأمثل في استقدام العمالة</p>
            </div>
          </div>
          {whatsappNumber && (
            <div className="mb-4">
              <a 
                href={`https://wa.me/${whatsappNumber.replace(/^\+/, '')}`}
                className="inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#1fb855] px-6 py-3 rounded-lg font-bold transition-all"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                </svg>
                <span>تواصل معنا عبر الواتساب</span>
              </a>
            </div>
          )}
          <div className="border-t border-blue-700 pt-4">
            <p className="text-sm text-blue-200">© 2025 الاسناد السريع للاستقدام - جميع الحقوق محفوظة</p>
          </div>
        </div>
        </footer>
      </div>
      
      {/* Video Modal - تصميم محسن */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl transform animate-scaleIn">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg">
                  <Play className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">فيديو السيرة الذاتية</h3>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-500 hover:text-red-600 transition-all duration-300 hover:rotate-90 hover:scale-110 p-2 rounded-lg hover:bg-red-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 bg-gray-50">
              <div className="aspect-video w-full rounded-xl overflow-hidden shadow-xl">
                {selectedVideo.includes('youtube.com') || selectedVideo.includes('youtu.be') ? (
                  <iframe
                    src={(() => {
                      // تحويل روابط YouTube إلى embed
                      if (selectedVideo.includes('youtu.be/')) {
                        const videoId = selectedVideo.split('youtu.be/')[1]?.split('?')[0]
                        return `https://www.youtube.com/embed/${videoId}`
                      } else if (selectedVideo.includes('watch?v=')) {
                        const videoId = selectedVideo.split('watch?v=')[1]?.split('&')[0]
                        return `https://www.youtube.com/embed/${videoId}`
                      }
                      return selectedVideo
                    })()}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="فيديو السيرة الذاتية"
                  />
                ) : selectedVideo.includes('drive.google.com') ? (
                  <iframe
                    src={(() => {
                      // تحويل رابط Google Drive إلى embed
                      const fileIdMatch = selectedVideo.match(/\/file\/d\/([^\/]+)/)
                      if (fileIdMatch && fileIdMatch[1]) {
                        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
                      }
                      return selectedVideo.replace('/view?usp=sharing', '/preview').replace('/view', '/preview')
                    })()}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="autoplay"
                    allowFullScreen
                    title="فيديو السيرة الذاتية"
                  />
                ) : selectedVideo.includes('vimeo.com') ? (
                  <iframe
                    src={(() => {
                      // تحويل رابط Vimeo إلى embed
                      const videoId = selectedVideo.split('vimeo.com/')[1]?.split('?')[0]
                      return `https://player.vimeo.com/video/${videoId}`
                    })()}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="فيديو السيرة الذاتية"
                  />
                ) : (
                  <video
                    src={selectedVideo}
                    controls
                    className="w-full h-full rounded-lg bg-black"
                    preload="metadata"
                  >
                    <source src={selectedVideo} type="video/mp4" />
                    <source src={selectedVideo} type="video/webm" />
                    <source src={selectedVideo} type="video/ogg" />
                    متصفحك لا يدعم تشغيل الفيديو
                  </video>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Popup - Popup احترافي للمشاركة */}
      {showSharePopup && (
        <div className="fixed bottom-6 right-6 z-[10000] animate-slideUp">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-lg border-2 border-white/20 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {sharePopupMessage.includes('⏳') && (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {sharePopupMessage.includes('✅') && (
                  <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {sharePopupMessage.includes('❌') && (
                  <svg className="w-6 h-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {sharePopupMessage.includes('📤') && (
                  <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )}
              </div>
              <p className="font-bold text-base">{sharePopupMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* CV View Modal - عرض السيرة الذاتية */}
      {selectedCVForView && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-2 sm:p-4 animate-fadeIn"
          onClick={() => setSelectedCVForView(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b-2 border-gray-100 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af]">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 sm:p-3 rounded-lg backdrop-blur-sm">
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {selectedCVForView.fullNameArabic || selectedCVForView.fullName}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80">
                    {selectedCVForView.referenceCode} • {selectedCVForView.nationality}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCVForView(null)}
                className="text-white hover:text-red-300 transition-all duration-300 hover:rotate-90 hover:scale-110 p-2 rounded-lg hover:bg-white/10"
              >
                <X className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
            </div>

            {/* Content - الصورة */}
            <div className="p-4 sm:p-6 bg-gray-50 overflow-y-auto max-h-[calc(95vh-180px)]">
              {selectedCVForView.cvImageUrl ? (
                <div className="flex justify-center">
                  <div className="relative inline-block w-full max-w-4xl group">
                    {/* Tooltip */}
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                      اضغط للتكبير 🔍
                    </div>
                    <img
                      src={processImageUrl(selectedCVForView.cvImageUrl)}
                      alt={selectedCVForView.fullName}
                      className="w-full h-auto object-contain bg-white rounded-lg shadow-xl border-2 border-gray-200 hover:shadow-2xl transition-all duration-300 cursor-zoom-in"
                      onClick={(e) => {
                        // فتح الصورة في تبويب جديد عند النقر
                        window.open(processImageUrl(selectedCVForView.cvImageUrl), '_blank');
                      }}
                      title="اضغط لفتح الصورة بالحجم الكامل"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (!target.src.startsWith('data:')) {
                          target.src = 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3C/svg%3E'
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-block p-8 bg-gray-200 rounded-full mb-4">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg">لا توجد صورة متاحة لهذه السيرة الذاتية</p>
                </div>
              )}
            </div>

            {/* Footer - الأزرار */}
            <div className="p-4 sm:p-6 border-t-2 border-gray-100 bg-white">
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => sendWhatsAppMessage(selectedCVForView)}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#1fb855] hover:to-[#0e6f5c] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                  </svg>
                  <span>حجز السيرة الذاتية</span>
                </button>

                <button
                  onClick={() => shareSingleCV(selectedCVForView)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>مشاركة</span>
                </button>

                {selectedCVForView.videoLink && (
                  <button
                    onClick={() => {
                      setSelectedVideo(selectedCVForView.videoLink || null);
                      setSelectedCVForView(null);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>فيديو</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
</div>
  )
}


