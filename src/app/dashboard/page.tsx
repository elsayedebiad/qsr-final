'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import BulkImageDownloader from '../../components/BulkImageDownloader'
import CountryFlag from '../../components/CountryFlag'
import { BulkActivityLogger, CVActivityLogger, ContractActivityLogger } from '../../lib/activity-logger'
import { getCountryInfo } from '../../lib/country-utils'
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

export default function CVsPage() {
  const router = useRouter()

  const [cvs, setCvs] = useState<CV[]>([])
  const [filteredCvs, setFilteredCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
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
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [viewingCv, setViewingCv] = useState<CV | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)

  const [selectedCvs, setSelectedCvs] = useState<string[]>([])
  const [showBulkDownloader, setShowBulkDownloader] = useState(false)
  const [showBulkOperationModal, setShowBulkOperationModal] = useState(false)
  const [bulkOperationType, setBulkOperationType] = useState<'delete' | 'status' | 'download'>('delete')
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  // شريط تحميل PNG الاحترافي
  const [showDownloadBar, setShowDownloadBar] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  
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
  }, [cvs, searchTerm, statusFilter, nationalityFilter, skillFilter, maritalStatusFilter, ageFilter, experienceFilter, languageFilter, religionFilter, educationFilter, salaryFilter, contractPeriodFilter, passportStatusFilter, heightFilter, weightFilter, childrenFilter, locationFilter])

  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedCvs(filteredCvs.slice(startIndex, endIndex))
  }, [filteredCvs, currentPage, itemsPerPage])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, nationalityFilter, skillFilter, maritalStatusFilter, ageFilter, experienceFilter, languageFilter, religionFilter, educationFilter, salaryFilter, contractPeriodFilter, passportStatusFilter, heightFilter, weightFilter, childrenFilter, locationFilter])

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
    // إخفاء السير المتعاقدة فقط، وإظهار السير المعادة
    let filtered = cvs.filter(cv => cv.status !== CVStatus.HIRED)

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
    if (statusFilter !== 'ALL') filtered = filtered.filter((cv) => cv.status === statusFilter)
    if (nationalityFilter !== 'ALL') filtered = filtered.filter((cv) => cv.nationality === nationalityFilter)
    if (skillFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const val = (cv as any)[skillFilter] as SkillLevel | undefined
        return val === SkillLevel.YES || val === SkillLevel.WILLING
      })
    }
    if (maritalStatusFilter !== 'ALL') filtered = filtered.filter((cv) => cv.maritalStatus === maritalStatusFilter)
    if (ageFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        if (!cv.age) return false
        if (ageFilter === '18-25') return cv.age >= 18 && cv.age <= 25
        if (ageFilter === '26-35') return cv.age >= 26 && cv.age <= 35
        if (ageFilter === '36-45') return cv.age >= 36 && cv.age <= 45
        if (ageFilter === '46+') return cv.age >= 46
        return true
      })
    }
    if (experienceFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const experience = cv.workExperience ?? cv.experience ?? 0
        if (typeof experience !== 'number') return false
        if (experienceFilter === '0-1') return experience >= 0 && experience < 1
        if (experienceFilter === '1-3') return experience >= 1 && experience <= 3
        if (experienceFilter === '3-5') return experience >= 3 && experience <= 5
        if (experienceFilter === '5+') return experience > 5
        return true
      })
    }
    if (languageFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const arabicLevel = cv.arabicLevel ?? cv.languageLevel
        return arabicLevel === languageFilter
      })
    }

    // فلاتر إضافية شاملة
    if (religionFilter !== 'ALL') filtered = filtered.filter((cv) => cv.religion === religionFilter)
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
        const height = parseInt(cv.height || '0')
        if (heightFilter === 'SHORT') return height < 160
        if (heightFilter === 'MEDIUM') return height >= 160 && height < 170
        if (heightFilter === 'TALL') return height >= 170
        return true
      })
    }
    
    if (weightFilter !== 'ALL') {
      filtered = filtered.filter((cv) => {
        const weight = parseInt(cv.weight || '0')
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
  const extractGoogleDriveFileId = (url: string): string | null => {
    if (!url) return null
    
    // Pattern 1: /file/d/FILE_ID/view
    const match1 = url.match(/\/file\/d\/([^\/]+)/)
    if (match1) return match1[1]
    
    // Pattern 2: /open?id=FILE_ID
    const match2 = url.match(/[?&]id=([^&]+)/)
    if (match2) return match2[1]
    
    // Pattern 3: /thumbnail?id=FILE_ID
    const match3 = url.match(/\/thumbnail\?id=([^&]+)/)
    if (match3) return match3[1]
    
    // Pattern 4: /uc?id=FILE_ID or /uc?export=view&id=FILE_ID
    const match4 = url.match(/\/uc\?.*id=([^&]+)/)
    if (match4) return match4[1]
    
    // Pattern 5: lh3.googleusercontent.com/d/FILE_ID
    const match5 = url.match(/lh3\.googleusercontent\.com\/d\/([^=?&]+)/)
    if (match5) return match5[1]
    
    // Pattern 6: رابط مباشر للـ FILE_ID (25+ حرف/رقم)
    const match6 = url.match(/[-\w]{25,}/)
    if (match6) return match6[0]
    
    return null
  }

  // تنزيل صورة واحدة: تحميل صورة Google Drive مباشرة
  const downloadSingleImage = async (cvId: string) => {
    const cv = cvs.find(c => c.id === cvId)
    if (!cv) {
      toast.error('السيرة الذاتية غير موجودة')
      return
    }
    
    const fileName = `السيرة_الذاتية_${cv.fullName}_${cv.referenceCode}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_')
    
    setDownloadModalFileName(fileName + '.jpg')
    setDownloadModalOpen(true)
    setDownloadModalStatus('preparing')
    setDownloadModalProgress(0)
    setDownloadModalError('')
    
    try {
      // التحقق من وجود صورة من Google Drive
      if (!cv.cvImageUrl) {
        setDownloadModalStatus('error')
        setDownloadModalError('لا توجد صورة لتحميلها. يرجى إضافة رابط صورة من Google Drive أولاً.')
        toast.error('لا توجد صورة لتحميلها')
        return
      }

      setDownloadModalStatus('downloading')
      setDownloadModalProgress(10)

      console.log('🔄 بدء تحميل صورة السيرة من Google Drive:', cv.cvImageUrl)

      // استخراج File ID من Google Drive
      const fileId = extractGoogleDriveFileId(cv.cvImageUrl)
      
      if (fileId) {
        console.log('🔍 File ID:', fileId)
        
        setDownloadModalProgress(50)
        
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
        console.log('🔗 رابط التحميل:', downloadUrl)
        
        setDownloadModalProgress(70)
        
        // استخدام رابط تحميل مباشر
        try {
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = fileName + '.jpg'
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          setDownloadModalProgress(100)
          setDownloadModalStatus('success')
          toast.success('تم بدء تحميل الصورة من Google Drive')
          console.log('✅ تم بدء التحميل')
          
          // backup: استخدام iframe للتأكيد
          setTimeout(() => {
            const iframe = document.createElement('iframe')
            iframe.style.display = 'none'
            iframe.style.position = 'absolute'
            iframe.style.width = '1px'
            iframe.style.height = '1px'
            iframe.src = downloadUrl
            document.body.appendChild(iframe)
            
            setTimeout(() => {
              if (iframe.parentNode) {
                document.body.removeChild(iframe)
              }
            }, 20000)
          }, 500)
          
          CVActivityLogger.viewed(cvId, cv.fullName) // تسجيل عرض السيرة
          return
        } catch (linkError) {
          console.warn('⚠️ فشل التحميل بالرابط، استخدام iframe:', linkError)
          
          // استخدام iframe فقط
          const iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          iframe.style.position = 'absolute'
          iframe.style.width = '1px'
          iframe.style.height = '1px'
          iframe.src = downloadUrl
          document.body.appendChild(iframe)
          
          setDownloadModalProgress(100)
          setDownloadModalStatus('success')
          
          setTimeout(() => {
            if (iframe.parentNode) {
              document.body.removeChild(iframe)
            }
          }, 20000)
          
          toast.success('تم بدء تحميل الصورة من Google Drive')
          CVActivityLogger.viewed(cvId, cv.fullName)
          return
        }
      } else {
        // استخدام الرابط الأصلي
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.style.position = 'absolute'
        iframe.style.width = '1px'
        iframe.style.height = '1px'
        iframe.src = cv.cvImageUrl
        document.body.appendChild(iframe)
        
        setDownloadModalProgress(100)
        setDownloadModalStatus('success')
        
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe)
          }
        }, 15000)
        
        toast.success('تم بدء تحميل الصورة')
        CVActivityLogger.viewed(cvId, cv.fullName)
        return
      }
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الصورة:', error)
      setDownloadModalStatus('error')
      setDownloadModalError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء التحميل')
    }
  }

  // تنزيل صور المحدد (يستدعي نافذة المجمّع الجديدة)
  const downloadBulkImages = () => {
    if (selectedCvs.length === 0) {
      toast('اختر على الأقل سيرة واحدة')
      return
    }
    
    // تسجيل النشاط
    BulkActivityLogger.download(selectedCvs.length)
    
    setShowBulkDownloader(true)
  }

  // تنزيل مباشر من Google Drive
  const downloadBulkImagesDirect = async () => {
    if (selectedCvs.length === 0) {
      toast('اختر على الأقل سيرة واحدة')
      return
    }
    
    const toastId = toast.loading(`بدء تحميل ${selectedCvs.length} صورة من Google Drive...`)
    setShowDownloadBar(true)
    setDownloadProgress(0)
    
    try {
      // تحميل الصور بشكل تسلسلي
      let successCount = 0
      let failedCount = 0
      let skippedCount = 0
      
      for (let i = 0; i < selectedCvs.length; i++) {
        const cvId = selectedCvs[i]
        const cv = cvs.find(c => c.id === cvId)
        
        if (!cv) {
          failedCount++
          continue
        }
        
        try {
          // التحقق من وجود صورة من Google Drive
          if (!cv.cvImageUrl) {
            console.warn(`لا توجد صورة لـ: ${cv.fullName}`)
            skippedCount++
            toast.loading(
              `⏭️ تخطي: ${cv.fullName} (لا توجد صورة) (${i + 1}/${selectedCvs.length})`, 
              { id: toastId }
            )
            const progress = Math.round(((i + 1) / selectedCvs.length) * 100)
            setDownloadProgress(progress)
            await new Promise(r => setTimeout(r, 300))
            continue
          }

          // استخراج File ID من Google Drive
          const fileId = extractGoogleDriveFileId(cv.cvImageUrl)
          
          if (!fileId) {
            console.warn(`فشل استخراج File ID لـ: ${cv.fullName}`)
            failedCount++
            toast.loading(
              `❌ فشل: ${cv.fullName} (رابط غير صالح) (${i + 1}/${selectedCvs.length})`, 
              { id: toastId }
            )
            const progress = Math.round(((i + 1) / selectedCvs.length) * 100)
            setDownloadProgress(progress)
            await new Promise(r => setTimeout(r, 300))
            continue
          }

          // إنشاء رابط التحميل المباشر
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
          const filename = `${cv.fullName}_${cv.referenceCode || cvId}.jpg`
            .replace(/[\\/:*?"<>|]+/g, '-')
            .replace(/\s+/g, '_')

          // تحميل الصورة عبر iframe مخفي
          const iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          iframe.style.position = 'absolute'
          iframe.style.width = '1px'
          iframe.style.height = '1px'
          iframe.src = downloadUrl
          document.body.appendChild(iframe)
          
          // حذف iframe بعد فترة
          setTimeout(() => {
            if (iframe.parentNode) {
              document.body.removeChild(iframe)
            }
          }, 5000)

          successCount++
          const progress = Math.round(((i + 1) / selectedCvs.length) * 100)
          setDownloadProgress(progress)
          
          // رسالة تحديث مع اسم السيرة
          toast.loading(
            `✅ تم تحميل: ${cv.fullName} (${i + 1}/${selectedCvs.length})`, 
            { id: toastId }
          )

          // مهلة قصيرة للسماح للمتصفح ببدء التحميل التالي
          await new Promise(r => setTimeout(r, 1200))
        } catch (error) {
          console.error(`Error downloading CV ${cvId}:`, error)
          failedCount++
          toast.loading(
            `❌ خطأ: ${cv?.fullName || 'سيرة ذاتية'} (${i + 1}/${selectedCvs.length})`, 
            { id: toastId }
          )
          await new Promise(r => setTimeout(r, 500))
        }
      }
      
      // رسالة النتيجة النهائية
      if (successCount === selectedCvs.length) {
        toast.success(
          `🎉 تم تحميل جميع الصور بنجاح من Google Drive!\n✅ نجح: ${successCount}`, 
          { id: toastId, duration: 4000 }
        )
      } else if (successCount > 0) {
        toast.success(
          `تم تحميل ${successCount} من ${selectedCvs.length} صورة\n${skippedCount > 0 ? `⏭️ تخطي: ${skippedCount} | ` : ''}${failedCount > 0 ? `❌ فشل: ${failedCount}` : ''}`, 
          { id: toastId, duration: 4000 }
        )
      } else {
        toast.error(`فشل تحميل جميع السير الذاتية`, { id: toastId })
      }

      // إخفاء شريط التحميل بعد لحظة
      setTimeout(() => {
        setShowDownloadBar(false)
        setDownloadProgress(0)
      }, 1000)
      
      // تسجيل النشاط
      if (successCount > 0) {
        BulkActivityLogger.download(successCount)
      }
      
    } catch (error) {
      console.error('Bulk download error:', error)
      toast.error('حدث خطأ أثناء التحميل الجماعي', { id: toastId })
      setShowDownloadBar(false)
      setDownloadProgress(0)
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
      {/* @ts-ignore */}
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
          {/* رسالة توضيحية للمستخدم العادي */}
          {user?.role === 'USER' && (
            <div className="card p-3 sm:p-4 mb-4 sm:mb-6 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-primary/10 rounded-lg p-1.5 sm:p-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-primary mb-0.5 sm:mb-1">مرحباً بك كمستخدم عادي</h3>
                  <p className="text-muted-foreground text-[10px] sm:text-xs">يمكنك مشاهدة وتحميل السير الذاتية فقط. للحصول على صلاحيات إضافية، تواصل مع المدير.</p>
                </div>
              </div>
            </div>
          )}

          {/* بنر التحديد الجماعي */}
          {selectedCvs.length > 0 && (
            <div className="card p-3 sm:p-6 mb-4 sm:mb-6 bg-primary/5 border-primary/20">
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
                    onClick={downloadBulkImagesDirect}
                    className="btn btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 flex-1 sm:flex-initial"
                    title="تحميل PNG لكل سيرة من المحدد"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 inline" />
                    <span className="hidden xs:inline">تحميل PNG</span> ({selectedCvs.length})
                  </button>
                  {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
                    <button
                      onClick={handleBulkDelete}
                      className="btn btn-destructive text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 inline" />
                      <span className="hidden xs:inline">حذف</span>
                    </button>
                  )}
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
                  className="flex-1 min-w-[160px] px-4 py-2.5 bg-muted border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
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
                  className="flex-1 min-w-[160px] px-4 py-2.5 bg-success/10 border border-success/30 rounded-lg text-sm font-medium text-success hover:bg-success/20 focus:outline-none focus:ring-2 focus:ring-success transition-all"
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
                  className="flex-1 min-w-[160px] px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                >
                  <option value="ALL">جميع الأعمار</option>
                  <option value="18-25">18-25 سنة</option>
                  <option value="26-35">26-35 سنة</option>
                  <option value="36-45">36-45 سنة</option>
                  <option value="46+">46+ سنة</option>
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
                      <option value="ALL">جميع المهارات</option>
                      <option value="babySitting">رعاية أطفال</option>
                      <option value="childrenCare">عناية بالأطفال</option>
                      <option value="cleaning">تنظيف</option>
                      <option value="washing">غسيل</option>
                      <option value="ironing">كي</option>
                      <option value="arabicCooking">طبخ عربي</option>
                      <option value="sewing">خياطة</option>
                      <option value="driving">قيادة</option>
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
                      <option value="ALL">الكل</option>
                      <option value="SINGLE">أعزب/عزباء</option>
                      <option value="MARRIED">متزوج/متزوجة</option>
                      <option value="DIVORCED">مطلق/مطلقة</option>
                      <option value="WIDOWED">أرمل/أرملة</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-success mb-2">
                      <Globe className="h-4 w-4 ml-2" /> مستوى اللغة
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-success"
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                    >
                      <option value="ALL">جميع المستويات</option>
                      <option value="EXCELLENT">ممتاز</option>
                      <option value="GOOD">جيد</option>
                      <option value="FAIR">متوسط</option>
                      <option value="POOR">ضعيف</option>
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
                      <option value="ALL">جميع المستويات</option>
                      <option value="0-1">أقل من سنة</option>
                      <option value="1-3">1-3 سنوات</option>
                      <option value="3-5">3-5 سنوات</option>
                      <option value="5+">أكثر من 5 سنوات</option>
                    </select>
                  </div>
                </div>

                {/* صف إضافي للفلاتر الجديدة */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-success mb-2">
                      <Star className="h-4 w-4 ml-2" /> الديانة
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-success"
                      value={religionFilter}
                      onChange={(e) => setReligionFilter(e.target.value)}
                    >
                      <option value="ALL">جميع الديانات</option>
                      <option value="مسلم">مسلم</option>
                      <option value="مسيحي">مسيحي</option>
                      <option value="هندوسي">هندوسي</option>
                      <option value="بوذي">بوذي</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-primary mb-2">
                      <BookOpen className="h-4 w-4 ml-2" /> المستوى التعليمي
                    </label>
                    <select
                      className="form-input w-full rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary"
                      value={educationFilter}
                      onChange={(e) => setEducationFilter(e.target.value)}
                    >
                      <option value="ALL">جميع المستويات</option>
                      <option value="ابتدائي">ابتدائي</option>
                      <option value="متوسط">متوسط</option>
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
                      <option value="ALL">جميع الرواتب</option>
                      <option value="LOW">أقل من 1000</option>
                      <option value="MEDIUM">1000 - 2000</option>
                      <option value="HIGH">أكثر من 2000</option>
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
                      <option value="ALL">جميع المدد</option>
                      <option value="سنة">سنة واحدة</option>
                      <option value="سنتان">سنتان</option>
                      <option value="ثلاث سنوات">ثلاث سنوات</option>
                      <option value="مفتوح">مفتوح</option>
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
                      <option value="ALL">جميع الحالات</option>
                      <option value="VALID">ساري المفعول</option>
                      <option value="EXPIRED">منتهي الصلاحية</option>
                      <option value="MISSING">غير متوفر</option>
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
                      <option value="ALL">جميع الأطوال</option>
                      <option value="SHORT">قصير (أقل من 160)</option>
                      <option value="MEDIUM">متوسط (160-170)</option>
                      <option value="TALL">طويل (أكثر من 170)</option>
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
                      <option value="ALL">جميع الأوزان</option>
                      <option value="LIGHT">خفيف (أقل من 60)</option>
                      <option value="MEDIUM">متوسط (60-80)</option>
                      <option value="HEAVY">ثقيل (أكثر من 80)</option>
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
                      <option value="ALL">الكل</option>
                      <option value="NONE">بدون أطفال</option>
                      <option value="FEW">1-2 أطفال</option>
                      <option value="MANY">أكثر من 2</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => {
                      setStatusFilter('ALL')
                      setNationalityFilter('ALL')
                      setSkillFilter('ALL')
                      setMaritalStatusFilter('ALL')
                      setAgeFilter('ALL')
                      setExperienceFilter('ALL')
                      setLanguageFilter('ALL')
                      setReligionFilter('ALL')
                      setEducationFilter('ALL')
                      setSalaryFilter('ALL')
                      setContractPeriodFilter('ALL')
                      setPassportStatusFilter('ALL')
                      setHeightFilter('ALL')
                      setWeightFilter('ALL')
                      setChildrenFilter('ALL')
                      setLocationFilter('ALL')
                      setSearchTerm('')
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-full text-sm font-medium hover:from-red-500 hover:to-pink-500"
                  >
                    مسح جميع الفلاتر
                  </button>
                </div>
              </div>
            </div>
          </div>

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
            <div className="overflow-x-auto" 
                 style={{
                   scrollbarWidth: 'thin',
                   scrollbarColor: '#d1d5db #f3f4f6'
                 }}>
              <style jsx>{`
                div::-webkit-scrollbar {
                  height: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: #f3f4f6;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #d1d5db;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #9ca3af;
                }
              `}</style>
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
                          {cv.profileImage ? (
                            <img 
                              className="h-10 w-10 rounded-full object-cover flex-shrink-0" 
                              src={processImageUrl(cv.profileImage)} 
                              alt={cv.fullName}
                              onError={(e) => {
                                // إذا فشل تحميل الصورة، استبدلها بأيقونة افتراضية
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-primary-foreground" />
                            </div>
                          )}
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
                              onClick={() => setSelectedVideo(cv.videoLink || null)}
                              className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg"
                              title="مشاهدة الفيديو"
                            >
                              <Play className="h-5 w-5" />
                            </button>
                          )}
                          {cv.status === CVStatus.NEW && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'CUSTOMER_SERVICE') && (
                          <>
                            <button
                              onClick={() => openBookingModal(cv)}
                              className="p-2 text-warning hover:text-warning/80 hover:bg-warning/10 rounded-lg"
                              title="حجز"
                            >
                              <Bookmark className="h-5 w-5" />
                            </button>
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
                    {cv.profileImage ? (
                      <img 
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0" 
                        src={processImageUrl(cv.profileImage)} 
                        alt={cv.fullName}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
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

                  {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
                    <>
                      <button
                        onClick={() => router.push(`/dashboard/cv/${cv.id}`)}
                        className="flex-1 p-2 text-primary hover:bg-primary/10 rounded-lg text-xs flex items-center justify-center gap-1"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        تعديل
                      </button>
                      
                      {cv.status === CVStatus.NEW && (
                        <button
                          onClick={() => openBookingModal(cv)}
                          className="flex-1 p-2 text-warning hover:bg-warning/10 rounded-lg text-xs flex items-center justify-center gap-1"
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                          حجز
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

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
                      ) : (
                        <Download className="h-7 w-7" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">
                        {bulkOperationType === 'delete' ? 'حذف السير المحددة' : 
                         bulkOperationType === 'status' ? 'تغيير الحالة' : 'تحميل الصور'}
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
                                  : 'تأكيد العملية'
                                }
                              </h4>
                              <p className="text-foreground mb-2">
                                {bulkOperationType === 'delete' 
                                  ? `سيتم حذف ${selectedCvs.length} سيرة ذاتية نهائياً من النظام`
                                  : `سيتم تطبيق العملية على ${selectedCvs.length} سيرة ذاتية`
                                }
                              </p>
                              <p className="text-muted-foreground text-sm">
                                ⚠️ هذا الإجراء لا يمكن التراجع عنه
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
                <li>• تحويل حالة السيرة إلى "محجوز"</li>
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
                />
              ) : selectedVideo.includes('drive.google.com') ? (
                <iframe
                  src={(() => {
                    // تحويل رابط Google Drive إلى embed
                    // مثال: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
                    // إلى: https://drive.google.com/file/d/FILE_ID/preview
                    const fileIdMatch = selectedVideo.match(/\/file\/d\/([^\/]+)/)
                    if (fileIdMatch && fileIdMatch[1]) {
                      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
                    }
                    // إذا كان الرابط بصيغة أخرى، حاول استخدامه كما هو
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
              {viewingCv.cvImageUrl ? (
                <img
                  src={`https://images.weserv.nl/?url=${encodeURIComponent(`https://drive.google.com/uc?export=view&id=${viewingCv.cvImageUrl.match(/[-\w]{25,}/)?.[0] || ''}`)}&w=2000&output=webp`}
                  alt={viewingCv.fullName}
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = viewingCv.cvImageUrl || ''
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
                  window.open(`/cv/${viewingCv.id}`, '_blank')
                }}
                className="flex-1 btn btn-secondary text-sm py-2"
              >
                <ExternalLink className="h-4 w-4 ml-2 inline" />
                فتح في صفحة جديدة
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
    </>
  )
}
