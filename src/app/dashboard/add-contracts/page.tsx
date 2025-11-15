'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useDebounce } from 'use-debounce'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  FileText, 
  Search, 
  Plus,
  X,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  Users,
  MessageSquare,
  Send,
  FileWarning
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ar } from 'date-fns/locale'

// قائمة المكاتب
const OFFICES = [
  'إثيوبيا (دوكا)',
  'إثيوبيا (NADYA)',
  'سريلانكا (NTW)',
  'سريلانكا (زهران)',
  'بنجلاديش (مدر لاند)',
  'كينيا (O.S)',
  'كينيا (Blue.Line)',
  'كينيا (AMANI)',
  'الهند (عمران)',
  'أوغندا (EBENEZER)',
  'بنجلاديش (MTC)',
  'الهند (الودود)',
  'سيرلانكا (ديشياني)',
  'الفلبين (دم دم)',
  'الهند (جميل)',
  'أوغندا (Keria)',
  'بوروندي (JLA)',
  'بوروندي (ALPHA)'
]

// حالات العقد
const CONTRACT_STATUSES = {
  CV_REQUEST: 'طلب رفع سيرة',
  EXTERNAL_OFFICE_APPROVAL: 'موافقة مكتب الإرسال الخارجي',
  FOREIGN_MINISTRY_APPROVAL: 'موافقة وزارة العمل الأجنبية',
  VISA_ISSUED: 'تم إصدار التأشيرة',
  EMBASSY_SENT: 'تم الإرسال للسفارة السعودية',
  EMBASSY_APPROVAL: 'وصل للمملكة العربية السعودية',
  TICKET_DATE_NOTIFIED: 'تم التبليغ بموعد التذكرة',
  REJECTED: 'مرفوض',
  CANCELLED: 'ملغي',
  OUTSIDE_KINGDOM: 'خارج المملكة'
}

interface Contract {
  id: number
  contractType: string
  salesRepName: string
  clientName: string
  contractNumber: string
  passportNumber?: string
  supportMobileNumber?: string
  salesMobileNumber?: string
  currentMonth: number
  currentDate: string
  countryName: string
  profession: string
  employerIdNumber: string
  workerPassportNumber: string
  office: string
  status: keyof typeof CONTRACT_STATUSES
  lastStatusUpdate: string
  cvUploadRequestDate?: string
  employmentRequestDate?: string
  followUpNotes?: string
  followUpNotesHistory?: Array<{
    id: number
    note: string
    createdAt: string
    createdBy: {
      id: number
      name: string
      role: string
    }
  }>
  hasCVIssue: boolean
  cvIssueType?: string
  createdAt: string
  updatedAt: string
  statusChanges?: any[]
  createdBy?: {
    id: number
    name: string
    role: string
  }
  cvId?: number
}

interface SalesRep {
  id: number
  name: string
}

interface CVData {
  id: number
  fullName: string
  fullNameArabic?: string
  nationality?: string
  position?: string
  passportNumber?: string
  age?: number
  profileImage?: string
  cvImageUrl?: string
  status: string
  contractStatus?: string
}

function AddContractsPageContent({ userData }: { userData: any }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(userData)

  // Update user when userData changes
  useEffect(() => {
    if (userData) {
      setUser(userData)
    }
  }, [userData])

  // معالجة الفلاتر من URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const filter = searchParams.get('filter')
    
    if (filter === 'issues') {
      setIssueFilter('has_issue')
    } else if (filter === 'stale') {
      setIssueFilter('stale_40')
    }
  }, [])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300) // تأخير 300ms للبحث
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [salesRepFilter, setSalesRepFilter] = useState<string>('')
  const [officeFilter, setOfficeFilter] = useState<string>('')
  const [creatorFilter, setCreatorFilter] = useState<string>('')
  const [issueFilter, setIssueFilter] = useState<string>('')
  const [dateFromFilter, setDateFromFilter] = useState<string>('')
  const [dateToFilter, setDateToFilter] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddSalesRepModal, setShowAddSalesRepModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newSalesRepName, setNewSalesRepName] = useState('')
  const [selectedCV, setSelectedCV] = useState<CVData | null>(null)
  const [isSearchingCV, setIsSearchingCV] = useState(false)
  const [cvSearchMessage, setCvSearchMessage] = useState('')
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false)
  const [selectedContractForHistory, setSelectedContractForHistory] = useState<Contract | null>(null)
  const [showStatusEditModal, setShowStatusEditModal] = useState(false)
  const [selectedContractForStatusEdit, setSelectedContractForStatusEdit] = useState<Contract | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false)
  const [selectedContractForView, setSelectedContractForView] = useState<Contract | null>(null)
  const [newFollowUpNote, setNewFollowUpNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  
  // قوائم فريدة للفلاتر - محسّنة بـ useMemo
  const uniqueSalesReps = useMemo(() => 
    Array.from(new Set(contracts.map(c => c.salesRepName).filter(Boolean))).sort(),
    [contracts]
  )
  const uniqueOffices = useMemo(() => 
    Array.from(new Set(contracts.map(c => c.office).filter(Boolean))).sort(),
    [contracts]
  )
  const uniqueCreators = useMemo(() => 
    Array.from(new Set(contracts.map(c => c.createdBy?.name).filter(Boolean))).sort(),
    [contracts]
  )

  // بيانات النموذج
  const [formData, setFormData] = useState({
    contractType: 'SPECIFIC',
    salesRepName: '',
    clientName: '',
    contractNumber: '',
    supportMobileNumber: '',
    salesMobileNumber: '',
    currentMonth: new Date().getMonth() + 1,
    currentDate: new Date().toISOString().split('T')[0],
    countryName: '',
    profession: '',
    employerIdNumber: '',
    workerPassportNumber: '',
    office: '',
    status: 'CV_REQUEST' as keyof typeof CONTRACT_STATUSES,
    cvUploadRequestDate: '',
    employmentRequestDate: '',
    followUpNotes: '',
    hasCVIssue: false,
    cvIssueType: ''
  })

  // جلب البيانات - محسّنة بـ useCallback
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const [contractsRes, salesRepsRes] = await Promise.all([
        fetch('/api/new-contracts'),
        fetch('/api/sales-representatives')
      ])

      if (contractsRes.ok) {
        const contractsData = await contractsRes.json()
        setContracts(contractsData)
        setFilteredContracts(contractsData)
        
        // تحديث العقد المعروض في المودال إذا كان مفتوحاً
        if (selectedContractForView) {
          const updatedContract = contractsData.find((c: Contract) => c.id === selectedContractForView.id)
          if (updatedContract) {
            setSelectedContractForView(updatedContract)
          }
        }
      }

      if (salesRepsRes.ok) {
        const salesRepsData = await salesRepsRes.json()
        setSalesReps(salesRepsData)
      }
    } catch (error) {
      console.error('❌ خطأ في جلب البيانات:', error)
      toast.error('حدث خطأ أثناء جلب البيانات')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [selectedContractForView])

  useEffect(() => {
    fetchData()
  }, [])

  // فلترة العقود - محسّنة بـ debouncing
  useEffect(() => {
    let filtered = contracts

    // فلتر البحث - بحث شامل في جميع البيانات (مع debouncing)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(contract =>
        contract.contractNumber.toLowerCase().includes(term) ||
        contract.clientName.toLowerCase().includes(term) ||
        contract.salesRepName.toLowerCase().includes(term) ||
        contract.workerPassportNumber.toLowerCase().includes(term) ||
        (contract.passportNumber && contract.passportNumber.toLowerCase().includes(term)) ||
        contract.employerIdNumber.toLowerCase().includes(term) ||
        contract.profession.toLowerCase().includes(term) ||
        contract.countryName.toLowerCase().includes(term) ||
        contract.office.toLowerCase().includes(term) ||
        CONTRACT_STATUSES[contract.status].toLowerCase().includes(term) ||
        (contract.cvIssueType && contract.cvIssueType.toLowerCase().includes(term)) ||
        (contract.followUpNotes && contract.followUpNotes.toLowerCase().includes(term)) ||
        (contract.supportMobileNumber && contract.supportMobileNumber.includes(term)) ||
        (contract.salesMobileNumber && contract.salesMobileNumber.includes(term)) ||
        (contract.createdBy?.name && contract.createdBy.name.toLowerCase().includes(term)) ||
        (contract.contractType === 'SPECIFIC' ? 'معين' : 'حسب المواصفات').includes(term)
      )
    }

    // فلتر الحالة
    if (statusFilter) {
      filtered = filtered.filter(contract => contract.status === statusFilter)
    }

    // فلتر ممثل المبيعات
    if (salesRepFilter) {
      filtered = filtered.filter(contract => contract.salesRepName === salesRepFilter)
    }

    // فلتر المكتب
    if (officeFilter) {
      filtered = filtered.filter(contract => contract.office === officeFilter)
    }

    // فلتر الموظف المنشئ
    if (creatorFilter) {
      filtered = filtered.filter(contract => contract.createdBy?.name === creatorFilter)
    }

    // فلتر المشاكل
    if (issueFilter === 'has-issue' || issueFilter === 'has_issue') {
      filtered = filtered.filter(contract => contract.hasCVIssue)
    } else if (issueFilter === 'no-issue') {
      filtered = filtered.filter(contract => !contract.hasCVIssue)
    } else if (issueFilter === 'stale_40') {
      // فلتر العقود المتأخرة 40 يوم أو أكثر
      filtered = filtered.filter(contract => {
        const daysSinceUpdate = Math.floor(
          (new Date().getTime() - new Date(contract.lastStatusUpdate).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceUpdate >= 40
      })
    }

    // فلتر التاريخ (من - إلى)
    if (dateFromFilter || dateToFilter) {
      filtered = filtered.filter(contract => {
        const contractDate = new Date(contract.createdAt)
        contractDate.setHours(0, 0, 0, 0) // إزالة الوقت للمقارنة بالتاريخ فقط
        
        if (dateFromFilter && dateToFilter) {
          const fromDate = new Date(dateFromFilter)
          fromDate.setHours(0, 0, 0, 0)
          const toDate = new Date(dateToFilter)
          toDate.setHours(23, 59, 59, 999)
          return contractDate >= fromDate && contractDate <= toDate
        } else if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter)
          fromDate.setHours(0, 0, 0, 0)
          return contractDate >= fromDate
        } else if (dateToFilter) {
          const toDate = new Date(dateToFilter)
          toDate.setHours(23, 59, 59, 999)
          return contractDate <= toDate
        }
        return true
      })
    }

    setFilteredContracts(filtered)
  }, [debouncedSearchTerm, statusFilter, salesRepFilter, officeFilter, creatorFilter, issueFilter, dateFromFilter, dateToFilter, contracts])

  // البحث عن السيرة الذاتية برقم الجواز - محسّنة بـ useCallback
  const searchCVByPassport = useCallback(async (passportNumber: string) => {
    if (!passportNumber || passportNumber.trim() === '') {
      setSelectedCV(null)
      setCvSearchMessage('')
      return
    }

    setIsSearchingCV(true)
    setCvSearchMessage('')

    try {
      const response = await fetch(`/api/cv/search-by-passport?passportNumber=${encodeURIComponent(passportNumber.trim())}`)
      const data = await response.json()

      if (response.ok && data.found) {
        setSelectedCV(data.cv)
        if (data.contractStatus) {
          setCvSearchMessage(`⚠️ تنبيه: هذه السيرة ${data.contractStatus}`)
        } else {
          setCvSearchMessage('✅ تم العثور على السيرة الذاتية')
        }
        
        // تعبئة بعض البيانات تلقائياً
        setFormData(prev => ({
          ...prev,
          clientName: prev.clientName || data.cv.fullName || '',
          profession: prev.profession || data.cv.position || '',
          countryName: prev.countryName || data.cv.nationality || ''
        }))
      } else {
        setSelectedCV(null)
        setCvSearchMessage('⚠️ لا توجد سيرة ذاتية بهذا الرقم')
      }
    } catch (error) {
      console.error('❌ خطأ في البحث:', error)
      setSelectedCV(null)
      setCvSearchMessage('❌ حدث خطأ أثناء البحث')
    } finally {
      setIsSearchingCV(false)
    }
  }, [user])

  // حساب عدد الأيام - محسّنة بـ useCallback
  const calculateDays = useCallback((date: string) => {
    return differenceInDays(new Date(), new Date(date))
  }, [])

  // تنسيق التاريخ - محسّنة بـ useCallback
  const formatDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar })
    } catch {
      return 'غير محدد'
    }
  }, [])

  // إضافة ملاحظة متابعة جديدة - محسّنة بـ useCallback
  const handleAddFollowUpNote = useCallback(async (contractId: number) => {
    if (!newFollowUpNote.trim()) {
      toast.error('الرجاء كتابة الملاحظة')
      return
    }

    setIsAddingNote(true)
    try {
      const response = await fetch(`/api/new-contracts/${contractId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newFollowUpNote.trim(),
          userId: user?.id || 1
        })
      })

      if (response.ok) {
        const noteData = await response.json()
        toast.success('✅ تم إضافة الملاحظة بنجاح')
        
        // تحديث المودال مباشرة بالملاحظة الجديدة
        if (selectedContractForView) {
          setSelectedContractForView({
            ...selectedContractForView,
            followUpNotesHistory: [noteData.note, ...(selectedContractForView.followUpNotesHistory || [])]
          })
        }
        
        setNewFollowUpNote('')
        
        // تحديث البيانات في الخلفية
        fetchData(false)
        
        // التمرير للملاحظة الجديدة بعد تحديث الواجهة
        setTimeout(() => {
          const latestNote = document.getElementById('latest-note')
          if (latestNote) {
            latestNote.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            // تأثير بصري للملاحظة الجديدة
            latestNote.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
            setTimeout(() => {
              latestNote.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
            }, 2000)
          }
        }, 100)
      } else {
        toast.error('❌ فشل إضافة الملاحظة')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('❌ حدث خطأ أثناء إضافة الملاحظة')
    } finally {
      setIsAddingNote(false)
    }
  }, [newFollowUpNote, selectedContractForView, user, fetchData, formatDate])

  // إضافة عقد جديد
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // إنشاء العقد الجديد
      const response = await fetch('/api/new-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cvId: selectedCV?.id || null,
          createdById: user?.id || 1
        })
      })

      if (response.ok) {
        toast.success('✅ تم إضافة العقد بنجاح')
        
        // إذا كانت السيرة مرتبطة
        if (selectedCV?.id) {
          try {
            // 1. تحديث حالة السيرة إلى HIRED
            await fetch(`/api/cvs/${selectedCV.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'HIRED',
                updatedById: user?.id || 1
              })
            })
            
            // 2. إنشاء عقد في النظام القديم
            await fetch('/api/contracts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cvId: selectedCV.id,
                identityNumber: formData.employerIdNumber,
                contractStartDate: formData.currentDate,
                createdById: user?.id || 1
              })
            })
            
            toast.success('✅ تم تحديث حالة السيرة وإنشاء العقد في النظام')
          } catch (error) {
            console.error('❌ خطأ في تحديث حالة السيرة:', error)
            toast.error('تم إنشاء العقد لكن حدث خطأ في تحديث السيرة')
          }
        }
        
        setShowAddModal(false)
        resetForm()
        setSelectedCV(null)
        setCvSearchMessage('')
        fetchData(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ أثناء إضافة العقد')
      }
    } catch (error) {
      console.error('❌ خطأ:', error)
      toast.error('حدث خطأ أثناء إضافة العقد')
    } finally {
      setIsSubmitting(false)
    }
  }

  // تحديث عقد
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedContract) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/new-contracts?id=${selectedContract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          changedById: user?.id || 1
        })
      })

      if (response.ok) {
        toast.success('✅ تم تحديث العقد بنجاح')
        
        // إذا كانت السيرة مرتبطة وتم تغيير الحالة
        if (selectedContract.cvId) {
          try {
            // 1. تحديث حالة السيرة إلى HIRED
            await fetch(`/api/cvs/${selectedContract.cvId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'HIRED',
                updatedById: user?.id || 1
              })
            })
            
            // 2. التحقق من وجود عقد في النظام القديم، وإنشاؤه إذا لم يكن موجوداً
            const contractsResponse = await fetch('/api/contracts')
            const existingContracts = await contractsResponse.json()
            const hasOldContract = existingContracts.some((c: any) => c.cvId === selectedContract.cvId)
            
            if (!hasOldContract && formData.employerIdNumber) {
              await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cvId: selectedContract.cvId,
                  identityNumber: formData.employerIdNumber,
                  contractStartDate: formData.currentDate,
                  createdById: user?.id || 1
                })
              })
            }
            
            toast.success('✅ تم تحديث السيرة والعقد في النظام')
          } catch (error) {
            console.error('❌ خطأ في تحديث حالة السيرة:', error)
          }
        }
        
        setShowEditModal(false)
        setSelectedContract(null)
        resetForm()
        fetchData(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ أثناء تحديث العقد')
      }
    } catch (error) {
      console.error('❌ خطأ:', error)
      toast.error('حدث خطأ أثناء تحديث العقد')
    } finally {
      setIsSubmitting(false)
    }
  }

  // حذف عقد
  const handleDelete = async () => {
    if (!selectedContract) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/new-contracts?id=${selectedContract.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('تم حذف العقد بنجاح')
        setShowDeleteModal(false)
        setSelectedContract(null)
        fetchData(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ أثناء حذف العقد')
      }
    } catch (error) {
      console.error('❌ خطأ:', error)
      toast.error('حدث خطأ أثناء حذف العقد')
    } finally {
      setIsSubmitting(false)
    }
  }

  // إضافة ممثل مبيعات جديد
  const handleAddSalesRep = async () => {
    if (!newSalesRepName.trim()) {
      toast.error('يرجى إدخال اسم ممثل المبيعات')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/sales-representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSalesRepName })
      })

      if (response.ok) {
        toast.success('تم إضافة ممثل المبيعات بنجاح')
        setShowAddSalesRepModal(false)
        setNewSalesRepName('')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ أثناء إضافة ممثل المبيعات')
      }
    } catch (error) {
      console.error('❌ خطأ:', error)
      toast.error('حدث خطأ أثناء إضافة ممثل المبيعات')
    } finally {
      setIsSubmitting(false)
    }
  }

  // حذف ممثل مبيعات
  const handleDeleteSalesRep = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف ممثل المبيعات؟')) return

    try {
      const response = await fetch(`/api/sales-representatives?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('تم حذف ممثل المبيعات بنجاح')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ أثناء حذف ممثل المبيعات')
      }
    } catch (error) {
      console.error('❌ خطأ:', error)
      toast.error('حدث خطأ أثناء حذف ممثل المبيعات')
    }
  }

  // فتح مودال تفاصيل الحالات
  const openStatusHistoryModal = (contract: Contract) => {
    setSelectedContractForHistory(contract)
    setShowStatusHistoryModal(true)
  }

  // فتح مودال تعديل الحالة
  const openStatusEditModal = (contract: Contract) => {
    setSelectedContractForStatusEdit(contract)
    setNewStatus(contract.status)
    setShowStatusEditModal(true)
  }

  // تعديل الحالة
  const handleStatusUpdate = async () => {
    if (!selectedContractForStatusEdit || !newStatus) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/new-contracts?id=${selectedContractForStatusEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          changedById: user?.id || 1
        })
      })

      if (response.ok) {
        toast.success('✅ تم تحديث حالة العقد بنجاح')
        setShowStatusEditModal(false)
        setSelectedContractForStatusEdit(null)
        fetchData(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ أثناء تحديث الحالة')
      }
    } catch (error) {
      console.error('❌ خطأ:', error)
      toast.error('حدث خطأ أثناء تحديث الحالة')
    } finally {
      setIsSubmitting(false)
    }
  }

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      contractType: 'SPECIFIC',
      salesRepName: '',
      clientName: '',
      contractNumber: '',
      supportMobileNumber: '',
      salesMobileNumber: '',
      currentMonth: new Date().getMonth() + 1,
      currentDate: new Date().toISOString().split('T')[0],
      countryName: '',
      profession: '',
      employerIdNumber: '',
      workerPassportNumber: '',
      office: '',
      status: 'CV_REQUEST',
      cvUploadRequestDate: '',
      employmentRequestDate: '',
      followUpNotes: '',
      hasCVIssue: false,
      cvIssueType: ''
    })
    setSelectedCV(null)
    setCvSearchMessage('')
  }

  // فتح مودال التعديل
  const openEditModal = (contract: Contract) => {
    setSelectedContract(contract)
    setFormData({
      contractType: contract.contractType,
      salesRepName: contract.salesRepName,
      clientName: contract.clientName,
      contractNumber: contract.contractNumber,
      supportMobileNumber: contract.supportMobileNumber || '',
      salesMobileNumber: contract.salesMobileNumber || '',
      currentMonth: contract.currentMonth,
      currentDate: contract.currentDate.split('T')[0],
      countryName: contract.countryName,
      profession: contract.profession,
      employerIdNumber: contract.employerIdNumber,
      workerPassportNumber: contract.workerPassportNumber,
      office: contract.office,
      status: contract.status,
      cvUploadRequestDate: contract.cvUploadRequestDate ? contract.cvUploadRequestDate.split('T')[0] : '',
      employmentRequestDate: contract.employmentRequestDate ? contract.employmentRequestDate.split('T')[0] : '',
      followUpNotes: contract.followUpNotes || '',
      hasCVIssue: contract.hasCVIssue,
      cvIssueType: contract.cvIssueType || ''
    })
    setShowEditModal(true)
  }

  // رمز الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CV_REQUEST':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'EXTERNAL_OFFICE_APPROVAL':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'FOREIGN_MINISTRY_APPROVAL':
        return <CheckCircle className="h-4 w-4 text-indigo-500" />
      case 'VISA_ISSUED':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      case 'EMBASSY_SENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'EMBASSY_APPROVAL':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-destructive" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      case 'OUTSIDE_KINGDOM':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  // مكون Shimmer Skeleton
  const ShimmerSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer"></div>
          <div className="space-y-2">
            <div className="h-7 w-40 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer"></div>
            <div className="h-4 w-56 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer"></div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-36 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-lg shimmer"></div>
          <div className="h-10 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer"></div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-card p-6 rounded-lg border border-border space-y-4">
        <div className="h-5 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer"></div>
        <div className="h-12 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-11 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-11 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer"></div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b-2 border-primary/20 p-4">
          <div className="grid grid-cols-12 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer"></div>
            ))}
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-border/50">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div key={row} className="p-4">
              <div className="grid grid-cols-12 gap-3 items-center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((col) => (
                  <div key={col} className="h-6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        {() => <ShimmerSkeleton />}
      </DashboardLayout>
    )
  }

  return (
          <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary ml-2 sm:ml-3" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">إضافة العقود</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">إدارة ومتابعة العقود الجديدة</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={() => router.push('/dashboard/add-contract')}
                  className="bg-primary hover:opacity-90 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg flex items-center gap-1 sm:gap-2 transition-all shadow-lg text-sm sm:text-base flex-1 sm:flex-initial justify-center"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">إضافة عقد جديد</span>
                  <span className="sm:hidden">إضافة</span>
                </button>
                <div className="bg-primary/10 px-3 sm:px-4 py-2 rounded-lg">
                  <span className="text-primary font-semibold text-sm sm:text-base">
                    {filteredContracts.length} عقد
                  </span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card p-3 sm:p-6 rounded-lg border border-border space-y-3 sm:space-y-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">الفلاتر والبحث</h3>
                {(searchTerm || statusFilter || salesRepFilter || officeFilter || creatorFilter || issueFilter || dateFromFilter || dateToFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('')
                      setSalesRepFilter('')
                      setOfficeFilter('')
                      setCreatorFilter('')
                      setIssueFilter('')
                      setDateFromFilter('')
                      setDateToFilter('')
                    }}
                    className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    مسح الفلاتر
                  </button>
                )}
              </div>
              
              {/* البحث الشامل */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5 pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="بحث شامل: رقم العقد، العميل، الجواز، الهوية، المهنة، الدولة، المكتب، الحالة، الملاحظات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-12 py-3 bg-gradient-to-r from-primary/5 to-transparent border-2 border-primary/30 rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                {/* مؤشر البحث */}
                {searchTerm && searchTerm !== debouncedSearchTerm && (
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  </div>
                )}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg border border-primary/20">
                  <span className="font-semibold text-primary">نتائج البحث:</span>
                  <span>{filteredContracts.length} عقد من أصل {contracts.length}</span>
                </div>
              )}

              {/* رسالة توضيحية للفلتر */}
              {issueFilter === 'has_issue' && (
                <div className="flex items-center justify-between gap-2 text-xs bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/30">
                  <div className="flex items-center gap-2">
                    <FileWarning className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold text-orange-600">عرض العقود التي بها مشاكل فقط</span>
                    <span className="text-muted-foreground">({filteredContracts.length} عقد)</span>
                  </div>
                  <button
                    onClick={() => setIssueFilter('')}
                    className="text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    إلغاء الفلتر ✕
                  </button>
                </div>
              )}
              {issueFilter === 'stale_40' && (
                <div className="flex items-center justify-between gap-2 text-xs bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-red-600">عرض العقود المتأخرة 40 يوم أو أكثر</span>
                    <span className="text-muted-foreground">({filteredContracts.length} عقد)</span>
                  </div>
                  <button
                    onClick={() => setIssueFilter('')}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    إلغاء الفلتر ✕
                  </button>
                </div>
              )}
              {(dateFromFilter || dateToFilter) && (
                <div className="flex items-center justify-between gap-2 text-xs bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-600">
                      📅 فلتر التاريخ: 
                      {dateFromFilter && dateToFilter ? (
                        <span> من {formatDate(dateFromFilter)} إلى {formatDate(dateToFilter)}</span>
                      ) : dateFromFilter ? (
                        <span> من {formatDate(dateFromFilter)}</span>
                      ) : (
                        <span> حتى {formatDate(dateToFilter)}</span>
                      )}
                    </span>
                    <span className="text-muted-foreground">({filteredContracts.length} عقد)</span>
                  </div>
                  <button
                    onClick={() => {
                      setDateFromFilter('')
                      setDateToFilter('')
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    إلغاء الفلتر ✕
                  </button>
                </div>
              )}

              {/* الفلاتر الأساسية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
                {/* فلتر الحالة */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">جميع الحالات</option>
                  {Object.entries(CONTRACT_STATUSES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>

                {/* فلتر ممثل المبيعات */}
                <select
                  value={salesRepFilter}
                  onChange={(e) => setSalesRepFilter(e.target.value)}
                  className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">جميع ممثلي المبيعات</option>
                  {uniqueSalesReps.map((rep) => (
                    <option key={rep} value={rep}>{rep}</option>
                  ))}
                </select>

                {/* فلتر المكتب */}
                <select
                  value={officeFilter}
                  onChange={(e) => setOfficeFilter(e.target.value)}
                  className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">جميع المكاتب</option>
                  {uniqueOffices.map((office) => (
                    <option key={office} value={office}>{office}</option>
                  ))}
                </select>

                {/* فلتر الموظف المنشئ */}
                <select
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">جميع الموظفين</option>
                  {uniqueCreators.map((creator) => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>

                {/* فلتر المشاكل */}
                <select
                  value={issueFilter}
                  onChange={(e) => setIssueFilter(e.target.value)}
                  className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">جميع العقود</option>
                  <option value="has-issue">بها مشاكل فقط</option>
                  <option value="no-issue">بدون مشاكل</option>
                  <option value="stale_40">متأخرة ≥40 يوم</option>
                </select>
              </div>

              {/* فلتر التاريخ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2">
                {/* من تاريخ */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-muted-foreground mr-1">📅 من تاريخ</label>
                    {dateFromFilter && (
                      <button
                        onClick={() => setDateFromFilter('')}
                        className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1 transition-colors"
                        title="مسح التاريخ"
                      >
                        <X className="h-3 w-3" />
                        مسح
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                {/* إلى تاريخ */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-muted-foreground mr-1">📅 إلى تاريخ</label>
                    {dateToFilter && (
                      <button
                        onClick={() => setDateToFilter('')}
                        className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1 transition-colors"
                        title="مسح التاريخ"
                      >
                        <X className="h-3 w-3" />
                        مسح
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              {/* عداد النتائج */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  عرض <span className="font-semibold text-foreground">{filteredContracts.length}</span> من أصل <span className="font-semibold text-foreground">{contracts.length}</span> عقد
                </p>
                {filteredContracts.length !== contracts.length && (
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    مفلتر
                  </span>
                )}
              </div>
            </div>
            {/* جدول العقود */}
            <div className="bg-card border border-border sm:border-2 overflow-hidden rounded-lg sm:rounded-2xl shadow-lg sm:shadow-xl">
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b-2 border-primary/20">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 sm:py-4 text-right text-xs font-extrabold text-foreground tracking-wide">رقم العقد</th>
                      <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide hidden md:table-cell">الجواز</th>
                      <th className="px-2 sm:px-4 py-3 sm:py-4 text-right text-xs font-extrabold text-foreground tracking-wide">العميل</th>
                      <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide hidden lg:table-cell">الدولة</th>
                      <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide hidden xl:table-cell">ممثل المبيعات</th>
                      <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide hidden lg:table-cell">المكتب</th>
                      <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide">الحالة</th>
                      <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide hidden md:table-cell">التاريخ</th>
                      <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide hidden sm:table-cell">الأيام</th>
                      <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide hidden xl:table-cell">المنشئ</th>
                      <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide hidden md:table-cell">تنبيه</th>
                      <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs font-extrabold text-foreground tracking-wide">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredContracts.map((contract) => {
                      const daysSinceCreation = calculateDays(contract.createdAt)
                      const daysSinceLastUpdate = calculateDays(contract.lastStatusUpdate)
                      
                      // تحديد لون الحالة
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'CV_REQUEST': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30'
                          case 'EXTERNAL_OFFICE_APPROVAL': return 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                          case 'FOREIGN_MINISTRY_APPROVAL': return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30'
                          case 'VISA_ISSUED': return 'bg-purple-500/10 text-purple-700 border-purple-500/30'
                          case 'EMBASSY_SENT': return 'bg-green-500/10 text-green-700 border-green-500/30'
                          case 'EMBASSY_APPROVAL': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                          case 'TICKET_DATE_NOTIFIED': return 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30'
                          case 'REJECTED': return 'bg-red-500/10 text-red-700 border-red-500/30'
                          case 'CANCELLED': return 'bg-gray-500/10 text-gray-700 border-gray-500/30'
                          case 'OUTSIDE_KINGDOM': return 'bg-orange-500/10 text-orange-700 border-orange-500/30'
                          default: return 'bg-muted text-muted-foreground border-border'
                        }
                      }
                      
                      return (
                        <tr key={contract.id} className="hover:bg-primary/5 transition-all duration-200 group">
                          <td className="px-2 sm:px-4 py-3 sm:py-4">
                            <div className="text-xs sm:text-sm font-bold text-primary">{contract.contractNumber}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                              {contract.contractType === 'SPECIFIC' ? 'معين' : 'مواصفات'}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-3 sm:py-4 text-center hidden md:table-cell">
                            <div className="text-xs font-mono font-bold text-foreground bg-muted/50 px-2 py-1 rounded inline-block">
                              {contract.passportNumber || contract.workerPassportNumber || '-'}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4">
                            <div className="text-xs sm:text-sm font-bold text-foreground">{contract.clientName}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {contract.profession}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-3 sm:py-4 text-center hidden lg:table-cell">
                            <div className="text-xs font-semibold text-foreground bg-primary/5 px-2 py-1 rounded-md inline-block">
                              {contract.countryName}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-3 sm:py-4 text-center hidden xl:table-cell">
                            <div className="text-xs font-semibold text-foreground">
                              {contract.salesRepName}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-3 sm:py-4 text-center hidden lg:table-cell">
                            <div className="text-xs text-muted-foreground">
                              {contract.office}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getStatusColor(contract.status)} shadow-sm`}>
                                {CONTRACT_STATUSES[contract.status]}
                              </div>
                              <button
                                onClick={() => openStatusHistoryModal(contract)}
                                className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold underline hover:no-underline transition-all"
                                title="عرض تفاصيل المراحل"
                              >
                                📋 التفاصيل
                              </button>
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-3 sm:py-4 text-center hidden md:table-cell">
                            <div className="text-xs font-semibold text-foreground">
                              {format(new Date(contract.createdAt), 'dd/MM/yy', { locale: ar })}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-3 sm:py-4 text-center hidden sm:table-cell">
                            <div className={`text-xs sm:text-sm font-extrabold px-2 py-1 rounded-lg inline-block ${
                              daysSinceCreation >= 40 ? 'bg-red-500/20 text-red-700' :
                              daysSinceCreation >= 20 ? 'bg-orange-500/20 text-orange-700' :
                              'bg-green-500/20 text-green-700'
                            }`}>
                              {daysSinceCreation}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">يوم</div>
                          </td>
                          <td className="px-2 sm:px-3 py-3 sm:py-4 text-center hidden xl:table-cell">
                            <div className="text-xs font-semibold text-foreground">
                              {contract.createdBy?.name || '-'}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-3 sm:py-4 text-center hidden md:table-cell">
                            {contract.hasCVIssue ? (
                              <div className="inline-flex items-center gap-1 text-xs text-destructive font-bold bg-destructive/10 px-2 py-1 rounded-full border border-destructive/30">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="hidden lg:inline">{contract.cvIssueType}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-xs text-success font-bold bg-success/10 px-2 py-1 rounded-full border border-success/30">
                                <CheckCircle className="h-3 w-3" />
                                <span className="hidden lg:inline">سليم</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                            <div className="flex gap-1 sm:gap-1.5 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedContractForView(contract)
                                  setShowViewDetailsModal(true)
                                }}
                                className="p-1.5 sm:p-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg transition-all hover:scale-110 shadow-sm"
                                title="عرض"
                              >
                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                              <button
                                onClick={() => openStatusEditModal(contract)}
                                className="p-1.5 sm:p-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-all hover:scale-110 shadow-sm"
                                title="تعديل الحالة"
                              >
                                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(contract)}
                                className="p-1.5 sm:p-2 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 rounded-lg transition-all hover:scale-110 shadow-sm"
                                title="تعديل"
                              >
                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedContract(contract)
                                  setShowDeleteModal(true)
                                }}
                                className="p-1.5 sm:p-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-all hover:scale-110 shadow-sm"
                                title="حذف"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredContracts.length === 0 && (
              <div className="bg-card border-2 border-dashed border-border rounded-xl p-12 text-center">
                <div className="bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {searchTerm || statusFilter ? 'لا توجد نتائج مطابقة' : 'لا توجد عقود بعد'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || statusFilter ? 'جرّب تغيير الفلاتر أو البحث بكلمات أخرى' : 'ابدأ بإضافة عقد جديد من الزر أعلاه'}
                </p>
                {!searchTerm && !statusFilter && (
                  <button
                    onClick={() => router.push('/dashboard/add-contract')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
                    <span>إضافة عقد جديد</span>
                  </button>
                )}
              </div>
            )}

            {/* مودال إضافة عقد */}
            {showAddModal && (
              <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6 sticky top-0 bg-card pb-4 border-b border-border">
                    <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Plus className="h-6 w-6 text-primary" />
                      إضافة عقد جديد
                    </h3>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* نوع العقد */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          نوع العقد <span className="text-destructive">*</span>
                        </label>
                        <select
                          value={formData.contractType}
                          onChange={(e) => setFormData({...formData, contractType: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        >
                          <option value="SPECIFIC">معين</option>
                          <option value="BY_SPECIFICATIONS">حسب المواصفات</option>
                        </select>
                      </div>

                      {/* ممثل المبيعات */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          اسم ممثل المبيعات <span className="text-destructive">*</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={formData.salesRepName}
                            onChange={(e) => setFormData({...formData, salesRepName: e.target.value})}
                            className="flex-1 px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                          >
                            <option value="">اختر ممثل المبيعات</option>
                            {salesReps.map((rep) => (
                              <option key={rep.id} value={rep.name}>{rep.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowAddSalesRepModal(true)}
                            className="px-3 py-2.5 bg-primary text-white rounded-lg hover:opacity-90 transition-all"
                            title="إضافة ممثل مبيعات جديد"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* رقم جواز العاملة - مع البحث عن السيرة */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        رقم جواز العاملة <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.workerPassportNumber}
                          onChange={(e) => {
                            setFormData({...formData, workerPassportNumber: e.target.value})
                            // البحث التلقائي
                            const value = e.target.value
                            if (value.length >= 5) {
                              searchCVByPassport(value)
                            } else {
                              setSelectedCV(null)
                              setCvSearchMessage('')
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="أدخل رقم الجواز للبحث عن السيرة"
                          required
                        />
                        {isSearchingCV && (
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <div className="spinner w-5 h-5"></div>
                          </div>
                        )}
                      </div>
                      {cvSearchMessage && (
                        <div className={`mt-2 p-3 rounded-lg ${
                          cvSearchMessage.startsWith('✅') 
                            ? 'bg-success/10 border border-success/30' 
                            : 'bg-warning/10 border border-warning/30'
                        }`}>
                          <p className={`text-sm ${
                            cvSearchMessage.startsWith('✅') ? 'text-success' : 'text-warning'
                          }`}>
                            {cvSearchMessage}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* بطاقة السيرة الذاتية */}
                    {selectedCV && (
                      <div className="bg-primary/5 border border-primary/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            السيرة الذاتية المختارة للتعاقد
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCV(null)
                              setCvSearchMessage('')
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="إلغاء الاختيار"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex gap-4">
                          <img
                            src={selectedCV.profileImage || selectedCV.cvImageUrl || '/placeholder.jpg'}
                            alt={selectedCV.fullName}
                            className="w-20 h-20 rounded-lg object-cover border border-border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'data:image/svg+xml,%3Csvg width="80" height="80" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="80" height="80" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E👤%3C/text%3E%3C/svg%3E'
                            }}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-foreground">{selectedCV.fullName}</h5>
                              <span className={`text-xs px-2 py-1 rounded ${
                                selectedCV.status === 'NEW' ? 'bg-success/20 text-success' :
                                selectedCV.status === 'HIRED' ? 'bg-primary/20 text-primary' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {selectedCV.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {selectedCV.fullNameArabic || 'لا يوجد اسم عربي'}
                            </p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                              {selectedCV.nationality && (
                                <span>🌍 {selectedCV.nationality}</span>
                              )}
                              {selectedCV.position && (
                                <span>💼 {selectedCV.position}</span>
                              )}
                              {selectedCV.age && (
                                <span>🎂 {selectedCV.age} سنة</span>
                              )}
                            </div>
                            {selectedCV.contractStatus && (
                              <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded">
                                <p className="text-xs text-warning font-medium">
                                  ⚠️ {selectedCV.contractStatus}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* اسم العميل ورقم العقد */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          اسم العميل <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.clientName}
                          onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم العقد <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.contractNumber}
                          onChange={(e) => setFormData({...formData, contractNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                    </div>

                    {/* أرقام الجوال */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم الجوال المساند
                        </label>
                        <input
                          type="text"
                          value={formData.supportMobileNumber}
                          onChange={(e) => setFormData({...formData, supportMobileNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم المبيعات
                        </label>
                        <input
                          type="text"
                          value={formData.salesMobileNumber}
                          onChange={(e) => setFormData({...formData, salesMobileNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* الشهر والتاريخ والدولة */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم الشهر الميلادي <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.currentMonth}
                          onChange={(e) => setFormData({...formData, currentMonth: parseInt(e.target.value)})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          التاريخ الحالي <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.currentDate}
                          onChange={(e) => setFormData({...formData, currentDate: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          اسم الدولة <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.countryName}
                          onChange={(e) => setFormData({...formData, countryName: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                    </div>

                    {/* المهنة والهويات */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          المهنة <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.profession}
                          onChange={(e) => setFormData({...formData, profession: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم هوية صاحب العمل <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.employerIdNumber}
                          onChange={(e) => setFormData({...formData, employerIdNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم جواز العاملة <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.workerPassportNumber}
                          onChange={(e) => setFormData({...formData, workerPassportNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                    </div>

                    {/* المكتب */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        اختيار المكتب <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={formData.office}
                        onChange={(e) => setFormData({...formData, office: e.target.value})}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        <option value="">اختر المكتب</option>
                        {OFFICES.map((office) => (
                          <option key={office} value={office}>{office}</option>
                        ))}
                      </select>
                    </div>

                    {/* الحالة */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        الحالة <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as keyof typeof CONTRACT_STATUSES})}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        {Object.entries(CONTRACT_STATUSES).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>

                    {/* تاريخ طلب رفع السيرة - يظهر عند اختيار حالة طلب رفع سيرة */}
                    {formData.status === 'CV_REQUEST' && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          تاريخ طلب رفع السيرة
                        </label>
                        <input
                          type="date"
                          value={formData.cvUploadRequestDate}
                          onChange={(e) => setFormData({...formData, cvUploadRequestDate: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}

                    {/* تاريخ طلب التوظيف - يظهر عند اختيار موافقة مكتب الإرسال */}
                    {formData.status === 'EXTERNAL_OFFICE_APPROVAL' && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          تاريخ طلب التوظيف
                        </label>
                        <input
                          type="date"
                          value={formData.employmentRequestDate}
                          onChange={(e) => setFormData({...formData, employmentRequestDate: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}

                    {/* ملاحظات المتابعة */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ملاحظات المتابعة
                      </label>
                      <textarea
                        value={formData.followUpNotes}
                        onChange={(e) => setFormData({...formData, followUpNotes: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </div>

                    {/* مشكلة في السيرة */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="hasCVIssue"
                          checked={formData.hasCVIssue}
                          onChange={(e) => setFormData({...formData, hasCVIssue: e.target.checked})}
                          className="w-5 h-5 text-primary bg-input border-border rounded focus:ring-2 focus:ring-ring"
                        />
                        <label htmlFor="hasCVIssue" className="text-sm font-medium text-foreground">
                          يوجد مشكلة في السيرة الذاتية (تبديل أو توثيق)
                        </label>
                      </div>

                      {formData.hasCVIssue && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              نوع المشكلة (اختياري)
                            </label>
                            <select
                              value={['تبديل', 'توثيق', 'تبديل وتوثيق', ''].includes(formData.cvIssueType) ? formData.cvIssueType : ''}
                              onChange={(e) => setFormData({...formData, cvIssueType: e.target.value})}
                              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">اختر من القائمة</option>
                              <option value="تبديل">تبديل</option>
                              <option value="توثيق">توثيق</option>
                              <option value="تبديل وتوثيق">تبديل وتوثيق</option>
                            </select>
                          </div>
                          
                          {/* حقل نص مخصص - يظهر دائماً */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              أو اكتب نوع المشكلة مباشرة
                            </label>
                            <input
                              type="text"
                              placeholder="مثال: مشكلة في الأوراق، تأخير في التوثيق، مشكلة في التأشيرة..."
                              value={['تبديل', 'توثيق', 'تبديل وتوثيق'].includes(formData.cvIssueType) ? '' : formData.cvIssueType}
                              onChange={(e) => setFormData({...formData, cvIssueType: e.target.value})}
                              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                              <span>💡</span>
                              <span>يمكنك الاختيار من القائمة أعلاه أو الكتابة هنا مباشرة</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-border sticky bottom-0 bg-card">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 btn-secondary"
                        disabled={isSubmitting}
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="spinner w-4 h-4"></div>
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            حفظ العقد
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* مودال التعديل - نفس النموذج */}
            {showEditModal && selectedContract && (
              <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                <div className="modal-content max-w-5xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="sticky top-0 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent rounded-t-lg p-6 mb-6 border-b-2 border-primary/20 z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-3 shadow-lg">
                          <Edit className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">تعديل العقد</h3>
                          <p className="text-sm text-muted-foreground mt-1">تعديل بيانات العقد رقم: {selectedContract.contractNumber}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEditModal(false)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-all"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleUpdate} className="px-6 space-y-6">
                    {/* نوع العقد */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          نوع العقد <span className="text-destructive">*</span>
                        </label>
                        <select
                          value={formData.contractType}
                          onChange={(e) => setFormData({...formData, contractType: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        >
                          <option value="SPECIFIC">معين</option>
                          <option value="BY_SPECIFICATIONS">حسب المواصفات</option>
                        </select>
                      </div>

                      {/* ممثل المبيعات */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          اسم ممثل المبيعات <span className="text-destructive">*</span>
                        </label>
                        <select
                          value={formData.salesRepName}
                          onChange={(e) => setFormData({...formData, salesRepName: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        >
                          <option value="">اختر ممثل المبيعات</option>
                          {salesReps.map((rep) => (
                            <option key={rep.id} value={rep.name}>{rep.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* اسم العميل */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        اسم العميل <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    {/* أرقام الجوال */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم الجوال المساند
                        </label>
                        <input
                          type="text"
                          value={formData.supportMobileNumber}
                          onChange={(e) => setFormData({...formData, supportMobileNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم المبيعات
                        </label>
                        <input
                          type="text"
                          value={formData.salesMobileNumber}
                          onChange={(e) => setFormData({...formData, salesMobileNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* الدولة */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        اسم الدولة <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.countryName}
                        onChange={(e) => setFormData({...formData, countryName: e.target.value})}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    {/* المهنة والهويات */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          المهنة <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.profession}
                          onChange={(e) => setFormData({...formData, profession: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم هوية صاحب العمل <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.employerIdNumber}
                          onChange={(e) => setFormData({...formData, employerIdNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم جواز العاملة <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.workerPassportNumber}
                          onChange={(e) => setFormData({...formData, workerPassportNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                    </div>

                    {/* المكتب */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        اختيار المكتب <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={formData.office}
                        onChange={(e) => setFormData({...formData, office: e.target.value})}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        <option value="">اختر المكتب</option>
                        {OFFICES.map((office) => (
                          <option key={office} value={office}>{office}</option>
                        ))}
                      </select>
                    </div>

                    {/* الحالة */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        الحالة <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as keyof typeof CONTRACT_STATUSES})}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        {Object.entries(CONTRACT_STATUSES).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>

                    {/* تاريخ طلب رفع السيرة - يظهر عند اختيار حالة طلب رفع سيرة */}
                    {formData.status === 'CV_REQUEST' && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          تاريخ طلب رفع السيرة
                        </label>
                        <input
                          type="date"
                          value={formData.cvUploadRequestDate}
                          onChange={(e) => setFormData({...formData, cvUploadRequestDate: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}

                    {/* تاريخ طلب التوظيف - يظهر عند اختيار موافقة مكتب الإرسال */}
                    {formData.status === 'EXTERNAL_OFFICE_APPROVAL' && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          تاريخ طلب التوظيف
                        </label>
                        <input
                          type="date"
                          value={formData.employmentRequestDate}
                          onChange={(e) => setFormData({...formData, employmentRequestDate: e.target.value})}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}

                    {/* ملاحظات المتابعة */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ملاحظات المتابعة
                      </label>
                      <textarea
                        value={formData.followUpNotes}
                        onChange={(e) => setFormData({...formData, followUpNotes: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </div>

                    {/* مشكلة في السيرة */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="hasCVIssueEdit"
                          checked={formData.hasCVIssue}
                          onChange={(e) => setFormData({...formData, hasCVIssue: e.target.checked})}
                          className="w-5 h-5 text-primary bg-input border-border rounded focus:ring-2 focus:ring-ring"
                        />
                        <label htmlFor="hasCVIssueEdit" className="text-sm font-medium text-foreground">
                          يوجد مشكلة في السيرة الذاتية (تبديل أو توثيق)
                        </label>
                      </div>

                      {formData.hasCVIssue && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              نوع المشكلة (اختياري)
                            </label>
                            <select
                              value={['تبديل', 'توثيق', 'تبديل وتوثيق', ''].includes(formData.cvIssueType) ? formData.cvIssueType : ''}
                              onChange={(e) => setFormData({...formData, cvIssueType: e.target.value})}
                              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">اختر من القائمة</option>
                              <option value="تبديل">تبديل</option>
                              <option value="توثيق">توثيق</option>
                              <option value="تبديل وتوثيق">تبديل وتوثيق</option>
                            </select>
                          </div>
                          
                          {/* حقل نص مخصص - يظهر دائماً */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              أو اكتب نوع المشكلة مباشرة
                            </label>
                            <input
                              type="text"
                              placeholder="مثال: مشكلة في الأوراق، تأخير في التوثيق، مشكلة في التأشيرة..."
                              value={['تبديل', 'توثيق', 'تبديل وتوثيق'].includes(formData.cvIssueType) ? '' : formData.cvIssueType}
                              onChange={(e) => setFormData({...formData, cvIssueType: e.target.value})}
                              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                              <span>💡</span>
                              <span>يمكنك الاختيار من القائمة أعلاه أو الكتابة هنا مباشرة</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer Buttons */}
                    <div className="sticky bottom-0 bg-gradient-to-t from-card via-card to-transparent pt-6 mt-6 border-t-2 border-primary/20 z-10">
                      <div className="flex gap-3 px-6 pb-6">
                        <button
                          type="button"
                          onClick={() => setShowEditModal(false)}
                          className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-all"
                          disabled={isSubmitting}
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="flex-1 btn-primary px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="spinner w-5 h-5"></div>
                              <span>جاري الحفظ...</span>
                            </>
                          ) : (
                            <>
                              <Edit className="h-5 w-5" />
                              <span>حفظ التعديلات</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* مودال الحذف */}
            {showDeleteModal && selectedContract && (
              <div className="modal-overlay">
                <div className="modal-content max-w-xl">
                  {/* Header */}
                  <div className="bg-gradient-to-l from-red-500/10 via-destructive/5 to-transparent rounded-t-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 shadow-lg">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">تأكيد حذف العقد</h3>
                          <p className="text-sm text-muted-foreground mt-1">هذا الإجراء لا يمكن التراجع عنه</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-all"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="px-6 pb-6 space-y-6">
                    {/* معلومات العقد */}
                    <div className="bg-gradient-to-br from-red-500/5 to-transparent rounded-xl p-5 border-2 border-red-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-500/10 rounded-full p-2">
                          <FileText className="h-5 w-5 text-red-500" />
                        </div>
                        <h4 className="font-semibold text-foreground">العقد المراد حذفه</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-background/80 rounded-lg p-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">رقم العقد</p>
                          <p className="text-lg font-bold text-foreground">{selectedContract.contractNumber}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">اسم العميل</p>
                          <p className="text-lg font-bold text-foreground">{selectedContract.clientName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">المهنة</p>
                          <p className="text-sm font-medium text-foreground">{selectedContract.profession}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">الحالة</p>
                          <p className="text-sm font-medium text-foreground">{CONTRACT_STATUSES[selectedContract.status]}</p>
                        </div>
                      </div>
                    </div>

                    {/* تحذير */}
                    <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <div className="flex-shrink-0 bg-red-500/10 rounded-full p-2">
                        <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                      </div>
                      <div className="text-sm">
                        <p className="text-foreground font-semibold mb-1">⚠️ تحذير هام</p>
                        <p className="text-muted-foreground">
                          سيتم حذف العقد وجميع البيانات المرتبطة به نهائياً. لن تتمكن من استرجاع هذا العقد بعد الحذف.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-border bg-muted/20">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-all"
                      disabled={isSubmitting}
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 px-6 py-3 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner w-5 h-5 border-white"></div>
                          <span>جاري الحذف...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-5 w-5" />
                          <span>تأكيد الحذف</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* مودال إضافة ممثل مبيعات */}
            {showAddSalesRepModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      إضافة ممثل مبيعات جديد
                    </h3>
                    <button
                      onClick={() => setShowAddSalesRepModal(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      اسم ممثل المبيعات
                    </label>
                    <input
                      type="text"
                      value={newSalesRepName}
                      onChange={(e) => setNewSalesRepName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="أدخل اسم ممثل المبيعات"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddSalesRepModal(false)}
                      className="flex-1 btn-secondary"
                      disabled={isSubmitting}
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleAddSalesRep}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner w-4 h-4"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          حفظ
                        </>
                      )}
                    </button>
                  </div>

                  {/* قائمة ممثلي المبيعات الحاليين */}
                  {salesReps.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground mb-3">ممثلو المبيعات الحاليون:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {salesReps.map((rep) => (
                          <div key={rep.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <span className="text-sm text-foreground">{rep.name}</span>
                            <button
                              onClick={() => handleDeleteSalesRep(rep.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* مودال تفاصيل الحالات */}
            {showStatusHistoryModal && selectedContractForHistory && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-card border-2 border-border rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b-2 border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl"></div>
                          <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-4 shadow-lg">
                            <Clock className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">سجل المراحل والتفاصيل</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">عقد رقم:</span>
                            <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-bold">
                              {selectedContractForHistory.contractNumber}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{selectedContractForHistory.clientName}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowStatusHistoryModal(false)
                          setSelectedContractForHistory(null)
                        }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl p-3 transition-all duration-200 border border-transparent hover:border-destructive/30"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-muted/20">
                    {/* الحالة الحالية */}
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg"></div>
                            <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-full p-3 shadow-lg">
                              <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">الحالة الحالية</h4>
                            <p className="text-xs text-muted-foreground">حالة العقد النشطة الآن</p>
                          </div>
                        </div>
                        <span className="px-3 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg text-sm font-bold shadow-lg">
                          {CONTRACT_STATUSES[selectedContractForHistory.status]}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-primary/20">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">تاريخ آخر تحديث</p>
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(selectedContractForHistory.lastStatusUpdate), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">عدد الأيام في هذه الحالة</p>
                          <p className="text-sm font-medium text-foreground">
                            {differenceInDays(new Date(), new Date(selectedContractForHistory.lastStatusUpdate))} يوم
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* سجل الحالات - Timeline */}
                    {selectedContractForHistory.statusChanges && selectedContractForHistory.statusChanges.length > 0 ? (
                      <div className="relative px-6">
                        <h4 className="font-bold text-foreground flex items-center gap-2 mb-4">
                          <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-base">سجل المراحل</span>
                          <span className="text-xs text-muted-foreground">({selectedContractForHistory.statusChanges.length} مرحلة)</span>
                        </h4>
                        
                        {/* Timeline Container */}
                        <div className="relative">
                          {/* Timeline Line */}
                          <div className="absolute right-[42px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-border"></div>
                          
                          <div className="space-y-6">
                            {selectedContractForHistory.statusChanges.map((change: any, index: number) => {
                              const nextChange = selectedContractForHistory.statusChanges?.[index + 1]
                              const daysInStatus = nextChange 
                                ? differenceInDays(new Date(change.changedAt), new Date(nextChange.changedAt))
                                : differenceInDays(new Date(), new Date(change.changedAt))
                              
                              const isCurrentStatus = change.toStatus === selectedContractForHistory.status
                              const isFirstItem = index === 0

                              return (
                                <div key={change.id} className="relative flex items-start gap-6 group">
                                  {/* Timeline Node */}
                                  <div className="relative z-10 flex-shrink-0">
                                    <div className={`
                                      w-[60px] h-[60px] rounded-xl flex items-center justify-center transition-all duration-300
                                      ${isCurrentStatus 
                                        ? 'bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shadow-primary/30 ring-2 ring-primary/20' 
                                        : 'bg-gradient-to-br from-muted to-muted/50 border-2 border-border group-hover:border-primary/30'
                                      }
                                    `}>
                                      {isCurrentStatus ? (
                                        <CheckCircle className="h-7 w-7 text-white" />
                                      ) : (
                                        <Clock className="h-7 w-7 text-muted-foreground" />
                                      )}
                                    </div>
                                    {isFirstItem && (
                                      <div className="absolute -top-0.5 -right-0.5">
                                        <span className="flex h-5 w-5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-5 w-5 bg-primary items-center justify-center text-white text-[8px] font-bold">
                                            ✓
                                          </span>
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Content Card */}
                                  <div className={`
                                    flex-1 rounded-xl p-4 transition-all duration-300
                                    ${isCurrentStatus 
                                      ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 shadow-lg' 
                                      : 'bg-gradient-to-br from-card to-muted/20 border border-border group-hover:border-primary/20 group-hover:shadow-md'
                                    }
                                  `}>
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h5 className={`text-base font-bold mb-1.5 ${isCurrentStatus ? 'text-primary' : 'text-foreground'}`}>
                                          {CONTRACT_STATUSES[change.toStatus as keyof typeof CONTRACT_STATUSES]}
                                        </h5>
                                        {change.fromStatus && (
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5 w-fit">
                                            <ArrowRight className="h-3 w-3" />
                                            <span>من: {CONTRACT_STATUSES[change.fromStatus as keyof typeof CONTRACT_STATUSES]}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col items-end gap-1.5">
                                        <span className={`
                                          text-xs px-3 py-1.5 rounded-full font-bold shadow-sm
                                          ${isCurrentStatus 
                                            ? 'bg-primary text-white' 
                                            : 'bg-muted text-foreground'
                                          }
                                        `}>
                                          {daysInStatus} يوم
                                        </span>
                                        {isCurrentStatus && (
                                          <span className="text-[9px] px-2 py-0.5 bg-success/20 text-success rounded-full font-semibold">
                                            الحالة الحالية
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5">
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                          <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                          <p className="text-[9px] text-muted-foreground font-medium uppercase">التاريخ</p>
                                          <p className="text-xs font-bold text-foreground">
                                            {format(new Date(change.changedAt), 'dd MMM yyyy', { locale: ar })}
                                          </p>
                                          <p className="text-[9px] text-muted-foreground">
                                            {format(new Date(change.changedAt), 'hh:mm a', { locale: ar })}
                                          </p>
                                        </div>
                                      </div>

                                      {change.changedBy && (
                                        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5">
                                          <div className="p-1.5 bg-primary/10 rounded-lg">
                                            <User className="h-3.5 w-3.5 text-primary" />
                                          </div>
                                          <div>
                                            <p className="text-[9px] text-muted-foreground font-medium uppercase">المسؤول</p>
                                            <p className="text-xs font-bold text-foreground">{change.changedBy.name}</p>
                                            <p className="text-[9px] text-muted-foreground">
                                              {change.changedBy.role === 'ADMIN' ? '👑 مدير' :
                                               change.changedBy.role === 'SUB_ADMIN' ? '⭐ أبوريشن' :
                                               change.changedBy.role === 'CUSTOMER_SERVICE' ? '💬 خدمة عملاء' :
                                               change.changedBy.role === 'SALES' ? '📊 مبيعات' : '👤 موظف'}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground px-6">
                        <div className="bg-muted/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-10 w-10 opacity-30" />
                        </div>
                        <p className="text-base font-medium mb-1">لا يوجد سجل لتغييرات الحالات</p>
                        <p className="text-sm">هذا العقد لم يتم تغيير حالته بعد</p>
                      </div>
                    )}

                    {/* معلومات إضافية */}
                    <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-2xl p-6 border border-border shadow-sm">
                      <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                        <div className="p-1.5 bg-muted rounded-lg">
                          <FileText className="h-4 w-4 text-foreground" />
                        </div>
                        <span className="text-sm">معلومات عامة</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card/50 rounded-xl p-4 border border-border">
                          <p className="text-xs text-muted-foreground mb-2 uppercase font-medium">تاريخ إنشاء العقد</p>
                          <p className="text-sm text-foreground font-bold">
                            {format(new Date(selectedContractForHistory.createdAt), 'dd MMMM yyyy', { locale: ar })}
                          </p>
                        </div>
                        <div className="bg-card/50 rounded-xl p-4 border border-border">
                          <p className="text-xs text-muted-foreground mb-2 uppercase font-medium">عمر العقد</p>
                          <p className="text-sm text-foreground font-bold">
                            {differenceInDays(new Date(), new Date(selectedContractForHistory.createdAt))} يوم
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-6 border-t-2 border-border">
                    <button
                      onClick={() => {
                        setShowStatusHistoryModal(false)
                        setSelectedContractForHistory(null)
                      }}
                      className="w-full px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>إغلاق</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* مودال تعديل الحالة */}
            {showStatusEditModal && selectedContractForStatusEdit && (
              <div className="modal-overlay">
                <div className="modal-content max-w-2xl">
                  {/* Header */}
                  <div className="bg-gradient-to-l from-blue-500/10 via-primary/5 to-transparent rounded-t-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg">
                          <RefreshCw className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">تعديل حالة العقد</h3>
                          <p className="text-sm text-muted-foreground mt-1">تغيير حالة العقد وتسجيل التغيير</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowStatusEditModal(false)
                          setSelectedContractForStatusEdit(null)
                        }}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-all"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="px-6 pb-6 space-y-6">
                    {/* معلومات العقد */}
                    <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl p-5 border border-border/50">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-foreground">معلومات العقد</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">رقم العقد</p>
                          <p className="text-base font-bold text-foreground">{selectedContractForStatusEdit.contractNumber}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">اسم العميل</p>
                          <p className="text-base font-bold text-foreground">{selectedContractForStatusEdit.clientName}</p>
                        </div>
                      </div>
                    </div>

                    {/* الانتقال بين الحالات */}
                    <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-5 border-2 border-primary/20">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground font-medium mb-2">الحالة الحالية</p>
                          <div className="flex items-center gap-2 bg-background/80 rounded-lg px-4 py-3 border border-border">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <p className="font-bold text-foreground">{CONTRACT_STATUSES[selectedContractForStatusEdit.status]}</p>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 bg-primary/10 rounded-full p-3">
                          <ArrowRight className="h-6 w-6 text-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground font-medium mb-2">الحالة الجديدة</p>
                          <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-3 border-2 border-primary">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                            <p className="font-bold text-primary">{CONTRACT_STATUSES[newStatus as keyof typeof CONTRACT_STATUSES]}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* اختيار الحالة الجديدة - أزرار احترافية */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-4">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        اختر الحالة الجديدة
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(CONTRACT_STATUSES).map(([key, value]) => {
                          const isSelected = newStatus === key
                          const getButtonColor = (statusKey: string) => {
                            switch (statusKey) {
                              case 'CV_REQUEST': return isSelected ? 'bg-yellow-500 text-white border-yellow-600' : 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/20'
                              case 'EXTERNAL_OFFICE_APPROVAL': return isSelected ? 'bg-blue-500 text-white border-blue-600' : 'bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20'
                              case 'FOREIGN_MINISTRY_APPROVAL': return isSelected ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30 hover:bg-indigo-500/20'
                              case 'VISA_ISSUED': return isSelected ? 'bg-purple-500 text-white border-purple-600' : 'bg-purple-500/10 text-purple-700 border-purple-500/30 hover:bg-purple-500/20'
                              case 'EMBASSY_SENT': return isSelected ? 'bg-green-500 text-white border-green-600' : 'bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20'
                              case 'EMBASSY_APPROVAL': return isSelected ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20'
                              case 'TICKET_DATE_NOTIFIED': return isSelected ? 'bg-cyan-500 text-white border-cyan-600' : 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30 hover:bg-cyan-500/20'
                              case 'REJECTED': return isSelected ? 'bg-red-500 text-white border-red-600' : 'bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20'
                              case 'CANCELLED': return isSelected ? 'bg-gray-500 text-white border-gray-600' : 'bg-gray-500/10 text-gray-700 border-gray-500/30 hover:bg-gray-500/20'
                              case 'OUTSIDE_KINGDOM': return isSelected ? 'bg-orange-500 text-white border-orange-600' : 'bg-orange-500/10 text-orange-700 border-orange-500/30 hover:bg-orange-500/20'
                              default: return isSelected ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                            }
                          }
                          
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewStatus(key)}
                              className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
                                getButtonColor(key)
                              } ${isSelected ? 'scale-105 shadow-lg ring-2 ring-offset-2 ring-primary/50' : 'hover:scale-102 shadow-sm'}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{value}</span>
                                {isSelected && <CheckCircle className="h-4 w-4" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* ملاحظة */}
                    <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                      <div className="flex-shrink-0 bg-blue-500/10 rounded-full p-2">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="text-sm">
                        <p className="text-foreground font-semibold mb-1">📝 ملاحظة هامة</p>
                        <p className="text-muted-foreground">
                          سيتم تسجيل هذا التغيير تلقائياً في سجل الحالات مع التاريخ والوقت الدقيق واسم الموظف الذي قام بالتعديل.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-border bg-muted/20">
                    <button
                      onClick={() => {
                        setShowStatusEditModal(false)
                        setSelectedContractForStatusEdit(null)
                      }}
                      className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-all"
                      disabled={isSubmitting}
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleStatusUpdate}
                      className="flex-1 btn-primary px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting || newStatus === selectedContractForStatusEdit.status}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner w-5 h-5"></div>
                          <span>جاري التحديث...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-5 w-5" />
                          <span>تحديث الحالة</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* مودال عرض تفاصيل العقد */}
            {showViewDetailsModal && selectedContractForView && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewDetailsModal(false)}>
                <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-primary/30 to-primary/20 rounded-2xl border-2 border-primary/40 shadow-lg">
                          <Eye className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-foreground">تفاصيل العقد</h3>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                              {selectedContractForView.contractNumber}
                            </span>
                            <span>•</span>
                            <span>{selectedContractForView.clientName}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowViewDetailsModal(false)}
                        className="text-muted-foreground hover:text-destructive transition-all p-2.5 rounded-xl hover:bg-destructive/10 border border-transparent hover:border-destructive/30"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Contract Details */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Quick Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">تاريخ الإنشاء</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">{format(new Date(selectedContractForView.createdAt), 'dd/MM/yyyy', { locale: ar })}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-4 border border-purple-500/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">عدد الأيام</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">{calculateDays(selectedContractForView.createdAt)} يوم</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-4 border border-green-500/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">الحالة</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">{CONTRACT_STATUSES[selectedContractForView.status]}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl p-4 border border-orange-500/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">المنشئ</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">{selectedContractForView.createdBy?.name || 'غير معروف'}</p>
                      </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* بيانات العقد */}
                      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20 shadow-sm">
                        <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 pb-3 border-b border-primary/20">
                          <div className="p-2 bg-primary/20 rounded-lg">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          📋 بيانات العقد
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">رقم العقد</span>
                            <span className="text-sm font-bold text-primary">{selectedContractForView.contractNumber}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">نوع العقد</span>
                            <span className="text-sm font-semibold text-foreground">
                              {selectedContractForView.contractType === 'SPECIFIC' ? '📋 معين' : '📝 حسب المواصفات'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">ممثل المبيعات</span>
                            <span className="text-sm font-semibold text-foreground">{selectedContractForView.salesRepName}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">المكتب</span>
                            <span className="text-sm font-semibold text-foreground">{selectedContractForView.office}</span>
                          </div>
                        </div>
                      </div>

                      {/* بيانات العميل */}
                      <div className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 rounded-xl p-5 border border-blue-500/20 shadow-sm">
                        <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 pb-3 border-b border-blue-500/20">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          👤 بيانات العميل
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-blue-500/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">اسم العميل</span>
                            <span className="text-sm font-bold text-foreground">{selectedContractForView.clientName}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-blue-500/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">رقم الهوية</span>
                            <span className="text-sm font-mono font-semibold text-foreground">{selectedContractForView.employerIdNumber}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-blue-500/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">رقم المساند</span>
                            <span className="text-sm font-semibold text-foreground">{selectedContractForView.supportMobileNumber || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-blue-500/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">رقم المبيعات</span>
                            <span className="text-sm font-semibold text-foreground">{selectedContractForView.salesMobileNumber || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* بيانات العاملة */}
                      <div className="bg-gradient-to-br from-purple-500/5 to-purple-600/10 rounded-xl p-5 border border-purple-500/20 shadow-sm">
                        <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 pb-3 border-b border-purple-500/20">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          👩‍💼 بيانات العاملة
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-purple-500/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">رقم الجواز</span>
                            <span className="text-sm font-mono font-bold text-foreground">{selectedContractForView.passportNumber || selectedContractForView.workerPassportNumber}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-purple-500/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">المهنة</span>
                            <span className="text-sm font-semibold text-foreground">💼 {selectedContractForView.profession}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-purple-500/30 transition-colors">
                            <span className="text-xs text-muted-foreground font-medium">الدولة</span>
                            <span className="text-sm font-semibold text-foreground">🌍 {selectedContractForView.countryName}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* مشكلة في السيرة */}
                    {selectedContractForView.hasCVIssue && (
                      <div className="bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-xl p-5 border border-destructive/20 shadow-sm">
                        <h4 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                          <div className="p-2 bg-destructive/20 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </div>
                          مشكلة في السيرة الذاتية
                        </h4>
                        <p className="text-base font-bold text-foreground">{selectedContractForView.cvIssueType}</p>
                      </div>
                    )}

                    {/* ملاحظات المتابعة */}
                    <div className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 rounded-xl p-5 border border-blue-500/20 shadow-sm">
                      <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 pb-3 border-b border-blue-500/20">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        ملاحظات المتابعة
                      </h4>

                      {/* قائمة الملاحظات */}
                      <div id="notes-container" className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                        {selectedContractForView.followUpNotesHistory && selectedContractForView.followUpNotesHistory.length > 0 ? (
                          selectedContractForView.followUpNotesHistory.map((note, index) => (
                            <div key={note.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow" id={index === 0 ? 'latest-note' : undefined}>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{note.createdBy.name}</p>
                                    <p className="text-xs text-muted-foreground">{note.createdBy.role}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-left">
                                    <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(note.createdAt), 'hh:mm a', { locale: ar })}</p>
                                  </div>
                                  {/* أزرار التعديل والحذف - للأدمن العام فقط */}
                                  {userData?.role === 'ADMIN' && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingNoteId(note.id)
                                          setEditingNoteText(note.note)
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                        title="تعديل الملاحظة"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return
                                          
                                          try {
                                            const response = await fetch(`/api/new-contracts/${selectedContractForView.id}/notes/${note.id}`, {
                                              method: 'DELETE'
                                            })
                                            
                                            if (!response.ok) throw new Error('فشل حذف الملاحظة')
                                            
                                            toast.success('تم حذف الملاحظة بنجاح')
                                            
                                            // تحديث القائمة
                                            setSelectedContractForView({
                                              ...selectedContractForView,
                                              followUpNotesHistory: selectedContractForView.followUpNotesHistory?.filter(n => n.id !== note.id)
                                            })
                                            
                                            // تحديث قائمة العقود
                                            await fetchData()
                                          } catch (error) {
                                            console.error('Error deleting note:', error)
                                            toast.error('فشل حذف الملاحظة')
                                          }
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                        title="حذف الملاحظة"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {editingNoteId === note.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingNoteText}
                                    onChange={(e) => setEditingNoteText(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-input border-2 border-blue-500 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/new-contracts/${selectedContractForView.id}/notes/${note.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ note: editingNoteText })
                                          })
                                          
                                          if (!response.ok) throw new Error('فشل تعديل الملاحظة')
                                          
                                          const data = await response.json()
                                          toast.success('تم تعديل الملاحظة بنجاح')
                                          
                                          // تحديث القائمة
                                          setSelectedContractForView({
                                            ...selectedContractForView,
                                            followUpNotesHistory: selectedContractForView.followUpNotesHistory?.map(n => 
                                              n.id === note.id ? { ...n, note: editingNoteText } : n
                                            )
                                          })
                                          
                                          setEditingNoteId(null)
                                          setEditingNoteText('')
                                          await fetchData()
                                        } catch (error) {
                                          console.error('Error updating note:', error)
                                          toast.error('فشل تعديل الملاحظة')
                                        }
                                      }}
                                      className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                    >
                                      حفظ
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingNoteId(null)
                                        setEditingNoteText('')
                                      }}
                                      className="px-4 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">{note.note}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">لا توجد ملاحظات متابعة بعد</p>
                          </div>
                        )}
                      </div>

                      {/* إضافة ملاحظة جديدة */}
                      <div className="border-t border-blue-500/20 pt-4">
                        <label className="block text-sm font-semibold text-foreground mb-2">إضافة ملاحظة جديدة</label>
                        <div className="relative">
                          <textarea
                            value={newFollowUpNote}
                            onChange={(e) => setNewFollowUpNote(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey && newFollowUpNote.trim()) {
                                handleAddFollowUpNote(selectedContractForView.id)
                              }
                            }}
                            placeholder="اكتب ملاحظة المتابعة هنا... (Ctrl+Enter للإرسال)"
                            rows={3}
                            className="w-full px-4 py-2.5 pr-14 bg-input border-2 border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-all"
                          />
                          <button
                            onClick={() => handleAddFollowUpNote(selectedContractForView.id)}
                            disabled={isAddingNote || !newFollowUpNote.trim()}
                            className="absolute left-2 bottom-2 p-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                            title="إرسال الملاحظة (Ctrl+Enter)"
                          >
                            {isAddingNote ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          💡 اضغط Ctrl+Enter للإرسال السريع
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-muted/30 p-6 border-t border-border">
                    <button
                      onClick={() => setShowViewDetailsModal(false)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
  )
}

export default function AddContractsPage() {
  return (
    <DashboardLayout>
      {(userData) => <AddContractsPageContent userData={userData} />}
    </DashboardLayout>
  )
}

