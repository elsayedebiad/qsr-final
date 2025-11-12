'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CVStatus, Priority, SkillLevel } from '@prisma/client'
import {
  Search,
  FileText,
  User,
  Edit,
  Trash2,
  Download,
  Undo2,
  RefreshCw,
  Zap,
  SlidersHorizontal, // ← أيقونة موحّدة للـ Slider menu
  Globe,
  Calendar,
  Heart,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FileSignature,
  Play,
  CalendarCheck,
  X,
  XCircle,
  BookOpen,
  DollarSign,
  Ruler,
  Scale,
  Baby,
  Star,
  Filter,
  Eye,
  ExternalLink,
  Share2,
  Grid3X3,
  List,
  RotateCcw,
  MapPin,
} from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import BulkImageDownloader from '../../components/BulkImageDownloader'
import CountryFlag from '../../components/CountryFlag'
import VideoPlayer from '@/components/VideoPlayer'
import { BulkActivityLogger, CVActivityLogger, ContractActivityLogger } from '../../lib/activity-logger'
import { getCountryInfo } from '../../lib/country-utils';
import { extractGoogleDriveFileId } from '../../lib/google-drive-utils';
import LottieIcon from '../../components/LottieIcon'
import { processImageUrl } from '../../lib/url-utils'
import DownloadProgressModal from '@/components/DownloadProgressModal'

interface User {
  id: string
  email: string
  name: string
  role: string
}

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
  createdBy: { name: string; email: string }
  createdAt: string
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
  workExperience?: number
  experience?: number
  arabicLevel?: string
  languageLevel?: string
  // خصائص إضافية للفلاتر المتقدمة
  religion?: string
  education?: string
  educationLevel?: string
  englishLevel?: SkillLevel
  passportStatus?: string
  height?: number | string
  weight?: number | string
  children?: string
  passportNumber?: string
  passportExpiryDate?: string
  numberOfChildren?: number
  livingTown?: string
  placeOfBirth?: string
  videoLink?: string
  cvImageUrl?: string
}

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// دالة تحويل الجنسية للعربي - helper function
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

export default function CVsPage() {
  const router = useRouter()

  const [cvs, setCvs] = useState<CV[]>([])
  const [filteredCvs, setFilteredCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [religionFilter, setReligionFilter] = useState<string>('ALL')
  const [nationalityFilter, setNationalityFilter] = useState<string>('ALL')
  const [skillFilter, setSkillFilter] = useState<string>('ALL')
  const [skillFilters, setSkillFilters] = useState<string[]>([])
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false)
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<string>('ALL')
  const [ageFilter, setAgeFilter] = useState<string>('ALL')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [experienceFilter, setExperienceFilter] = useState<string>('ALL')
  const [arabicLevelFilter, setArabicLevelFilter] = useState<string>('ALL')
  const [englishLevelFilter, setEnglishLevelFilter] = useState<string>('ALL')
  
  // فلاتر إضافية شاملة
  const [educationFilter, setEducationFilter] = useState<string>('ALL')
  const [salaryFilter, setSalaryFilter] = useState<string>('ALL')
  const [contractPeriodFilter, setContractPeriodFilter] = useState<string>('ALL')
  const [passportStatusFilter, setPassportStatusFilter] = useState<string>('ALL')
  const [heightFilter, setHeightFilter] = useState<string>('ALL')
  const [weightFilter, setWeightFilter] = useState<string>('ALL')
  const [childrenFilter, setChildrenFilter] = useState<string>('ALL')
  const [locationFilter, setLocationFilter] = useState<string>('ALL')
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  // استخراج الجنسيات الفريدة من البيانات (مثل صفحات السلز)
  const uniqueNationalities = useMemo(() => {
    // استثناء السير المتعاقدة والمؤرشفة
    const visibleCvs = cvs.filter(cv => cv.status !== CVStatus.HIRED && cv.status !== CVStatus.ARCHIVED)
    
    // استخراج الجنسيات وتوحيدها (تحويل للإنجليزي uppercase)
    const nationalitiesSet = new Set<string>()
    
    visibleCvs.forEach(cv => {
      if (cv.nationality && cv.nationality.trim() !== '') {
        // تنظيف وتوحيد الجنسية
        const cleanNationality = cv.nationality.trim().toUpperCase()
        nationalitiesSet.add(cleanNationality)
      }
    })
    
    // تحويل إلى array وترتيب بالعربية
    return Array.from(nationalitiesSet)
      .sort((a, b) => {
        const arabicA = getNationalityArabic(a)
        const arabicB = getNationalityArabic(b)
        return arabicA.localeCompare(arabicB, 'ar')
      })
  }, [cvs])
  const [videoModalKey, setVideoModalKey] = useState(0)
  const [viewingCv, setViewingCv] = useState<CV | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedCVForView, setSelectedCVForView] = useState<CV | null>(null)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [sharePopupMessage, setSharePopupMessage] = useState('')

  const [selectedCvs, setSelectedCvs] = useState<string[]>([])
  const [showBulkDownloader, setShowBulkDownloader] = useState(false)
  const [showBulkOperationModal, setShowBulkOperationModal] = useState(false)
  const [bulkOperationType, setBulkOperationType] = useState<'delete' | 'status' | 'download' | 'archive'>('delete')
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  // شريط تحميل PNG الاحترافي
  const [showDownloadBar, setShowDownloadBar] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  // View mode for SALES accounts
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Reset system states
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(30)
  const [paginatedCvs, setPaginatedCvs] = useState<CV[]>([])

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newBulkStatus, setNewBulkStatus] = useState<CVStatus>(CVStatus.NEW)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [contractingCv, setContractingCv] = useState<CV | null>(null)
  const [identityNumber, setIdentityNumber] = useState('')
  const [isCreatingContract, setIsCreatingContract] = useState(false)
  
  // حالة مودال الحجز
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [bookingCv, setBookingCv] = useState<CV | null>(null)
  const [bookingIdentityNumber, setBookingIdentityNumber] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  
  // Download modal states
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [downloadModalProgress, setDownloadModalProgress] = useState(0)
  const [downloadModalStatus, setDownloadModalStatus] = useState<'preparing' | 'downloading' | 'success' | 'error'>('preparing')
  const [downloadModalFileName, setDownloadModalFileName] = useState('')
  const [downloadModalError, setDownloadModalError] = useState('')

  useEffect(() => {
    fetchCVs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // دالة مطابقة الجنسية - منسوخة من صفحة السلز
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
    
    // تنظيف البيانات للمقارنة
    const cleanNationality = cvNationality.trim().toUpperCase()
    const cleanFilter = englishFilter.toUpperCase()
    
    // مطابقة دقيقة فقط
    return cleanNationality === cleanFilter
  }, [])

  // فلترة السير الذاتية - تم نسخها من صفحة السلز
  const allFilteredCvs = useMemo(() => {
    // التحقق من وجود البيانات أولاً
    if (!cvs || cvs.length === 0) {
      return []
    }
    
    // إخفاء السير المتعاقدة والمؤرشفة، وإظهار السير المعادة
    return cvs.filter(cv => cv.status !== CVStatus.HIRED && cv.status !== CVStatus.ARCHIVED).filter(cv => {
      // البحث الشامل في جميع البيانات
      const term = searchTerm.toLowerCase()
      const matchesSearch = searchTerm === '' || 
        cv.fullName.toLowerCase().includes(term) ||
        (cv.fullNameArabic || '').toLowerCase().includes(term) ||
        (cv.nationality || '').toLowerCase().includes(term) ||
        (cv.position || '').toLowerCase().includes(term) ||
        (cv.referenceCode || '').toLowerCase().includes(term) ||
        (cv.passportNumber || '').toLowerCase().includes(term) ||
        (cv.email || '').toLowerCase().includes(term) ||
        (cv.phone || '').includes(term) ||
        (cv.religion || '').toLowerCase().includes(term) ||
        (cv.maritalStatus || '').toLowerCase().includes(term) ||
        (cv.education || '').toLowerCase().includes(term) ||
        (cv.arabicLevel || '').toLowerCase().includes(term) ||
        (cv.englishLevel || '').toLowerCase().includes(term) ||
        (cv.experience || '').toLowerCase().includes(term) ||
        (cv.livingTown || '').toLowerCase().includes(term) ||
        cv.age?.toString().includes(term) ||
        (cv.height?.toString() || '').includes(term) ||
        (cv.weight?.toString() || '').includes(term)

      // فلتر الديانة
      const matchesReligion = religionFilter === 'ALL' || (() => {
        if (!cv.religion) return false
        if (religionFilter === 'مسلمة') return cv.religion.includes('مسلم') || cv.religion.includes('MUSLIM')
        if (religionFilter === 'مسيحية') return cv.religion.includes('مسيحي') || cv.religion.includes('CHRISTIAN')
        if (religionFilter === 'أخرى') return cv.religion && !cv.religion.includes('مسلم') && !cv.religion.includes('مسيحي')
        return cv.religion === religionFilter
      })()
      
      // فلتر الجنسية - باستخدام دالة المطابقة
      const matchesNationality = matchesNationalityFilter(cv.nationality, nationalityFilter)
      
      // فلتر الحالة الاجتماعية
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

      // فلتر المهارات - اختيار متعدد
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

      // فلتر الخبرة
      const matchesExperience = (() => {
        if (experienceFilter === 'ALL') return true
        
        const expVal = cv.experience
        let experience = ''
        if (typeof expVal === 'string') {
          experience = expVal.trim().toLowerCase()
        } else if (typeof expVal === 'number') {
          experience = String(expVal)
        }
        
        const numbers = experience.match(/\d+/g)
        const years = numbers && numbers.length > 0 ? parseInt(numbers[0]) : 0
        
        switch (experienceFilter) {
          case 'NO_EXPERIENCE':
            return experience === 'لا يوجد' || experience === '' || 
                   experience === 'no' || experience === 'none' || years === 0
          case '1-2': return years >= 1 && years <= 2
          case '3-5': return years >= 3 && years <= 5
          case '6-10': return years >= 6 && years <= 10
          case 'MORE_10': return years > 10
          default: return false
        }
      })()

      // فلتر اللغة العربية
      const matchesArabicLevel = arabicLevelFilter === 'ALL' || (() => {
        const arabicLevel = cv.arabicLevel ?? cv.languageLevel
        if (arabicLevelFilter === 'WEAK') return arabicLevel === null || arabicLevel === undefined
        if (arabicLevelFilter === 'NO') return arabicLevel === 'NO'
        return arabicLevel === arabicLevelFilter
      })()

      // فلتر اللغة الإنجليزية  
      const matchesEnglishLevel = englishLevelFilter === 'ALL' || (() => {
        const englishLevel = cv.englishLevel
        if (englishLevelFilter === 'WEAK') return englishLevel === null || englishLevel === undefined
        if (englishLevelFilter === 'NO') return englishLevel === 'NO'
        return englishLevel === englishLevelFilter
      })()

      // فلتر التعليم - متعلم/غير متعلم
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

      // فلتر الطول
      const matchesHeight = heightFilter === 'ALL' || (() => {
        if (!cv.height) return false
        const height = typeof cv.height === 'number' ? cv.height : parseInt(String(cv.height))
        switch (heightFilter) {
          case '<155': return height < 155
          case '155-160': return height >= 155 && height < 160
          case '160-165': return height >= 160 && height < 165
          case '165-170': return height >= 165 && height < 170
          case '170-175': return height >= 170 && height < 175
          case '>175': return height >= 175
          default: return true
        }
      })()

      // فلتر الوزن
      const matchesWeight = weightFilter === 'ALL' || (() => {
        if (!cv.weight) return false
        const weight = typeof cv.weight === 'number' ? cv.weight : parseInt(String(cv.weight))
        switch (weightFilter) {
          case '<50': return weight < 50
          case '50-55': return weight >= 50 && weight < 55
          case '55-60': return weight >= 55 && weight < 60
          case '60-65': return weight >= 60 && weight < 65
          case '65-70': return weight >= 65 && weight < 70
          case '70-75': return weight >= 70 && weight < 75
          case '>75': return weight >= 75
          default: return true
        }
      })()

      // فلتر الموقع
      const matchesLocation = locationFilter === 'ALL' || 
        cv.livingTown?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        cv.placeOfBirth?.toLowerCase().includes(locationFilter.toLowerCase())

      return matchesSearch && matchesReligion && matchesNationality && 
             matchesAge && matchesSkill && matchesArabicLevel && 
             matchesEnglishLevel && matchesEducation && matchesExperience &&
             matchesMaritalStatus && matchesHeight &&
             matchesWeight && matchesLocation
    })
  }, [cvs, searchTerm, religionFilter, nationalityFilter, ageFilter, 
      skillFilters, arabicLevelFilter, englishLevelFilter, educationFilter,
      experienceFilter, maritalStatusFilter, heightFilter, weightFilter, locationFilter])

  useEffect(() => {
    setFilteredCvs(allFilteredCvs)
  }, [allFilteredCvs])

  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedCvs(filteredCvs.slice(startIndex, endIndex))
  }, [filteredCvs, currentPage, itemsPerPage])

  // Reset to first page when filters or items per page change
  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    religionFilter,
    nationalityFilter,
    skillFilter,
    maritalStatusFilter,
    ageFilter,
    experienceFilter,
    arabicLevelFilter,
    englishLevelFilter,
    educationFilter,
    salaryFilter,
    contractPeriodFilter,
    passportStatusFilter,
    heightFilter,
    weightFilter,
    childrenFilter,
    locationFilter,
    itemsPerPage
  ])

  // إغلاق الـModal بزر Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCVForView(null)
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

  const fetchCVs = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return router.push('/login')
      const res = await fetch('/api/cvs', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCvs(data.cvs || [])
    } catch {
      toast.error('فشل في تحميل السير الذاتية')
    } finally {
      setIsLoading(false)
    }
  }

  // دالة حساب عدد البيانات لكل فلتر - منسوخة من صفحة السلز
  const getCountForFilter = useCallback((filterType: string, filterValue: string): number => {
    if (!cvs || cvs.length === 0) return 0
    
    // استثناء السير المتعاقدة والمؤرشفة من الحساب
    const visibleCvs = cvs.filter(cv => cv.status !== CVStatus.HIRED && cv.status !== CVStatus.ARCHIVED)
    
    // معالجة خاصة لقيمة ALL - استثناء السائقين من فلاتر اللغة
    if (filterValue === 'ALL') {
      switch (filterType) {
        case 'arabicLevel':
        case 'englishLevel':
          // استثناء السائقين ونقل الخدمات من فلاتر اللغة
          return visibleCvs.filter(cv => {
            const position = (cv.position || '').trim()
            const isDriver = position.includes('سائق') || position.toLowerCase().includes('driver')
            const isService = position.includes('نقل خدمات') || position.includes('نقل الخدمات')
            return !isDriver && !isService
          }).length
        default:
          return visibleCvs.length
      }
    }
    
    return visibleCvs.filter(cv => {
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
          if (filterValue === '21-30') return cv.age >= 21 && cv.age <= 30
          if (filterValue === '30-40') return cv.age >= 30 && cv.age <= 40
          if (filterValue === '40-50') return cv.age >= 40 && cv.age <= 50
          return false
          
        case 'maritalStatus':
          return cv.maritalStatus === filterValue
          
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
          
        case 'arabicLevel':
          // استثناء السائقين ونقل الخدمات من فلاتر اللغة
          const posArabic = cv.position
          const positionArabic = (typeof posArabic === 'string' ? posArabic : (typeof posArabic === 'number' ? String(posArabic) : '')).trim()
          const isDriverArabic = positionArabic.includes('سائق') || positionArabic.toLowerCase().includes('driver')
          const isServiceArabic = positionArabic.includes('نقل خدمات') || positionArabic.includes('نقل الخدمات')
          if (isDriverArabic || isServiceArabic) return false
          
          const arabicLevel = cv.arabicLevel ?? cv.languageLevel
          if (filterValue === 'WEAK') return arabicLevel === null || arabicLevel === undefined
          if (filterValue === 'NO') return arabicLevel === 'NO'
          return arabicLevel === filterValue
          
        case 'englishLevel':
          // استثناء السائقين ونقل الخدمات من فلاتر اللغة
          const posEnglish = cv.position
          const positionEnglish = (typeof posEnglish === 'string' ? posEnglish : (typeof posEnglish === 'number' ? String(posEnglish) : '')).trim()
          const isDriverEnglish = positionEnglish.includes('سائق') || positionEnglish.toLowerCase().includes('driver')
          const isServiceEnglish = positionEnglish.includes('نقل خدمات') || positionEnglish.includes('نقل الخدمات')
          if (isDriverEnglish || isServiceEnglish) return false
          
          const englishLevel = cv.englishLevel
          if (filterValue === 'WEAK') return englishLevel === null || englishLevel === undefined
          if (filterValue === 'NO') return englishLevel === 'NO'
          return englishLevel === filterValue
          
        case 'experience':
          const expVal = cv.experience
          let exp = ''
          if (typeof expVal === 'string') {
            exp = expVal.trim().toLowerCase()
          } else if (typeof expVal === 'number') {
            exp = String(expVal)
          }
          const nums = exp.match(/\d+/g)
          const yrs = nums && nums.length > 0 ? parseInt(nums[0]) : 0
          
          if (filterValue === 'NO_EXPERIENCE') {
            return exp === 'لا يوجد' || exp === '' || exp === 'no' || exp === 'none' || yrs === 0
          }
          if (filterValue === '1-2') return yrs >= 1 && yrs <= 2
          if (filterValue === '3-5') return yrs >= 3 && yrs <= 5
          if (filterValue === '6-10') return yrs >= 6 && yrs <= 10
          if (filterValue === 'MORE_10') return yrs > 10
          return false
          
        case 'education':
          const educationLevel = (cv.educationLevel || cv.education || '').toLowerCase().trim()
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
          
        case 'salary':
          const salary = parseInt(cv.monthlySalary || '0')
          if (filterValue === '0-1000' && salary <= 1000) return true
          if (filterValue === '1000-1500' && salary > 1000 && salary <= 1500) return true
          if (filterValue === '1500-2000' && salary > 1500 && salary <= 2000) return true
          if (filterValue === '2000+' && salary > 2000) return true
          return false
          
        case 'contractPeriod':
          const period = cv.contractPeriod || ''
          if (filterValue === '1' && period.includes('1')) return true
          if (filterValue === '2' && period.includes('2')) return true
          if (filterValue === '3' && period.includes('3')) return true
          if (filterValue === 'أكثر' && (period.includes('4') || period.includes('5'))) return true
          return false
          
        case 'passportStatus':
          const passport = (cv.passportStatus || '').toLowerCase()
          if (filterValue === 'متوفر' && (passport.includes('متوفر') || passport.includes('available'))) return true
          if (filterValue === 'غير متوفر' && (passport.includes('غير') || passport.includes('not'))) return true
          if (filterValue === 'قيد الإنجاز' && (passport.includes('قيد') || passport.includes('processing'))) return true
          return false
          
        case 'height':
          if (!cv.height) return false
          const height = typeof cv.height === 'number' ? cv.height : parseInt(String(cv.height))
          if (filterValue === '<155') return height < 155
          if (filterValue === '155-160') return height >= 155 && height < 160
          if (filterValue === '160-165') return height >= 160 && height < 165
          if (filterValue === '165-170') return height >= 165 && height < 170
          if (filterValue === '170-175') return height >= 170 && height < 175
          if (filterValue === '>175') return height >= 175
          return false
          
        case 'weight':
          if (!cv.weight) return false
          const weight = typeof cv.weight === 'number' ? cv.weight : parseInt(String(cv.weight))
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
          
        case 'children':
          const childrenValue = cv.children || cv.numberOfChildren || 0
          const children = typeof childrenValue === 'number' ? childrenValue : parseInt(String(childrenValue || '0'))
          if (filterValue === 'NONE' && children === 0) return true
          if (filterValue === 'FEW' && children >= 1 && children <= 2) return true
          if (filterValue === 'MANY' && children > 2) return true
          return false
          
        default:
          return false
      }
    }).length
  }, [cvs])

  const toggleCvSelection = (id: string) => {
    setSelectedCvs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  const toggleSelectAll = () => {
    if (selectedCvs.length === paginatedCvs.length) setSelectedCvs([])
    else setSelectedCvs(paginatedCvs.map((cv) => cv.id))
  }

  // Pagination functions
  const totalPages = Math.ceil(filteredCvs.length / itemsPerPage)
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }
  const goToNextPage = () => goToPage(currentPage + 1)
  const goToPrevPage = () => goToPage(currentPage - 1)

  // دالة لاستخراج FILE_ID من روابط Google Drive المختلفة

  // تنزيل صورة واحدة: تحميل صورة Google Drive مباشرة
  const downloadSingleImage = async (cvId: string) => {
    const cv = cvs.find(c => c.id === cvId)
    if (!cv) {
      toast.error('السيرة الذاتية غير موجودة')
      return
    }
    
    // إضافة timestamp فريد لتجنب تكرار أسماء الملفات
    const timestamp = new Date().getTime()
    const fileName = `${cv.fullName}_${cv.referenceCode || cvId}_${timestamp}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_')
    
    const toastId = toast.loading('جاري تحميل الصورة...')
    
    try {
      // Import mobile download utilities
      const { downloadFromUrl, isMobileApp, showMobileDownloadInstructions } = await import('@/lib/mobile-download-utils')
      
      console.log('🔄 بدء تحميل صورة السيرة للـ:', cv.fullName)
      console.log('📱 هل هو تطبيق موبايل؟', isMobileApp())
      
      // التحقق من وجود صورة من Google Drive
      if (!cv.cvImageUrl) {
        // Try to generate image using API
        const token = localStorage.getItem('token')
        if (!token) {
          toast.error('يجب تسجيل الدخول أولاً', { id: toastId })
          return
        }
        
        console.log('🔄 استخدام API لتوليد صورة السيرة')
        
        const response = await fetch(`/api/cv/${cvId}/alqaeid-image`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `فشل في إنشاء الصورة (${response.status})`)
        }
        
        const blob = await response.blob()
        
        // استخدام الطريقة المحسنة للتحميل
        const { downloadFile } = await import('@/lib/mobile-download-utils')
        
        const downloadSuccess = await downloadFile(blob, {
          fileName: fileName + '.png',
          fallbackToNewWindow: true
        })
        
        if (downloadSuccess) {
          toast.success('تم إنشاء وتحميل صورة السيرة', { id: toastId })
          
          if (isMobileApp()) {
            setTimeout(() => {
              showMobileDownloadInstructions(fileName + '.png')
            }, 1500)
          }
        } else {
          throw new Error('فشل في تحميل الصورة المولدة')
        }
        
        CVActivityLogger.viewed(cvId, cv.fullName)
        return
      }

      // استخراج File ID من Google Drive
      const fileId = extractGoogleDriveFileId(cv.cvImageUrl)
      
      if (!fileId) {
        // If no file ID, try with original URL
        console.warn('⚠️ لم نتمكن من استخراج File ID، استخدام الرابط الأصلي')
        
        // استخدام تنزيل مباشر
        const link = document.createElement('a')
        link.href = cv.cvImageUrl
        link.download = fileName + '.jpg'
        link.target = '_blank'
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('تم بدء تحميل الصورة', { id: toastId })
        
        if (isMobileApp()) {
          setTimeout(() => {
            showMobileDownloadInstructions(fileName + '.jpg')
          }, 1500)
        }
        
        CVActivityLogger.viewed(cvId, cv.fullName)
        return
      }

      // استخدام Google Drive direct download link
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
      console.log('🔗 رابط التحميل:', downloadUrl)
      
      // استخدام تنزيل مباشر بدون fetch (لتجنب CORS)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName + '.jpg'
      link.target = '_blank'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('تم بدء تحميل الصورة من Google Drive', { id: toastId })
      
      if (isMobileApp()) {
        setTimeout(() => {
          showMobileDownloadInstructions(fileName + '.jpg')
        }, 1500)
      }
      
      CVActivityLogger.viewed(cvId, cv.fullName)
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الصورة:', error)
      toast.error('حدث خطأ أثناء التحميل: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'), { id: toastId })
    }
  }

  // تنزيل صور المحدد (تحميل الصور الفعلية من Google Drive)
  const downloadBulkImages = async () => {
    if (selectedCvs.length === 0) {
      toast('اختر على الأقل سيرة واحدة');
      return;
    }

    const toastId = toast.loading(`جاري فتح روابط التحميل لـ ${selectedCvs.length} صورة...`);
    setShowDownloadBar(true);
    setDownloadProgress(0);

    try {
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < selectedCvs.length; i++) {
        const cvId = selectedCvs[i];
        const cv = cvs.find(c => c.id === cvId);

        if (!cv) {
          failedCount++;
          continue;
        }

        try {
          // التحقق من وجود صورة من Google Drive
          if (!cv.cvImageUrl) {
            console.warn(`لا توجد صورة لـ: ${cv.fullName}`);
            skippedCount++;
            setDownloadProgress(Math.round(((i + 1) / selectedCvs.length) * 100));
            toast.loading(
              `⏭️ تخطي: ${cv.fullName} (لا توجد صورة) (${i + 1}/${selectedCvs.length})`,
              { id: toastId }
            );
            await new Promise(r => setTimeout(r, 300));
            continue;
          }

          // استخراج File ID من Google Drive
          const fileId = extractGoogleDriveFileId(cv.cvImageUrl);

          if (!fileId) {
            console.warn(`فشل استخراج File ID لـ: ${cv.fullName}`);
            failedCount++;
            setDownloadProgress(Math.round(((i + 1) / selectedCvs.length) * 100));
            toast.loading(
              `❌ فشل: ${cv.fullName} (رابط غير صالح) (${i + 1}/${selectedCvs.length})`,
              { id: toastId }
            );
            await new Promise(r => setTimeout(r, 300));
            continue;
          }

          // استخدام Google Drive direct download link
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          
          // إنشاء اسم ملف فريد مع timestamp
          const timestamp = new Date().getTime() + i; // إضافة i لضمان التفرد حتى في نفس الميلي ثانية
          const fileName = `${cv.fullName}_${cv.referenceCode || cvId}_${timestamp}.jpg`
            .replace(/[\\/:*?"<>|]+/g, '-')
            .replace(/\s+/g, '_');
          
          // استخدام fetch + blob للتحميل بدلاً من iframe
          const response = await fetch(downloadUrl);
          const blob = await response.blob();
          
          // إنشاء رابط تحميل
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // تنظيف الذاكرة
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 100);

          successCount++;
          setDownloadProgress(Math.round(((i + 1) / selectedCvs.length) * 100));

          // رسالة تحديث مع اسم السيرة
          toast.loading(
            `✅ جاري تحميل: ${cv.fullName} (${i + 1}/${selectedCvs.length})`,
            { id: toastId }
          );

          // مهلة بين التحميلات (مهم لتجنب حظر المتصفح)
          await new Promise(r => setTimeout(r, 2000));
        } catch (error) {
          console.error(`Error downloading CV ${cvId}:`, error);
          failedCount++;
          toast.loading(
            `❌ خطأ: ${cv?.fullName || 'سيرة ذاتية'} (${i + 1}/${selectedCvs.length})`,
            { id: toastId }
          );
          await new Promise(r => setTimeout(r, 500));
        }
      }

      // رسالة النتيجة النهائية
      if (successCount === selectedCvs.length) {
        toast.success(
          `🎉 تم فتح روابط التحميل بنجاح!\n✅ ${successCount} صورة`,
          { id: toastId, duration: 4000 }
        );
      } else if (successCount > 0) {
        toast.success(
          `تم فتح ${successCount} من ${selectedCvs.length} رابط\n${skippedCount > 0 ? `⏭️ تخطي: ${skippedCount} | ` : ''}${failedCount > 0 ? `❌ فشل: ${failedCount}` : ''}`,
          { id: toastId, duration: 4000 }
        );
      } else {
        toast.error(`فشل فتح روابط التحميل`, { id: toastId });
      }

      // إخفاء شريط التحميل
      setTimeout(() => {
        setShowDownloadBar(false);
        setDownloadProgress(0);
      }, 1000);

      // تسجيل النشاط
      if (successCount > 0) {
        BulkActivityLogger.download(successCount);
      }

    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error('حدث خطأ أثناء التحميل الجماعي', { id: toastId });
      setShowDownloadBar(false);
      setDownloadProgress(0);
    }
  };

  // مشاركة السير المحددة (متعددة)
  const shareBulkCVs = async () => {
    if (selectedCvs.length === 0) {
      toast.error('اختر على الأقل سيرة واحدة للمشاركة')
      return
    }

    console.log('🔍 عدد السير المحددة:', selectedCvs.length)

    // الحصول على السير المحددة
    const selectedCVsData = cvs.filter(cv => selectedCvs.includes(cv.id))
    console.log('📊 السير المحددة:', selectedCVsData.map(cv => ({ name: cv.fullName, hasImage: !!cv.cvImageUrl })))

    // فلترة السير التي لها صور
    const cvsWithImages = selectedCVsData.filter(cv => cv.cvImageUrl && cv.cvImageUrl.trim() !== '')

    console.log('🖼️ السير التي لها صور:', cvsWithImages.length)

    if (cvsWithImages.length === 0) {
      toast.error('لا توجد صور متاحة للسير المحددة')
      console.error('❌ لا توجد cvImageUrl للسير المحددة')
      return
    }

    // التحقق من دعم Web Share API
    if (!navigator.share) {
      toast.error('المتصفح لا يدعم المشاركة. جرب من الموبايل.')
      console.error('❌ المتصفح لا يدعم Web Share API')
      return
    }

    try {
      setSharePopupMessage(`⏳ جاري تحضير ${cvsWithImages.length} صورة...`)
      setShowSharePopup(true)

      // تحميل جميع الصور
      const files: File[] = []
      let successCount = 0
      let failedCount = 0
      
      for (let i = 0; i < cvsWithImages.length; i++) {
        const cv = cvsWithImages[i]
        setSharePopupMessage(`⏳ جاري تحميل ${i + 1}/${cvsWithImages.length}...`)
        
        try {
          const imageUrl = processImageUrl(cv.cvImageUrl!)
          console.log(`📥 تحميل صورة ${i + 1}: ${cv.fullName}`, imageUrl)
          
          const response = await fetch(imageUrl, { 
            mode: 'cors',
            cache: 'no-cache'
          })
          
          console.log(`📡 Response status: ${response.status}`)
          
          if (response.ok) {
            const blob = await response.blob()
            console.log(`✅ تم تحميل blob: ${blob.size} bytes, type: ${blob.type}`)
            
            const fileName = `${cv.fullName}_${cv.referenceCode || cv.id}.jpg`
              .replace(/[\\/:*?"<>|]+/g, '-')
              .replace(/\s+/g, '_')
            
            const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' })
            files.push(file)
            successCount++
          } else {
            failedCount++
            console.error(`❌ فشل تحميل ${cv.fullName}: Status ${response.status}`)
          }
        } catch (error) {
          failedCount++
          console.error(`❌ خطأ في تحميل صورة ${cv.fullName}:`, error)
        }
      }

      console.log(`📊 النتيجة: نجح ${successCount}, فشل ${failedCount}`)

      if (files.length === 0) {
        setSharePopupMessage('❌ فشل تحميل جميع الصور')
        toast.error('فشل تحميل الصور. تحقق من الاتصال بالإنترنت.')
        setTimeout(() => setShowSharePopup(false), 3000)
        return
      }

      // التحقق من دعم مشاركة ملفات متعددة
      const canShareFiles = navigator.canShare && navigator.canShare({ files })
      console.log('🔍 هل يمكن مشاركة الملفات؟', canShareFiles)
      
      if (canShareFiles) {
        setSharePopupMessage(`📤 جاهز! اختر التطبيق لمشاركة ${files.length} صورة...`)
        
        console.log('📤 بدء المشاركة:', files.map(f => ({ name: f.name, size: f.size, type: f.type })))
        
        await navigator.share({
          title: `${files.length} سيرة ذاتية`,
          text: `مشاركة ${files.length} سيرة ذاتية`,
          files
        })
        
        setSharePopupMessage(`✅ تمت مشاركة ${files.length} صورة بنجاح!`)
        toast.success(`تمت مشاركة ${files.length} صورة`)
        setTimeout(() => {
          setShowSharePopup(false)
          setSelectedCvs([]) // إلغاء التحديد
        }, 2000)
      } else {
        console.error('❌ المتصفح لا يدعم مشاركة ملفات متعددة')
        setSharePopupMessage('❌ المتصفح لا يدعم مشاركة ملفات متعددة')
        toast.error('جرب من تطبيق الموبايل للمشاركة')
        setTimeout(() => setShowSharePopup(false), 3000)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('❌ خطأ في المشاركة المتعددة:', error)
        setSharePopupMessage('❌ حدث خطأ أثناء المشاركة')
        toast.error(`خطأ: ${error.message}`)
        setTimeout(() => setShowSharePopup(false), 3000)
      } else {
        // المستخدم ألغى
        console.log('ℹ️ المستخدم ألغى المشاركة')
        setShowSharePopup(false)
      }
    }
  }

  // فتح نافذة العمليات الجماعية
  const handleBulkDelete = () => {
    if (selectedCvs.length === 0) {
      toast.error('اختر على الأقل سيرة واحدة للحذف')
      return
    }
    setBulkOperationType('delete')
    setShowBulkOperationModal(true)
  }

  // فتح نافذة الأرشفة الجماعية
  const handleBulkArchive = () => {
    if (selectedCvs.length === 0) {
      toast.error('اختر على الأقل سيرة واحدة للأرشفة')
      return
    }
    setBulkOperationType('archive')
    setShowBulkOperationModal(true)
  }

  // تنفيذ العمليات الجماعية
  const executeBulkOperation = async () => {
    setBulkProcessing(true)
    setBulkProgress(0)

    try {
      const token = localStorage.getItem('token')
      const totalItems = selectedCvs.length

      if (bulkOperationType === 'delete') {
        for (let i = 0; i < selectedCvs.length; i++) {
          const cvId = selectedCvs[i]
          await fetch(`/api/cvs/${cvId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          })
          setBulkProgress(Math.round(((i + 1) / totalItems) * 100))
          await new Promise(resolve => setTimeout(resolve, 200)) // تأخير بسيط للتأثير البصري
        }
        
        // تحديث القائمة محلياً
        setCvs(prev => prev.filter(cv => !selectedCvs.includes(cv.id)))
        
        // تسجيل النشاط
        BulkActivityLogger.delete(selectedCvs.length)
        
        toast.success(`تم حذف ${selectedCvs.length} سيرة ذاتية بنجاح`)
      } else if (bulkOperationType === 'archive') {
        for (let i = 0; i < selectedCvs.length; i++) {
          const cvId = selectedCvs[i]
          await fetch(`/api/cvs/${cvId}`, {
            method: 'PATCH',
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'ARCHIVED' })
          })
          setBulkProgress(Math.round(((i + 1) / totalItems) * 100))
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        // تحديث القائمة محلياً
        setCvs(prev => prev.map(cv => 
          selectedCvs.includes(cv.id) 
            ? { ...cv, status: CVStatus.ARCHIVED }
            : cv
        ))
        
        // تسجيل النشاط
        BulkActivityLogger.archive(selectedCvs.length)
        
        toast.success(`تم أرشفة ${selectedCvs.length} سيرة ذاتية بنجاح`)
      }

      setSelectedCvs([])
      setTimeout(() => {
        setShowBulkOperationModal(false)
        setBulkProcessing(false)
        setBulkProgress(0)
      }, 1500)

    } catch (error) {
      console.error('Error in bulk operation:', error)
      toast.error('فشل في تنفيذ العملية')
      setBulkProcessing(false)
    }
  }

  // فتح مودال الحجز
  const openBookingModal = (cv: CV) => {
    setBookingCv(cv)
    setBookingIdentityNumber('')
    setBookingNotes('')
    setIsBookingModalOpen(true)
  }

  // إغلاق مودال الحجز
  const closeBookingModal = () => {
    setIsBookingModalOpen(false)
    setBookingCv(null)
    setBookingIdentityNumber('')
    setBookingNotes('')
    setIsCreatingBooking(false)
  }

  // تأكيد الحجز
  const confirmBooking = async () => {
    if (!bookingCv || !bookingIdentityNumber.trim()) {
      toast.error('يرجى إدخال رقم الهوية')
      return
    }

    setIsCreatingBooking(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cvId: bookingCv.id,
          identityNumber: bookingIdentityNumber.trim(),
          notes: bookingNotes.trim() || null
        })
      })

      if (response.ok) {
        toast.success('تم حجز السيرة الذاتية بنجاح')
        closeBookingModal()
        fetchCVs() // تحديث القائمة
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في الحجز')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(error instanceof Error ? error.message : 'فشل في الحجز')
    } finally {
      setIsCreatingBooking(false)
    }
  }

  // إرسال رسالة واتساب للحجز (للمستخدمين من نوع USER)
  const sendWhatsAppMessage = (cv: CV) => {
    try {
      // استخدام رقم واتساب افتراضي من الإعدادات أو من ملف البيئة
      const defaultWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '966500000000';
      
      // تنظيف رقم الهاتف (إزالة أي أحرف غير رقمية)
      const cleanPhone = defaultWhatsAppNumber.replace(/\D/g, '');
      
      // إنشاء الرسالة مع تنسيق محسن
      const message = `مرحباً، أريد الاستفسار عن السيرة الذاتية:
الاسم: ${cv.fullName || 'غير محدد'}
${cv.fullNameArabic ? `الاسم بالعربية: ${cv.fullNameArabic}\n` : ''}${cv.referenceCode ? `الكود المرجعي: ${cv.referenceCode}\n` : ''}${cv.nationality ? `الجنسية: ${cv.nationality}\n` : ''}${cv.position ? `الوظيفة: ${cv.position}\n` : ''}${cv.experience ? `الخبرة: ${cv.experience}\n` : ''}${cv.age ? `العمر: ${cv.age} سنة\n` : ''}${cv.monthlySalary ? `الراتب المطلوب: ${cv.monthlySalary} ريال\n` : ''}
من الداشبورد`;

      // ترميز الرسالة لعنوان URL
      const encodedMessage = encodeURIComponent(message);
      
      // إنشاء رابط WhatsApp
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      
      // فتح WhatsApp في نافذة/تبويب جديد
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('خطأ في فتح WhatsApp:', error);
      toast.error('حدث خطأ أثناء فتح WhatsApp');
    }
  };

  // مشاركة سيرة ذاتية واحدة (إرسال الصورة مباشرة)
  const shareSingleCV = async (cv: CV) => {
    const shareUrl = `${window.location.origin}/cv/${cv.id}`
    
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
          // تحميل الصورة من Google Drive
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

  // تحديث الحالة (اختياري)
  const handleStatusChange = async (cvId: string, newStatus: CVStatus) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/cvs/${cvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      
      // العثور على السيرة الذاتية لتسجيل النشاط
      const cv = cvs.find(c => c.id === cvId)
      if (cv) {
        const statusLabels: Record<string, string> = {
          'NEW': 'جديد',
          'BOOKED': 'محجوز',
          'HIRED': 'متعاقد',
          'REJECTED': 'مرفوض',
          'RETURNED': 'معاد',
          'ARCHIVED': 'مؤرشف'
        }
        
        CVActivityLogger.statusChanged(
          cvId, 
          cv.fullName, 
          statusLabels[cv.status] || cv.status, 
          statusLabels[newStatus] || newStatus
        )
      }
      
      toast.success('تم تحديث الحالة')
      fetchCVs()
    } catch {
      toast.error('فشل تحديث الحالة')
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    )
  }


  return (
    <>
    <DashboardLayout>
      {/* Modal animation component */}
      {(user: User | null) => (
        <div className="space-y-6">
          {/* نافذة منبثقة جميلة لشريط التحميل */}
          {showDownloadBar && (
            <div className="fixed inset-0 z-50 grid place-items-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative card p-8 w-full max-w-md text-center animate-fade-in">
                <div className="mx-auto mb-4 rounded-xl w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-pulse">
                  <Download className="h-8 w-8 text-white animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">جاري تحميل الصور المحددة</h3>
                <p className="text-sm text-muted-foreground mb-2">شكراً لانتظارك، سننتهي خلال لحظات</p>
                <div className="text-xs text-primary font-semibold mb-4">
                  تم تحميل {Math.round((downloadProgress / 100) * selectedCvs.length)} من {selectedCvs.length} سيرة ذاتية
                </div>
                
                {/* شريط التقدم الاحترافي */}
                <div className="relative mb-4 h-4 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full transition-all duration-300 relative overflow-hidden"
                    style={{ width: `${downloadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                  
                  {/* علامات التقدم */}
                  <div className="absolute inset-0 flex justify-between items-center px-1">
                    <div className={`w-0.5 h-2 ${downloadProgress >= 0 ? 'bg-primary' : 'bg-border'}`} />
                    <div className={`w-0.5 h-2 ${downloadProgress >= 25 ? 'bg-primary' : 'bg-border'}`} />
                    <div className={`w-0.5 h-2 ${downloadProgress >= 50 ? 'bg-primary' : 'bg-border'}`} />
                    <div className={`w-0.5 h-2 ${downloadProgress >= 75 ? 'bg-primary' : 'bg-border'}`} />
                    <div className={`w-0.5 h-2 ${downloadProgress >= 100 ? 'bg-primary' : 'bg-border'}`} />
                  </div>
                </div>
                
                <div className="text-lg font-bold text-primary">{downloadProgress}%</div>
                
                {/* معلومات إضافية */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-muted-foreground">
                      <div className="font-semibold">⚡ السرعة</div>
                      <div>متوسطة</div>
                    </div>
                    <div className="text-muted-foreground">
                      <div className="font-semibold">📁 التنسيق</div>
                      <div>PNG</div>
                    </div>
                    <div className="text-muted-foreground">
                      <div className="font-semibold">🔄 التحميل</div>
                      <div>متتالي</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* إشعار للسير المعادة */}
          {filteredCvs.some(cv => cv.status === 'RETURNED') && (
            <div className="card p-6 mb-6 bg-warning/10 border-warning/20">
              <div className="flex items-center gap-4">
                <div className="bg-warning/20 rounded-lg p-3">
                  <RefreshCw className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-warning mb-1">سير ذاتية معادة من العقود</h3>
                  <p className="text-muted-foreground text-sm">
                    يوجد {filteredCvs.filter(cv => cv.status === 'RETURNED').length} سيرة ذاتية تم إعادتها من العقود. يمكنك إعادة التعاقد معها مرة أخرى.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* بطاقة إعدادات صفحات المبيعات - للمدراء فقط */}
          {user?.role === 'ADMIN' && (
            <div className="card p-6 mb-6 bg-gradient-to-r from-success/10 to-info/10 border-success/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-success/20 p-3 rounded-lg">
                    <SlidersHorizontal className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">إعدادات صفحات المبيعات</h3>
                    <p className="text-muted-foreground text-sm mt-1">إدارة أرقام الواتساب لصفحات Sales 1-5</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard/sales-config')}
                  className="btn btn-success px-6 py-3 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                  إدارة الإعدادات
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {['sales1', 'sales2', 'sales3', 'sales4', 'sales5'].map((salesId, index) => (
                  <button
                    key={salesId}
                    onClick={() => window.open(`/${salesId}`, '_blank')}
                    className="card p-3 text-center hover:shadow-card-hover transition-all duration-200"
                  >
                    <div className="text-sm font-medium text-foreground">Sales {index + 1}</div>
                    <div className="text-xs text-muted-foreground mt-1">عرض الصفحة</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الفلاتر السريعة */}
          <div className="card p-3 sm:p-4 mb-6 shadow-card">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 sm:gap-3">
              <select
                className="w-full lg:flex-1 lg:min-w-[160px] px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-border rounded-lg text-xs sm:text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                value={religionFilter}
                onChange={(e) => setReligionFilter(e.target.value)}
              >
                <option value="ALL">جميع الديانات ({getCountForFilter('religion', 'ALL')})</option>
                <option value="مسلمة">مسلمة ({getCountForFilter('religion', 'مسلمة')})</option>
                <option value="مسيحية">مسيحية ({getCountForFilter('religion', 'مسيحية')})</option>
                <option value="أخرى">أخرى ({getCountForFilter('religion', 'أخرى')})</option>
              </select>

              <select
                className="w-full lg:flex-1 lg:min-w-[160px] px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-border rounded-lg text-xs sm:text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                value={nationalityFilter}
                onChange={(e) => setNationalityFilter(e.target.value)}
              >
                <option value="ALL">جميع الجنسيات ({getCountForFilter('nationality', 'ALL')})</option>
                {uniqueNationalities.map(nationality => (
                  <option key={nationality} value={nationality}>
                    {getNationalityArabic(nationality)} ({getCountForFilter('nationality', nationality)})
                  </option>
                ))}
              </select>

              <select
                className="w-full lg:flex-1 lg:min-w-[160px] px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-border rounded-lg text-xs sm:text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
              >
                <option value="ALL">جميع الأعمار ({getCountForFilter('age', 'ALL')})</option>
                <option value="21-30">21-30 سنة ({getCountForFilter('age', '21-30')})</option>
                <option value="30-40">30-40 سنة ({getCountForFilter('age', '30-40')})</option>
                <option value="40-50">40-50 سنة ({getCountForFilter('age', '40-50')})</option>
              </select>

              <select
                className="w-full lg:flex-1 lg:min-w-[160px] px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-border rounded-lg text-xs sm:text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                value={maritalStatusFilter}
                onChange={(e) => setMaritalStatusFilter(e.target.value)}
              >
                <option value="ALL">جميع الحالات ({getCountForFilter('maritalStatus', 'ALL')})</option>
                <option value="SINGLE">أعزب/عزباء ({getCountForFilter('maritalStatus', 'SINGLE')})</option>
                <option value="MARRIED">متزوج/متزوجة ({getCountForFilter('maritalStatus', 'MARRIED')})</option>
                <option value="DIVORCED">مطلق/مطلقة ({getCountForFilter('maritalStatus', 'DIVORCED')})</option>
                <option value="WIDOWED">أرمل/أرملة ({getCountForFilter('maritalStatus', 'WIDOWED')})</option>
              </select>

              {/* زر المزيد من الفلاتر */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`w-full sm:w-auto sm:col-span-2 lg:col-span-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 border-2 ${
                  showAdvancedFilters
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-card text-foreground border-border hover:bg-muted hover:border-primary/50'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className={`h-4 w-4 transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                  {showAdvancedFilters ? 'إخفاء الفلاتر' : 'المزيد من الفلاتر'}
                </span>
              </button>
            </div>
          </div>

          {/* البحث الشامل */}
          <div className="card p-4 sm:p-6 shadow-card mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="بحث شامل: الاسم، الجنسية، المهنة، الكود المرجعي، الجواز، الديانة، المهارات، التعليم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 sm:py-4 bg-gradient-to-r from-primary/5 to-transparent border-2 border-primary/30 rounded-lg text-foreground placeholder:text-muted-foreground/70 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                  title="مسح البحث"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* رسالة توضيحية للبحث */}
            {searchTerm && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg border border-primary/20 mt-3">
                <span className="font-semibold text-primary">نتائج البحث:</span>
                <span>{allFilteredCvs.length} سيرة من أصل {cvs.length}</span>
              </div>
            )}
          </div>

          {/* الفلاتر المتقدمة */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdvancedFilters ? 'max-h-[2000px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
            <div className="card p-3 sm:p-4 md:p-6 shadow-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-primary mb-1 sm:mb-2">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" /> المهارات (اختيار متعدد)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSkillsDropdown(!showSkillsDropdown)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary flex items-center justify-between hover:border-muted-foreground transition-all"
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
                        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-card max-h-64 overflow-y-auto">
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
                              const count = getCountForFilter('skill', skill.id)
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
                                <span className="text-sm flex-1">{skill.label} ({count})</span>
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
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground mb-1 sm:mb-2">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" /> مستوى العربية
                  </label>
                  <select
                    className="w-full rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary border border-border bg-background text-foreground"
                    value={arabicLevelFilter}
                    onChange={(e) => setArabicLevelFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات ({getCountForFilter('arabicLevel', 'ALL')})</option>
                    <option value="YES">ممتاز ({getCountForFilter('arabicLevel', 'YES')})</option>
                    <option value="WILLING">جيد ({getCountForFilter('arabicLevel', 'WILLING')})</option>
                    <option value="WEAK">ضعيف ({getCountForFilter('arabicLevel', 'WEAK')})</option>
                    <option value="NO">لا ({getCountForFilter('arabicLevel', 'NO')})</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground mb-1 sm:mb-2">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" /> مستوى الإنجليزية
                  </label>
                  <select
                    className="w-full rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary border border-border bg-background text-foreground"
                    value={englishLevelFilter}
                    onChange={(e) => setEnglishLevelFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات ({getCountForFilter('englishLevel', 'ALL')})</option>
                    <option value="YES">ممتاز ({getCountForFilter('englishLevel', 'YES')})</option>
                    <option value="WILLING">جيد ({getCountForFilter('englishLevel', 'WILLING')})</option>
                    <option value="WEAK">ضعيف ({getCountForFilter('englishLevel', 'WEAK')})</option>
                    <option value="NO">لا ({getCountForFilter('englishLevel', 'NO')})</option>
                  </select>
                </div>


              </div>

              {/* صف إضافي للفلاتر الجديدة */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground mb-1 sm:mb-2">
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" /> المستوى التعليمي
                  </label>
                  <select
                    className="w-full rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary border border-border bg-background text-foreground"
                    value={educationFilter}
                    onChange={(e) => setEducationFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات ({getCountForFilter('education', 'ALL')})</option>
                    <option value="متعلم">متعلم ({getCountForFilter('education', 'متعلم')})</option>
                    <option value="غير متعلم">غير متعلم ({getCountForFilter('education', 'غير متعلم')})</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground mb-1 sm:mb-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" /> سنوات الخبرة
                  </label>
                  <select
                    className="w-full rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary border border-border bg-background text-foreground"
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                  >
                    <option value="ALL">جميع مستويات الخبرة ({cvs.length})</option>
                    <option value="NO_EXPERIENCE">بدون خبرة ({getCountForFilter('experience', 'NO_EXPERIENCE')})</option>
                    <option value="1-2">1-2 سنة ({getCountForFilter('experience', '1-2')})</option>
                    <option value="3-5">3-5 سنوات ({getCountForFilter('experience', '3-5')})</option>
                    <option value="6-10">6-10 سنوات ({getCountForFilter('experience', '6-10')})</option>
                    <option value="MORE_10">أكثر من 10 سنوات ({getCountForFilter('experience', 'MORE_10')})</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground mb-1 sm:mb-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" /> الطول
                  </label>
                  <select
                    className="w-full rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary border border-border bg-background text-foreground"
                    value={heightFilter}
                    onChange={(e) => setHeightFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الأطوال ({cvs.length})</option>
                    <option value="<155">أقل من 155 سم ({getCountForFilter('height', '<155')})</option>
                    <option value="155-160">155-160 سم ({getCountForFilter('height', '155-160')})</option>
                    <option value="160-165">160-165 سم ({getCountForFilter('height', '160-165')})</option>
                    <option value="165-170">165-170 سم ({getCountForFilter('height', '165-170')})</option>
                    <option value="170-175">170-175 سم ({getCountForFilter('height', '170-175')})</option>
                    <option value=">175">أكثر من 175 سم ({getCountForFilter('height', '>175')})</option>
                  </select>
                </div>

              </div>

              {/* صف إضافي للوزن والمنطقة */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground mb-1 sm:mb-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" /> الوزن
                  </label>
                  <select
                    className="w-full rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary border border-border bg-background text-foreground"
                    value={weightFilter}
                    onChange={(e) => setWeightFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الأوزان ({cvs.length})</option>
                    <option value="<50">أقل من 50 كجم ({getCountForFilter('weight', '<50')})</option>
                    <option value="50-55">50-55 كجم ({getCountForFilter('weight', '50-55')})</option>
                    <option value="55-60">55-60 كجم ({getCountForFilter('weight', '55-60')})</option>
                    <option value="60-65">60-65 كجم ({getCountForFilter('weight', '60-65')})</option>
                    <option value="65-70">65-70 كجم ({getCountForFilter('weight', '65-70')})</option>
                    <option value="70-75">70-75 كجم ({getCountForFilter('weight', '70-75')})</option>
                    <option value=">75">أكثر من 75 كجم ({getCountForFilter('weight', '>75')})</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground mb-1 sm:mb-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" /> المنطقة
                  </label>
                  <select
                    className="w-full rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary border border-border bg-background text-foreground"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المناطق ({cvs.length})</option>
                    {Array.from(new Set(cvs.map(cv => cv.livingTown).filter(Boolean))).sort().map(location => (
                      <option key={location} value={location!}>
                        {location} ({getCountForFilter('location', location!)})
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    setReligionFilter('ALL')
                    setNationalityFilter('ALL')
                    setSkillFilters([])
                    setAgeFilter('ALL')
                    setMaritalStatusFilter('ALL')
                    setArabicLevelFilter('ALL')
                    setEnglishLevelFilter('ALL')
                    setEducationFilter('ALL')
                    setExperienceFilter('ALL')
                    setHeightFilter('ALL')
                    setWeightFilter('ALL')
                    setLocationFilter('ALL')
                    setSearchTerm('')
                  }}
                  className="btn-secondary px-6 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  مسح جميع الفلاتر
                </button>
              </div>
            </div>
          </div>

          {/* بنر التحديد الجماعي - يظهر فوق السير مباشرة */}
          {selectedCvs.length > 0 && (
            <div className="card p-3 sm:p-6 mb-4 bg-primary/5 border-primary/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-primary/10 rounded-lg p-2 sm:p-3">
                    <User className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-semibold text-primary mb-0.5 sm:mb-1">تم تحديد {selectedCvs.length} سيرة</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">يمكنك الآن تطبيق العمليات الجماعية على السير المحددة</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedCvs([])}
                    className="btn btn-secondary text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 inline" />
                    إلغاء
                  </button>
                  <button
                    onClick={downloadBulkImages}
                    className="btn btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
                    title="تحميل PNG لكل سيرة من المحدد"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 inline" />
                    <span className="hidden xs:inline">تحميل</span> ({selectedCvs.length})
                  </button>
                  <button
                    onClick={shareBulkCVs}
                    className="btn btn-info text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
                    title="مشاركة الصور المحددة"
                  >
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 inline" />
                    <span className="hidden xs:inline">مشاركة</span> ({selectedCvs.length})
                  </button>
                  {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
                    <>
                      <button
                        onClick={handleBulkArchive}
                        className="btn btn-warning text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
                      >
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 inline" />
                        <span className="hidden xs:inline">أرشفة</span>
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="btn btn-destructive text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 inline" />
                        <span className="hidden xs:inline">حذف</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* سطر أدوات سريع */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
            <div className="flex items-center card p-2 sm:p-3 hover:shadow-md transition-shadow w-full sm:w-auto">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary bg-input border-2 border-border rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary checked:bg-primary checked:border-primary ml-2 sm:ml-3"
                  checked={paginatedCvs.length > 0 && selectedCvs.length === paginatedCvs.length}
                  onChange={toggleSelectAll}
                />
                <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  تحديد الكل ({paginatedCvs.length})
                </span>
              </label>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg w-full sm:w-auto text-center">
              <span className="hidden sm:inline">إجمالي النتائج: </span><span className="font-bold text-foreground">{filteredCvs.length}</span>
              <span className="mx-1">|</span>
              <span className="hidden sm:inline">الصفحة: </span><span className="font-bold text-primary">{currentPage}</span>/<span className="font-bold text-primary">{totalPages}</span>
            </div>
          </div>

          {/* عرض Grid للمستخدمين من نوع USER - مشابه لصفحات السلز */}
          {user?.role === 'USER' ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6' : 'space-y-4'}>
              {paginatedCvs.map((cv) => (
                <div
                  key={cv.id}
                  className={`group bg-white rounded-2xl shadow-xl border-2 ${selectedCvs.includes(cv.id) ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-gray-100'} overflow-hidden hover:shadow-2xl hover:border-blue-400/40 transition-all duration-500 hover:-translate-y-2 transform`}
                >
                  {/* صورة السيرة الذاتية - تصميم محسّن */}
                  <div className="aspect-[3/4] relative overflow-hidden bg-white">
                    {cv.cvImageUrl ? (
                      <>
                        <div className="w-full h-full relative">
                          {/* Checkbox محسّن */}
                          <div className="absolute top-3 left-3 z-20">
                            <label className="relative flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={selectedCvs.includes(cv.id)}
                                onChange={() => toggleCvSelection(cv.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="w-7 h-7 bg-white border-3 border-gray-300 rounded-lg shadow-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200 flex items-center justify-center">
                                {selectedCvs.includes(cv.id) && (
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </label>
                          </div>

                          {/* الصورة */}
                          <button
                            onClick={() => {
                              setSelectedCVForView(cv)
                            }}
                            className="w-full h-full focus:outline-none cursor-pointer group/img relative"
                            title="اضغط لعرض السيرة الكاملة"
                          >
                            <img
                              src={processImageUrl(cv.cvImageUrl)}
                              alt={cv.fullName}
                              className="w-full h-full object-contain transition-all duration-500 group-hover/img:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                if (!target.src.startsWith('data:')) {
                                  target.src = 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3C/svg%3E'
                                }
                              }}
                            />
                            {/* Overlay محسّن عند الـHover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
                              <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-xl shadow-2xl transform translate-y-4 group-hover/img:translate-y-0 transition-transform duration-300">
                                <p className="text-blue-600 font-bold text-base flex items-center gap-2">
                                  <Eye className="h-5 w-5" />
                                  <span>اضغط للعرض الكامل</span>
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center">
                        <div className="text-white text-center p-4">
                          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl">
                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-base font-bold">{cv.fullName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* أزرار التفاعل - محسّنة لجميع الشاشات */}
                  <div className="p-2.5 sm:p-3 lg:p-2.5 bg-gradient-to-br from-white to-gray-50 border-t border-gray-100">
                    {/* الصف الأول - التحميل والعرض */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        onClick={() => downloadSingleImage(cv.id)}
                        className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3.5 sm:py-3 lg:py-2.5 px-2 rounded-xl text-sm sm:text-base lg:text-sm flex flex-col items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 hover:scale-[1.02]"
                        title="تحميل السيرة"
                      >
                        <Download className="h-6 w-6 sm:h-5 sm:w-5 mb-1 sm:mb-0.5" />
                        <span className="font-bold">تحميل</span>
                      </button>
                      
                      <button
                        onClick={() => setSelectedCVForView(cv)}
                        className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 sm:py-3 lg:py-2.5 px-2 rounded-xl text-sm sm:text-base lg:text-sm flex flex-col items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 hover:scale-[1.02]"
                        title="عرض السيرة الكاملة"
                      >
                        <Eye className="h-6 w-6 sm:h-5 sm:w-5 mb-1 sm:mb-0.5" />
                        <span className="font-bold">عرض</span>
                      </button>
                    </div>
                    
                    {/* الصف الثاني - المشاركة والفيديو */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => shareSingleCV(cv)}
                        className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 sm:py-2.5 lg:py-2 px-2 rounded-lg text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 hover:scale-[1.02]"
                        title="مشاركة السيرة"
                      >
                        <Share2 className="h-5 w-5 sm:h-4 sm:w-4 mb-0.5" />
                        <span className="font-bold">مشاركة</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          if (cv.videoLink && cv.videoLink.trim() !== '') {
                            setVideoModalKey(prev => prev + 1);
                            setVideoModalKey((prev: number) => prev + 1); setSelectedVideo(cv.videoLink);
                          } else {
                            toast.error('لا يوجد رابط فيديو لهذه السيرة');
                          }
                        }}
                        className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 sm:py-2.5 lg:py-2 px-2 rounded-lg text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 hover:scale-[1.02]"
                        title="مشاهدة الفيديو"
                      >
                        <Play className="h-5 w-5 sm:h-4 sm:w-4 mb-0.5" />
                        <span className="font-bold">فيديو</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
          {/* الجدول - عرض مخفي على الموبايل */}
          <div className="overflow-hidden card hidden md:block">
            {/* رسالة توضيحية للتمرير الأفقي */}
            <div className="bg-muted px-4 py-2 border-b border-border text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <ChevronLeft className="h-3 w-3" />
                <span>يمكنك التمرير يميناً ويساراً لعرض جميع الأعمدة</span>
                <ChevronRight className="h-3 w-3" />
              </p>
            </div>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <table className="w-full text-sm text-right text-muted-foreground min-w-max"
                     style={{ minWidth: '1200px' }}>
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="p-4 text-center w-12">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-primary bg-input border-2 border-muted-foreground/30 rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary hover:scale-110 checked:bg-primary checked:border-primary"
                          onChange={toggleSelectAll}
                          checked={selectedCvs.length === paginatedCvs.length && paginatedCvs.length > 0}
                        />
                      </label>
                    </th>
                    <th className="px-4 py-4 font-semibold text-muted-foreground w-48 max-w-48 text-right">الاسم الكامل</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground min-w-24 text-center">الكود المرجعي</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground min-w-32 text-center">رقم الجواز</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground min-w-32 text-center">الجنسية</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground w-32 max-w-32 text-center">الوظيفة</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground min-w-16 text-center">العمر</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground min-w-24 text-center">الحالة</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground min-w-40 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedCvs.map((cv) => (
                    <tr key={cv.id} className={`${selectedCvs.includes(cv.id) ? 'bg-primary/10 ring-2 ring-primary/20' : cv.status === 'RETURNED' ? 'bg-warning/10 border-l-4 border-warning' : 'bg-card'} hover:bg-muted border-l-4 transition-all`} style={{ borderLeftColor: cv.nationality ? getCountryInfo(cv.nationality).colors.primary : 'var(--border)' }}>
                      <td className="p-4 text-center">
                        <label className="flex items-center justify-center cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-primary bg-input border-2 border-muted-foreground/30 rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary hover:scale-110 group-hover:border-primary checked:bg-primary checked:border-primary"
                            checked={selectedCvs.includes(cv.id)}
                            onChange={() => toggleCvSelection(cv.id)}
                          />
                        </label>
                      </td>
                      <td className="px-4 py-4 w-48 max-w-48">
                        <div className="flex items-center space-x-3 max-w-full">
                          <img 
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600" 
                            src={processImageUrl(cv.profileImage)} 
                            alt={cv.fullName}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (!target.src.startsWith('data:')) {
                                target.src = 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3C/svg%3E'
                              }
                            }}
                          />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="font-semibold text-foreground truncate" title={cv.fullName}>{cv.fullName}</div>
                            {cv.fullNameArabic && (
                              <div className="text-sm text-muted-foreground truncate" title={cv.fullNameArabic}>{cv.fullNameArabic}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                          {cv.referenceCode}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-sm font-medium text-foreground">
                          {cv.passportNumber || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <CountryFlag nationality={cv.nationality || ''} size="md" />
                      </td>
                      <td className="px-3 py-4 w-32 max-w-32">
                        <span className="text-sm text-foreground truncate block" title={cv.position || ''}>{cv.position}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-sm font-semibold text-foreground">{cv.age}</span>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cv.status === 'NEW' ? 'bg-primary/20 text-primary' :
                          cv.status === 'BOOKED' ? 'bg-warning/20 text-warning' :
                          cv.status === 'RETURNED' ? 'bg-warning/20 text-warning' :
                          cv.status === 'REJECTED' ? 'bg-destructive/20 text-destructive' :
                          cv.status === 'ARCHIVED' ? 'bg-muted text-muted-foreground' :
                          'bg-primary/20 text-primary'
                        }`}>
                          {cv.status === 'NEW' ? 'جديد' : 
                           cv.status === 'BOOKED' ? 'محجوز' : 
                           cv.status === 'RETURNED' ? 'معاد' :
                           cv.status === 'REJECTED' ? 'مرفوض' :
                           cv.status === 'ARCHIVED' ? 'مؤرشف' :
                           cv.status}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* زر عرض السيرة - متاح للجميع */}
                          <button
                            onClick={() => {
                              CVActivityLogger.viewed(cv.id, cv.fullName)
                              router.push(`/cv/${cv.id}`)
                            }}
                            className="p-1.5 text-info hover:text-info/80 hover:bg-info/10 rounded-md"
                            title="عرض السيرة"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          
                          {/* زر تحميل الصورة - متاح للجميع */}
                            <button
                              onClick={() => downloadSingleImage(cv.id)}
                              className="p-2 text-success hover:text-success/80 hover:bg-success/10 rounded-lg border border-success/20 hover:border-success/40 transition-all"
                              title="تحميل صورة السيرة كـ PNG"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          
                          {/* أزرار تغيير الحالة - للمدراء فقط */}
                          {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'CUSTOMER_SERVICE') && (
                            <button
                              onClick={() => router.push(`/dashboard/cv/${cv.id}`)}
                              className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-all"
                              title="✏️ تعديل بيانات السيرة الذاتية"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          )}
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
                              onClick={() => {
                                console.log('🎥 Video button clicked for CV:', cv.fullName, 'Video URL:', cv.videoLink)
                                setVideoModalKey(prev => prev + 1);
                                setVideoModalKey((prev: number) => prev + 1); setSelectedVideo(cv.videoLink || null)
                              }}
                              className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-all"
                              title="🎬 مشاهدة الفيديو الخاص بالسيرة"
                            >
                              <Play className="h-5 w-5" />
                            </button>
                          )}
                          {/* حجز - متاح للمدراء وخدمة العملاء فقط */}
                          {cv.status === CVStatus.NEW && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'CUSTOMER_SERVICE') && (
                            <button
                              onClick={() => openBookingModal(cv)}
                              className="p-2 text-warning hover:text-warning/80 hover:bg-warning/10 rounded-lg transition-all"
                              title="📋 حجز السيرة الذاتية برقم هوية"
                            >
                              <CalendarCheck className="h-5 w-5" />
                            </button>
                        )}
                        {/* أزرار التعاقد والرفض - متاحة للمدراء وخدمة العملاء */}
                        {cv.status === CVStatus.NEW && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'CUSTOMER_SERVICE') && (
                          <>
                            <button
                              onClick={() => {
                                setContractingCv(cv)
                                setIsContractModalOpen(true)
                              }}
                              className="p-2 text-success hover:text-success/80 hover:bg-success/10 rounded-lg"
                              title="تعاقد"
                            >
                              <FileSignature className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(cv.id, CVStatus.REJECTED)}
                              className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-all"
                              title="❌ رفض السيرة الذاتية"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {cv.status === CVStatus.BOOKED && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'CUSTOMER_SERVICE') && (
                          <>
                            <button
                              onClick={() => {
                                setContractingCv(cv)
                                setIsContractModalOpen(true)
                              }}
                              className="p-2 text-success hover:text-success/80 hover:bg-success/10 rounded-lg"
                              title="تعاقد"
                            >
                              <FileSignature className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(cv.id, CVStatus.RETURNED)}
                              className="p-2 text-warning hover:text-warning/80 hover:bg-warning/10 rounded-lg transition-all"
                              title="🔄 إعادة السيرة إلى الحالة الجديدة"
                            >
                              <Undo2 className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {cv.status === CVStatus.RETURNED && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'CUSTOMER_SERVICE') && (
                          <button
                            onClick={() => {
                              setContractingCv(cv)
                              setIsContractModalOpen(true)
                            }}
                            className="p-2 text-success hover:text-success/80 hover:bg-success/10 rounded-lg transition-all"
                            title="♻️ إعادة التعاقد مع السيرة المعادة"
                          >
                            <FileSignature className="h-5 w-5" />
                          </button>
                        )}
                        {(cv.status === CVStatus.HIRED || cv.status === CVStatus.REJECTED) && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'CUSTOMER_SERVICE') && (
                          <button
                            onClick={() => handleStatusChange(cv.id, CVStatus.RETURNED)}
                            className="p-2 text-warning hover:text-warning/80 hover:bg-warning/10 rounded-lg"
                            title="إعادة"
                          >
                            <Undo2 className="h-5 w-5" />
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* عرض البطاقات للموبايل */}
          <div className="md:hidden space-y-3">
            {paginatedCvs.map((cv) => (
              <div
                key={cv.id}
                className={`card p-3 ${
                  selectedCvs.includes(cv.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                } ${cv.status === 'RETURNED' ? 'border-r-4 border-warning bg-warning/5' : ''}`}
                style={{ borderRightColor: cv.nationality ? getCountryInfo(cv.nationality).colors.primary : 'var(--border)' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-primary border-2 rounded"
                      checked={selectedCvs.includes(cv.id)}
                      onChange={() => toggleCvSelection(cv.id)}
                    />
                    <img 
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600" 
                      src={processImageUrl(cv.profileImage)} 
                      alt={cv.fullName}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (!target.src.startsWith('data:')) {
                          target.src = 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3C/svg%3E'
                        }
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-foreground truncate">{cv.fullName}</div>
                      {cv.fullNameArabic && (
                        <div className="text-xs text-muted-foreground truncate">{cv.fullNameArabic}</div>
                      )}
                    </div>
                  </div>
                  <CountryFlag nationality={cv.nationality || ''} size="sm" />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="bg-muted/50 px-2 py-1 rounded">
                    <span className="text-muted-foreground">الكود:</span>
                    <span className="font-mono font-semibold text-foreground mr-1">{cv.referenceCode}</span>
                  </div>
                  <div className="bg-muted/50 px-2 py-1 rounded">
                    <span className="text-muted-foreground">العمر:</span>
                    <span className="font-semibold text-foreground mr-1">{cv.age || '-'}</span>
                  </div>
                  <div className="bg-muted/50 px-2 py-1 rounded">
                    <span className="text-muted-foreground">الوظيفة:</span>
                    <span className="font-semibold text-foreground mr-1 truncate">{cv.position || '-'}</span>
                  </div>
                  <div className="bg-muted/50 px-2 py-1 rounded">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      cv.status === CVStatus.NEW ? 'bg-info/20 text-info' :
                      cv.status === CVStatus.BOOKED ? 'bg-warning/20 text-warning' :
                      cv.status === CVStatus.HIRED ? 'bg-success/20 text-success' :
                      cv.status === CVStatus.REJECTED ? 'bg-destructive/20 text-destructive' :
                      cv.status === CVStatus.RETURNED ? 'bg-warning/20 text-warning' :
                      'bg-muted/20 text-muted-foreground'
                    }`}>
                      {cv.status === 'NEW' ? 'جديد' :
                       cv.status === 'BOOKED' ? 'محجوز' :
                       cv.status === 'HIRED' ? 'متعاقد' :
                       cv.status === 'REJECTED' ? 'مرفوض' :
                       cv.status === 'RETURNED' ? 'معاد' : 'مؤرشف'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border">
                  <button
                    onClick={() => {
                      setViewingCv(cv)
                      setShowImageModal(true)
                    }}
                    className="flex-1 p-2 text-info hover:bg-info/10 rounded-lg text-xs flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    عرض
                  </button>
                  
                  <button
                    onClick={() => downloadSingleImage(cv.id)}
                    className="flex-1 p-2 text-success hover:bg-success/10 rounded-lg text-xs flex items-center justify-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    تحميل
                  </button>

                  {/* تعديل - متاح للمدراء فقط */}
                  {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
                    <button
                      onClick={() => router.push(`/dashboard/cv/${cv.id}`)}
                      className="flex-1 p-2 text-primary hover:bg-primary/10 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      تعديل
                    </button>
                  )}
                  
                  {/* حجز - متاح للمدراء وخدمة العملاء فقط */}
                  {cv.status === CVStatus.NEW && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'CUSTOMER_SERVICE') && (
                    <button
                      onClick={() => openBookingModal(cv)}
                      className="flex-1 p-2 text-warning hover:bg-warning/10 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      حجز
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card p-3 sm:p-6 mt-4 sm:mt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredCvs.length)} من أصل {filteredCvs.length} نتيجة
                    </span>
                  </div>
                  
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">عرض:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-xs sm:text-sm text-muted-foreground">صف</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                  {/* Previous Button */}
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      currentPage === 1
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">السابق</span>
                  </button>

                  {/* Page Numbers - نظام بسيط وثابت */}
                  <div className="flex items-center gap-1">
                    {/* الصفحة الأولى */}
                    {currentPage > 2 && totalPages > 5 && (
                      <>
                        <button
                          onClick={() => goToPage(1)}
                          className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 bg-muted text-foreground hover:bg-muted/80"
                        >
                          1
                        </button>
                        {currentPage > 3 && <span className="px-1 text-muted-foreground">...</span>}
                      </>
                    )}
                    
                    {/* الصفحات المرئية */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // اعرض الصفحة الحالية والصفحات المجاورة
                        if (totalPages <= 5) return true; // اعرض كل الصفحات إذا كان المجموع 5 أو أقل
                        if (page === currentPage) return true; // الصفحة الحالية
                        if (page === currentPage - 1) return true; // الصفحة السابقة
                        if (page === currentPage + 1) return true; // الصفحة التالية
                        if (currentPage === 1 && page <= 3) return true; // في البداية، اعرض 3 صفحات
                        if (currentPage === 2 && page <= 4) return true; // في البداية، اعرض 4 صفحات
                        if (currentPage === totalPages && page >= totalPages - 2) return true; // في النهاية
                        if (currentPage === totalPages - 1 && page >= totalPages - 3) return true; // قبل النهاية
                        return false;
                      })
                      .map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))
                    }
                    
                    {/* الصفحة الأخيرة */}
                    {currentPage < totalPages - 1 && totalPages > 5 && (
                      <>
                        {currentPage < totalPages - 2 && <span className="px-1 text-muted-foreground">...</span>}
                        <button
                          onClick={() => goToPage(totalPages)}
                          className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 bg-muted text-foreground hover:bg-muted/80"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    <span className="hidden xs:inline">التالي</span>
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* نافذة العمليات الجماعية المحسّنة */}
          {showBulkOperationModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
              <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border">
                {/* Header */}
                <div className="bg-gradient-to-r from-destructive to-destructive/80 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      {bulkOperationType === 'delete' ? (
                        <Trash2 className="h-7 w-7" />
                      ) : bulkOperationType === 'status' ? (
                        <RefreshCw className="h-7 w-7" />
                      ) : bulkOperationType === 'archive' ? (
                        <FileText className="h-7 w-7" />
                      ) : (
                        <Download className="h-7 w-7" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">
                        {bulkOperationType === 'delete' ? 'حذف السير المحددة' : 
                         bulkOperationType === 'status' ? 'تغيير الحالة' : 
                         bulkOperationType === 'archive' ? 'أرشفة السير المحددة' : 'تحميل الصور'}
                      </h3>
                      <p className="text-white/90 text-sm">
                        عدد السير المحددة: <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{selectedCvs.length}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowBulkOperationModal(false)}
                      className="mr-auto text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                      disabled={bulkProcessing}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {!bulkProcessing ? (
                    <>
                      <div className="mb-6">
                        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-destructive/20 rounded-full p-3 flex-shrink-0">
                              <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-foreground mb-2 text-lg">
                                {bulkOperationType === 'delete' 
                                  ? 'تحذير: عملية حذف نهائية'
                                  : bulkOperationType === 'archive'
                                  ? 'تأكيد: عملية أرشفة'
                                  : 'تأكيد العملية'
                                }
                              </h4>
                              <p className="text-foreground mb-2">
                                {bulkOperationType === 'delete' 
                                  ? `سيتم حذف ${selectedCvs.length} سيرة ذاتية نهائياً من النظام`
                                  : bulkOperationType === 'archive'
                                  ? `سيتم نقل ${selectedCvs.length} سيرة ذاتية إلى الأرشيف`
                                  : `سيتم تطبيق العملية على ${selectedCvs.length} سيرة ذاتية`
                                }
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {bulkOperationType === 'archive' 
                                  ? '⚠️ يمكن استعادة السير من صفحة الأرشيف لاحقاً'
                                  : '⚠️ هذا الإجراء لا يمكن التراجع عنه'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowBulkOperationModal(false)}
                          className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-semibold transition-colors"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={executeBulkOperation}
                          className="flex-1 px-6 py-3 bg-destructive hover:opacity-90 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-5 w-5" />
                          تأكيد العملية
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="mb-8">
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-8">
                          <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                          <h4 className="text-xl font-bold text-foreground mb-2">جاري التنفيذ...</h4>
                          <p className="text-muted-foreground">يرجى الانتظار حتى اكتمال العملية</p>
                        </div>
                      </div>

                      {/* شريط التقدم */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-foreground">التقدم</span>
                          <span className="text-sm font-bold text-primary">{bulkProgress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden border border-border">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300 ease-out relative"
                            style={{ width: `${bulkProgress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {bulkProgress === 100 && (
                        <div className="bg-success/10 border border-success/30 rounded-xl p-6">
                          <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                          <p className="text-success font-semibold">تم إنجاز العملية بنجاح!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* نافذة التعاقد */}
          {isContractModalOpen && contractingCv && (
            <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
              <div className="bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-2xl font-bold mb-2 text-foreground">
                  {contractingCv.status === 'RETURNED' ? 'إعادة التعاقد' : 'إنشاء عقد جديد'}
                </h3>
                <p className="mb-4 text-muted-foreground">
                  {contractingCv.status === 'RETURNED' 
                    ? <>أنت على وشك إعادة التعاقد مع <span className="font-semibold text-success">{contractingCv.fullName}</span>. يرجى إدخال رقم هوية جديد.</>
                    : <>أنت على وشك التعاقد مع <span className="font-semibold text-primary">{contractingCv.fullName}</span>.</>
                  }
                </p>
                <div className="mb-6 p-4 bg-info/10 border border-info/30 rounded-xl">
                  <p className="text-sm text-info">
                    📋 <strong>ملاحظة:</strong> بعد التعاقد، ستنتقل السيرة الذاتية إلى صفحة العقود وستختفي من الصفحة الرئيسية.
                  </p>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!contractingCv || !identityNumber.trim()) {
                      toast.error('يرجى إدخال رقم الهوية')
                      return
                    }

                    setIsCreatingContract(true)
                    try {
                      const token = localStorage.getItem('token')
                      // إنشاء تاريخ العقد بتوقيت مصر الصحيح
                      const now = new Date()
                      const contractDate = now.toISOString()
                      
                      // تحديث السيرة مباشرة (بدون إنشاء عقد منفصل للسير المعادة)
                      const updateRes = await fetch(`/api/cvs/${contractingCv.id}`, {
                        method: 'PATCH',
                        headers: { 
                          'Content-Type': 'application/json', 
                          Authorization: `Bearer ${token}` 
                        },
                        body: JSON.stringify({ 
                          status: CVStatus.HIRED,
                          contractDate: contractDate,
                          identityNumber: identityNumber
                        }),
                      })
                      
                      if (!updateRes.ok) {
                        const errorData = await updateRes.json().catch(() => ({}))
                        throw new Error(errorData.message || 'فشل في تحديث السيرة')
                      }
                      
                      // إنشاء عقد منفصل فقط للسير الجديدة (غير المعادة)
                      if (contractingCv.status !== 'RETURNED') {
                        try {
                          await fetch('/api/contracts', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json', 
                              Authorization: `Bearer ${token}` 
                            },
                            body: JSON.stringify({
                              cvId: contractingCv.id,
                              identityNumber: identityNumber,
                              contractDate: contractDate,
                              status: 'ACTIVE'
                            }),
                          })
                        } catch (contractError) {
                          console.log('Contract creation failed, but CV updated successfully')
                        }
                      }
                      
                      // إزالة السيرة من القائمة المحلية
                      setCvs(prev => prev.filter(cv => cv.id !== contractingCv.id))
                      
                      // تسجيل النشاط
                      if (contractingCv.status === 'RETURNED') {
                        CVActivityLogger.statusChanged(contractingCv.id.toString(), contractingCv.fullName, 'معاد', 'متعاقد')
                      } else {
                        ContractActivityLogger.created(contractingCv.id.toString(), contractingCv.fullName)
                      }
                      
                      // إغلاق النافذة وتنظيف البيانات
                      setIsContractModalOpen(false)
                      setIdentityNumber('')
                      setContractingCv(null)
                      
                      // رسالة نجاح مع خيار الانتقال لصفحة العقود
                      const successMessage = contractingCv.status === 'RETURNED' 
                        ? `تم إعادة التعاقد مع ${contractingCv.fullName} بنجاح! تم نقل السيرة إلى صفحة العقود.`
                        : `تم التعاقد مع ${contractingCv.fullName} بنجاح! تم نقل السيرة إلى صفحة العقود.`
                      
                      toast.success(successMessage, {
                        duration: 6000,
                      })
                      
                      // عرض إشعار للانتقال لصفحة العقود
                      setTimeout(() => {
                        toast((t) => (
                          <div className="flex items-center gap-3">
                            <span>هل تريد الانتقال إلى صفحة العقود؟</span>
                            <button
                              onClick={() => {
                                router.push('/dashboard/contracts')
                                toast.dismiss(t.id)
                              }}
                              className="bg-primary text-white px-3 py-1 rounded text-sm hover:opacity-90"
                            >
                              نعم
                            </button>
                            <button
                              onClick={() => toast.dismiss(t.id)}
                              className="bg-gray-300 text-foreground px-3 py-1 rounded text-sm hover:bg-gray-400"
                            >
                              لا
                            </button>
                          </div>
                        ), { duration: 8000 })
                      }, 1000)
                      
                    } catch (error) {
                      console.error('Contract creation error:', error)
                      const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء العقد. يرجى المحاولة مرة أخرى.'
                      toast.error(errorMessage)
                    } finally {
                      setIsCreatingContract(false)
                    }
                  }}
                >
                  <div className="mb-6">
                    <label htmlFor="identityNumber" className="block text-sm font-medium text-foreground mb-2">
                      رقم الهوية
                    </label>
                    <input
                      id="identityNumber"
                      type="text"
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                      placeholder="أدخل رقم الهوية هنا"
                      required
                      disabled={isCreatingContract}
                    />
                  </div>
                  
                  {/* شريط التحميل */}
                  {isCreatingContract && (
                    <div className="mb-6">
                      <div className="flex items-center gap-3 text-primary mb-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-medium">جاري إنشاء العقد...</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse" style={{width: '70%'}}></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-4">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsContractModalOpen(false)
                        setContractingCv(null)
                        setIdentityNumber('')
                      }} 
                      disabled={isCreatingContract}
                      className="px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-gray-200 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit" 
                      disabled={isCreatingContract}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isCreatingContract ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          جاري التعاقد...
                        </>
                      ) : (
                        <>
                          <FileSignature className="h-5 w-5" />
                          تأكيد التعاقد
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* نافذة التنزيل المجمّع */}
          {showBulkDownloader && (
            <BulkImageDownloader
              cvIds={selectedCvs}
              cvNameById={(id) => cvs.find(c => c.id === id)?.fullName || id}
              onClose={() => setShowBulkDownloader(false)}
              onComplete={() => {
                setShowBulkDownloader(false)
                setSelectedCvs([])
              }}
            />
          )}
        </div>
      )}
    </DashboardLayout>

    {/* مودال الحجز */}
    {isBookingModalOpen && bookingCv && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
          {/* Header */}
          <div className="bg-gradient-to-r from-warning to-warning/80 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <CalendarCheck className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">حجز السيرة الذاتية</h3>
                <p className="text-white/90 text-sm">إدخال بيانات الحجز</p>
              </div>
              <button
                onClick={closeBookingModal}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                disabled={isCreatingBooking}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-warning" />
                معلومات السيرة الذاتية:
              </h4>
              <div className="text-sm text-foreground space-y-1">
                <p><span className="font-medium">الاسم:</span> {bookingCv.fullName}</p>
                {bookingCv.position && <p><span className="font-medium">الوظيفة:</span> {bookingCv.position}</p>}
                {bookingCv.nationality && <p><span className="font-medium">الجنسية:</span> {bookingCv.nationality}</p>}
                {bookingCv.referenceCode && <p><span className="font-medium">الكود المرجعي:</span> {bookingCv.referenceCode}</p>}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="bookingIdentityNumber" className="block text-sm font-medium text-foreground mb-2">
                  <span className="text-destructive">*</span> رقم الهوية:
                </label>
                <input
                  type="text"
                  id="bookingIdentityNumber"
                  value={bookingIdentityNumber}
                  onChange={(e) => setBookingIdentityNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-warning focus:border-transparent bg-input text-foreground"
                  placeholder="أدخل رقم الهوية"
                  disabled={isCreatingBooking}
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label htmlFor="bookingNotes" className="block text-sm font-medium text-foreground mb-2">
                  ملاحظات (اختياري):
                </label>
                <textarea
                  id="bookingNotes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-warning focus:border-transparent bg-input text-foreground resize-none"
                  placeholder="أضف ملاحظات عن الحجز (مثل: تاريخ المقابلة، متطلبات خاصة...)"
                  rows={3}
                  disabled={isCreatingBooking}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="bg-info/10 border border-info/30 rounded-lg p-3 mb-6">
              <p className="text-sm text-info">
                <strong>📋 ملاحظة:</strong> عند التأكيد سيتم:
              </p>
              <ul className="text-xs text-info mt-1 space-y-1 mr-4">
                <li>• حجز السيرة الذاتية برقم الهوية المحدد</li>
                <li>• تحويل حالة السيرة إلى &quot;محجوز&quot;</li>
                <li>• نقل السيرة إلى صفحة المحجوزات</li>
                <li>• إمكانية التعاقد لاحقاً من صفحة المحجوزات</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeBookingModal}
                className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-semibold transition-colors"
                disabled={isCreatingBooking}
              >
                إلغاء
              </button>
              <button
                onClick={confirmBooking}
                className="flex-1 px-6 py-3 bg-warning hover:opacity-90 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                disabled={isCreatingBooking || !bookingIdentityNumber.trim()}
              >
                {isCreatingBooking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري الحجز...
                  </>
                ) : (
                  <>
                    <CalendarCheck className="h-5 w-5" />
                    تأكيد الحجز
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Video Modal - محسن للهواتف */}
      <VideoPlayer 
        videoUrl={selectedVideo} 
        onClose={() => setSelectedVideo(null)}
        videoModalKey={videoModalKey}
      />

      {/* Image Viewer Modal - للموبايل */}
      {showImageModal && viewingCv && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-background rounded-t-lg p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CountryFlag nationality={viewingCv.nationality || ''} size="md" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground truncate">{viewingCv.fullName}</h3>
                  {viewingCv.fullNameArabic && (
                    <p className="text-sm text-muted-foreground truncate">{viewingCv.fullNameArabic}</p>
                  )}
                  <p className="text-xs text-muted-foreground">الكود: {viewingCv.referenceCode}</p>
                </div>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 overflow-auto bg-muted rounded-b-lg">
              {(viewingCv.cvImageUrl || viewingCv.profileImage) ? (
                <img
                  src={(() => {
                    // إذا كان هناك cvImageUrl، استخدمها
                    if (viewingCv.cvImageUrl) {
                      const fileId = viewingCv.cvImageUrl.match(/[-\w]{25,}/)?.[0]
                      if (fileId) {
                        return `https://images.weserv.nl/?url=${encodeURIComponent(`https://drive.google.com/uc?export=view&id=${fileId}`)}&w=2000&output=webp`
                      }
                      return viewingCv.cvImageUrl
                    }
                    // وإلا استخدم profileImage
                    return processImageUrl(viewingCv.profileImage)
                  })()}
                  alt={viewingCv.fullName}
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    // في حالة فشل التحميل، جرب الرابط الأصلي
                    if (viewingCv.cvImageUrl && !target.src.includes(viewingCv.cvImageUrl)) {
                      target.src = viewingCv.cvImageUrl
                    } else if (viewingCv.profileImage && !target.src.includes(viewingCv.profileImage)) {
                      target.src = processImageUrl(viewingCv.profileImage)
                    } else {
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = `
                        <div class="flex items-center justify-center h-96 text-muted-foreground">
                          <div class="text-center">
                            <svg class="h-16 w-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            <p>فشل تحميل الصورة</p>
                          </div>
                        </div>
                      `
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>لا توجد صورة متاحة</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-background rounded-b-lg p-4 flex gap-2 border-t border-border">
              <button
                onClick={() => downloadSingleImage(viewingCv.id)}
                className="flex-1 btn btn-primary text-sm py-2"
              >
                <Download className="h-4 w-4 ml-2 inline" />
                تحميل الصورة
              </button>
              <button
                onClick={() => {
                  router.push(`/dashboard/cv/${viewingCv.id}`)
                  setShowImageModal(false)
                }}
                className="flex-1 btn btn-secondary text-sm py-2"
              >
                <ExternalLink className="h-4 w-4 ml-2 inline" />
                عرض التفاصيل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Progress Modal */}
      <DownloadProgressModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        progress={downloadModalProgress}
        status={downloadModalStatus}
        fileName={downloadModalFileName}
        errorMessage={downloadModalError}
      />

      {/* CV View Modal - عرض السيرة الذاتية (للمستخدمين من نوع USER) */}
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
                        window.open(processImageUrl(selectedCVForView.cvImageUrl!), '_blank');
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

                <button
                  onClick={() => downloadSingleImage(selectedCVForView.id)}
                  className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>تحميل</span>
                </button>

                {selectedCVForView.videoLink && (
                  <button
                    onClick={() => {
                      setVideoModalKey((prev: number) => prev + 1); setSelectedVideo(selectedCVForView.videoLink || null);
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

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
            transform: translateY(20px);
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
      `}</style>
    </>
  )
}

