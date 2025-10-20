'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Bookmark,
  FileSignature,
  Play,
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
} from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import BulkImageDownloader from '../../components/BulkImageDownloader'
import CountryFlag from '../../components/CountryFlag'
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

export default function CVsPage() {
  const router = useRouter()

  const [cvs, setCvs] = useState<CV[]>([])
  const [filteredCvs, setFilteredCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [religionFilter, setReligionFilter] = useState<string>('ALL')
  const [nationalityFilter, setNationalityFilter] = useState<string>('ALL')
  const [skillFilter, setSkillFilter] = useState<string>('ALL')
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(30)
  const [paginatedCvs, setPaginatedCvs] = useState<CV[]>([])

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newBulkStatus, setNewBulkStatus] = useState<CVStatus>(CVStatus.NEW)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [contractingCv, setContractingCv] = useState<CV | null>(null)
  const [identityNumber, setIdentityNumber] = useState('')
  
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

  useEffect(() => {
    filterCVs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvs, searchTerm, religionFilter, nationalityFilter, skillFilter, maritalStatusFilter, ageFilter, experienceFilter, arabicLevelFilter, englishLevelFilter, educationFilter, salaryFilter, contractPeriodFilter, passportStatusFilter, heightFilter, weightFilter, childrenFilter, locationFilter])

  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedCvs(filteredCvs.slice(startIndex, endIndex))
  }, [filteredCvs, currentPage, itemsPerPage])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, religionFilter, nationalityFilter, skillFilter, maritalStatusFilter, ageFilter, experienceFilter, arabicLevelFilter, englishLevelFilter, educationFilter, salaryFilter, contractPeriodFilter, passportStatusFilter, heightFilter, weightFilter, childrenFilter, locationFilter])

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

  const filterCVs = () => {
    // إخفاء السير المتعاقدة والمؤرشفة، وإظهار السير المعادة
    let filtered = cvs.filter(cv => cv.status !== CVStatus.HIRED && cv.status !== CVStatus.ARCHIVED)
    
    // عرض جميع الديانات الموجودة في البيانات (للتشخيص)
    if (religionFilter !== 'ALL') {
      const religions = [...new Set(cvs.map(cv => cv.religion || 'غير محدد'))]
      console.log('🔍 الديانات الموجودة في البيانات:', religions)
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (cv) =>
          cv.fullName.toLowerCase().includes(q) ||
          (cv.fullNameArabic && cv.fullNameArabic.toLowerCase().includes(q)) ||
          (cv.email && cv.email.toLowerCase().includes(q)) ||
          (cv.phone && cv.phone.includes(searchTerm)) ||
          (cv.position && cv.position.toLowerCase().includes(q)) ||
          (cv.referenceCode && cv.referenceCode.toLowerCase().includes(q)) ||
          (cv.nationality && cv.nationality.toLowerCase().includes(q)),
      )
    }
    // تمت إزالة فلتر الحالة واستبداله بفلتر الديانة في الفلاتر السريعة
    if (religionFilter !== 'ALL') {
      console.log('🔍 تطبيق فلتر الديانة:', religionFilter)
      const beforeCount = filtered.length
      filtered = filtered.filter((cv) => {
        // التعامل مع القيم الفارغة أو غير المحددة
        const cvReligion = cv.religion || ''
        const match = cvReligion === religionFilter
        if (match) {
          console.log('✅ تطابق:', cv.fullName, 'الديانة:', cvReligion)
        }
        return match
      })
      console.log(`📊 نتائج فلتر الديانة: ${filtered.length} من أصل ${beforeCount}`)
    }
    if (nationalityFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        // خريطة تحويل من العربية إلى الإنجليزية للمطابقة
        const arabicToEnglishMap: { [key: string]: string } = {
          'الفلبين': 'FILIPINO',
          'الهند': 'INDIAN',
          'بنغلاديش': 'BANGLADESHI',
          'إثيوبيا': 'إثيوبيا',
          'كينيا': 'KENYAN',
          'أوغندا': 'اوغندا',
          'بوروندي': 'بوروندي',
          'رواندا': 'RWANDAN',
          'تنزانيا': 'TANZANIAN',
          'مالاوي': 'MALAWIAN',
          'زامبيا': 'ZAMBIAN',
          'زيمبابوي': 'ZIMBABWEAN',
          'غانا': 'GHANAIAN',
          'نيجيريا': 'NIGERIAN',
          'الكاميرون': 'CAMEROONIAN',
          'الكونغو': 'CONGOLESE',
          'السودان': 'SUDANESE',
          'الصومال': 'SOMALI',
          'إريتريا': 'ERITREAN',
          'جيبوتي': 'DJIBOUTIAN',
          'مدغشقر': 'MALAGASY',
          'موريشيوس': 'MAURITIAN',
          'سيشل': 'SEYCHELLOIS',
          'جزر القمر': 'COMORAN',
          'الرأس الأخضر': 'CAPE_VERDEAN',
          'ساو تومي': 'SAO_TOMEAN',
          'غينيا': 'GUINEAN',
          'سيراليون': 'SIERRA_LEONEAN',
          'ليبيريا': 'LIBERIAN',
          'ساحل العاج': 'IVORIAN',
          'بوركينا فاسو': 'BURKINABE',
          'مالي': 'MALIAN',
          'السنغال': 'SENEGALESE',
          'غامبيا': 'GAMBIAN',
          'غينيا بيساو': 'GUINEA_BISSAUAN',
          'المغرب': 'MOROCCAN',
          'الجزائر': 'ALGERIAN',
          'تونس': 'TUNISIAN',
          'ليبيا': 'LIBYAN',
          'مصر': 'EGYPTIAN',
          'باكستان': 'PAKISTANI',
          'سريلانكا': 'سريلانكا',
          'نيبال': 'NEPALESE',
          'ميانمار': 'BURMESE',
          'تايلاند': 'THAI',
          'فيتنام': 'VIETNAMESE',
          'كمبوديا': 'CAMBODIAN',
          'لاوس': 'LAOTIAN',
          'إندونيسيا': 'INDONESIAN',
          'ماليزيا': 'MALAYSIAN'
        }
        
        // إذا كان الفلتر بالعربية، حوله للإنجليزية
        const englishFilter = arabicToEnglishMap[nationalityFilter] || nationalityFilter
        
        // مطابقة مباشرة مع البيانات من ملف الإكسل
        return cv.nationality === englishFilter || 
               cv.nationality?.includes(englishFilter) || 
               cv.nationality === nationalityFilter || 
               cv.nationality?.includes(nationalityFilter)
      })
    }
    if (skillFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        // Get skill value using bracket notation
        let val: SkillLevel | undefined
        if (skillFilter === 'babySitting') val = cv.babySitting
        else if (skillFilter === 'childrenCare') val = cv.childrenCare
        else if (skillFilter === 'tutoring') val = cv.tutoring
        else if (skillFilter === 'disabledCare') val = cv.disabledCare
        else if (skillFilter === 'cleaning') val = cv.cleaning
        else if (skillFilter === 'washing') val = cv.washing
        else if (skillFilter === 'ironing') val = cv.ironing
        else if (skillFilter === 'arabicCooking') val = cv.arabicCooking
        else if (skillFilter === 'sewing') val = cv.sewing
        else if (skillFilter === 'driving') val = cv.driving
        else val = undefined
        return val === SkillLevel.YES || val === SkillLevel.WILLING
      })
    }
    if (maritalStatusFilter !== 'ALL') filtered = filtered.filter((cv) => cv.maritalStatus === maritalStatusFilter)
    if (ageFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        if (!cv.age) return false
        if (ageFilter === '20-25') return cv.age >= 20 && cv.age <= 25
        if (ageFilter === '25-30') return cv.age >= 25 && cv.age <= 30
        if (ageFilter === '30-35') return cv.age >= 30 && cv.age <= 35
        if (ageFilter === '35-40') return cv.age >= 35 && cv.age <= 40
        if (ageFilter === '40-45') return cv.age >= 40 && cv.age <= 45
        if (ageFilter === '45+') return cv.age >= 45
        return true
      })
    }
    if (experienceFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const expValue = cv.experience || ''
        const exp = typeof expValue === 'string' ? expValue.trim().toLowerCase() : String(expValue).trim().toLowerCase()
        
        // معالجة القيم الفارغة وغير المحددة
        if (experienceFilter === 'NO_EXPERIENCE') {
          // معالجة جميع الحالات الممكنة لـ "بدون خبرة"
          if (!exp || exp === '') return true
          if (exp === 'لا يوجد' || exp === 'لايوجد') return true
          if (exp === 'غير محدد' || exp === 'غيرمحدد') return true
          if (exp === 'no' || exp === 'none' || exp === 'null' || exp === 'undefined') return true
          if (exp === '0' || exp === '0 سنة' || exp === '0 سنوات') return true
          // التحقق إذا كانت تحتوي على "لا" أو "غير"
          if (exp.includes('لا') || exp.includes('غير')) return true
          return false
        }
        
        // استخراج الأرقام من النص
        const nums = exp.match(/\d+/g)
        const yrs = nums && nums.length > 0 ? parseInt(nums[0]) : 0
        
        // في حالة وجود رقم صفر، اعتبره بدون خبرة
        if (yrs === 0 && experienceFilter !== 'NO_EXPERIENCE') return false
        
        if (experienceFilter === '1-2') return yrs >= 1 && yrs <= 2
        if (experienceFilter === '3-5') return yrs >= 3 && yrs <= 5
        if (experienceFilter === '6-10') return yrs >= 6 && yrs <= 10
        if (experienceFilter === 'MORE_10') return yrs > 10
        
        return false
      })
    }
    if (arabicLevelFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const arabicLevel = cv.arabicLevel ?? cv.languageLevel
        if (arabicLevelFilter === 'WEAK') return arabicLevel === null || arabicLevel === undefined
        if (arabicLevelFilter === 'NO') return arabicLevel === 'NO'
        return arabicLevel === arabicLevelFilter
      })
    }
    if (englishLevelFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const englishLevel = cv.englishLevel
        if (englishLevelFilter === 'WEAK') return englishLevel === null || englishLevel === undefined
        if (englishLevelFilter === 'NO') return englishLevel === 'NO'
        return englishLevel === englishLevelFilter
      })
    }

    // فلاتر إضافية شاملة
    if (educationFilter !== 'ALL') filtered = filtered.filter((cv) => cv.education === educationFilter)
    
    if (salaryFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const salary = parseInt(cv.monthlySalary || '0')
        if (salaryFilter === 'LOW') return salary < 1000
        if (salaryFilter === 'MEDIUM') return salary >= 1000 && salary < 2000
        if (salaryFilter === 'HIGH') return salary >= 2000
        return true
      })
    }
    
    if (contractPeriodFilter !== 'ALL') filtered = filtered.filter((cv) => cv.contractPeriod === contractPeriodFilter)
    
    if (passportStatusFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        if (passportStatusFilter === 'VALID') return cv.passportNumber && cv.passportExpiryDate
        if (passportStatusFilter === 'EXPIRED') return cv.passportExpiryDate && new Date(cv.passportExpiryDate) < new Date()
        if (passportStatusFilter === 'MISSING') return !cv.passportNumber
        return true
      })
    }
    
    if (heightFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const height = typeof cv.height === 'number' ? cv.height : parseInt(String(cv.height || '0'))
        if (heightFilter === '<150') return height < 150
        if (heightFilter === '150-160') return height >= 150 && height <= 160
        if (heightFilter === '160-170') return height >= 160 && height <= 170
        if (heightFilter === '170+') return height >= 170
        return true
      })
    }
    
    if (weightFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const weight = typeof cv.weight === 'number' ? cv.weight : parseInt(String(cv.weight || '0'))
        if (weightFilter === 'LIGHT') return weight < 60
        if (weightFilter === 'MEDIUM') return weight >= 60 && weight < 80
        if (weightFilter === 'HEAVY') return weight >= 80
        return true
      })
    }
    
    if (childrenFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const children = cv.numberOfChildren || 0
        if (childrenFilter === 'NONE') return children === 0
        if (childrenFilter === 'FEW') return children > 0 && children <= 2
        if (childrenFilter === 'MANY') return children > 2
        return true
      })
    }
    
    if (locationFilter !== 'ALL') {
      filtered = filtered.filter((cv) => 
        cv.livingTown?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        cv.placeOfBirth?.toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    setFilteredCvs(filtered)
  }

  const getCountForFilter = useCallback((filterType: string, filterValue: string): number => {
    if (!cvs || cvs.length === 0) return 0
    
    // معالجة خاصة لقيمة ALL
    if (filterValue === 'ALL') {
      return cvs.length
    }
    
    return cvs.filter(cv => {
      switch (filterType) {
        case 'religion':
          if (filterValue === 'مسلمة') return cv.religion?.includes('مسلم') || cv.religion?.includes('MUSLIM')
          if (filterValue === 'مسيحية') return cv.religion?.includes('مسيحي') || cv.religion?.includes('CHRISTIAN')
          if (filterValue === 'أخرى') return cv.religion && !cv.religion.includes('مسلم') && !cv.religion.includes('مسيحي')
          return false
          
        case 'nationality':
          // خريطة تحويل من العربية إلى الإنجليزية للمطابقة
          const arabicToEnglishMap: { [key: string]: string } = {
            'الفلبين': 'FILIPINO',
            'الهند': 'INDIAN',
            'بنغلاديش': 'BANGLADESHI',
            'إثيوبيا': 'إثيوبيا',
            'كينيا': 'KENYAN',
            'أوغندا': 'اوغندا',
            'بوروندي': 'بوروندي',
            'رواندا': 'RWANDAN',
            'تنزانيا': 'TANZANIAN',
            'مالاوي': 'MALAWIAN',
            'زامبيا': 'ZAMBIAN',
            'زيمبابوي': 'ZIMBABWEAN',
            'غانا': 'GHANAIAN',
            'نيجيريا': 'NIGERIAN',
            'الكاميرون': 'CAMEROONIAN',
            'الكونغو': 'CONGOLESE',
            'السودان': 'SUDANESE',
            'الصومال': 'SOMALI',
            'إريتريا': 'ERITREAN',
            'جيبوتي': 'DJIBOUTIAN',
            'مدغشقر': 'MALAGASY',
            'موريشيوس': 'MAURITIAN',
            'سيشل': 'SEYCHELLOIS',
            'جزر القمر': 'COMORAN',
            'الرأس الأخضر': 'CAPE_VERDEAN',
            'ساو تومي': 'SAO_TOMEAN',
            'غينيا': 'GUINEAN',
            'سيراليون': 'SIERRA_LEONEAN',
            'ليبيريا': 'LIBERIAN',
            'ساحل العاج': 'IVORIAN',
            'بوركينا فاسو': 'BURKINABE',
            'مالي': 'MALIAN',
            'السنغال': 'SENEGALESE',
            'غامبيا': 'GAMBIAN',
            'غينيا بيساو': 'GUINEA_BISSAUAN',
            'المغرب': 'MOROCCAN',
            'الجزائر': 'ALGERIAN',
            'تونس': 'TUNISIAN',
            'ليبيا': 'LIBYAN',
            'مصر': 'EGYPTIAN',
            'باكستان': 'PAKISTANI',
            'سريلانكا': 'سريلانكا',
            'نيبال': 'NEPALESE',
            'ميانمار': 'BURMESE',
            'تايلاند': 'THAI',
            'فيتنام': 'VIETNAMESE',
            'كمبوديا': 'CAMBODIAN',
            'لاوس': 'LAOTIAN',
            'إندونيسيا': 'INDONESIAN',
            'ماليزيا': 'MALAYSIAN'
          }
          
          // إذا كان الفلتر بالعربية، حوله للإنجليزية
          const englishFilter = arabicToEnglishMap[filterValue] || filterValue
          
          // مطابقة مباشرة مع البيانات من ملف الإكسل
          return cv.nationality === englishFilter || 
                 cv.nationality?.includes(englishFilter) || 
                 cv.nationality === filterValue || 
                 cv.nationality?.includes(filterValue)
          
        case 'age':
          if (!cv.age) return false
          if (filterValue === '20-25') return cv.age >= 20 && cv.age <= 25
          if (filterValue === '25-30') return cv.age >= 25 && cv.age <= 30
          if (filterValue === '30-35') return cv.age >= 30 && cv.age <= 35
          if (filterValue === '35-40') return cv.age >= 35 && cv.age <= 40
          if (filterValue === '40-45') return cv.age >= 40 && cv.age <= 45
          if (filterValue === '45+') return cv.age >= 45
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
            'ironing': 'ironing'
          }
          const skillKey = skillMap[filterValue]
          return skillKey ? (cv[skillKey] === 'YES' || cv[skillKey] === 'WILLING') : false
          
        case 'arabicLevel':
          const arabicLevel = cv.arabicLevel ?? cv.languageLevel
          if (filterValue === 'WEAK') return arabicLevel === null || arabicLevel === undefined
          if (filterValue === 'NO') return arabicLevel === 'NO'
          return arabicLevel === filterValue
          
        case 'englishLevel':
          const englishLevel = cv.englishLevel
          if (filterValue === 'WEAK') return englishLevel === null || englishLevel === undefined
          if (filterValue === 'NO') return englishLevel === 'NO'
          return englishLevel === filterValue
          
        case 'experience':
          const expValue = cv.experience || ''
          const exp = typeof expValue === 'string' ? expValue.trim().toLowerCase() : String(expValue).trim().toLowerCase()
          
          // معالجة القيم الفارغة وغير المحددة
          if (filterValue === 'NO_EXPERIENCE') {
            // معالجة جميع الحالات الممكنة لـ "بدون خبرة"
            if (!exp || exp === '') return true
            if (exp === 'لا يوجد' || exp === 'لايوجد') return true
            if (exp === 'غير محدد' || exp === 'غيرمحدد') return true
            if (exp === 'no' || exp === 'none' || exp === 'null' || exp === 'undefined') return true
            if (exp === '0' || exp === '0 سنة' || exp === '0 سنوات') return true
            // التحقق إذا كانت تحتوي على "لا" أو "غير"
            if (exp.includes('لا') || exp.includes('غير')) return true
            return false
          }
          
          // استخراج الأرقام من النص
          const nums = exp.match(/\d+/g)
          const yrs = nums && nums.length > 0 ? parseInt(nums[0]) : 0
          
          // في حالة وجود رقم صفر، اعتبره بدون خبرة
          if (yrs === 0 && filterValue !== 'NO_EXPERIENCE') return false
          
          if (filterValue === '1-2') return yrs >= 1 && yrs <= 2
          if (filterValue === '3-5') return yrs >= 3 && yrs <= 5
          if (filterValue === '6-10') return yrs >= 6 && yrs <= 10
          if (filterValue === 'MORE_10') return yrs > 10
          
          return false
          
        case 'education':
          const education = (cv.educationLevel || cv.education || '').toLowerCase()
          if (filterValue === 'متعلم') return education.includes('نعم') || education.includes('yes') || education.includes('متعلم')
          if (filterValue === 'غير متعلم') return education.includes('لا') || education.includes('no') || education.includes('غير') || education === ''
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
          const height = typeof cv.height === 'number' ? cv.height : parseInt(String(cv.height || '0'))
          if (filterValue === '140-150' && height >= 140 && height <= 150) return true
          if (filterValue === '150-160' && height >= 150 && height <= 160) return true
          if (filterValue === '160-170' && height >= 160 && height <= 170) return true
          if (filterValue === '170+' && height >= 170) return true
          return false
          
        case 'weight':
          const weight = typeof cv.weight === 'number' ? cv.weight : parseInt(String(cv.weight || '0'))
          if (filterValue === '40-50' && weight >= 40 && weight <= 50) return true
          if (filterValue === '50-60' && weight >= 50 && weight <= 60) return true
          if (filterValue === '60-70' && weight >= 60 && weight <= 70) return true
          if (filterValue === '70+' && weight >= 70) return true
          return false
          
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
    
    const fileName = `${cv.fullName}_${cv.referenceCode || cvId}`
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
        
        const downloadSuccess = await downloadFromUrl(cv.cvImageUrl, {
          fileName: fileName + '.jpg',
          fallbackToNewWindow: true
        })
        
        if (downloadSuccess) {
          toast.success('تم بدء تحميل الصورة', { id: toastId })
          
          if (isMobileApp()) {
            setTimeout(() => {
              showMobileDownloadInstructions(fileName + '.jpg')
            }, 1500)
          }
        } else {
          throw new Error('رابط الصورة غير صالح')
        }
        
        CVActivityLogger.viewed(cvId, cv.fullName)
        return
      }

      // استخدام Google Drive direct download link
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
      console.log('🔗 رابط التحميل:', downloadUrl)
      
      // استخدام الطريقة المحسنة للتحميل
      const downloadSuccess = await downloadFromUrl(downloadUrl, {
        fileName: fileName + '.jpg',
        fallbackToNewWindow: true
      })
      
      if (downloadSuccess) {
        toast.success('تم بدء تحميل الصورة من Google Drive', { id: toastId })
        
        if (isMobileApp()) {
          setTimeout(() => {
            showMobileDownloadInstructions(fileName + '.jpg')
          }, 1500)
        }
      } else {
        throw new Error('فشل في تحميل الصورة من Google Drive')
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
          
          // إنشاء iframe مخفي للتحميل
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = downloadUrl;
          document.body.appendChild(iframe);
          
          // إزالة iframe بعد 5 ثواني
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 5000);

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

          {/* كرت البحث والتصفية */}
          <div className="card p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="bg-primary/10 p-3 rounded-lg ml-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  البحث والتصفية المتقدمة
                </h3>
                <p className="text-muted-foreground text-sm mt-1">ابحث وصفي السير الذاتية بسهولة</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="relative group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder=" ابحث بالاسم، الجنسية، الوظيفة، أو أي معلومة أخرى..."
                  className="form-input w-full pr-14 pl-6 py-5 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  dir="rtl"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* الفلاتر السريعة */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-3">
                <select
                  className="flex-1 min-w-[160px] px-4 py-2.5 bg-muted border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary/50"
                  value={religionFilter}
                  onChange={(e) => setReligionFilter(e.target.value)}
                >
                  <option value="ALL">جميع الديانات ({getCountForFilter('religion', 'ALL')})</option>
                  <option value="مسلمة">مسلمة ({getCountForFilter('religion', 'مسلمة')})</option>
                  <option value="مسيحية">مسيحية ({getCountForFilter('religion', 'مسيحية')})</option>
                  <option value="أخرى">أخرى ({getCountForFilter('religion', 'أخرى')})</option>
                </select>

                <select
                  className="flex-1 min-w-[160px] px-4 py-2.5 bg-success/10 border border-success/30 rounded-lg text-sm font-medium text-success hover:bg-success/20 focus:outline-none focus:ring-2 focus:ring-success transition-all"
                  value={nationalityFilter}
                  onChange={(e) => setNationalityFilter(e.target.value)}
                >
                  <option value="ALL">جميع الجنسيات ({getCountForFilter('nationality', 'ALL')})</option>
                  <option value="الفلبين">الفلبين ({getCountForFilter('nationality', 'الفلبين')})</option>
                  <option value="الهند">الهند ({getCountForFilter('nationality', 'الهند')})</option>
                  <option value="بنغلاديش">بنغلاديش ({getCountForFilter('nationality', 'بنغلاديش')})</option>
                  <option value="إثيوبيا">إثيوبيا ({getCountForFilter('nationality', 'إثيوبيا')})</option>
                  <option value="كينيا">كينيا ({getCountForFilter('nationality', 'كينيا')})</option>
                  <option value="أوغندا">أوغندا ({getCountForFilter('nationality', 'أوغندا')})</option>
                  <option value="نيبال">نيبال ({getCountForFilter('nationality', 'نيبال')})</option>
                  <option value="سريلانكا">سريلانكا ({getCountForFilter('nationality', 'سريلانكا')})</option>
                  <option value="إندونيسيا">إندونيسيا ({getCountForFilter('nationality', 'إندونيسيا')})</option>
                </select>

                <select
                  className="flex-1 min-w-[160px] px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                >
                  <option value="ALL">جميع الأعمار ({getCountForFilter('age', 'ALL')})</option>
                  <option value="20-25">20-25 سنة ({getCountForFilter('age', '20-25')})</option>
                  <option value="25-30">25-30 سنة ({getCountForFilter('age', '25-30')})</option>
                  <option value="30-35">30-35 سنة ({getCountForFilter('age', '30-35')})</option>
                  <option value="35-40">35-40 سنة ({getCountForFilter('age', '35-40')})</option>
                  <option value="40-45">40-45 سنة ({getCountForFilter('age', '40-45')})</option>
                  <option value="45+">أكبر من 45 ({getCountForFilter('age', '45+')})</option>
                </select>

                {/* زر المزيد من الفلاتر */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border-2 ${
                    showAdvancedFilters
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30'
                      : 'bg-background text-foreground border-border hover:bg-muted hover:border-primary/50'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className={`h-4 w-4 transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                    {showAdvancedFilters ? 'إخفاء الفلاتر' : 'المزيد من الفلاتر'}
                  </span>
                </button>
              </div>
            </div>

            {/* الفلاتر المتقدمة */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdvancedFilters ? 'max-h-[1000px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
              <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-primary mb-2">
                      <Star className="h-4 w-4 ml-2" /> المهارات
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary"
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                    >
                      <option value="ALL">جميع المهارات ({getCountForFilter('skill', 'ALL')})</option>
                      <option value="babySitting">رعاية أطفال ({getCountForFilter('skill', 'babySitting')})</option>
                      <option value="childrenCare">عناية بالأطفال ({getCountForFilter('skill', 'childrenCare')})</option>
                      <option value="cleaning">التنظيف ({getCountForFilter('skill', 'cleaning')})</option>
                      <option value="washing">الغسيل ({getCountForFilter('skill', 'washing')})</option>
                      <option value="ironing">الكي ({getCountForFilter('skill', 'ironing')})</option>
                      <option value="arabicCooking">الطبخ العربي ({getCountForFilter('skill', 'arabicCooking')})</option>
                      <option value="sewing">الخياطة ({getCountForFilter('skill', 'sewing')})</option>
                      <option value="driving">القيادة ({getCountForFilter('skill', 'driving')})</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-info mb-2">
                      <Heart className="h-4 w-4 ml-2" /> الحالة الاجتماعية
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-info"
                      value={maritalStatusFilter}
                      onChange={(e) => setMaritalStatusFilter(e.target.value)}
                    >
                      <option value="ALL">الكل ({getCountForFilter('maritalStatus', 'ALL')})</option>
                      <option value="SINGLE">أعزب/عزباء ({getCountForFilter('maritalStatus', 'SINGLE')})</option>
                      <option value="MARRIED">متزوج/متزوجة ({getCountForFilter('maritalStatus', 'MARRIED')})</option>
                      <option value="DIVORCED">مطلق/مطلقة ({getCountForFilter('maritalStatus', 'DIVORCED')})</option>
                      <option value="WIDOWED">أرمل/أرملة ({getCountForFilter('maritalStatus', 'WIDOWED')})</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-success mb-2">
                      <Globe className="h-4 w-4 ml-2" /> اللغة العربية
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-success"
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
                    <label className="flex items-center text-sm font-semibold text-info mb-2">
                      <Globe className="h-4 w-4 ml-2" /> اللغة الإنجليزية
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-info"
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

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-warning mb-2">
                      <Calendar className="h-4 w-4 ml-2" /> سنوات الخبرة
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-warning"
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                    >
                      <option value="ALL">جميع الخبرات ({getCountForFilter('experience', 'ALL')})</option>
                      <option value="NO_EXPERIENCE">بدون خبرة ({getCountForFilter('experience', 'NO_EXPERIENCE')})</option>
                      <option value="1-2">1-2 سنة ({getCountForFilter('experience', '1-2')})</option>
                      <option value="3-5">3-5 سنوات ({getCountForFilter('experience', '3-5')})</option>
                      <option value="6-10">6-10 سنوات ({getCountForFilter('experience', '6-10')})</option>
                      <option value="MORE_10">أكثر من 10 سنوات ({getCountForFilter('experience', 'MORE_10')})</option>
                    </select>
                  </div>
                </div>

                {/* صف إضافي للفلاتر الجديدة */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-primary mb-2">
                      <BookOpen className="h-4 w-4 ml-2" /> المستوى التعليمي
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary"
                      value={educationFilter}
                      onChange={(e) => setEducationFilter(e.target.value)}
                    >
                      <option value="ALL">جميع المستويات ({getCountForFilter('education', 'ALL')})</option>
                      <option value="متعلم">متعلم ({getCountForFilter('education', 'متعلم')})</option>
                      <option value="غير متعلم">غير متعلم ({getCountForFilter('education', 'غير متعلم')})</option>
                      <option value="ثانوي">ثانوي</option>
                      <option value="جامعي">جامعي</option>
                      <option value="دراسات عليا">دراسات عليا</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-warning mb-2">
                      <DollarSign className="h-4 w-4 ml-2" /> الراتب المطلوب
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-warning"
                      value={salaryFilter}
                      onChange={(e) => setSalaryFilter(e.target.value)}
                    >
                      <option value="ALL">جميع الرواتب ({getCountForFilter('salary', 'ALL')})</option>
                      <option value="0-1000">أقل من 1000 ({getCountForFilter('salary', '0-1000')})</option>
                      <option value="1000-1500">1000-1500 ({getCountForFilter('salary', '1000-1500')})</option>
                      <option value="1500-2000">1500-2000 ({getCountForFilter('salary', '1500-2000')})</option>
                      <option value="2000+">أكثر من 2000 ({getCountForFilter('salary', '2000+')})</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-info mb-2">
                      <Calendar className="h-4 w-4 ml-2" /> مدة العقد
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-info"
                      value={contractPeriodFilter}
                      onChange={(e) => setContractPeriodFilter(e.target.value)}
                    >
                      <option value="ALL">جميع المدد ({getCountForFilter('contractPeriod', 'ALL')})</option>
                      <option value="1">سنة واحدة ({getCountForFilter('contractPeriod', '1')})</option>
                      <option value="2">سنتان ({getCountForFilter('contractPeriod', '2')})</option>
                      <option value="3">3 سنوات ({getCountForFilter('contractPeriod', '3')})</option>
                      <option value="أكثر">أكثر من 3 ({getCountForFilter('contractPeriod', 'أكثر')})</option>
                    </select>
                  </div>
                </div>

                {/* صف ثالث للفلاتر */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-destructive mb-2">
                      <FileText className="h-4 w-4 ml-2" /> حالة الجواز
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-destructive"
                      value={passportStatusFilter}
                      onChange={(e) => setPassportStatusFilter(e.target.value)}
                    >
                      <option value="ALL">جميع الحالات ({getCountForFilter('passportStatus', 'ALL')})</option>
                      <option value="متوفر">متوفر ({getCountForFilter('passportStatus', 'متوفر')})</option>
                      <option value="غير متوفر">غير متوفر ({getCountForFilter('passportStatus', 'غير متوفر')})</option>
                      <option value="قيد الإنجاز">قيد الإنجاز ({getCountForFilter('passportStatus', 'قيد الإنجاز')})</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-primary mb-2">
                      <Ruler className="h-4 w-4 ml-2" /> الطول
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary"
                      value={heightFilter}
                      onChange={(e) => setHeightFilter(e.target.value)}
                    >
                      <option value="ALL">جميع الأطوال ({getCountForFilter('height', 'ALL')})</option>
                      <option value="140-150">140-150 سم ({getCountForFilter('height', '140-150')})</option>
                      <option value="150-160">150-160 سم ({getCountForFilter('height', '150-160')})</option>
                      <option value="160-170">160-170 سم ({getCountForFilter('height', '160-170')})</option>
                      <option value="170+">أكثر من 170 ({getCountForFilter('height', '170+')})</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-success mb-2">
                      <Scale className="h-4 w-4 ml-2" /> الوزن
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-success"
                      value={weightFilter}
                      onChange={(e) => setWeightFilter(e.target.value)}
                    >
                      <option value="ALL">جميع الأوزان ({getCountForFilter('weight', 'ALL')})</option>
                      <option value="40-50">40-50 كجم ({getCountForFilter('weight', '40-50')})</option>
                      <option value="50-60">50-60 كجم ({getCountForFilter('weight', '50-60')})</option>
                      <option value="60-70">60-70 كجم ({getCountForFilter('weight', '60-70')})</option>
                      <option value="70+">أكثر من 70 ({getCountForFilter('weight', '70+')})</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-info mb-2">
                      <Baby className="h-4 w-4 ml-2" /> عدد الأطفال
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-info"
                      value={childrenFilter}
                      onChange={(e) => setChildrenFilter(e.target.value)}
                    >
                      <option value="ALL">الكل ({getCountForFilter('children', 'ALL')})</option>
                      <option value="NONE">بدون أطفال ({getCountForFilter('children', 'NONE')})</option>
                      <option value="FEW">1-2 أطفال ({getCountForFilter('children', 'FEW')})</option>
                      <option value="MANY">أكثر من 2 ({getCountForFilter('children', 'MANY')})</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setReligionFilter('ALL')
                      setNationalityFilter('ALL')
                      setSkillFilter('ALL')
                      setMaritalStatusFilter('ALL')
                      setAgeFilter('ALL')
                      setExperienceFilter('ALL')
                      setArabicLevelFilter('ALL')
                      setEnglishLevelFilter('ALL')
                      setEducationFilter('ALL')
                      setSalaryFilter('ALL')
                      setContractPeriodFilter('ALL')
                      setPassportStatusFilter('ALL')
                      setHeightFilter('ALL')
                      setWeightFilter('ALL')
                      setChildrenFilter('ALL')
                      setLocationFilter('ALL')
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-full text-sm font-medium hover:from-red-500 hover:to-pink-500"
                  >
                    مسح جميع الفلاتر
                  </button>
                </div>
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
                            setSelectedVideo(cv.videoLink);
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
                    <th className="px-4 py-4 font-semibold text-muted-foreground min-w-48 text-right">الاسم الكامل</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground min-w-24 text-center">الكود المرجعي</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground min-w-32 text-center">الجنسية</th>
                    <th className="px-3 py-4 font-semibold text-muted-foreground min-w-28 text-center">الوظيفة</th>
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
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
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
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground truncate">{cv.fullName}</div>
                            {cv.fullNameArabic && (
                              <div className="text-sm text-muted-foreground truncate">{cv.fullNameArabic}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                          {cv.referenceCode}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <CountryFlag nationality={cv.nationality || ''} size="md" />
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-sm text-foreground truncate block">{cv.position}</span>
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
                          {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
                            <button
                              onClick={() => router.push(`/dashboard/cv/${cv.id}`)}
                              className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg"
                              title="تعديل البيانات"
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
                                setSelectedVideo(cv.videoLink || null)
                              }}
                              className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg"
                              title="مشاهدة الفيديو"
                            >
                              <Play className="h-5 w-5" />
                            </button>
                          )}
                          {/* حجز - متاح للمدراء وخدمة العملاء فقط */}
                          {cv.status === CVStatus.NEW && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'CUSTOMER_SERVICE') && (
                            <button
                              onClick={() => openBookingModal(cv)}
                              className="p-2 text-warning hover:text-warning/80 hover:bg-warning/10 rounded-lg"
                              title="حجز"
                            >
                              <Bookmark className="h-5 w-5" />
                            </button>
                        )}
                        {/* أزرار التعاقد والرفض - متاحة للمدراء فقط (ليس للمبيعات) */}
                        {cv.status === CVStatus.NEW && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
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
                              className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg"
                              title="رفض"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {cv.status === CVStatus.BOOKED && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
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
                              className="p-2 text-warning hover:text-warning/80 hover:bg-warning/10 rounded-lg"
                              title="إعادة"
                            >
                              <Undo2 className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {cv.status === CVStatus.RETURNED && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
                          <button
                            onClick={() => {
                              setContractingCv(cv)
                              setIsContractModalOpen(true)
                            }}
                            className="p-2 text-success hover:text-success/80 hover:bg-success/10 rounded-lg"
                            title="إعادة التعاقد"
                          >
                            <FileSignature className="h-5 w-5" />
                          </button>
                        )}
                        {(cv.status === CVStatus.HIRED || cv.status === CVStatus.REJECTED) && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
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
                      <Bookmark className="h-3.5 w-3.5" />
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
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredCvs.length)} من أصل {filteredCvs.length} نتيجة
                  </span>
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

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
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
                      );
                    })}
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
                    if (!identityNumber) return
                    
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
                        CVActivityLogger.statusChanged(contractingCv.id, contractingCv.fullName, 'معاد', 'متعاقد')
                      } else {
                        ContractActivityLogger.created(contractingCv.id, contractingCv.fullName)
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
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsContractModalOpen(false)
                        setContractingCv(null)
                        setIdentityNumber('')
                      }} 
                      className="px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-gray-200 font-semibold transition-all"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold shadow-lg transition-all"
                    >
                      تأكيد التعاقد
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
                <Bookmark className="h-7 w-7" />
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
                    <Bookmark className="h-5 w-5" />
                    تأكيد الحجز
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Video Modal */}
    {selectedVideo && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold text-foreground">فيديو السيرة الذاتية</h3>
            <button
              onClick={() => setSelectedVideo(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-4">
            <div className="aspect-video w-full">
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
                  onLoad={() => console.log('✅ YouTube video loaded successfully:', selectedVideo)}
                  onError={() => console.error('❌ YouTube video failed to load:', selectedVideo)}
                />
              ) : selectedVideo.includes('drive.google.com') ? (
                <iframe
                  src={(() => {
                    // تحويل رابط Google Drive إلى embed
                    const fileIdMatch = selectedVideo.match(/\/file\/d\/([^\/]+)/)
                    if (fileIdMatch && fileIdMatch[1]) {
                      const embedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
                      console.log('🔗 Google Drive embed URL:', embedUrl)
                      return embedUrl
                    }
                    // إذا كان الرابط بصيغة أخرى، حاول استخدامه كما هو
                    const fallbackUrl = selectedVideo.replace('/view?usp=sharing', '/preview').replace('/view', '/preview')
                    console.log('🔗 Google Drive fallback URL:', fallbackUrl)
                    return fallbackUrl
                  })()}
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="autoplay"
                  allowFullScreen
                  title="فيديو السيرة الذاتية"
                  onLoad={() => console.log('✅ Google Drive video loaded successfully:', selectedVideo)}
                  onError={() => console.error('❌ Google Drive video failed to load:', selectedVideo)}
                />
              ) : selectedVideo.includes('vimeo.com') ? (
                <iframe
                  src={(() => {
                    // تحويل رابط Vimeo إلى embed
                    const videoId = selectedVideo.split('vimeo.com/')[1]?.split('?')[0]
                    const embedUrl = `https://player.vimeo.com/video/${videoId}`
                    console.log('🔗 Vimeo embed URL:', embedUrl)
                    return embedUrl
                  })()}
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="فيديو السيرة الذاتية"
                  onLoad={() => console.log('✅ Vimeo video loaded successfully:', selectedVideo)}
                  onError={() => console.error('❌ Vimeo video failed to load:', selectedVideo)}
                />
              ) : (
                <video
                  src={selectedVideo}
                  controls
                  className="w-full h-full rounded-lg bg-black"
                  preload="metadata"
                  onLoadedData={() => console.log('✅ Direct video loaded successfully:', selectedVideo)}
                  onError={(e) => {
                    console.error('❌ Direct video failed to load:', selectedVideo)
                    console.error('Video error details:', e)
                  }}
                >
                  <source src={selectedVideo} type="video/mp4" />
                  <source src={selectedVideo} type="video/webm" />
                  <source src={selectedVideo} type="video/ogg" />
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
              )}
            </div>
            
            {/* Debug Information - Only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-xs font-mono text-muted-foreground">
                  <strong>🔍 Debug Info:</strong>
                </p>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  <strong>Video URL:</strong> {selectedVideo}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check browser console for detailed loading information
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

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

