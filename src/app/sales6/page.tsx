'use client'

import { useState, useEffect, useRef } from 'react'
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
  ChevronRight
} from 'lucide-react'
import CountryFlag from '../../components/CountryFlag'
import { processImageUrl } from '@/lib/url-utils'
import SimpleImageCarousel from '@/components/SimpleImageCarousel'
import ClarityScript from '@/components/ClarityScript'

// إضافة أنيميشن CSS مخصص
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
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }

  .animate-slideUp {
    animation: slideUp 0.5s ease-out;
  }

  .search-input::placeholder {
    color: black !important;
    opacity: 1 !important;
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

export default function Sales6Page() {
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
  const salesPageId = 'sales6'
  
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

  // دالة مطابقة الجنسية الذكية
  const matchesNationalityFilter = (cvNationality: string | null | undefined, filter: string): boolean => {
    if (filter === 'ALL') return true
    if (!cvNationality) return false
    
    // مطابقة مباشرة
    if (cvNationality === filter) return true
    
    // خريطة الجنسيات بالعربي والإنجليزي
    const nationalityMap: { [key: string]: string[] } = {
      'FILIPINO': ['الفلبين', 'فلبيني', 'فلبينيه', 'فلبين', 'filipino', 'philippines'],
      'INDIAN': ['الهند', 'هندي', 'هنديه', 'هند', 'indian', 'india'],
      'BANGLADESHI': ['بنغلاديش', 'بنغلاديشي', 'بنغلادش', 'بنقلاديش', 'bangladeshi', 'bangladesh'],
      'ETHIOPIAN': ['إثيوبيا', 'اثيوبي', 'اثيوبيه', 'إثيوبيا', 'إثيوبي', 'اثوبيا', 'ethiopian', 'ethiopia'],
      'KENYAN': ['كينيا', 'كيني', 'كينيه', 'كينيا', 'kenyan', 'kenya'],
      'UGANDAN': ['أوغندا', 'اوغندية', 'أوغندي', 'اوغندي', 'أوغندا', 'اوغندا', 'ugandan', 'uganda']
    }
    
    // البحث في الخريطة
    const searchTerms = nationalityMap[filter] || []
    for (const term of searchTerms) {
      if (smartSearch(cvNationality, term)) {
        return true
      }
    }
    
    return false
  }

  // فلترة السير الذاتية - نظام شامل مثل الداشبورد
  useEffect(() => {
    const filtered = cvs.filter(cv => {
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
      const matchesNationality = matchesNationalityFilter(cv.nationality, nationalityFilter)
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

      return matchesSearch && matchesStatus && matchesNationality && matchesMaritalStatus && 
             matchesAge && matchesSkill && matchesExperience && matchesLanguage && 
             matchesReligion && matchesEducation && matchesSalary && matchesContractPeriod && 
             matchesPassportStatus && matchesHeight && matchesWeight && matchesChildren && matchesLocation &&
             matchesDriving
    })

    setFilteredCvs(filtered)
  }, [cvs, searchTerm, statusFilter, nationalityFilter, maritalStatusFilter, ageFilter, 
      skillFilter, experienceFilter, languageFilter, religionFilter, educationFilter, 
      salaryFilter, contractPeriodFilter, passportStatusFilter, heightFilter, weightFilter, 
      childrenFilter, locationFilter, drivingFilter])

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
من صفحة: Sales 1`;

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
      {/* Microsoft Clarity Analytics */}
      <ClarityScript />
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
                      className="bg-[#25d366] hover:bg-[#1fb855] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-bold"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                      </svg>
                      <span className="hidden sm:inline">اطلب عاملتك</span>
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
                if (nationalityFilter === 'FILIPINO') {
                  setNationalityFilter('ALL');
                } else {
                  setNationalityFilter('FILIPINO');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'FILIPINO'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'FILIPINO'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              
              {/* المحتوى */}
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">الفلبين</h3>
                
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => matchesNationalityFilter(cv.nationality, 'FILIPINO')).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية السريلانكا */}
            <div
              onClick={() => {
                if (nationalityFilter === 'SRI_LANKAN') {
                  setNationalityFilter('ALL');
                  setReligionFilter('ALL');
                } else {
                  setNationalityFilter('SRI_LANKAN');
                  setReligionFilter('MUSLIM');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'SRI_LANKAN'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'SRI_LANKAN'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">سريلانكا</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => matchesNationalityFilter(cv.nationality, 'SRI_LANKAN')).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية البنغلاديش */}
            <div
              onClick={() => {
                if (nationalityFilter === 'BANGLADESHI') {
                  setNationalityFilter('ALL');
                  setReligionFilter('ALL');
                } else {
                  setNationalityFilter('BANGLADESHI');
                  setReligionFilter('MUSLIM');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'BANGLADESHI'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'BANGLADESHI'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">بنغلاديش</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => matchesNationalityFilter(cv.nationality, 'BANGLADESHI')).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية الإثيوبيا */}
            <div
              onClick={() => {
                if (nationalityFilter === 'ETHIOPIAN') {
                  setNationalityFilter('ALL');
                  setReligionFilter('ALL');
                } else {
                  setNationalityFilter('ETHIOPIAN');
                  setReligionFilter('MUSLIM');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'ETHIOPIAN'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'ETHIOPIAN'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">إثيوبيا</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => matchesNationalityFilter(cv.nationality, 'ETHIOPIAN')).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية الكينيا */}
            <div
              onClick={() => {
                if (nationalityFilter === 'KENYAN') {
                  setNationalityFilter('ALL');
                  setReligionFilter('ALL');
                } else {
                  setNationalityFilter('KENYAN');
                  setReligionFilter('MUSLIM');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'KENYAN'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'KENYAN'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">كينيا</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => matchesNationalityFilter(cv.nationality, 'KENYAN')).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية الأوغندا */}
            <div
              onClick={() => {
                if (nationalityFilter === 'UGANDAN') {
                  setNationalityFilter('ALL');
                  setReligionFilter('ALL');
                } else {
                  setNationalityFilter('UGANDAN');
                  setReligionFilter('MUSLIM');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'UGANDAN'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'UGANDAN'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">أوغندا</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => matchesNationalityFilter(cv.nationality, 'UGANDAN')).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر سائق خاص */}
            <div
              onClick={() => {
                if (drivingFilter === 'YES') {
                  setDrivingFilter('ALL');
                } else {
                  setDrivingFilter('YES');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                drivingFilter === 'YES'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                drivingFilter === 'YES'
                  ? 'bg-gradient-to-br from-emerald-700 to-emerald-900'
                  : 'bg-gradient-to-br from-emerald-600 to-emerald-800 group-hover:from-emerald-500 group-hover:to-emerald-700'
              }`}></div>
              
              {/* المحتوى */}
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">سائق خاص</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => cv.driving === 'YES').length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر الجنسية البروندية */}
            <div
              onClick={() => {
                if (nationalityFilter === 'BURUNDIAN') {
                  setNationalityFilter('ALL');
                  setReligionFilter('ALL');
                } else {
                  setNationalityFilter('BURUNDIAN');
                  setReligionFilter('MUSLIM');
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                nationalityFilter === 'BURUNDIAN'
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 transition-all duration-300 ${
                nationalityFilter === 'BURUNDIAN'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700'
              }`}></div>
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">بروندية</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => matchesNationalityFilter(cv.nationality, 'BURUNDIAN')).length}
                  </span>
                </div>
              </div>
            </div>

            {/* فلتر نقل خدمات */}
            <div
              onClick={() => {
                if (statusFilter === CVStatus.RETURNED) {
                  setStatusFilter('ALL');
                } else {
                  setStatusFilter(CVStatus.RETURNED);
                }
              }}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                statusFilter === CVStatus.RETURNED
                  ? 'shadow-2xl scale-105 ring-4 ring-[#1e3a8a]/30'
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              }`}
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                statusFilter === CVStatus.RETURNED
                  ? 'bg-gradient-to-br from-amber-700 to-amber-900'
                  : 'bg-gradient-to-br from-amber-600 to-amber-800 group-hover:from-amber-500 group-hover:to-amber-700'
              }`}></div>
              
              {/* المحتوى */}
              <div className="relative p-4 flex flex-col items-center justify-center min-h-[100px] z-10">
                <h3 className="text-white font-bold text-xl mb-3">نقل خدمات</h3>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-8 py-2 min-w-[80px] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {cvs.filter(cv => cv.status === CVStatus.RETURNED).length}
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
                className={`group bg-white rounded-lg shadow-md border ${selectedCvs.includes(cv.id) ? 'border-[#1e3a8a] ring-2 ring-[#1e3a8a]/20' : 'border-gray-200'} overflow-hidden hover:shadow-lg transition-all duration-300 ${
                  viewMode === 'list' ? 'flex items-center p-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* صورة السيرة الذاتية - مع معلومات احترافية */}
                    <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      {cv.profileImage ? (
                        <>
                          <img
                            src={processImageUrl(cv.profileImage)}
                            alt={cv.fullName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 bg-gradient-to-br from-blue-500 to-purple-600"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (!target.src.startsWith('data:')) {
                                target.src = 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3C/svg%3E'
                              }
                            }}
                          />
                          
                          {/* شريط علوي - الكود والعمر والجنسية */}
                          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-[#1e3a8a] text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded">
                                  {cv.referenceCode}
                                </span>
                                {cv.age && (
                                  <span className="bg-white/90 text-gray-800 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded">
                                    {cv.age} سنة
                                  </span>
                                )}
                              </div>
                              <div className="text-2xl sm:text-3xl">
                                {cv.nationality === 'FILIPINO' && '🇵🇭'}
                                {cv.nationality === 'INDIAN' && '🇮🇳'}
                                {cv.nationality === 'BANGLADESHI' && '🇧🇩'}
                                {cv.nationality === 'ETHIOPIAN' && '🇪🇹'}
                                {cv.nationality === 'KENYAN' && '🇰🇪'}
                                {cv.nationality === 'UGANDAN' && '🇺🇬'}
                              </div>
                            </div>
                          </div>
                          
                          {/* شريط سفلي بالمعلومات - موسع */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent p-2 sm:p-3">
                            <div className="space-y-1.5">
                              {/* الاسم */}
                              <div className="flex items-center gap-1.5">
                                <div className="bg-white/20 backdrop-blur-sm p-1 rounded flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <p className="text-white font-bold text-[10px] sm:text-xs truncate flex-1 drop-shadow-lg">
                                  {cv.fullNameArabic || cv.fullName}
                                </p>
                              </div>
                              
                              {/* الوظيفة والديانة - في صف واحد */}
                              <div className="grid grid-cols-2 gap-1.5">
                                {/* الوظيفة */}
                                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded px-1.5 py-1">
                                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                                  </svg>
                                  <p className="text-white text-[9px] sm:text-[10px] truncate font-medium drop-shadow-md">
                                    {cv.position || 'غير محدد'}
                                  </p>
                                </div>
                                
                                {/* الديانة */}
                                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded px-1.5 py-1">
                                  <span className="text-xs flex-shrink-0">
                                    {cv.religion && (cv.religion.toUpperCase().includes('MUSLIM') || cv.religion.includes('مسلم')) ? '🕌' : 
                                     cv.religion && (cv.religion.toUpperCase().includes('CHRISTIAN') || cv.religion.includes('مسيحي')) ? '✝️' : 
                                     cv.religion && (cv.religion.toUpperCase().includes('BUDDHIST') || cv.religion.includes('بوذي')) ? '☸️' : 
                                     cv.religion && (cv.religion.toUpperCase().includes('HINDU') || cv.religion.includes('هندوسي')) ? '🕉️' : '📿'}
                                  </span>
                                  <p className="text-white text-[9px] sm:text-[10px] font-semibold truncate drop-shadow-md">
                                    {cv.religion ? (
                                      cv.religion.toUpperCase().includes('MUSLIM') || cv.religion.includes('مسلم') ? 'مسلم' : 
                                      cv.religion.toUpperCase().includes('CHRISTIAN') || cv.religion.includes('مسيحي') ? 'مسيحي' : 
                                      cv.religion.toUpperCase().includes('BUDDHIST') || cv.religion.includes('بوذي') ? 'بوذي' : 
                                      cv.religion.toUpperCase().includes('HINDU') || cv.religion.includes('هندوسي') ? 'هندوسي' : 
                                      cv.religion
                                    ) : 'غير محدد'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
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
                    <div className="p-2 sm:p-4 bg-gradient-to-br from-gray-50 to-white">
                      {/* زر الحجز الرئيسي - محسّن للموبايل */}
                      <div className="mb-2 sm:mb-2">
                        <button
                          onClick={() => sendWhatsAppMessage(cv)}
                          className="w-full bg-gradient-to-r from-[#25d366] to-[#20c158] hover:from-[#1fb855] hover:to-[#1da84a] text-white py-2.5 sm:py-3 px-1 sm:px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                        >
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                          </svg>
                          <span className="truncate font-extrabold">حجز</span>
                        </button>
                      </div>
                      
                      {/* باقي الأزرار - محسّنة للموبايل */}
                      <div className="grid grid-cols-4 gap-1 sm:gap-2">
                        <button
                          onClick={() => shareSingleCV(cv)}
                          className="bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] hover:from-[#1e40af] hover:to-[#1e3a8a] text-white py-2 sm:py-2.5 px-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-xs flex flex-col items-center justify-center transition-all duration-200 min-h-[50px] sm:min-h-[60px] shadow-sm sm:shadow-md active:scale-95"
                          title="مشاركة السيرة الذاتية"
                        >
                          <Share2 className="h-4 w-4 sm:h-4 sm:w-4 mb-0.5" />
                          <span className="font-bold leading-tight">مشاركة</span>
                        </button>
                        <button
                          onClick={() => downloadSingleCV(cv)}
                          className="bg-gradient-to-b from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-2 sm:py-2.5 px-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-xs flex flex-col items-center justify-center transition-all duration-200 min-h-[50px] sm:min-h-[60px] shadow-sm sm:shadow-md active:scale-95"
                          title="تحميل السيرة الذاتية"
                        >
                          <Download className="h-4 w-4 sm:h-4 sm:w-4 mb-0.5" />
                          <span className="font-bold leading-tight">تحميل</span>
                        </button>
                        <button
                          onClick={() => router.push(`/cv/${cv.id}`)}
                          className="bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] hover:from-[#1e40af] hover:to-[#1e3a8a] text-white py-2 sm:py-2.5 px-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-xs flex flex-col items-center justify-center transition-all duration-200 min-h-[50px] sm:min-h-[60px] shadow-sm sm:shadow-md active:scale-95"
                          title="عرض السيرة الكاملة"
                        >
                          <Eye className="h-4 w-4 sm:h-4 sm:w-4 mb-0.5" />
                          <span className="font-bold leading-tight">عرض</span>
                        </button>
                        <button
                          onClick={() => {
                            if (cv.videoLink && cv.videoLink.trim() !== '') {
                              setSelectedVideo(cv.videoLink);
                            } else {
                              alert('لا يوجد رابط فيديو لهذه السيرة');
                            }
                          }}
                          className="bg-gradient-to-b from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 sm:py-2.5 px-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-xs flex flex-col items-center justify-center transition-all duration-200 min-h-[50px] sm:min-h-[60px] shadow-sm sm:shadow-md active:scale-95"
                          title="مشاهدة الفيديو"
                        >
                          <Play className="h-4 w-4 sm:h-4 sm:w-4 mb-0.5" />
                          <span className="font-bold leading-tight">فيديو</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // عرض القائمة - تصميم محسن
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                      {cv.profileImage ? (
                        <img 
                          src={processImageUrl(cv.profileImage)} 
                          alt={cv.fullName} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 bg-gradient-to-br from-blue-500 to-purple-600"
                          onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (!target.src.startsWith('data:')) {
                                target.src = 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3C/svg%3E'
                              }
                            }}
                        />
                      ) : (
                        <img 
                          src="/placeholder-worker.png"
                          alt={cv.fullName}
                          className="w-full h-full object-cover"
                        />
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
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                        </svg>
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
</div>
  )
}

