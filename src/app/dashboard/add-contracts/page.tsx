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
  FileWarning,
  Ruler,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import * as XLSX from 'xlsx'
import { format, differenceInDays } from 'date-fns'
import { ar } from 'date-fns/locale'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

// ترجمة أسماء الدول الشائعة للتقرير الإنجليزي
const COUNTRY_EN: Record<string, string> = {
  'السعودية': 'Saudi Arabia',
  'إثيوبيا': 'Ethiopia',
  'أثيوبيا': 'Ethiopia',
  'أوغندا': 'Uganda',
  'سريلانكا': 'Sri Lanka',
  'سيرلانكا': 'Sri Lanka',
  'بنجلاديش': 'Bangladesh',
  'الهند': 'India',
  'كينيا': 'Kenya',
  'بوروندي': 'Burundi',
  'الفلبين': 'Philippines'
}

// ترجمة أسماء المكاتب للتقرير الإنجليزي
const OFFICE_EN: Record<string, string> = {
  'إثيوبيا (دوكا)': 'Ethiopia (Duka)',
  'إثيوبيا (NADYA)': 'Ethiopia (NADYA)',
  'سريلانكا (NTW)': 'Sri Lanka (NTW)',
  'سريلانكا (زهران)': 'Sri Lanka (Zahran)',
  'بنجلاديش (مدر لاند)': 'Bangladesh (Mader Land)',
  'كينيا (O.S)': 'Kenya (O.S)',
  'كينيا (Blue.Line)': 'Kenya (Blue.Line)',
  'كينيا (AMANI)': 'Kenya (AMANI)',
  'الهند (عمران)': 'India (Omran)',
  'أوغندا (EBENEZER)': 'Uganda (EBENEZER)',
  'بنجلاديش (MTC)': 'Bangladesh (MTC)',
  'الهند (الودود)': 'India (Al-Wadud)',
  'سيرلانكا (ديشياني)': 'Sri Lanka (Deshyani)',
  'الفلبين (دم دم)': 'Philippines (Dem Dem)',
  'الهند (جميل)': 'India (Jameel)',
  'أوغندا (Keria)': 'Uganda (Keria)',
  'بوروندي (JLA)': 'Burundi (JLA)',
  'بوروندي (ALPHA)': 'Burundi (ALPHA)'
}

// ترجمة بعض المسميات الوظيفية الشائعة (إن وجدت) للتقرير الإنجليزي
const PROFESSION_EN: Record<string, string> = {
  'عاملة منزلية': 'Housemaid',
  'سائق': 'Driver',
  'مربية أطفال': 'Nanny',
  'طباخة': 'Cook'
}

// حالات العقد
const CONTRACT_STATUSES = {
  CV_REQUEST: 'طلب رفع سيرة',
  EXTERNAL_OFFICE_APPROVAL: 'موافقة مكتب الإرسال الخارجي',
  FOREIGN_MINISTRY_APPROVAL: 'موافقة وزارة العمل الأجنبية',
  VISA_ISSUED: 'تم إصدار التأشيرة',
  EMBASSY_SENT: 'تم الإرسال للسفارة السعودية',
  EMBASSY_APPROVAL: 'وصل للمملكة العربية السعودية',
  TICKET_DATE_NOTIFIED: 'تم التبليغ بموعد التذكرة',
  ARRIVAL_CONFIRMATION: 'تأكيد الوصول',
  REJECTED: 'مرفوض',
  CANCELLED: 'ملغي',
  OUTSIDE_KINGDOM: 'خارج المملكة'
}

// English labels لحالات العقد للتقارير الإنجليزية
const CONTRACT_STATUSES_EN: Record<keyof typeof CONTRACT_STATUSES, string> = {
  CV_REQUEST: 'CV upload requested',
  EXTERNAL_OFFICE_APPROVAL: 'External office approval',
  FOREIGN_MINISTRY_APPROVAL: 'Foreign ministry approval',
  VISA_ISSUED: 'Visa issued',
  EMBASSY_SENT: 'Sent to Saudi embassy',
  EMBASSY_APPROVAL: 'Arrived in Saudi Arabia',
  TICKET_DATE_NOTIFIED: 'Ticket date notified',
  ARRIVAL_CONFIRMATION: 'Arrival confirmed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  OUTSIDE_KINGDOM: 'Outside the Kingdom'
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
  const [daysFilter, setDaysFilter] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showAddSalesRepModal, setShowAddSalesRepModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [selectedContractIds, setSelectedContractIds] = useState<number[]>([])
  const [showPdfOptionsModal, setShowPdfOptionsModal] = useState(false)
  const [pdfFontSize, setPdfFontSize] = useState(9)
  const [pdfLanguage, setPdfLanguage] = useState<'ar' | 'en'>('ar')
  const [pdfSelectedColumns, setPdfSelectedColumns] = useState<string[]>([
    'index',
    'contractNumber',
    'contractType',
    'clientName',
    'workerPassportNumber',
    'profession',
    'countryName',
    'employerIdNumber',
    'office',
    'salesRepName',
    'status',
    'statusDate',
    'createdAt',
    'days',
    'createdBy'
  ])

  const pdfColumnsConfig = [
    { key: 'index', labelAr: 'م', labelEn: 'No.' },
    { key: 'contractNumber', labelAr: 'رقم العقد', labelEn: 'Contract No.' },
    { key: 'contractType', labelAr: 'النوع', labelEn: 'Type' },
    { key: 'clientName', labelAr: 'العميل', labelEn: 'Client' },
    { key: 'workerPassportNumber', labelAr: 'رقم الجواز', labelEn: 'Passport No.' },
    { key: 'profession', labelAr: 'المهنة', labelEn: 'Profession' },
    { key: 'countryName', labelAr: 'الدولة', labelEn: 'Country' },
    { key: 'employerIdNumber', labelAr: 'رقم الهوية', labelEn: 'ID Number' },
    { key: 'office', labelAr: 'المكتب', labelEn: 'Office' },
    { key: 'salesRepName', labelAr: 'ممثل المبيعات', labelEn: 'Sales rep.' },
    { key: 'status', labelAr: 'الحالة', labelEn: 'Status' },
    { key: 'statusDate', labelAr: 'تاريخ الحالة', labelEn: 'Status date' },
    { key: 'createdAt', labelAr: 'تاريخ الإنشاء', labelEn: 'Created at' },
    { key: 'days', labelAr: 'الأيام', labelEn: 'Days' },
    { key: 'createdBy', labelAr: 'المنشئ', labelEn: 'Created by' }
  ] as const

  const togglePdfColumn = (key: string) => {
    setPdfSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }
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
  
  // حالات استيراد Excel
  const [showImportModal, setShowImportModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  
  // Column resizing and font size states
  const defaultColumnWidths = {
    checkbox: 40,
    contractNumber: 90,
    passport: 90,
    client: 110,
    country: 70,
    salesRep: 90,
    office: 100,
    status: 120,
    date: 75,
    days: 55,
    creator: 80,
    alert: 60,
    actions: 100
  }

  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contractsTableColumnWidths')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Error parsing saved column widths:', e)
        }
      }
    }
    return defaultColumnWidths
  })

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // حفظ عرض الأعمدة في localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('contractsTableColumnWidths', JSON.stringify(columnWidths))
    }
  }, [columnWidths])

  // Font size control
  const defaultFontSize = 12
  const minFontSize = 9
  const maxFontSize = 16

  const [tableFontSize, setTableFontSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contractsTableFontSize')
      if (saved) {
        const size = parseInt(saved)
        if (size >= minFontSize && size <= maxFontSize) {
          return size
        }
      }
    }
    return defaultFontSize
  })

  // حفظ حجم الخط
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('contractsTableFontSize', tableFontSize.toString())
    }
  }, [tableFontSize])

  // Handle column resize
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    setResizingColumn(columnKey)
    setStartX(e.clientX)
    setStartWidth(columnWidths[columnKey])
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return
    const diff = startX - e.clientX
    const newWidth = Math.max(50, startWidth + diff)
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }, [resizingColumn, startX, startWidth])

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null)
  }, [])

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.classList.add('resizing-column')
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.classList.remove('resizing-column')
      }
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp])

  // Font size functions
  const increaseFontSize = () => {
    setTableFontSize(prev => {
      const newSize = Math.min(prev + 1, maxFontSize)
      if (newSize === maxFontSize) {
        toast('وصلت للحد الأقصى لحجم الخط', { icon: '📏' })
      }
      return newSize
    })
  }

  const decreaseFontSize = () => {
    setTableFontSize(prev => {
      const newSize = Math.max(prev - 1, minFontSize)
      if (newSize === minFontSize) {
        toast('وصلت للحد الأدنى لحجم الخط', { icon: '📏' })
      }
      return newSize
    })
  }

  const resetFontSize = () => {
    setTableFontSize(defaultFontSize)
    toast.success('تم إعادة ضبط حجم الخط')
  }

  const resetColumnWidths = () => {
    setColumnWidths(defaultColumnWidths)
    toast.success('تم إعادة ضبط عرض الأعمدة')
  }
  
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

    // فلتر عدد الأيام
    if (daysFilter) {
      const filterDays = parseInt(daysFilter)
      if (!isNaN(filterDays)) {
        filtered = filtered.filter(contract => calculateDays(contract.createdAt) === filterDays)
      }
    }

    // الترتيب
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    setFilteredContracts(filtered)
  }, [debouncedSearchTerm, statusFilter, salesRepFilter, officeFilter, creatorFilter, issueFilter, dateFromFilter, dateToFilter, daysFilter, sortOrder, contracts])

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

  // حذف عقود متعددة
  const handleBulkDelete = async () => {
    if (selectedContractIds.length === 0) return

    setIsSubmitting(true)

    try {
      // حذف كل عقد على حدة
      const deletePromises = selectedContractIds.map(id => 
        fetch(`/api/new-contracts?id=${id}`, {
          method: 'DELETE'
        })
      )

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(r => r.ok).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`✅ تم حذف ${successCount} عقد بنجاح`)
      }
      
      if (failCount > 0) {
        toast.error(`❌ فشل حذف ${failCount} عقد`)
      }

      setShowBulkDeleteModal(false)
      setSelectedContractIds([])
      fetchData(false)
    } catch (error) {
      console.error('❌ خطأ:', error)
      toast.error('حدث خطأ أثناء حذف العقود')
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

  // استيراد من Excel
  const handleImportExcel = async () => {
    if (!importFile) {
      toast.error('الرجاء اختيار ملف Excel')
      return
    }

    setIsImporting(true)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('userId', String(user?.id || 1))

      const response = await fetch('/api/new-contracts/import-excel', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setImportResults(data)
        toast.success(data.message)
        
        // تحديث البيانات
        fetchData()
        
        // إعادة تعيين الملف
        setImportFile(null)
        
        // إغلاق المودال بعد 3 ثواني إذا نجحت جميع العقود
        if (data.failed === 0) {
          setTimeout(() => {
            setShowImportModal(false)
            setImportResults(null)
          }, 3000)
        }
      } else {
        toast.error(data.error || 'فشل استيراد العقود')
      }
    } catch (error) {
      console.error('❌ خطأ في استيراد العقود:', error)
      toast.error('حدث خطأ أثناء استيراد العقود')
    } finally {
      setIsImporting(false)
    }
  }

  // تنزيل ملف نموذجي للاستيراد
  const downloadTemplateExcel = () => {
    const templateData = [{
      'رقم العقد': 'مثال: 2024001',
      'النوع': 'معين',
      'العميل': 'مثال: أحمد محمد',
      'رقم جواز العاملة': 'مثال: A1234567',
      'المهنة': 'مثال: عاملة منزلية',
      'الدولة': 'مثال: إثيوبيا',
      'رقم هوية صاحب العمل': 'مثال: 1234567890',
      'المكتب': 'إثيوبيا (دوكا)',
      'ممثل المبيعات': 'مثال: محمد أحمد',
      'رقم الجوال المساند': '0512345678',
      'رقم المبيعات': '0512345679',
      'رقم الشهر الميلادي': '12',
      'التاريخ الحالي': '01/12/2024',
      'الحالة': 'طلب رفع سيرة',
      'تاريخ طلب رفع السيرة': '',
      'تاريخ طلب التوظيف': '',
      'يوجد مشكلة': 'لا',
      'نوع المشكلة': '',
      'تاريخ الإنشاء': '01/12/2024',
      'آخر تحديث للحالة': '',
      'عدد الأيام منذ الإنشاء': '0',
      'المنشئ': '',
      'ملاحظات المتابعة': ''
    }]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'نموذج العقود')
    XLSX.writeFile(wb, `نموذج_استيراد_عقود.xlsx`)
    toast.success('تم تنزيل الملف النموذجي')
  }

  // تصدير إلى Excel
  const handleExportExcel = (type: 'all' | 'selected') => {
    const contractsToExport = type === 'selected' 
      ? contracts.filter(c => selectedContractIds.includes(c.id))
      : filteredContracts

    if (contractsToExport.length === 0) {
      toast.error('لا توجد عقود لتصديرها')
      return
    }

    // تحضير البيانات
    const data = contractsToExport.map(c => ({
      'رقم العقد': c.contractNumber,
      'النوع': c.contractType === 'SPECIFIC' ? 'معين' : 'مواصفات',
      'العميل': c.clientName,
      'رقم جواز العاملة': c.passportNumber || c.workerPassportNumber || '-',
      'المهنة': c.profession || '-',
      'الدولة': c.countryName,
      'رقم هوية صاحب العمل': c.employerIdNumber || '-',
      'المكتب': c.office,
      'ممثل المبيعات': c.salesRepName,
      'رقم الجوال المساند': c.supportMobileNumber || '-',
      'رقم المبيعات': c.salesMobileNumber || '-',
      'رقم الشهر الميلادي': c.currentMonth || '-',
      'التاريخ الحالي': c.currentDate ? format(new Date(c.currentDate), 'dd/MM/yyyy') : '-',
      'الحالة': CONTRACT_STATUSES[c.status],
      'تاريخ طلب رفع السيرة': c.cvUploadRequestDate ? format(new Date(c.cvUploadRequestDate), 'dd/MM/yyyy') : '-',
      'تاريخ طلب التوظيف': c.employmentRequestDate ? format(new Date(c.employmentRequestDate), 'dd/MM/yyyy') : '-',
      'يوجد مشكلة': c.hasCVIssue ? 'نعم' : 'لا',
      'نوع المشكلة': c.cvIssueType || '-',
      'تاريخ الإنشاء': format(new Date(c.createdAt), 'dd/MM/yyyy'),
      'آخر تحديث للحالة': c.lastStatusUpdate ? format(new Date(c.lastStatusUpdate), 'dd/MM/yyyy') : '-',
      'عدد الأيام منذ الإنشاء': calculateDays(c.createdAt),
      'المنشئ': c.createdBy?.name || '-',
      'ملاحظات المتابعة': c.followUpNotes || '-'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'العقود')
    XLSX.writeFile(wb, `contracts_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    toast.success('تم تصدير ملف Excel بنجاح')
  }

  const openPdfOptions = (type: 'all' | 'selected') => {
    const contractsToExportCount =
      type === 'selected'
        ? contracts.filter((c) => selectedContractIds.includes(c.id)).length
        : filteredContracts.length

    if (contractsToExportCount === 0) {
      toast.error('لا توجد عقود لتصديرها')
      return
    }

    // حفظ نوع التصدير في data-attribute بسيطة
    (window as any).__pdfExportType = type
    setShowPdfOptionsModal(true)
  }

  // تصدير إلى PDF
  const handleExportPDF = async (type: 'all' | 'selected') => {
    const contractsToExport = type === 'selected' 
      ? contracts.filter(c => selectedContractIds.includes(c.id))
      : filteredContracts

    if (contractsToExport.length === 0) {
      toast.error('لا توجد عقود لتصديرها')
      return
    }

    try {
      toast.loading('جاري إنشاء ملف PDF...', { id: 'pdf-export' })

      // إنشاء عنصر مؤقت للطباعة
      const printElement = document.createElement('div')
      printElement.style.position = 'absolute'
      printElement.style.left = '-9999px'
      printElement.style.top = '0'
      printElement.style.width = '297mm' // A4 Landscape width
      printElement.style.backgroundColor = 'white'
      printElement.style.fontSize = pdfFontSize + 'px'
      printElement.style.color = 'black'
      printElement.style.direction = 'rtl'

      // تحميل خط Cairo من Google Fonts
      const fontLink = document.createElement('link')
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap'
      fontLink.rel = 'stylesheet'
      document.head.appendChild(fontLink)

      // انتظار تحميل الخط
      await new Promise(resolve => setTimeout(resolve, 500))

      // تحويل الشعار إلى base64
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      
      const logoBase64 = await new Promise<string>((resolve) => {
        logoImg.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = logoImg.width
          canvas.height = logoImg.height
          ctx?.drawImage(logoImg, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        }
        logoImg.onerror = () => resolve('')
        logoImg.src = '/logo-2.png'
      })

      // إنشاء محتوى PDF مع خط Cairo وجميع البيانات
      printElement.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          * { font-family: 'Cairo', sans-serif !important; }
        </style>
          <div style="padding: 8px; max-width: 100%; font-family: 'Cairo', sans-serif; position: relative; min-height: 100%;">
          
          <!-- Header مع الشعار -->
          <div style="text-align: center; margin-bottom: 8px; border-bottom: 2px solid #2563eb; padding-bottom: 6px; position: relative; z-index: 1;">
            ${logoBase64 ? `<img src="${logoBase64}" style="max-height: 40px; margin-bottom: 4px;" />` : ''}
            <h1 style="margin: 0; color: #1e40af; font-size: 18px; font-weight: 800; font-family: 'Cairo', sans-serif;">
              ${pdfLanguage === 'en' ? 'Contracts Report' : 'تقرير العقود'}
            </h1>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 4px; font-size: 9px;">
              <p style="margin: 0; color: #475569; font-weight: 600;">
                ${pdfLanguage === 'en' ? '📅 Report date: ' : '📅 تاريخ التقرير: '}
                ${format(new Date(), 'dd/MM/yyyy - HH:mm')}
              </p>
              <p style="margin: 0; color: #475569; font-weight: 600;">
                ${pdfLanguage === 'en' ? '📊 Total: ' : '📊 إجمالي العقود: '}
                ${contractsToExport.length} ${pdfLanguage === 'en' ? 'contracts' : 'عقد'}
              </p>
            </div>
          </div>

          <!-- الجدول -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: ${pdfFontSize - 1}px; position: relative; z-index: 1;">
            <thead>
              <tr style="background: linear-gradient(90deg, #1e40af 0%, #3b82f6 100%);">
              ${pdfColumnsConfig
                .filter((col) => pdfSelectedColumns.includes(col.key))
                .map((col) => {
                  const label = pdfLanguage === 'en' ? col.labelEn : col.labelAr
                  return `<th style="border: 1px solid #1e3a8a; padding: 6px 3px; text-align: center; font-weight: 700; color: white; font-size: ${pdfFontSize - 1}px;">${label}</th>`
                })
                .join('')}
              </tr>
            </thead>
            <tbody>
              ${contractsToExport.map((contract, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f1f5f9'};">
                  ${pdfColumnsConfig
                    .filter((col) => pdfSelectedColumns.includes(col.key))
                    .map((col) => {
                      const baseStyle = `border: 1px solid #cbd5e1; padding: 6px 3px; text-align: center; font-size: ${
                        pdfFontSize - 1
                      }px;`
                      if (col.key === 'index') {
                        return `<td style="${baseStyle} font-weight: 700; color: #64748b;">${index + 1}</td>`
                      }
                      if (col.key === 'contractNumber') {
                        return `<td style="${baseStyle} font-weight: 700; color: #1e40af;">${contract.contractNumber}</td>`
                      }
                      if (col.key === 'contractType') {
                        const typeLabel =
                          pdfLanguage === 'en'
                            ? contract.contractType === 'SPECIFIC'
                              ? 'Specific'
                              : 'By specifications'
                            : contract.contractType === 'SPECIFIC'
                            ? 'معين'
                            : 'مواصفات'
                        return `<td style="${baseStyle}">${typeLabel}</td>`
                      }
                      if (col.key === 'clientName') {
                        return `<td style="${baseStyle} font-weight: 600;">${contract.clientName}</td>`
                      }
                      if (col.key === 'workerPassportNumber') {
                        return `<td style="${baseStyle} direction: ltr;">${
                          contract.passportNumber || contract.workerPassportNumber || '-'
                        }</td>`
                      }
                      if (col.key === 'profession') {
                        const profession =
                          pdfLanguage === 'en'
                            ? PROFESSION_EN[contract.profession] || contract.profession || '-'
                            : contract.profession || '-'
                        return `<td style="${baseStyle}">${profession}</td>`
                      }
                      if (col.key === 'countryName') {
                        const country =
                          pdfLanguage === 'en'
                            ? COUNTRY_EN[contract.countryName] || contract.countryName
                            : contract.countryName
                        return `<td style="${baseStyle}">${country}</td>`
                      }
                      if (col.key === 'employerIdNumber') {
                        return `<td style="${baseStyle} direction: ltr;">${
                          contract.employerIdNumber || '-'
                        }</td>`
                      }
                      if (col.key === 'office') {
                        const office =
                          pdfLanguage === 'en'
                            ? OFFICE_EN[contract.office] || contract.office
                            : contract.office
                        return `<td style="${baseStyle} font-size: ${pdfFontSize - 2}px;">${office}</td>`
                      }
                      if (col.key === 'salesRepName') {
                        return `<td style="${baseStyle}">${contract.salesRepName}</td>`
                      }
                      if (col.key === 'status') {
                        const statusLabel =
                          pdfLanguage === 'en'
                            ? CONTRACT_STATUSES_EN[contract.status]
                            : CONTRACT_STATUSES[contract.status]
                        return `<td style="${baseStyle} color: #059669; font-weight: 600;">${statusLabel}</td>`
                      }
                      if (col.key === 'statusDate') {
                        const statusDate =
                          contract.lastStatusUpdate ||
                          (contract.status === 'CV_REQUEST'
                            ? contract.cvUploadRequestDate
                            : contract.status === 'EXTERNAL_OFFICE_APPROVAL'
                            ? contract.employmentRequestDate
                            : contract.updatedAt || contract.createdAt)
                        return `<td style="${baseStyle} direction: ltr;">${
                          statusDate ? format(new Date(statusDate), 'dd/MM/yyyy') : '-'
                        }</td>`
                      }
                      if (col.key === 'createdAt') {
                        return `<td style="${baseStyle} direction: ltr;">${format(
                          new Date(contract.createdAt),
                          'dd/MM/yyyy'
                        )}</td>`
                      }
                      if (col.key === 'days') {
                        const daysVal = calculateDays(contract.createdAt)
                        return `<td style="${baseStyle} font-weight: 700; color: ${
                          daysVal > 30 ? '#dc2626' : '#059669'
                        };">${daysVal}</td>`
                      }
                      if (col.key === 'createdBy') {
                        return `<td style="${baseStyle}">${contract.createdBy?.name || '-'}</td>`
                      }
                      return `<td style="${baseStyle}">-</td>`
                    })
                    .join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Footer -->
          <div style="margin-top: 8px; text-align: center; border-top: 2px solid #2563eb; padding-top: 6px; position: relative; z-index: 1;">
            ${logoBase64 ? `<img src="${logoBase64}" style="max-height: 26px; margin-bottom: 4px; opacity: 0.7;" />` : ''}
            <p style="margin: 0; color: #475569; font-size: 9px; font-weight: 600;">
              ${
                pdfLanguage === 'en'
                  ? 'This report was generated automatically from the Contracts Management System.'
                  : 'تم إنشاء هذا التقرير تلقائياً من نظام إدارة العقود'
              }
            </p>
            <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 8px;">
              © ${new Date().getFullYear()} ${pdfLanguage === 'en' ? 'All rights reserved.' : 'جميع الحقوق محفوظة.'}
            </p>
          </div>
        </div>
      `

      document.body.appendChild(printElement)

      // انتظار تحميل الخط والصور
      await new Promise(resolve => setTimeout(resolve, 300))

      // تحويل إلى صورة
      const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: printElement.offsetWidth,
        height: printElement.offsetHeight
      })

      // إنشاء PDF بوضع أفقي (Landscape)
      const pdf = new jsPDF('l', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // الحفاظ على النسبة بدون تمديد مشوه، مع تقليل الهوامش قدر الإمكان
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const renderWidth = imgWidth * ratio
      const renderHeight = imgHeight * ratio

      const marginX = (pdfWidth - renderWidth) / 2
      const marginY = (pdfHeight - renderHeight) / 2

      pdf.addImage(imgData, 'PNG', marginX, marginY, renderWidth, renderHeight)

      // حفظ الملف
      const fileName = `contracts_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`
      pdf.save(fileName)

      // تنظيف
      document.body.removeChild(printElement)
      document.head.removeChild(fontLink)
      
      toast.success('تم إنشاء ملف PDF بنجاح', { id: 'pdf-export' })
    } catch (error) {
      console.error('خطأ في إنشاء PDF:', error)
      toast.error('حدث خطأ أثناء إنشاء ملف PDF', { id: 'pdf-export' })
    }
  }

  // تحديد الكل
  const toggleSelectAll = () => {
    if (selectedContractIds.length === filteredContracts.length && filteredContracts.length > 0) {
      setSelectedContractIds([])
    } else {
      setSelectedContractIds(filteredContracts.map(c => c.id))
    }
  }

  // تحديد عقد واحد
  const toggleSelectContract = (id: number) => {
    if (selectedContractIds.includes(id)) {
      setSelectedContractIds(prev => prev.filter(i => i !== id))
    } else {
      setSelectedContractIds(prev => [...prev, id])
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-effect {
          background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}} />
      
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg shimmer-effect ml-2 sm:ml-3"></div>
          <div>
            <div className="h-6 sm:h-7 w-32 sm:w-40 rounded shimmer-effect mb-2"></div>
            <div className="h-3 sm:h-4 w-40 sm:w-52 rounded shimmer-effect"></div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="h-9 sm:h-10 w-28 sm:w-36 rounded-lg shimmer-effect flex-1 sm:flex-initial"></div>
          <div className="h-9 sm:h-10 w-16 sm:w-20 rounded-lg shimmer-effect"></div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-card p-3 sm:p-6 rounded-lg border border-border space-y-3 sm:space-y-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-28 rounded shimmer-effect"></div>
          <div className="h-8 w-24 rounded-lg shimmer-effect"></div>
        </div>
        <div className="h-10 sm:h-12 w-full rounded-lg shimmer-effect"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 sm:h-11 rounded-lg shimmer-effect"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-9 sm:h-11 rounded-lg shimmer-effect"></div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-card border border-border sm:border-2 rounded-lg sm:rounded-2xl shadow-lg overflow-hidden">
        {/* شريط التحكم */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-4 py-3 border-b border-border">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-48 rounded shimmer-effect"></div>
              <div className="h-4 w-24 rounded shimmer-effect"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 rounded-lg shimmer-effect"></div>
              <div className="h-8 w-24 rounded-lg shimmer-effect"></div>
              <div className="h-8 w-20 rounded-lg shimmer-effect"></div>
            </div>
          </div>
        </div>
        
        {/* Table Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b-2 border-primary/20 px-2 py-3">
          <div className="flex gap-2 overflow-hidden">
            <div className="h-4 w-10 rounded shimmer-effect flex-shrink-0"></div>
            <div className="h-4 w-20 rounded shimmer-effect flex-shrink-0"></div>
            <div className="h-4 w-24 rounded shimmer-effect flex-shrink-0"></div>
            <div className="h-4 w-28 rounded shimmer-effect flex-shrink-0"></div>
            <div className="h-4 w-20 rounded shimmer-effect flex-shrink-0"></div>
            <div className="h-4 w-24 rounded shimmer-effect flex-shrink-0"></div>
            <div className="h-4 w-28 rounded shimmer-effect flex-shrink-0"></div>
            <div className="h-4 w-20 rounded shimmer-effect flex-shrink-0"></div>
            <div className="h-4 w-16 rounded shimmer-effect flex-shrink-0"></div>
            <div className="h-4 w-20 rounded shimmer-effect flex-shrink-0"></div>
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-border/50">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div key={row} className="px-2 py-3 hover:bg-muted/30">
              <div className="flex gap-2 items-center overflow-hidden">
                <div className="h-4 w-4 rounded shimmer-effect flex-shrink-0"></div>
                <div className="h-5 w-16 rounded shimmer-effect flex-shrink-0"></div>
                <div className="h-5 w-20 rounded shimmer-effect flex-shrink-0"></div>
                <div className="h-5 w-24 rounded shimmer-effect flex-shrink-0"></div>
                <div className="h-5 w-16 rounded shimmer-effect flex-shrink-0"></div>
                <div className="h-5 w-20 rounded shimmer-effect flex-shrink-0"></div>
                <div className="h-5 w-24 rounded shimmer-effect flex-shrink-0"></div>
                <div className="h-5 w-16 rounded shimmer-effect flex-shrink-0"></div>
                <div className="h-5 w-12 rounded shimmer-effect flex-shrink-0"></div>
                <div className="flex gap-1 flex-shrink-0">
                  <div className="h-7 w-7 rounded-lg shimmer-effect"></div>
                  <div className="h-7 w-7 rounded-lg shimmer-effect"></div>
                  <div className="h-7 w-7 rounded-lg shimmer-effect"></div>
                </div>
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
          <>
          <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <style dangerouslySetInnerHTML={{__html: `
              .scrollbar-custom {
                scrollbar-width: thin;
                scrollbar-color: hsl(var(--primary) / 0.5) hsl(var(--muted) / 0.3);
                overflow-x: auto !important;
                overflow-y: visible;
              }
              
              .scrollbar-custom::-webkit-scrollbar {
                height: 14px;
              }
              
              .scrollbar-custom::-webkit-scrollbar-track {
                background: hsl(var(--muted) / 0.5);
                border-radius: 8px;
                margin: 4px 8px;
                border: 1px solid hsl(var(--border));
              }
              
              .scrollbar-custom::-webkit-scrollbar-thumb {
                background: linear-gradient(90deg, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.8));
                border-radius: 8px;
                border: 2px solid hsl(var(--muted) / 0.3);
                background-clip: padding-box;
              }
              
              .scrollbar-custom::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(90deg, hsl(var(--primary) / 0.8), hsl(var(--primary)));
                border-radius: 8px;
                border: 2px solid hsl(var(--muted) / 0.3);
                background-clip: padding-box;
              }
              
              .scrollbar-custom::-webkit-scrollbar-thumb:active {
                background: hsl(var(--primary));
              }

              .scrollbar-custom::-webkit-scrollbar-corner {
                background: transparent;
              }
            `}} />
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
                      setDaysFilter('')
                      setSortOrder('desc')
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

                {/* فلتر عدد الأيام */}
                <input
                  type="number"
                  placeholder="عدد الأيام..."
                  value={daysFilter}
                  onChange={(e) => setDaysFilter(e.target.value)}
                  className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
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
            <div className="bg-card border border-border sm:border-2 overflow-x-auto rounded-lg sm:rounded-2xl shadow-lg sm:shadow-xl">
              {/* شريط التحكم */}
              <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-4 py-3 border-b border-border">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span>↔️</span>
                      <span>يمكنك التمرير يميناً ويساراً لعرض جميع الأعمدة</span>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-border"></div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        title={sortOrder === 'asc' ? 'ترتيب من الأقدم للأحدث' : 'ترتيب من الأحدث للأقدم'}
                      >
                        {sortOrder === 'asc' ? (
                          <>
                            <ArrowUp className="h-3 w-3" />
                            <span>الأقدم أولاً</span>
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-3 w-3" />
                            <span>الأحدث أولاً</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* أزرار التحكم */}
                  <div className="flex items-center gap-2">
                    {/* زر الاستيراد */}
                    <button 
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all text-sm font-medium"
                      title="استيراد عقود من Excel"
                    >
                      <FileSpreadsheet className="h-5 w-5" />
                      <span className="hidden sm:inline">استيراد Excel</span>
                    </button>

                    {/* زر تصدير Excel */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-700 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-all text-sm font-medium">
                          <FileSpreadsheet className="h-5 w-5" />
                          <span className="hidden sm:inline">تصدير Excel</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportExcel('all')} className="cursor-pointer gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>تصدير الكل إلى Excel</span>
                          <span className="text-xs text-muted-foreground">({filteredContracts.length})</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportExcel('selected')} className="cursor-pointer gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>تصدير المحدد إلى Excel</span>
                          <span className="text-xs text-muted-foreground">({selectedContractIds.length})</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* زر تصدير PDF */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-700 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all text-sm font-medium">
                          <FileDown className="h-5 w-5" />
                          <span className="hidden sm:inline">تصدير PDF</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPdfOptions('all')} className="cursor-pointer gap-2">
                          <FileDown className="h-4 w-4" />
                          <span>تصدير الكل إلى PDF</span>
                          <span className="text-xs text-muted-foreground">({filteredContracts.length})</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPdfOptions('selected')} className="cursor-pointer gap-2">
                          <FileDown className="h-4 w-4" />
                          <span>تصدير المحدد إلى PDF</span>
                          <span className="text-xs text-muted-foreground">({selectedContractIds.length})</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* زر الحذف المتعدد */}
                    {selectedContractIds.length > 0 && (
                      <button 
                        onClick={() => setShowBulkDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-700 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all text-sm font-medium animate-in fade-in zoom-in duration-200"
                        title="حذف العقود المحددة"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="hidden sm:inline">حذف المحدد</span>
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">{selectedContractIds.length}</span>
                      </button>
                    )}

                    {/* التحكم في حجم الخط */}
                    <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-lg p-1">
                      <button
                        onClick={decreaseFontSize}
                        className="p-1.5 hover:bg-background rounded transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="تصغير الخط"
                        disabled={tableFontSize <= minFontSize}
                      >
                        <span className="text-sm font-bold">A-</span>
                      </button>
                      <div className="px-2 text-xs font-medium text-foreground">
                        {tableFontSize}px
                      </div>
                      <button
                        onClick={increaseFontSize}
                        className="p-1.5 hover:bg-background rounded transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="تكبير الخط"
                        disabled={tableFontSize >= maxFontSize}
                      >
                        <span className="text-base font-bold">A+</span>
                      </button>
                      <div className="w-px h-4 bg-border mx-1"></div>
                      <button
                        onClick={resetFontSize}
                        className="p-1.5 hover:bg-background rounded transition-all active:scale-95"
                        title="إعادة ضبط حجم الخط"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </div>

                    {/* إعادة ضبط عرض الأعمدة */}
                    <button
                      onClick={resetColumnWidths}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg transition-all text-xs font-medium hover:scale-105 active:scale-95"
                      title="إعادة ضبط عرض الأعمدة للقيم الافتراضية"
                    >
                      <Ruler className="h-3 w-3" />
                      <span className="hidden xl:inline">إعادة ضبط العرض</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Scroll Container */}
              <div className="relative">
                <div className="overflow-x-auto scrollbar-custom w-full">
                  <div className="inline-block min-w-full">
                    <table className="w-full" style={{ fontSize: `${tableFontSize}px`, minWidth: '1100px' }}>
                  <thead className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b-2 border-primary/20">
                    <tr>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide relative" style={{ minWidth: `${columnWidths.checkbox}px` }}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          checked={filteredContracts.length > 0 && selectedContractIds.length === filteredContracts.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-3 py-3 text-right font-extrabold text-foreground tracking-wide relative whitespace-nowrap" style={{ minWidth: `${columnWidths.contractNumber}px` }}>
                        رقم العقد
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'contractNumber')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide hidden md:table-cell relative whitespace-nowrap" style={{ minWidth: `${columnWidths.passport}px` }}>
                        الجواز
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'passport')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-right font-extrabold text-foreground tracking-wide relative whitespace-nowrap" style={{ minWidth: `${columnWidths.client}px` }}>
                        العميل
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'client')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide hidden lg:table-cell relative whitespace-nowrap" style={{ minWidth: `${columnWidths.country}px` }}>
                        الدولة
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'country')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide hidden xl:table-cell relative whitespace-nowrap" style={{ minWidth: `${columnWidths.salesRep}px` }}>
                        ممثل المبيعات
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'salesRep')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide hidden lg:table-cell relative whitespace-nowrap" style={{ minWidth: `${columnWidths.office}px` }}>
                        المكتب
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'office')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide relative whitespace-nowrap" style={{ minWidth: `${columnWidths.status}px` }}>
                        الحالة
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'status')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide hidden md:table-cell relative whitespace-nowrap" style={{ minWidth: `${columnWidths.date}px` }}>
                        التاريخ
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'date')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide hidden sm:table-cell relative whitespace-nowrap" style={{ minWidth: `${columnWidths.days}px` }}>
                        الأيام
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'days')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide hidden xl:table-cell relative whitespace-nowrap" style={{ minWidth: `${columnWidths.creator}px` }}>
                        المنشئ
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'creator')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide hidden md:table-cell relative whitespace-nowrap" style={{ minWidth: `${columnWidths.alert}px` }}>
                        التنبيهات
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary hover:w-2 transition-all group active:bg-primary" onMouseDown={(e) => handleMouseDown(e, 'alert')} title="اسحب لتغيير العرض">
                          <div className="h-full w-full bg-border group-hover:bg-primary group-active:bg-primary"></div>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold text-foreground tracking-wide relative whitespace-nowrap" style={{ minWidth: `${columnWidths.actions}px` }}>
                        إجراءات
                      </th>
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
                          case 'ARRIVAL_CONFIRMATION': return 'bg-teal-500/10 text-teal-700 border-teal-500/30'
                          case 'REJECTED': return 'bg-red-500/10 text-red-700 border-red-500/30'
                          case 'CANCELLED': return 'bg-gray-500/10 text-gray-700 border-gray-500/30'
                          case 'OUTSIDE_KINGDOM': return 'bg-orange-500/10 text-orange-700 border-orange-500/30'
                          default: return 'bg-muted text-muted-foreground border-border'
                        }
                      }
                      
                      return (
                        <tr key={contract.id} className="hover:bg-primary/5 transition-all duration-200 group">
                          <td className="px-3 py-3 text-center" style={{ minWidth: `${columnWidths.checkbox}px` }}>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                              checked={selectedContractIds.includes(contract.id)}
                              onChange={() => toggleSelectContract(contract.id)}
                            />
                          </td>
                          <td className="px-3 py-3" style={{ minWidth: `${columnWidths.contractNumber}px` }}>
                            <div className="font-bold text-primary truncate">{contract.contractNumber}</div>
                            <div className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                              {contract.contractType === 'SPECIFIC' ? 'معين' : 'مواصفات'}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center hidden md:table-cell" style={{ minWidth: `${columnWidths.passport}px` }}>
                            <div className="font-mono font-bold text-foreground bg-muted/50 px-2 py-1 rounded inline-block truncate">
                              {contract.passportNumber || contract.workerPassportNumber || '-'}
                            </div>
                          </td>
                          <td className="px-3 py-3" style={{ minWidth: `${columnWidths.client}px` }}>
                            <div className="font-bold text-foreground truncate">{contract.clientName}</div>
                            <div className="text-muted-foreground mt-0.5 truncate">
                              {contract.profession}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center hidden lg:table-cell" style={{ minWidth: `${columnWidths.country}px` }}>
                            <div className="font-semibold text-foreground bg-primary/5 px-2 py-1 rounded-md inline-block truncate">
                              {contract.countryName}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center hidden xl:table-cell" style={{ minWidth: `${columnWidths.salesRep}px` }}>
                            <div className="font-semibold text-foreground truncate">
                              {contract.salesRepName}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center hidden lg:table-cell" style={{ minWidth: `${columnWidths.office}px` }}>
                            <div className="font-medium text-foreground truncate px-2">
                              {contract.office}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center" style={{ minWidth: `${columnWidths.status}px` }}>
                            <div className="flex flex-col items-center gap-1.5">
                              <div className={`font-bold px-3 py-1.5 rounded-full border ${getStatusColor(contract.status)} shadow-sm truncate max-w-full`}>
                                {CONTRACT_STATUSES[contract.status]}
                              </div>
                              <button
                                onClick={() => openStatusHistoryModal(contract)}
                                className="text-blue-600 hover:text-blue-700 font-semibold underline hover:no-underline transition-all"
                                title="عرض تفاصيل المراحل"
                              >
                                📋 التفاصيل
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center hidden md:table-cell" style={{ minWidth: `${columnWidths.date}px` }}>
                            <div className="font-semibold text-foreground truncate">
                              {format(new Date(contract.createdAt), 'dd/MM/yy', { locale: ar })}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center hidden sm:table-cell" style={{ minWidth: `${columnWidths.days}px` }}>
                            <div className={`font-extrabold px-2 py-1 rounded-lg inline-block ${
                              daysSinceCreation >= 40 ? 'bg-red-500/20 text-red-700' :
                              daysSinceCreation >= 20 ? 'bg-orange-500/20 text-orange-700' :
                              'bg-green-500/20 text-green-700'
                            }`}>
                              {daysSinceCreation}
                            </div>
                            <div className="text-muted-foreground mt-0.5">يوم</div>
                          </td>
                          <td className="px-3 py-3 text-center hidden xl:table-cell" style={{ minWidth: `${columnWidths.creator}px` }}>
                            <div className="font-semibold text-foreground truncate">
                              {contract.createdBy?.name || '-'}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center hidden md:table-cell" style={{ minWidth: `${columnWidths.alert}px` }}>
                            {contract.hasCVIssue ? (
                              <div className="inline-flex items-center gap-1 text-destructive font-bold bg-destructive/10 px-2 py-1 rounded-full border border-destructive/30 truncate">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                <span className="hidden lg:inline truncate">{contract.cvIssueType}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-success font-bold bg-success/10 px-2 py-1 rounded-full border border-success/30">
                                <CheckCircle className="h-3 w-3" />
                                <span className="hidden lg:inline">سليم</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center" style={{ minWidth: `${columnWidths.actions}px` }}>
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

            {/* مودال الحذف المتعدد */}
            {showBulkDeleteModal && selectedContractIds.length > 0 && (
              <div className="modal-overlay">
                <div className="modal-content max-w-2xl">
                  {/* Header */}
                  <div className="bg-gradient-to-l from-red-500/10 via-destructive/5 to-transparent rounded-t-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-red-500/30 rounded-xl blur-lg"></div>
                          <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 shadow-lg">
                            <Trash2 className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">حذف عقود متعددة</h3>
                          <p className="text-sm text-muted-foreground mt-1">سيتم حذف {selectedContractIds.length} عقد نهائياً</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowBulkDeleteModal(false)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-all"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="px-6 pb-6 space-y-6">
                    {/* إحصائيات */}
                    <div className="bg-gradient-to-br from-red-500/5 to-transparent rounded-xl p-5 border-2 border-red-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-500/10 rounded-full p-2">
                            <FileText className="h-5 w-5 text-red-500" />
                          </div>
                          <h4 className="font-semibold text-foreground">العقود المحددة للحذف</h4>
                        </div>
                        <div className="bg-red-600 text-white px-4 py-2 rounded-full text-lg font-extrabold">
                          {selectedContractIds.length}
                        </div>
                      </div>
                      
                      {/* قائمة العقود المحددة */}
                      <div className="bg-background/80 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                        {contracts
                          .filter(c => selectedContractIds.includes(c.id))
                          .slice(0, 10)
                          .map((contract) => (
                            <div key={contract.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:border-red-500/30 transition-all">
                              <div className="flex-1">
                                <p className="font-bold text-foreground">{contract.contractNumber}</p>
                                <p className="text-sm text-muted-foreground">{contract.clientName} • {contract.profession}</p>
                              </div>
                              <span className="text-xs px-2 py-1 bg-red-500/10 text-red-700 rounded-full">
                                {CONTRACT_STATUSES[contract.status]}
                              </span>
                            </div>
                          ))}
                        {selectedContractIds.length > 10 && (
                          <div className="text-center p-2 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                            + {selectedContractIds.length - 10} عقد إضافي
                          </div>
                        )}
                      </div>
                    </div>

                    {/* تحذير قوي */}
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
                      <div className="flex-shrink-0 bg-red-500/20 rounded-full p-2">
                        <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                      </div>
                      <div className="text-sm">
                        <p className="text-foreground font-bold mb-2 text-lg">⚠️ تحذير شديد الأهمية!</p>
                        <ul className="text-muted-foreground space-y-1.5">
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 font-bold mt-0.5">•</span>
                            <span>سيتم حذف <strong className="text-red-600">{selectedContractIds.length} عقد</strong> بشكل نهائي ولا رجعة فيه</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 font-bold mt-0.5">•</span>
                            <span>سيتم حذف جميع البيانات المرتبطة بهذه العقود</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 font-bold mt-0.5">•</span>
                            <span>لن تتمكن من استرجاع أي من هذه العقود بعد الحذف</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-border bg-muted/20">
                    <button
                      onClick={() => setShowBulkDeleteModal(false)}
                      className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-all"
                      disabled={isSubmitting}
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleBulkDelete}
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
                          <span>حذف {selectedContractIds.length} عقد</span>
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
                                    flex-1 rounded-xl p-5 transition-all duration-300
                                    ${isCurrentStatus 
                                      ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 shadow-lg' 
                                      : 'bg-gradient-to-br from-card to-muted/20 border border-border group-hover:border-primary/20 group-hover:shadow-md'
                                    }
                                  `}>
                                    {/* Status Transition - Enhanced Display */}
                                    <div className="mb-4">
                                      {change.fromStatus ? (
                                        <div className="flex items-center gap-3 bg-muted/50 dark:bg-muted/30 rounded-xl p-4">
                                          {/* حالة البداية */}
                                          <div className="flex-1 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-lg p-3 text-center">
                                            <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase mb-1">الحالة السابقة</p>
                                            <p className="text-sm font-bold text-red-900 dark:text-red-100">
                                              {CONTRACT_STATUSES[change.fromStatus as keyof typeof CONTRACT_STATUSES]}
                                            </p>
                                          </div>
                                          
                                          {/* السهم */}
                                          <div className="flex flex-col items-center gap-1">
                                            <div className="relative">
                                              <ArrowRight className={`h-8 w-8 ${isCurrentStatus ? 'text-primary' : 'text-muted-foreground'} animate-pulse`} />
                                              <div className={`absolute inset-0 ${isCurrentStatus ? 'bg-primary/20' : 'bg-muted'} rounded-full blur-md -z-10`}></div>
                                            </div>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">انتقل</span>
                                          </div>
                                          
                                          {/* الحالة الجديدة */}
                                          <div className={`flex-1 bg-gradient-to-br rounded-lg p-3 text-center border-2 ${
                                            isCurrentStatus 
                                              ? 'from-primary/20 to-primary/10 border-primary/50' 
                                              : 'from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800/50'
                                          }`}>
                                            <p className={`text-[10px] font-bold uppercase mb-1 ${
                                              isCurrentStatus ? 'text-primary' : 'text-green-600 dark:text-green-400'
                                            }`}>
                                              الحالة الجديدة
                                            </p>
                                            <p className={`text-sm font-bold ${
                                              isCurrentStatus ? 'text-primary' : 'text-green-900 dark:text-green-100'
                                            }`}>
                                              {CONTRACT_STATUSES[change.toStatus as keyof typeof CONTRACT_STATUSES]}
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-center">
                                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">تم إنشاء العقد بحالة</p>
                                          <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                            {CONTRACT_STATUSES[change.toStatus as keyof typeof CONTRACT_STATUSES]}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-3 gap-3">
                                      {/* التاريخ والوقت */}
                                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/10 rounded-lg p-3 border border-blue-200 dark:border-blue-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="p-1.5 bg-blue-600 rounded-lg">
                                            <Calendar className="h-3.5 w-3.5 text-white" />
                                          </div>
                                          <p className="text-[9px] text-blue-900 dark:text-blue-100 font-bold uppercase">التاريخ</p>
                                        </div>
                                        <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-1">
                                          {format(new Date(change.changedAt), 'dd MMMM yyyy', { locale: ar })}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/20 rounded px-2 py-1">
                                          <Clock className="h-3 w-3" />
                                          <span className="font-bold">{format(new Date(change.changedAt), 'hh:mm a', { locale: ar })}</span>
                                        </div>
                                      </div>

                                      {/* عدد الأيام */}
                                      <div className={`bg-gradient-to-br rounded-lg p-3 border ${
                                        isCurrentStatus 
                                          ? 'from-primary/20 to-primary/10 border-primary/30' 
                                          : 'from-purple-50 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/10 border-purple-200 dark:border-purple-800/50'
                                      }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className={`p-1.5 rounded-lg ${isCurrentStatus ? 'bg-primary' : 'bg-purple-600'}`}>
                                            <Clock className="h-3.5 w-3.5 text-white" />
                                          </div>
                                          <p className={`text-[9px] font-bold uppercase ${
                                            isCurrentStatus ? 'text-primary' : 'text-purple-900 dark:text-purple-100'
                                          }`}>المدة</p>
                                        </div>
                                        <p className={`text-2xl font-extrabold ${
                                          isCurrentStatus ? 'text-primary' : 'text-purple-900 dark:text-purple-100'
                                        }`}>
                                          {daysInStatus}
                                        </p>
                                        <p className={`text-[10px] font-bold ${
                                          isCurrentStatus ? 'text-primary/70' : 'text-purple-700 dark:text-purple-300'
                                        }`}>يوم</p>
                                        {isCurrentStatus && (
                                          <div className="mt-2 text-[8px] px-2 py-0.5 bg-success/20 text-success rounded-full font-bold text-center">
                                            الحالة النشطة
                                          </div>
                                        )}
                                      </div>

                                      {/* المسؤول */}
                                      {change.changedBy && (
                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/30 dark:from-orange-950/30 dark:to-orange-900/10 rounded-lg p-3 border border-orange-200 dark:border-orange-800/50">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-orange-600 rounded-lg">
                                              <User className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <p className="text-[9px] text-orange-900 dark:text-orange-100 font-bold uppercase">المسؤول</p>
                                          </div>
                                          <p className="text-xs font-bold text-orange-900 dark:text-orange-100 mb-1 truncate" title={change.changedBy.name}>
                                            {change.changedBy.name}
                                          </p>
                                          <p className="text-[10px] font-bold text-orange-700 dark:text-orange-300">
                                            {change.changedBy.role === 'ADMIN' ? '👑 مدير' :
                                             change.changedBy.role === 'SUB_ADMIN' ? '⭐ أبوريشن' :
                                             change.changedBy.role === 'CUSTOMER_SERVICE' ? '💬 خدمة عملاء' :
                                             change.changedBy.role === 'SALES' ? '📊 مبيعات' : '👤 موظف'}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* الملاحظات إن وجدت */}
                                    {change.notes && (
                                      <div className="mt-3 bg-muted/50 rounded-lg p-3 border border-border">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                          <p className="text-[9px] text-muted-foreground font-bold uppercase">ملاحظات</p>
                                        </div>
                                        <p className="text-xs text-foreground">{change.notes}</p>
                                      </div>
                                    )}
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

            {/* مودال استيراد Excel */}
            {showImportModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => {
                if (!isImporting) {
                  setShowImportModal(false)
                  setImportFile(null)
                  setImportResults(null)
                }
              }}>
                <div className="bg-card border-2 border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-6 py-5 border-b-2 border-border/50 sticky top-0 z-10 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                          <div className="relative bg-primary/10 p-3 rounded-full">
                            <FileSpreadsheet className="h-7 w-7 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">استيراد عقود من Excel</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">قم برفع ملف Excel لاستيراد عقود متعددة</p>
                        </div>
                      </div>
                      {!isImporting && (
                        <button
                          onClick={() => {
                            setShowImportModal(false)
                            setImportFile(null)
                            setImportResults(null)
                          }}
                          className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all duration-200 hover:scale-110"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-6">
                    {/* تعليمات */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-2 border-blue-200 dark:border-blue-800/50 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-600 p-1.5 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="font-bold text-blue-900 dark:text-blue-100 text-lg">تعليمات الاستيراد</h4>
                        </div>
                        <button
                          onClick={downloadTemplateExcel}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                          title="تنزيل ملف نموذجي"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>تنزيل نموذج</span>
                        </button>
                      </div>
                      <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-2 mr-5">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                          <span>يجب أن يكون الملف بصيغة Excel (.xlsx أو .xls)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                          <span>يجب أن تكون أسماء الأعمدة مطابقة تماماً لملف التصدير</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                          <span><strong>الحقول المطلوبة:</strong> رقم العقد، العميل، رقم جواز العاملة، الدولة، المكتب، ممثل المبيعات</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                          <span>يمكنك تنزيل الملف النموذجي أعلاه ثم تعبئته بالبيانات</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 dark:text-red-400 font-bold mt-0.5">⚠</span>
                          <span className="font-semibold text-red-800 dark:text-red-300">سيتم رفض العقود ذات الأرقام المكررة (في الملف أو السيستم)</span>
                        </li>
                      </ul>
                    </div>

                    {/* رفع الملف */}
                    <div className="bg-muted/30 border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                      <label className="block text-base font-bold text-foreground mb-3 flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        اختر ملف Excel
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setImportFile(file)
                            setImportResults(null)
                          }
                        }}
                        disabled={isImporting}
                        className="w-full px-4 py-3 bg-input border-2 border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-primary file:to-primary/80 file:text-white hover:file:from-primary/90 hover:file:to-primary/70 disabled:opacity-50 cursor-pointer transition-all"
                      />
                      {importFile && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 rounded-lg flex items-center gap-3">
                          <div className="bg-green-600 p-2 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-green-900 dark:text-green-100">{importFile.name}</p>
                            <p className="text-xs text-green-700 dark:text-green-300">الحجم: {(importFile.size / 1024).toFixed(2)} كيلوبايت</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* نتائج الاستيراد */}
                    {importResults && (
                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border rounded-xl p-5 space-y-4 shadow-inner animate-in slide-in-from-top-5 duration-500">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-primary" />
                          </div>
                          <h4 className="font-bold text-foreground text-lg">نتائج الاستيراد</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="bg-green-600 p-2 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-white" />
                              </div>
                              <span className="font-bold text-green-900 dark:text-green-100">تم بنجاح</span>
                            </div>
                            <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{importResults.success}</p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">عقد مستورد</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="bg-red-600 p-2 rounded-lg">
                                <XCircle className="h-5 w-5 text-white" />
                              </div>
                              <span className="font-bold text-red-900 dark:text-red-100">فشل</span>
                            </div>
                            <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">{importResults.failed}</p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">عقد مرفوض</p>
                          </div>
                        </div>

                        {importResults.errors && importResults.errors.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="bg-red-600 p-1.5 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-white" />
                              </div>
                              <h5 className="font-bold text-red-900 dark:text-red-100">الأخطاء المكتشفة:</h5>
                            </div>
                            <ul className="text-sm text-red-800 dark:text-red-200 space-y-2">
                              {importResults.errors.map((error, index) => (
                                <li key={index} className="flex items-start gap-2 bg-red-100/50 dark:bg-red-900/20 p-2 rounded-lg">
                                  <span className="text-red-600 dark:text-red-400 font-bold mt-0.5 flex-shrink-0">⚠</span>
                                  <span className="flex-1">{error}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* رسالة الإغلاق التلقائي */}
                        {importResults.failed === 0 && (
                          <div className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-2 border-green-200 dark:border-green-800/50 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-600 p-2 rounded-lg animate-pulse">
                                <CheckCircle className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-green-900 dark:text-green-100">✅ تم الاستيراد بنجاح!</p>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">سيتم إغلاق النافذة تلقائياً بعد 3 ثواني...</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* أزرار */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleImportExcel}
                        disabled={!importFile || isImporting}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:from-primary/90 hover:to-primary/70 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
                      >
                        {isImporting ? (
                          <>
                            <div className="relative">
                              <RefreshCw className="h-6 w-6 animate-spin" />
                              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                            </div>
                            <span>جاري الاستيراد...</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-6 w-6" />
                            <span>بدء الاستيراد</span>
                          </>
                        )}
                      </button>
                      
                      {!isImporting && (
                        <button
                          onClick={() => {
                            setShowImportModal(false)
                            setImportFile(null)
                            setImportResults(null)
                          }}
                          className="px-6 py-4 bg-muted hover:bg-muted/70 text-foreground rounded-xl transition-all font-bold text-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 border-2 border-border"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Footer للملاحظة */}
                  {isImporting && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800/50 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping"></div>
                          <div className="relative bg-blue-600 p-2 rounded-full">
                            <RefreshCw className="h-5 w-5 text-white animate-spin" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-100">جاري معالجة البيانات...</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">يرجى الانتظار حتى اكتمال العملية</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* مودال إعدادات تصدير PDF */}
          {showPdfOptionsModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">خيارات تصدير PDF</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      اختر الأعمدة التي تريد تضمينها وتحكم في حجم الخط قبل إنشاء ملف PDF
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPdfOptionsModal(false)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {/* اختيار لغة التقرير */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">لغة التقرير (Report language)</h4>
                    <div className="inline-flex items-center gap-2 bg-muted/60 border border-border rounded-full p-1">
                      <button
                        type="button"
                        onClick={() => setPdfLanguage('ar')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          pdfLanguage === 'ar'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        عربي
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfLanguage('en')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          pdfLanguage === 'en'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">الأعمدة في التقرير</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {pdfColumnsConfig.map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border text-xs cursor-pointer hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-primary"
                            checked={pdfSelectedColumns.includes(col.key)}
                            onChange={() => togglePdfColumn(col.key)}
                          />
                          <span className="text-foreground">{col.labelAr}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground mb-1">حجم الخط في ملف PDF</h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={7}
                        max={13}
                        value={pdfFontSize}
                        onChange={(e) => setPdfFontSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-16 text-center">
                        {pdfFontSize}px
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      الحجم الأصغر يناسب عدد أعمدة أكبر، والحجم الأكبر مناسب للتقارير المختصرة
                    </p>
                    <div className="mt-1 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3">
                      <p className="text-[11px] text-muted-foreground mb-1">معاينة فورية لحجم الخط:</p>
                      <p
                        className="font-medium text-foreground"
                        style={{ fontSize: `${pdfFontSize}px`, lineHeight: '1.6' }}
                      >
                        مثال: تقرير العقود الرسمية – هذا النص يوضح لك شكل الخط داخل ملف الـ PDF بالحجم الحالي.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border bg-muted/40 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setShowPdfOptionsModal(false)}
                    className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      setShowPdfOptionsModal(false)
                      const exportType = (window as any).__pdfExportType as 'all' | 'selected'
                      handleExportPDF(exportType || 'all')
                    }}
                    className="px-4 py-2 rounded-lg bg-primary hover:opacity-90 text-white text-sm font-medium flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    <span>إنشاء PDF الآن</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          </>
  )
}

export default function AddContractsPage() {
  return (
    <DashboardLayout>
      {(userData) => (
        <>
          <AddContractsPageContent userData={userData} />

          {/* مودال إعدادات تصدير PDF */}
          {/* ملاحظة: هذا المودال مستقل عن المحتوى الأساسي */}
        </>
      )}
    </DashboardLayout>
  )
}
