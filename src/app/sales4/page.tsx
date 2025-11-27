'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CVStatus, Priority, SkillLevel } from '@prisma/client'
import { 
  ArrowLeft, 
  Eye, 
  Search, 
  Grid3X3, 
  List, 
  Archive,
  SlidersHorizontal,
  Star,
  Globe,
  Calendar,
  BookOpen,
  X,
  ChevronDown,
  Share2,
  Play,
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  AlertTriangle,
  Camera
} from 'lucide-react'
import CountryFlag from '../../components/CountryFlag'
import { processImageUrl } from '@/lib/url-utils'
import SimpleImageCarousel from '@/components/SimpleImageCarousel'
import ClarityScript from '@/components/ClarityScript'
import VideoPlayer from '@/components/VideoPlayer'
import ImageWithFallback from '@/components/ImageWithFallback'
import SalesRedirectCheck from '@/components/SalesRedirectCheck'
import AutoScrollIndicatorEnhanced from '@/components/AutoScrollIndicatorEnhanced'
import FlyingLantern from '@/components/FlyingLantern'
import PhoneNumberPopup from '@/components/PhoneNumberPopup'
import { logSearchAnalytics, logPageView } from '@/lib/search-analytics'

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
  languageLevel: string | undefined
  education?: string
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

export default function Sales4Page() {
  const router = useRouter()
  const [cvs, setCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [displayLimit, setDisplayLimit] = useState(20) // عرض 20 سيرة في البداية
  const [statusFilter] = useState<CVStatus | 'ALL'>('ALL')
  const [nationalityFilter, setNationalityFilter] = useState<string>('إثيوبيا')
  const [positionFilter, setPositionFilter] = useState<string>('ALL') // فلتر الوظيفة: سائق، خدمات
  const [skillFilters, setSkillFilters] = useState<string[]>([]) // تحديد متعدد للمهارات
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false)
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<string>('ALL')
  const [minAge, setMinAge] = useState<number>(20)
  const [maxAge, setMaxAge] = useState<number>(60)
  const [ageFilterEnabled, setAgeFilterEnabled] = useState(true)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [experienceFilter, setExperienceFilter] = useState<string>('ALL')
  const [arabicLevelFilter, setArabicLevelFilter] = useState<string>('ALL')
  const [englishLevelFilter, setEnglishLevelFilter] = useState<string>('ALL')
  const cvsContainerRef = useRef<HTMLDivElement>(null)
  
  // فلاتر إضافية شاملة
  const [religionFilter, setReligionFilter] = useState<string>('ALL')
  const [educationFilter, setEducationFilter] = useState<string>('ALL')
  const [contractPeriodFilter, setContractPeriodFilter] = useState<string>('ALL')
  const [passportStatusFilter, setPassportStatusFilter] = useState<string>('ALL')
  const [heightFilter, setHeightFilter] = useState<string>('ALL')
  const [weightFilter, setWeightFilter] = useState<string>('ALL')
  const [childrenFilter, setChildrenFilter] = useState<string>('ALL')
  const [locationFilter, setLocationFilter] = useState<string>('ALL')
  const [drivingFilter, setDrivingFilter] = useState<string>('ALL')
  
  // فلاتر إضافية من الداشبورد
  const [skillFilter, setSkillFilter] = useState<string>('ALL')
  const [languageFilter, setLanguageFilter] = useState<string>('ALL')
  
  // حالة التحميل والتحديد
  const [selectedCvs, setSelectedCvs] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [currentDownloadName, setCurrentDownloadName] = useState('')
  
  // رقم الواتساب المخصص لهذه الصفحة
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [videoModalKey, setVideoModalKey] = useState(0)
  const [selectedCVForView, setSelectedCVForView] = useState<CV | null>(null)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [sharePopupMessage, setSharePopupMessage] = useState('')
  const salesPageId = 'sales4'

  const resetAllFilters = useCallback(() => {
    setReligionFilter('ALL')
    setNationalityFilter('ALL')
    setSkillFilters([])
    setPositionFilter('ALL')
    setMinAge(20)
    setMaxAge(60)
    setAgeFilterEnabled(true)
    setMaritalStatusFilter('ALL')
    setArabicLevelFilter('ALL')
    setEnglishLevelFilter('ALL')
    setEducationFilter('ALL')
    setExperienceFilter('ALL')
    setHeightFilter('ALL')
    setWeightFilter('ALL')
    setChildrenFilter('ALL')
    setLocationFilter('ALL')
    setDrivingFilter('ALL')
    setContractPeriodFilter('ALL')
    setPassportStatusFilter('ALL')
    setSkillFilter('ALL')
    setLanguageFilter('ALL')
    setShowAdvancedFilters(false)
    setSearchTerm('')
    setSelectedCvs([])
    setShowSkillsDropdown(false)
  }, [])
  
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
        
        // تشخيص: طباعة الجنسيات الفعلية
        const nationalities = uniqueCvs.map((cv: CV) => cv.nationality).filter((n: string | undefined) => n)
        const uniqueNats = [...new Set(nationalities)]
        console.log('الجنسيات الفعلية في البيانات:', uniqueNats)
        
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
      'FILIPINO': 'فلبينية',
      'INDIAN': 'هندية', 
      'BANGLADESHI': 'بنغلاديشية',
      'ETHIOPIAN': 'إثيوبية',
      'KENYAN': 'كينية',
      'UGANDAN': 'أوغندية',
      'BURUNDIAN': 'بوروندية',
      'RWANDAN': 'رواندية',
      'TANZANIAN': 'تنزانية',
      'MALAWIAN': 'مالاوية',
      'ZAMBIAN': 'زامبية',
      'ZIMBABWEAN': 'زيمبابوية',
      'GHANAIAN': 'غانية',
      'NIGERIAN': 'نيجيرية',
      'CAMEROONIAN': 'كاميرونية',
      'CONGOLESE': 'كونغولية',
      'SUDANESE': 'سودانية',
      'SOMALI': 'صومالية',
      'ERITREAN': 'إريترية',
      'DJIBOUTIAN': 'جيبوتية',
      'MALAGASY': 'مدغشقرية',
      'MAURITIAN': 'موريشيوسية',
      'SEYCHELLOIS': 'سيشيلية',
      'COMORAN': 'قمرية',
      'CAPE_VERDEAN': 'رأس أخضر',
      'SAO_TOMEAN': 'ساو تومية',
      'GUINEAN': 'غينية',
      'SIERRA_LEONEAN': 'سيراليونية',
      'LIBERIAN': 'ليبيرية',
      'IVORIAN': 'عاجية',
      'BURKINABE': 'بوركينية',
      'MALIAN': 'مالية',
      'SENEGALESE': 'سنغالية',
      'GAMBIAN': 'غامبية',
      'GUINEA_BISSAUAN': 'غينيا بيساو',
      'MOROCCAN': 'مغربية',
      'ALGERIAN': 'جزائرية',
      'TUNISIAN': 'تونسية',
      'LIBYAN': 'ليبية',
      'EGYPTIAN': 'مصرية',
      'PAKISTANI': 'باكستانية',
      'SRI_LANKAN': 'سريلانكية',
      'NEPALESE': 'نيبالية',
      'BURMESE': 'ميانمارية',
      'THAI': 'تايلاندية',
      'VIETNAMESE': 'فيتنامية',
      'CAMBODIAN': 'كمبودية',
      'LAOTIAN': 'لاوسية',
      'INDONESIAN': 'إندونيسية',
      'MALAYSIAN': 'ماليزية'
    }
    
    return nationalityArabicMap[nationality.toUpperCase()] || nationality
  }

  // دالة مطابقة الجنسية - مطابقة مباشرة مع البيانات من الإكسل
  const matchesNationalityFilter = useCallback((cvNationality: string | null | undefined, filter: string): boolean => {
    if (filter === 'ALL') return true
    if (!cvNationality) return false
    
    // خريطة تحويل من العربية إلى الإنجليزية للمطابقة
    const arabicToEnglishMap: { [key: string]: string } = {
      'فلبينية': 'FILIPINO',
      'هندية': 'INDIAN',
      'بنغلاديشية': 'BANGLADESHI',
      'إثيوبية': 'ETHIOPIAN',
      'كينية': 'KENYAN',
      'أوغندية': 'UGANDAN',
      'بوروندية': 'BURUNDIAN',
      'رواندية': 'RWANDAN',
      'تنزانية': 'TANZANIAN',
      'مالاوية': 'MALAWIAN',
      'زامبية': 'ZAMBIAN',
      'زيمبابوية': 'ZIMBABWEAN',
      'غانية': 'GHANAIAN',
      'نيجيرية': 'NIGERIAN',
      'كاميرونية': 'CAMEROONIAN',
      'كونغولية': 'CONGOLESE',
      'سودانية': 'SUDANESE',
      'صومالية': 'SOMALI',
      'إريترية': 'ERITREAN',
      'جيبوتية': 'DJIBOUTIAN',
      'مدغشقرية': 'MALAGASY',
      'موريشيوسية': 'MAURITIAN',
      'سيشيلية': 'SEYCHELLOIS',
      'قمرية': 'COMORAN',
      'رأس أخضر': 'CAPE_VERDEAN',
      'ساو تومية': 'SAO_TOMEAN',
      'غينية': 'GUINEAN',
      'سيراليونية': 'SIERRA_LEONEAN',
      'ليبيرية': 'LIBERIAN',
      'عاجية': 'IVORIAN',
      'بوركينية': 'BURKINABE',
      'مالية': 'MALIAN',
      'سنغالية': 'SENEGALESE',
      'غامبية': 'GAMBIAN',
      'غينيا بيساو': 'GUINEA_BISSAUAN',
      'مغربية': 'MOROCCAN',
      'جزائرية': 'ALGERIAN',
      'تونسية': 'TUNISIAN',
      'ليبية': 'LIBYAN',
      'مصرية': 'EGYPTIAN',
      'باكستانية': 'PAKISTANI',
      'سريلانكية': 'SRI_LANKAN',
      'نيبالية': 'NEPALESE',
      'ميانمارية': 'BURMESE',
      'تايلاندية': 'THAI',
      'فيتنامية': 'VIETNAMESE',
      'كمبودية': 'CAMBODIAN',
      'لاوسية': 'LAOTIAN',
      'إندونيسية': 'INDONESIAN',
      'ماليزية': 'MALAYSIAN'
    }
    
    // إذا كان الفلتر بالعربية، حوله للإنجليزية
    const englishFilter = arabicToEnglishMap[filter] || filter
    
    // مطابقة مباشرة مع البيانات من ملف الإكسل
    return cvNationality === englishFilter || cvNationality.includes(englishFilter) || cvNationality === filter || cvNationality.includes(filter)
  }, [])

  const doesCvMatchFilters = useCallback((cv: CV, overrideNationality?: string) => {
    const activeNationalityFilter = overrideNationality ?? nationalityFilter

    const matchesSearch = searchTerm === '' || 
      smartSearch(cv.fullName, searchTerm) ||
      smartSearch(cv.fullNameArabic || '', searchTerm) ||
      smartSearch(cv.nationality || '', searchTerm) ||
      smartSearch(cv.position || '', searchTerm) ||
      smartSearch(cv.referenceCode || '', searchTerm) ||
      smartSearch(cv.email || '', searchTerm) ||
      cv.phone?.includes(searchTerm)

    const matchesStatus = statusFilter === 'ALL' || cv.status === statusFilter

    const matchesPosition = positionFilter === 'ALL' || (() => {
      const position = (cv.position || '').trim().toLowerCase()
      const filterValue = positionFilter.toLowerCase()
      return position === filterValue || position.includes(filterValue)
    })()

    const matchesNationality = matchesNationalityFilter(cv.nationality, activeNationalityFilter)

    const excludeDriversFromNationality = (() => {
      if (activeNationalityFilter !== 'ALL') {
        const position = (cv.position || '').trim()
        const isDriver = position.includes('سائق') || position.toLowerCase().includes('driver')
        const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
        if (isDriver || isService) return false
      }
      return true
    })()

    const matchesMaritalStatus = maritalStatusFilter === 'ALL' || cv.maritalStatus === maritalStatusFilter

    const matchesAge = !ageFilterEnabled || (() => {
      if (!cv.age) return false
      return cv.age >= minAge && cv.age <= maxAge
    })()

    const matchesSkill = skillFilters.length === 0 || skillFilters.some(skill => {
      switch (skill) {
        case 'babySitting': return cv.babySitting === 'YES' || cv.babySitting === 'WILLING'
        case 'childrenCare': return cv.childrenCare === 'YES' || cv.childrenCare === 'WILLING'
        case 'cleaning': return cv.cleaning === 'YES' || cv.cleaning === 'WILLING'
        case 'arabicCooking': return cv.arabicCooking === 'YES' || cv.arabicCooking === 'WILLING'
        case 'driving': return cv.driving === 'YES' || cv.driving === 'WILLING'
        case 'washing': return cv.washing === 'YES' || cv.washing === 'WILLING'
        case 'ironing': return cv.ironing === 'YES' || cv.ironing === 'WILLING'
        case 'tutoring': return cv.tutoring === 'YES' || cv.tutoring === 'WILLING'
        case 'disabledCare': return cv.disabledCare === 'YES' || cv.disabledCare === 'WILLING'
        case 'sewing': return cv.sewing === 'YES' || cv.sewing === 'WILLING'
        default: return false
      }
    })

    const matchesExperience = (() => {
      if (experienceFilter === 'ALL') return true

      const experienceValue = (cv.experience || '').trim()
      
      // إذا كانت القيمة فارغة أو null، تعتبر بدون خبرة
      if (!experienceValue || experienceValue === '') {
        return experienceFilter === 'NO_EXPERIENCE'
      }

      const experienceLower = experienceValue.toLowerCase()
      
      // القيم الصريحة التي تعني "بدون خبرة" (مطابقة تامة)
      const noExperienceExact = [
        'لا يوجد', 'بدون خبرة', 'لا خبرة', 'غير محدد', 
        'no', 'none', 'no experience', 'بدون', '0',
        'N/A', 'n/a', 'NA', 'na', '-', '--', '---',
        'لا توجد خبرة', 'لا يوجد خبرة', 'لا'
      ]
      
      // التحقق من المطابقة التامة أولاً
      const isExactNoExperience = noExperienceExact.some(text => 
        experienceLower === text.toLowerCase()
      )
      
      if (isExactNoExperience) {
        return experienceFilter === 'NO_EXPERIENCE'
      }
      
      // معالجة خاصة للقيمة "خبرة" فقط (بدون أي نص إضافي)
      if (experienceLower === 'خبرة' || experienceLower === 'experience') {
        return experienceFilter === 'WITH_EXPERIENCE'
      }
      
      // إذا كانت القيمة تحتوي على رقم (سنوات)، فهي خبرة
      const hasNumber = /\d+/.test(experienceValue)
      if (hasNumber) {
        // استخراج الرقم
        const numbers = experienceValue.match(/\d+/g)
        const years = numbers && numbers.length > 0 ? parseInt(numbers[0]) : 0
        
        // إذا كان الرقم 0، تعتبر بدون خبرة
        if (years === 0) {
          return experienceFilter === 'NO_EXPERIENCE'
        }
        
        // إذا كان هناك رقم أكبر من 0، تعتبر خبرة
        return experienceFilter === 'WITH_EXPERIENCE'
      }
      
      // إذا كانت القيمة تحتوي على كلمات تدل على خبرة
      const experienceKeywords = ['خبرة', 'سنة', 'سنوات', 'عام', 'أعوام', 'experience', 'year', 'years']
      const hasExperienceKeyword = experienceKeywords.some(keyword => 
        experienceLower.includes(keyword.toLowerCase())
      )
      
      if (hasExperienceKeyword) {
        return experienceFilter === 'WITH_EXPERIENCE'
      }
      
      // إذا كانت القيمة غير فارغة ولكن لا تحتوي على معلومات واضحة
      // نعتبرها خبرة (لأنها ليست "بدون خبرة" صريحة)
      const hasExperience = !isExactNoExperience && experienceValue !== ''
      
      if (experienceFilter === 'WITH_EXPERIENCE') {
        return hasExperience
      }

      if (experienceFilter === 'NO_EXPERIENCE') {
        return !hasExperience
      }

      return true
    })()

    const matchesArabicLevel = arabicLevelFilter === 'ALL' || (() => {
      const arabicLevel = cv.arabicLevel ?? cv.languageLevel
      if (arabicLevelFilter === 'WEAK') return arabicLevel === null || arabicLevel === undefined
      if (arabicLevelFilter === 'NO') return arabicLevel === 'NO'
      return arabicLevel === arabicLevelFilter
    })()

    const matchesEnglishLevel = englishLevelFilter === 'ALL' || (() => {
      const englishLevel = cv.englishLevel
      if (englishLevelFilter === 'WEAK') return englishLevel === null || englishLevel === undefined
      if (englishLevelFilter === 'NO') return englishLevel === 'NO'
      return englishLevel === englishLevelFilter
    })()

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

    const matchesEducation = (() => {
      if (educationFilter === 'ALL') return true

      const educationLevel = (cv.educationLevel || cv.education || '').toLowerCase().trim()

      if (educationFilter === 'متعلم') {
        return educationLevel === 'نعم' || educationLevel === 'yes' || 
               educationLevel === 'متعلم' || educationLevel === 'educated'
      } else if (educationFilter === 'غير متعلم') {
        return educationLevel === 'لا' || educationLevel === 'no' || 
               educationLevel === '' || educationLevel === 'غير متعلم' || 
               educationLevel === 'أمي' || educationLevel === 'none'
      }
      return false
    })()

    const matchesContractPeriod = contractPeriodFilter === 'ALL' || cv.contractPeriod === contractPeriodFilter

    const matchesPassportStatus = passportStatusFilter === 'ALL' || (() => {
      switch (passportStatusFilter) {
        case 'VALID': return cv.passportNumber && cv.passportExpiryDate
        case 'EXPIRED': return cv.passportNumber && !cv.passportExpiryDate
        case 'MISSING': return !cv.passportNumber
        default: return true
      }
    })()

    const matchesHeight = heightFilter === 'ALL' || (() => {
      if (!cv.height) return false
      const height = parseInt(cv.height)
      switch (heightFilter) {
        case '<155': return height < 155
        case '155-160': return height >= 155 && height <= 160
        case '160-165': return height >= 160 && height <= 165
        case '165-170': return height >= 165 && height <= 170
        case '170-175': return height >= 170 && height <= 175
        case '>175': return height > 175
        default: return true
      }
    })()

    const matchesWeight = weightFilter === 'ALL' || (() => {
      if (!cv.weight) return false
      const weight = parseInt(cv.weight)
      switch (weightFilter) {
        case '<50': return weight < 50
        case '50-55': return weight >= 50 && weight <= 55
        case '55-60': return weight >= 55 && weight <= 60
        case '60-65': return weight >= 60 && weight <= 65
        case '65-70': return weight >= 65 && weight <= 70
        case '70-75': return weight >= 70 && weight <= 75
        case '>75': return weight > 75
        default: return true
      }
    })()

    const matchesChildren = childrenFilter === 'ALL' || (() => {
      switch (childrenFilter) {
        case 'NONE': return cv.numberOfChildren === 0
        case 'FEW': return cv.numberOfChildren !== undefined && cv.numberOfChildren >= 1 && cv.numberOfChildren <= 2
        case '3+': return cv.numberOfChildren !== undefined && cv.numberOfChildren >= 3
        default: return true
      }
    })()

    const matchesLocation = locationFilter === 'ALL' || 
      cv.livingTown?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      cv.placeOfBirth?.toLowerCase().includes(locationFilter.toLowerCase())

    const matchesDriving = drivingFilter === 'ALL' || cv.driving === drivingFilter

    return matchesSearch && matchesStatus && matchesPosition && matchesNationality && 
           excludeDriversFromNationality && matchesAge && matchesSkill && matchesArabicLevel && 
           matchesEnglishLevel && matchesReligion && matchesEducation && matchesExperience &&
           matchesMaritalStatus && matchesContractPeriod && matchesPassportStatus && matchesHeight &&
           matchesWeight && matchesChildren && matchesLocation && matchesDriving
  }, [
    searchTerm,
    statusFilter,
    positionFilter,
    nationalityFilter,
    matchesNationalityFilter,
    maritalStatusFilter,
    ageFilterEnabled,
    minAge,
    maxAge,
    skillFilters,
    experienceFilter,
    arabicLevelFilter,
    englishLevelFilter,
    religionFilter,
    educationFilter,
    contractPeriodFilter,
    passportStatusFilter,
    heightFilter,
    weightFilter,
    childrenFilter,
    locationFilter,
    drivingFilter
  ])

  // فلترة السير الذاتية - تم تحسينها باستخدام useMemo للأداء
  const allFilteredCvs = useMemo(() => {
    if (!cvs || cvs.length === 0) {
      return []
    }

    return cvs.filter(cv => doesCvMatchFilters(cv))
  }, [cvs, doesCvMatchFilters])

  // عرض عدد محدود من السير لتحسين الأداء
  const filteredCvs = useMemo(() => {
    const result = allFilteredCvs.slice(0, displayLimit)
    // تسجيل فقط في بيئة التطوير وعند وجود بيانات
    if (process.env.NODE_ENV === 'development' && allFilteredCvs.length > 0) {
      console.log(`Filtered CVs: ${result.length} out of ${allFilteredCvs.length} total`)
    }
    return result
  }, [allFilteredCvs, displayLimit])

  // استخراج الوظائف الفريدة من البيانات المرفوعة
  const uniquePositions = useMemo(() => {
    const positions = cvs
      .map(cv => cv.position)
      .filter((position): position is string => !!position && position.trim() !== '')
      .map(position => position.trim())
    
    // إزالة التكرارات
    return Array.from(new Set(positions)).sort()
  }, [cvs])

  // استخراج الجنسيات الفريقة من البيانات المرفوعة
  const uniqueNationalities = useMemo(() => {
    const nationalities = cvs
      .map(cv => cv.nationality)
      .filter((nationality): nationality is string => !!nationality && nationality.trim() !== '')
      .map(nationality => nationality.trim())
    
    // إزالة التكرارات
    const unique = Array.from(new Set(nationalities)).sort()
    console.log('الجنسيات الفريقة:', unique)
    return unique
  }, [cvs])

  // خريطة تحويل الجنسيات من الإنجليزية للعربية
  const nationalityDisplayMap: { [key: string]: string } = {
    'FILIPINO': 'الفلبين',
    'SRI_LANKAN': 'سريلانكا', 
    'BANGLADESHI': 'بنغلاديش',
    'ETHIOPIAN': 'إثيوبيا',
    'KENYAN': 'كينيا',
    'UGANDAN': 'أوغندا',
    'BURUNDIAN': 'بروندية',
    'INDIAN': 'الهند'
  }

  // الحصول على الاسم العربي للجنسية
  const getNationalityDisplayName = (nationality: string): string => {
    // البحث في الخريطة أولاً
    const mapped = nationalityDisplayMap[nationality.toUpperCase()]
    if (mapped) return mapped
    
    // إذا كانت الجنسية تحتوي على كلمات عربية، استخدمها كما هي
    if (/[\u0600-\u06FF]/.test(nationality)) {
      return nationality
    }
    
    // وإلا استخدم الاسم الإنجليزي
    return nationality
  }

  // دوال حساب عدد البيانات لكل فلتر
  const getCountForFilter = useCallback((filterType: string, filterValue: string): number => {
    if (!cvs || cvs.length === 0) return 0

    if (filterType === 'nationality') {
      return cvs.filter(cv => doesCvMatchFilters(cv, filterValue)).length
    }
    
    // معالجة خاصة لقيمة ALL لحساب العدد الفعلي بناءً على نوع الفلتر
    if (filterValue === 'ALL') {
      switch (filterType) {
        case 'arabicLevel':
        case 'englishLevel':
          // استثناء السائقين ونقل الخدمات من فلاتر اللغة
          return cvs.filter(cv => {
            const position = (cv.position || '').trim()
            const isDriver = position.includes('سائق') || position.toLowerCase().includes('driver')
            const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
            return !isDriver && !isService
          }).length
        case 'education':
        case 'religion':
        case 'position':
        case 'nationality':
        case 'age':
        case 'maritalStatus':
          return cvs.length
        default:
          return cvs.length
      }
    }
    
    return cvs.filter(cv => {
      switch (filterType) {
        case 'religion':
          if (filterValue === 'مسلمة') return cv.religion?.includes('مسلم') || cv.religion?.includes('MUSLIM')
          if (filterValue === 'مسيحية') return cv.religion?.includes('مسيحي') || cv.religion?.includes('CHRISTIAN')
          if (filterValue === 'أخرى') return cv.religion && !cv.religion.includes('مسلم') && !cv.religion.includes('مسيحي')
          return false
          
        case 'nationality':
          return matchesNationalityFilter(cv.nationality, filterValue)
          
        case 'age':
          if (!cv.age) return false
          if (filterValue === 'ALL') return true
          return cv.age >= minAge && cv.age <= maxAge
          
        case 'position':
          const position = (cv.position || '').toLowerCase()
          const value = filterValue.toLowerCase()
          return position === value || position.includes(value)
          
        case 'arabicLevel':
          // استثناء السائقين ونقل الخدمات من فلاتر اللغة
          const positionArabic = (cv.position || '').trim()
          const isDriverArabic = positionArabic.includes('سائق') || positionArabic.toLowerCase().includes('driver')
          const isServiceArabic = positionArabic.includes('نقل خدمات') || positionArabic.includes('نقل الخدمات')
          if (isDriverArabic || isServiceArabic) return false
          
          const arabicLevel = cv.arabicLevel ?? cv.languageLevel
          if (filterValue === 'WEAK') return arabicLevel === null || arabicLevel === undefined
          if (filterValue === 'NO') return arabicLevel === 'NO'
          return arabicLevel === filterValue
          
        case 'englishLevel':
          // استثناء السائقين ونقل الخدمات من فلاتر اللغة
          const positionEnglish = (cv.position || '').trim()
          const isDriverEnglish = positionEnglish.includes('سائق') || positionEnglish.toLowerCase().includes('driver')
          const isServiceEnglish = positionEnglish.includes('نقل خدمات') || positionEnglish.includes('نقل الخدمات')
          if (isDriverEnglish || isServiceEnglish) return false
          
          const englishLevel = cv.englishLevel
          if (filterValue === 'WEAK') return englishLevel === null || englishLevel === undefined
          if (filterValue === 'NO') return englishLevel === 'NO'
          return englishLevel === filterValue
          
        case 'education':
          const educationLevel = (cv.educationLevel || cv.education || '').toLowerCase().trim()
          // البيانات الفعلية تحتوي على "نعم" أو "لا"
          if (filterValue === 'متعلم') {
            return educationLevel === 'نعم' || educationLevel === 'yes' || 
                   educationLevel === 'متعلم' || educationLevel === 'educated'
          }
          if (filterValue === 'غير متعلم') {
            return educationLevel === 'لا' || educationLevel === 'no' || 
                   educationLevel === '' || educationLevel === 'غير متعلم' || 
                   educationLevel === 'أمي' || educationLevel === 'none'
          }
          return false
          
        case 'experience': {
          const experienceValue = (cv.experience || '').trim()
          
          // إذا كانت القيمة فارغة أو null، تعتبر بدون خبرة
          if (!experienceValue || experienceValue === '') {
            return filterValue === 'NO_EXPERIENCE'
          }

          const experienceLower = experienceValue.toLowerCase()
          
          // القيم الصريحة التي تعني "بدون خبرة" (مطابقة تامة)
          const noExperienceExact = [
            'لا يوجد', 'بدون خبرة', 'لا خبرة', 'غير محدد', 
            'no', 'none', 'no experience', 'بدون', '0',
            'N/A', 'n/a', 'NA', 'na', '-', '--', '---',
            'لا توجد خبرة', 'لا يوجد خبرة', 'لا'
          ]
          
          // التحقق من المطابقة التامة أولاً
          const isExactNoExperience = noExperienceExact.some(text => 
            experienceLower === text.toLowerCase()
          )
          
          if (isExactNoExperience) {
            return filterValue === 'NO_EXPERIENCE'
          }
          
          // معالجة خاصة للقيمة "خبرة" فقط (بدون أي نص إضافي)
          if (experienceLower === 'خبرة' || experienceLower === 'experience') {
            return filterValue === 'WITH_EXPERIENCE'
          }
          
          // إذا كانت القيمة تحتوي على رقم (سنوات)، فهي خبرة
          const hasNumber = /\d+/.test(experienceValue)
          if (hasNumber) {
            // استخراج الرقم
            const numbers = experienceValue.match(/\d+/g)
            const years = numbers && numbers.length > 0 ? parseInt(numbers[0]) : 0
            
            // إذا كان الرقم 0، تعتبر بدون خبرة
            if (years === 0) {
              return filterValue === 'NO_EXPERIENCE'
            }
            
            // إذا كان هناك رقم أكبر من 0، تعتبر خبرة
            return filterValue === 'WITH_EXPERIENCE'
          }
          
          // إذا كانت القيمة تحتوي على كلمات تدل على خبرة
          const experienceKeywords = ['خبرة', 'سنة', 'سنوات', 'عام', 'أعوام', 'experience', 'year', 'years']
          const hasExperienceKeyword = experienceKeywords.some(keyword => 
            experienceLower.includes(keyword.toLowerCase())
          )
          
          if (hasExperienceKeyword) {
            return filterValue === 'WITH_EXPERIENCE'
          }
          
          // إذا كانت القيمة غير فارغة ولكن لا تحتوي على معلومات واضحة
          const hasExperience = !isExactNoExperience && experienceValue !== ''

          if (filterValue === 'WITH_EXPERIENCE') return hasExperience
          if (filterValue === 'NO_EXPERIENCE') return !hasExperience
          return true
        }
        case 'skill':
          const skillMap: { [key: string]: keyof typeof cv } = {
            'babySitting': 'babySitting',
            'childrenCare': 'childrenCare',
            'cleaning': 'cleaning',
            'arabicCooking': 'arabicCooking',
            'driving': 'driving',
            'washing': 'washing',
            'ironing': 'ironing',
            'tutoring': 'tutoring',
            'disabledCare': 'disabledCare',
            'sewing': 'sewing'
          }
          const skillKey = skillMap[filterValue]
          return skillKey ? (cv[skillKey] === 'YES' || cv[skillKey] === 'WILLING') : false
          
        case 'maritalStatus':
          return cv.maritalStatus === filterValue
          
        case 'height':
          if (!cv.height) return false
          const height = parseInt(cv.height)
          if (filterValue === '<155') return height < 155
          if (filterValue === '155-160') return height >= 155 && height < 160
          if (filterValue === '160-165') return height >= 160 && height < 165
          if (filterValue === '165-170') return height >= 165 && height < 170
          if (filterValue === '170-175') return height >= 170 && height < 175
          if (filterValue === '>175') return height >= 175
          return false
          
        case 'weight':
          if (!cv.weight) return false
          const weight = parseInt(cv.weight)
          if (filterValue === '<50') return weight < 50
          if (filterValue === '50-55') return weight >= 50 && weight < 55
          if (filterValue === '55-60') return weight >= 55 && weight < 60
          if (filterValue === '60-65') return weight >= 60 && weight < 65
          if (filterValue === '65-70') return weight >= 65 && weight < 70
          if (filterValue === '70-75') return weight >= 70 && weight < 75
          if (filterValue === '>75') return weight >= 75
          return false
          
        case 'location':
          const location = (cv.livingTown || '').toLowerCase()
          return location.includes(filterValue.toLowerCase())
          
        default:
          return false
      }
    }).length
  }, [cvs, matchesNationalityFilter, doesCvMatchFilters])

  const uniqueArabicLevels = useMemo(() => {
    if (!cvs || cvs.length === 0) return []
    
    const levels = cvs
      .map(cv => cv.arabicLevel || 'NO') // معالجة القيم الفارغة
      .filter((level): level is SkillLevel => !!level)
    
    const unique = Array.from(new Set(levels))
    // تسجيل فقط في بيئة التطوير وعند وجود بيانات
    if (process.env.NODE_ENV === 'development' && unique.length > 0) {
      console.log('Arabic levels in data:', unique)
    }
    return unique
  }, [cvs])

  const uniqueEnglishLevels = useMemo(() => {
    if (!cvs || cvs.length === 0) return []
    
    const levels = cvs
      .map(cv => cv.englishLevel || 'NO') // معالجة القيم الفارغة
      .filter((level): level is SkillLevel => !!level)
    
    const unique = Array.from(new Set(levels))
    // تسجيل فقط في بيئة التطوير وعند وجود بيانات
    if (process.env.NODE_ENV === 'development' && unique.length > 0) {
      console.log('English levels in data:', unique)
    }
    return unique
  }, [cvs])

  // دالة لتحميل المزيد
  const loadMore = useCallback(() => {
    setDisplayLimit(prev => prev + 20)
  }, [])

  // إعادة ضبط حد العرض عند تغيير الفلتر
  useEffect(() => {
    setDisplayLimit(20) // إعادة تعيين إلى 20 عند تغيير الفلتر
  }, [searchTerm, statusFilter, nationalityFilter, skillFilters, minAge, maxAge, ageFilterEnabled, 
      arabicLevelFilter, englishLevelFilter, religionFilter, educationFilter, positionFilter])

  // Scroll تلقائي عند تغيير الفلتر
  useEffect(() => {
    if (cvsContainerRef.current && (nationalityFilter !== 'ALL' || statusFilter !== 'ALL' || positionFilter !== 'ALL' || searchTerm)) {
      setTimeout(() => {
        cvsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [nationalityFilter, statusFilter, positionFilter, searchTerm])

  // تسجيل عمليات البحث والفلاتر
  useEffect(() => {
    // تسجيل فقط إذا تم تحميل البيانات
    if (cvs.length === 0) return

    logSearchAnalytics({
      salesPageId,
      searchTerm: searchTerm || undefined,
      nationality: nationalityFilter !== 'ALL' ? nationalityFilter : undefined,
      position: positionFilter !== 'ALL' ? positionFilter : undefined,
      ageFilter: ageFilterEnabled ? `${minAge}-${maxAge}` : undefined,
      experience: experienceFilter !== 'ALL' ? experienceFilter : undefined,
      arabicLevel: arabicLevelFilter !== 'ALL' ? arabicLevelFilter : undefined,
      englishLevel: englishLevelFilter !== 'ALL' ? englishLevelFilter : undefined,
      maritalStatus: maritalStatusFilter !== 'ALL' ? maritalStatusFilter : undefined,
      skills: skillFilters.length > 0 ? skillFilters : undefined,
      religion: religionFilter !== 'ALL' ? religionFilter : undefined,
      education: educationFilter !== 'ALL' ? educationFilter : undefined,
      resultsCount: allFilteredCvs.length
    })
  }, [
    salesPageId,
    searchTerm,
    nationalityFilter,
    positionFilter,
    minAge,
    maxAge,
    ageFilterEnabled,
    experienceFilter,
    arabicLevelFilter,
    englishLevelFilter,
    maritalStatusFilter,
    skillFilters,
    religionFilter,
    educationFilter,
    allFilteredCvs.length,
    cvs.length
  ])

  // دالة للتعامل مع تبديل المهارات
  const toggleSkillFilter = (skill: string) => {
    setSkillFilters(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill)
      } else {
        return [...prev, skill]
      }
    })
  }

  // إرسال رسالة واتساب
  const sendWhatsAppMessage = async (cv: CV) => {
    try {
      if (!whatsappNumber) {
        toast.error('لم يتم تعيين رقم واتساب لهذه الصفحة. يرجى التواصل مع الإدارة.');
        return;
      }

      // تسجيل النقرة في قاعدة البيانات
      const { trackBookingClick } = await import('@/lib/booking-tracker')
      const trackingData = await trackBookingClick(salesPageId, cv)
      const clickId = trackingData?.click?.id

      // تنظيف رقم الهاتف (إزالة أي أحرف غير رقمية)
      const cleanPhone = whatsappNumber.replace(/\D/g, '');
      
      // إنشاء رابط تتبع مخفي - عندما يفتحه العميل من الواتساب نعرف أنه أرسل الرسالة!
      const trackingUrl = clickId 
        ? `${window.location.origin}/cv/${cv.id}?from=${salesPageId}&track=${clickId}`
        : `${window.location.origin}/cv/${cv.id}?from=${salesPageId}`;
      
      // إنشاء الرسالة مع تنسيق محسن
      const message = `هلا والله 
حبيت أستفسر عن العامل رقم ${cv.referenceCode || 'غير محدد'}
الاسم: ${cv.fullNameArabic || cv.fullName || 'غير محدد'}
الجنسية: ${cv.nationality || 'غير محددة'}
المهنة: ${cv.position || 'غير محددة'}
عنده خبرة ${cv.experience || 'غير محددة'}، وعمره ${cv.age || 'غير محدد'} سنة

هذا رابط سيرته: ${trackingUrl}

إذا متوفر علمّوني الله يعطيكم العافية `;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      
      // فتح الرابط في نافذة جديدة
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      // تتبع الحدث في Google Analytics (اختياري)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'whatsapp_click', {
          'event_category': 'engagement',
          'event_label': `CV: ${cv.fullName || 'Unknown'}`,
          'page_title': 'Sales 1',
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
    const shareUrl = `${window.location.origin}/cv/${cv.id}?from=sales1`
    
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
    <>
      <style>{customStyles}</style>
      <ClarityScript />
      <SalesRedirectCheck />
      <AutoScrollIndicatorEnhanced />      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 overflow-x-hidden" dir="rtl">
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
                  {allFilteredCvs.length} سيرة متاحة
                </span>
              </div>
            </div>
          </div>
          
          {/* شريط الشعار والقائمة */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                {/* الشعار */}
                <a 
                  href="https://qsr.sa/offers1-2" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img 
                    src="/logo-2.png" 
                    alt="الاسناد السريع" 
                    className="h-6 sm:h-8 w-auto object-contain"
                  />
                  <div className="hidden md:block">
                    <h1 className="text-xl font-bold text-[#1e3a8a]">الاسناد السريع</h1>
                    <p className="text-sm text-gray-600">للاستقدام</p>
                  </div>
                </a>
                
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
                      href={`https://wa.me/${whatsappNumber}`} 
                      className="bg-[#25d366] hover:bg-[#1fb855] text-white px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg font-bold text-sm sm:text-base"
                      target="_blank"
                      rel="noopener noreferrer"
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
          {/* إشعار للسير المعادة */}
          {filteredCvs.some(cv => cv.status === 'RETURNED') && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-lg mt-6 animate-slideUp">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl p-2 sm:p-3 flex-shrink-0 shadow-md">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-orange-900">سير ذاتية معادة من العقود</h3>
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
                      {filteredCvs.filter(cv => cv.status === 'RETURNED').length}
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                    يوجد <strong className="text-orange-700">{filteredCvs.filter(cv => cv.status === 'RETURNED').length}</strong> سيرة ذاتية تم إعادتها من العقود. 
                    هذه السير متاحة للتعاقد مرة أخرى ويمكنك التواصل بشأنها.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-orange-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span>السير المعادة مميزة بخلفية برتقالية في القائمة</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#1e3a8a] p-3 rounded-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1e3a8a]">البحث والتصفية</h3>
                <p className="text-sm text-gray-600">ابحث عن السيرة الذاتية المناسبة</p>
              </div>
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
                whatsappNumber={whatsappNumber}
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
                whatsappNumber={whatsappNumber}
              />
            </div>
          )}

          {/* نص توجيهي */}
          <div className="text-center mb-4">
            <p className="text-xl font-bold text-[#1e3a8a]">اضغط على الجنسية المطلوبة 👇</p>
          </div>

          {/* مربعات الفلاتر السريعة - ديناميكية بناءً على البيانات الموجودة */}
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-2 sm:gap-4 mb-6">
            {/* عرض مربعات الجنسيات الموجودة في البيانات */}
            {uniqueNationalities.map((nationality) => {
              const displayName = getNationalityDisplayName(nationality)
              const filterKey = nationality
              const isActive = nationalityFilter === filterKey
              
              // حساب عدد السير (باستثناء السائقين ونقل الخدمات)
              const count = cvs.filter(cv => doesCvMatchFilters(cv, nationality)).length
              
              // عدم عرض الجنسيات التي لا تحتوي على سير (باستثناء السائقين ونقل الخدمات)
              if (count === 0) return null
              
              return (
                <div
                  key={nationality}
                  onClick={() => {
                    if (nationalityFilter === filterKey) {
                      setNationalityFilter('ALL');
                    } else {
                      setNationalityFilter(filterKey);
                      setPositionFilter('ALL'); // إلغاء فلتر الوظيفة
                    }
                  }}
                  className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'shadow-2xl scale-105 ring-4 ring-amber-400 shadow-amber-400/60'
                      : 'shadow-lg hover:shadow-xl hover:scale-102'
                  }`}
                >
                  {/* خلفية متدرجة */}
                  <div className={`absolute inset-0 transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                      : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
                  }`}></div>
                  
                  {/* المحتوى */}
                  <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                    <h3 className="text-white font-bold text-xl mb-3">{displayName}</h3>
                    
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">
                        {count}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* فلتر سائقين */}
            <div
              onClick={() => {
                if (positionFilter === 'سائق') {
                  setPositionFilter('ALL');
                } else {
                  setPositionFilter('سائق');
                  setNationalityFilter('ALL'); // إلغاء فلتر الجنسية
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                positionFilter === 'سائق'
                  ? 'shadow-2xl scale-105 ring-4 ring-amber-400 shadow-amber-400/60'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                positionFilter === 'سائق'
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
                      return position.includes('سائق') || position.toLowerCase().includes('driver')
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر نقل خدمات */}
            <div
              onClick={() => {
                if (positionFilter === 'نقل خدمات') {
                  setPositionFilter('ALL');
                } else {
                  setPositionFilter('نقل خدمات');
                  setNationalityFilter('ALL'); // إلغاء فلتر الجنسية
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                positionFilter === 'نقل خدمات'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                positionFilter === 'نقل خدمات'
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

          {/* الفلاتر السريعة - من الداشبورد */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            {/* رأس الفلاتر مع زر المسح */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#1e3a8a]" />
                الفلاتر السريعة
              </h3>
              <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 shadow-sm transition-all"
                title="إعادة تعيين الفلاتر"
              >
                <RefreshCw className="h-4 w-4" />
                مسح الفلاتر
              </button>
            </div>

            <div className="space-y-6">
              {/* الصف الأول - الفلاتر الأساسية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    الدولة
                  </label>
                  <select
                    className="w-full px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    value={nationalityFilter}
                    onChange={(e) => setNationalityFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الجنسيات</option>
                    {uniqueNationalities.map(nationality => (
                      <option key={nationality} value={nationality}>
                        {getNationalityArabic(nationality)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">الديانة</label>
                  <select
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                    value={religionFilter}
                    onChange={(e) => setReligionFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الديانات</option>
                    <option value="مسلمة">مسلمة</option>
                    <option value="مسيحية">مسيحية</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-purple-600">الخبرة</label>
                  <select
                    className="w-full px-3 py-2.5 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الخبرات</option>
                    <option value="WITH_EXPERIENCE">خبرة</option>
                    <option value="NO_EXPERIENCE">بدون خبرة</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-purple-600">الوظيفة</label>
                  <select
                    className="w-full px-3 py-2.5 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الوظائف</option>
                    {uniquePositions.map(position => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-pink-600">الحالة الاجتماعية</label>
                  <select
                    className="w-full px-3 py-2.5 bg-pink-50 border border-pink-200 rounded-lg text-sm font-medium text-pink-700 hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                    value={maritalStatusFilter}
                    onChange={(e) => setMaritalStatusFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="SINGLE">أعزب/عزباء</option>
                    <option value="MARRIED">متزوج/متزوجة</option>
                    <option value="DIVORCED">مطلق/مطلقة</option>
                    <option value="WIDOWED">أرمل/أرملة</option>
                  </select>
                </div>
                
                <div className={`space-y-2 rounded-xl border-2 transition-all p-3 ${ageFilterEnabled ? 'border-blue-300 bg-blue-50 shadow-inner' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      العمر
                    </label>
                    <button
                      type="button"
                      onClick={() => setAgeFilterEnabled((prev) => !prev)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full transition-all ${ageFilterEnabled ? 'bg-white text-blue-600 shadow' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {ageFilterEnabled ? 'مفعل' : 'إيقاف'}
                    </button>
                  </div>
                  {ageFilterEnabled && (
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-blue-600 block mb-1">من</label>
                          <select
                            value={minAge}
                            onChange={(e) => {
                              const val = parseInt(e.target.value)
                              setMinAge(val)
                              if (maxAge < val) {
                                setMaxAge(val)
                              }
                            }}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                          >
                            {Array.from({ length: 41 }, (_, i) => i + 20).map(age => (
                              <option key={age} value={age}>{age}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-blue-600 block mb-1">إلى</label>
                          <select
                            value={maxAge}
                            onChange={(e) => {
                              const val = parseInt(e.target.value)
                              setMaxAge(val)
                              if (minAge > val) {
                                setMinAge(val)
                              }
                            }}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                          >
                            {Array.from({ length: 41 }, (_, i) => i + 20).map(age => (
                              <option key={age} value={age}>{age}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="text-xs text-blue-700 font-medium text-center">
                        {minAge} - {maxAge} سنة
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* زر الفلاتر المتقدمة */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 flex items-center justify-center gap-2 ${
                    showAdvancedFilters
                      ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-lg shadow-[#1e3a8a]/30'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#1e3a8a]/50'
                  }`}
                >
                  <SlidersHorizontal className={`h-4 w-4 transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                  {showAdvancedFilters ? 'إخفاء الفلاتر المتقدمة' : 'المزيد من الفلاتر'}
                </button>
              </div>
            </div>
          </div>

          {/* الفلاتر المتقدمة - من الداشبورد */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdvancedFilters ? 'max-h-[1200px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
              {/* عنوان الفلاتر المتقدمة */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#1e3a8a]" />
                  الفلاتر المتقدمة
                </h3>
              </div>

              {/* المهارات واللغات */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-[#1e3a8a] mb-2">
                    <Star className="h-4 w-4 ml-2" /> المهارات (اختيار متعدد)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSkillsDropdown(!showSkillsDropdown)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] flex items-center justify-between hover:border-gray-400 transition-all"
                    >
                      <span className="truncate">
                        {skillFilters.length === 0 
                          ? 'اختر المهارات' 
                          : `تم اختيار ${skillFilters.length} مهارة`}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showSkillsDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showSkillsDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowSkillsDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          <div className="p-2">
                            {skillFilters.length > 0 && (
                              <button
                                onClick={() => {
                                  setSkillFilters([])
                                }}
                                className="w-full px-3 py-2 mb-2 text-xs text-red-600 hover:bg-red-50 rounded font-medium transition-colors"
                              >
                                ✕ مسح الكل
                              </button>
                            )}
                            {[
                              { id: 'babySitting', label: 'رعاية أطفال', icon: '👶' },
                              { id: 'childrenCare', label: 'العناية بالأطفال', icon: '👧' },
                              { id: 'cleaning', label: 'تنظيف', icon: '🧹' },
                              { id: 'arabicCooking', label: 'طبخ عربي', icon: '🍲' },
                              { id: 'driving', label: 'قيادة', icon: '🚗' },
                              { id: 'washing', label: 'غسيل', icon: '🧺' },
                              { id: 'ironing', label: 'كي', icon: '👔' },
                              { id: 'tutoring', label: 'تدريس', icon: '📚' },
                              { id: 'disabledCare', label: 'رعاية كبار السن', icon: '👴' },
                              { id: 'sewing', label: 'خياطة', icon: '🧵' }
                            ].map(skill => {
                              return (
                              <label
                                key={skill.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all ${
                                  skillFilters.includes(skill.id)
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={skillFilters.includes(skill.id)}
                                  onChange={() => toggleSkillFilter(skill.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-lg">{skill.icon}</span>
                                <span className="text-sm flex-1">{skill.label}</span>
                                {skillFilters.includes(skill.id) && (
                                  <span className="text-blue-600 text-xs">✓</span>
                                )}
                              </label>
                            )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* عرض المهارات المحددة كـ tags */}
                  {skillFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {skillFilters.map(skillId => {
                        const skillLabels: Record<string, string> = {
                          babySitting: 'رعاية أطفال',
                          childrenCare: 'العناية بالأطفال',
                          cleaning: 'تنظيف',
                          arabicCooking: 'طبخ عربي',
                          driving: 'قيادة',
                          washing: 'غسيل',
                          ironing: 'كي',
                          tutoring: 'تدريس',
                          disabledCare: 'رعاية كبار السن',
                          sewing: 'خياطة'
                        }
                        return (
                          <span
                            key={skillId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                          >
                            {skillLabels[skillId]}
                            <button
                              onClick={() => toggleSkillFilter(skillId)}
                              className="hover:text-blue-900"
                            >
                              ✕
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-600 mb-2">
                    <Globe className="h-4 w-4 ml-2" /> مستوى العربية
                  </label>
                  <select
                    className="w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-500 border border-gray-300"
                    value={arabicLevelFilter}
                    onChange={(e) => setArabicLevelFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="YES">ممتاز</option>
                    <option value="WILLING">جيد</option>
                    <option value="WEAK">ضعيف</option>
                    <option value="NO">لا</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-blue-600 mb-2">
                    <Globe className="h-4 w-4 ml-2" /> مستوى الإنجليزية
                  </label>
                  <select
                    className="w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 border border-gray-300"
                    value={englishLevelFilter}
                    onChange={(e) => setEnglishLevelFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="YES">ممتاز</option>
                    <option value="WILLING">جيد</option>
                    <option value="WEAK">ضعيف</option>
                    <option value="NO">لا</option>
                  </select>
                </div>
              </div>

              {/* الفلاتر الإضافية - التعليم والمواصفات */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-[#1e3a8a] mb-2">
                    <BookOpen className="h-4 w-4 ml-2" /> المستوى التعليمي
                  </label>
                  <select
                    className="w-full rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#1e3a8a] border border-gray-300 bg-white"
                    value={educationFilter}
                    onChange={(e) => setEducationFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="متعلم">متعلم</option>
                    <option value="غير متعلم">غير متعلم</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-orange-600 mb-2">
                    <MapPin className="h-4 w-4 ml-2" /> الطول
                  </label>
                  <select
                    className="w-full rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 border border-gray-300 bg-white"
                    value={heightFilter}
                    onChange={(e) => setHeightFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الأطوال</option>
                    <option value="<155">أقل من 155 سم</option>
                    <option value="155-160">155-160 سم</option>
                    <option value="160-165">160-165 سم</option>
                    <option value="165-170">165-170 سم</option>
                    <option value="170-175">170-175 سم</option>
                    <option value=">175">أكثر من 175 سم</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-teal-600 mb-2">
                    <MapPin className="h-4 w-4 ml-2" /> الوزن
                  </label>
                  <select
                    className="w-full rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 border border-gray-300 bg-white"
                    value={weightFilter}
                    onChange={(e) => setWeightFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الأوزان</option>
                    <option value="<50">أقل من 50 كجم</option>
                    <option value="50-55">50-55 كجم</option>
                    <option value="55-60">55-60 كجم</option>
                    <option value="60-65">60-65 كجم</option>
                    <option value="65-70">65-70 كجم</option>
                    <option value="70-75">70-75 كجم</option>
                    <option value=">75">أكثر من 75 كجم</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-indigo-600 mb-2">
                    <MapPin className="h-4 w-4 ml-2" /> المنطقة
                  </label>
                  <select
                    className="w-full rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 border border-gray-300 bg-white"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المناطق</option>
                    {Array.from(new Set(cvs.map(cv => cv.livingTown).filter(Boolean))).sort().map(location => (
                      <option key={location} value={location!}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* زر مسح الفلاتر */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
                <button
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-lg text-sm font-medium hover:from-red-500 hover:to-pink-500 inline-flex items-center gap-2 shadow-sm transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  مسح جميع الفلاتر
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ملاحظات هامة */}
        <div className="mb-8">
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* رأس البطاقة */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-3">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-white animate-pulse" />
                <h3 className="text-white font-bold text-lg">ملاحظات هامة</h3>
                <AlertTriangle className="h-5 w-5 text-white animate-pulse" />
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {/* الملاحظة الأولى */}
              <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex-shrink-0 mt-1">
                  <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-2 shadow-md">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-amber-900 font-bold text-sm mb-1">بخصوص الصور</h4>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    صور العاملات الموجودة على هذا الموقع محسنه باستخدام الذكاء الاصطناعي، وهي للعرض التوضيحي فقط
                  </p>
                </div>
              </div>
              
              {/* الملاحظة الثانية */}
              <div className="flex items-start gap-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border border-red-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex-shrink-0 mt-1">
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-full p-2 shadow-md animate-pulse">
                    <X className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-red-900 font-bold text-sm mb-1">خدماتنا</h4>
                  <p className="text-red-800 text-sm leading-relaxed">
                    لا يوجد لدينا إيجار عاملات - نحن نقدم خدمات الاستقدام فقط
                  </p>
                </div>
              </div>
            </div>
            
            {/* شريط ديكوري في الأسفل */}
            <div className="h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600"></div>
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
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('CV clicked:', cv.fullName, cv.id);
                              console.log('CV object:', cv);
                              console.log('Setting selectedCVForView to:', cv);
                              setSelectedCVForView(cv);
                              console.log('selectedCVForView should be set now');
                            }}
                            className="w-full h-full focus:outline-none cursor-pointer group relative"
                            title="اضغط لعرض السيرة الكاملة"
                          >
                            <ImageWithFallback
                              src={cv.cvImageUrl}
                              alt={cv.fullName}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain transition-all duration-500 group-hover:brightness-110"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Image clicked:', cv.fullName, cv.id);
                                setSelectedCVForView(cv);
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
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full mb-2 sm:mb-3 shadow-xl">
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
                          className="w-full bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#1fb855] hover:to-[#0e6f5c] text-white py-3 sm:py-3.5 px-2 sm:px-4 rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group relative overflow-hidden"
                        >
                          {/* تأثير النبض المتوهج في الخلفية */}
                          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></span>
                          
                          {/* دائرة متوهجة خلف الأيقونات */}
                          <span className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 blur-xl"></span>
                          
                          {/* أيقونة WhatsApp الرئيسية مع دوران وتكبير */}
                          <svg className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 relative z-10 group-hover:scale-125 group-hover:rotate-[360deg] transition-all duration-700 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                          </svg>
                          
                          <span className="font-extrabold relative z-10 group-hover:scale-110 transition-transform duration-300">اضغط هنا للاستفسار</span>
                          
                          {/* سهم نابض ومتحرك */}
                          <svg className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 relative z-10 group-hover:translate-x-2 transition-all duration-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* زر الفيديو - بتصميم احترافي - يخفى عندما يكون فلتر نقل خدمات مفعل */}
                      {positionFilter !== 'نقل خدمات' && (
                        <div className="mb-2 sm:mb-3">
                          <button
                            onClick={() => {
                              if (cv.videoLink && cv.videoLink.trim() !== '') {
                                setVideoModalKey(prev => prev + 1);
                                setSelectedVideo(cv.videoLink);
                              } else {
                                toast.error('لا يوجد رابط فيديو لهذه السيرة');
                              }
                            }}
                            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] group relative overflow-hidden"
                          >
                            {/* تأثير النبض المتوهج */}
                            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></span>
                            
                            {/* دائرة متوهجة */}
                            <span className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 blur-xl"></span>
                            
                            {/* أيقونة Play احترافية */}
                            <div className="relative z-10 bg-white/20 rounded-full p-1 group-hover:bg-white/30 transition-all duration-300">
                              <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                            </div>
                            
                            <span className="font-bold relative z-10 text-[9px] sm:text-sm leading-tight">شاهد طريقة استخراج التأشيرة</span>
                            
                            {/* أيقونة سهم */}
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 relative z-10 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      )}
                      
                      {/* باقي الأزرار - محسّنة للموبايل */}
                      <div className={`grid ${positionFilter === 'نقل خدمات' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-3`}>
                        {/* زر فيديو العاملة - يظهر فقط عند تفعيل فلتر نقل خدمات */}
                        {positionFilter === 'نقل خدمات' && (
                          <button
                            onClick={() => {
                              if (cv.videoLink && cv.videoLink.trim() !== '') {
                                setVideoModalKey(prev => prev + 1);
                                setSelectedVideo(cv.videoLink);
                              } else {
                                toast.error('لا يوجد رابط فيديو لهذه السيرة');
                              }
                            }}
                            className="bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white py-3 sm:py-3.5 px-1 rounded-lg text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-300 min-h-[60px] sm:min-h-[70px] shadow-md hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105 group relative overflow-hidden"
                            title="فيديو العاملة المطلوبة"
                          >
                            {/* تأثير متوهج */}
                            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                            
                            <div className="relative z-10 bg-white/20 rounded-full p-1.5 mb-1 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                              <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                            </div>
                            <span className="font-bold leading-tight text-[10px] sm:text-xs">فيديو العاملة</span>
                          </button>
                        )}
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
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('CV clicked (list):', cv.fullName, cv.id);
                            setSelectedCVForView(cv);
                          }}
                          className="w-full h-full focus:outline-none cursor-pointer group/img relative"
                          title="اضغط لعرض السيرة الكاملة"
                        >
                          <ImageWithFallback
                            src={cv.cvImageUrl}
                            alt={cv.fullName}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain transition-all duration-300 group-hover:brightness-110"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Image clicked (list):', cv.fullName, cv.id);
                              setSelectedCVForView(cv);
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
                        className="bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#1fb855] hover:to-[#0e6f5c] text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                        </svg>
                        اضغط هنا للاستفسار
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
          <a 
            href="https://qsr.sa/offers1-2" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src="/logo-2.png" alt="الاسناد السريع" className="h-10 sm:h-12 w-auto object-contain bg-white rounded-lg p-2" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">الاسناد السريع للاستقدام</h2>
              <p className="text-xs sm:text-sm text-blue-200">خدمات استقدام العمالة المنزلية</p>
            </div>
          </a>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-6">
            <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-400" />
            <span className="text-sm sm:text-lg">الرياض - المملكة العربية السعودية</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6">
            {whatsappNumber && (
              <>
                <a href={`tel:${whatsappNumber}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto justify-center">
                  <Phone className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="font-semibold text-sm sm:text-base" dir="ltr">{whatsappNumber}</span>
                </a>
                <a 
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} 
                  className="flex items-center gap-2 bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#1fb855] hover:to-[#0e6f5c] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto justify-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="h-4 sm:h-5 w-4 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                  </svg>
                  <span className="font-semibold text-sm sm:text-base">واتساب</span>
                </a>
              </>
            )}
            <a href="mailto:info@qsr.sa" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto justify-center">
              <Mail className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="font-semibold text-sm sm:text-base" dir="ltr">info@qsr.sa</span>
            </a>
          </div>
          
          <div className="pt-4 border-t border-blue-700">
            <p className="text-sm text-blue-200"> 2025 الاسناد السريع للاستقدام - جميع الحقوق محفوظة</p>
          </div>
        </div>
        </footer>
      </div>
      
      {/* Video Modal - محسن للهواتف */}
      <VideoPlayer 
        videoUrl={selectedVideo} 
        onClose={() => setSelectedVideo(null)}
        videoModalKey={videoModalKey}
        title={positionFilter === 'نقل خدمات' ? 'فيديو العاملة المطلوبة' : 'شاهد طريقة استخراج التأشيرة'}
      />

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
                    <ImageWithFallback
                      src={selectedCVForView.cvImageUrl}
                      alt={selectedCVForView.fullName}
                      className="w-full h-auto object-contain bg-white rounded-lg shadow-xl border-2 border-gray-200 hover:shadow-2xl transition-all duration-300 cursor-zoom-in"
                      onClick={(e) => {
                        // فتح الصورة في تبويب جديد عند النقر
                        if (selectedCVForView.cvImageUrl) {
                        window.open(processImageUrl(selectedCVForView.cvImageUrl), '_blank');
                        }
                      }}
                      title="اضغط لفتح الصورة بالحجم الكامل"
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
                  <span>اضغط هنا للاستفسار</span>
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
                    className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-pink-500/50 hover:scale-105 border-2 border-pink-300/40"
                  >
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse fill-current" />
                    <span>فيديو العاملة المطلوبة</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* شخصية فنانيس الكرتونية المتحركة */}
      <FlyingLantern />

      {/* نافذة منبثقة لجمع أرقام الهواتف */}
      <PhoneNumberPopup salesPageId="sales4" delaySeconds={8} expiryDays={7} />
    </div>
    </>
  )
}