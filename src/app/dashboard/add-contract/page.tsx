'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  FileText, 
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Save,
  User,
  Users,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
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
  REJECTED: 'مرفوض',
  CANCELLED: 'ملغي',
  OUTSIDE_KINGDOM: 'خارج المملكة'
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

interface SalesRep {
  id: number
  name: string
}

function AddContractPageContent({ userData }: { userData: any }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(userData)

  // Update user when userData changes
  useEffect(() => {
    if (userData) {
      setUser(userData)
    }
  }, [userData])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCV, setSelectedCV] = useState<CVData | null>(null)
  const [isSearchingCV, setIsSearchingCV] = useState(false)
  const [cvSearchMessage, setCvSearchMessage] = useState('')
  const [showAddSalesRepModal, setShowAddSalesRepModal] = useState(false)
  const [newSalesRepName, setNewSalesRepName] = useState('')

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

  // جلب ممثلي المبيعات
  const fetchSalesReps = async () => {
    try {
      const response = await fetch('/api/sales-representatives')
      if (response.ok) {
        const data = await response.json()
        setSalesReps(data)
      }
    } catch (error) {
      console.error('❌ خطأ في جلب ممثلي المبيعات:', error)
    }
  }

  useEffect(() => {
    fetchSalesReps()
  }, [])

  // البحث عن السيرة الذاتية برقم الجواز
  const searchCVByPassport = async (passportNumber: string) => {
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
        
        // تعبئة بعض البيانات تلقائياً (بدون اسم العميل)
        setFormData(prev => ({
          ...prev,
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
  }

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
        
        // إعادة التوجيه لصفحة العقود
        setTimeout(() => {
          router.push('/dashboard/add-contracts')
        }, 1500)
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
        toast.success('✅ تم إضافة ممثل المبيعات بنجاح')
        setNewSalesRepName('')
        fetchSalesReps()
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
  const handleDeleteSalesRep = async (id: number, name: string) => {
    if (!confirm(`⚠️ هل أنت متأكد من حذف "${name}" من قائمة ممثلي المبيعات؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) return

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/sales-representatives?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(`✅ تم حذف "${name}" بنجاح`)
        await fetchSalesReps() // تحديث القائمة
        
        // إذا كان الممثل المحذوف مختاراً في النموذج، قم بإزالته
        if (formData.salesRepName === name) {
          setFormData({...formData, salesRepName: ''})
          toast('ℹ️ تم إزالة الممثل من النموذج', { 
            icon: 'ℹ️',
            duration: 3000 
          })
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ أثناء حذف ممثل المبيعات')
      }
    } catch (error) {
      console.error('❌ خطأ:', error)
      toast.error('حدث خطأ أثناء حذف ممثل المبيعات')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
          <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="max-w-6xl mx-auto px-4 py-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => router.push('/dashboard/add-contracts')}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="رجوع"
                  >
                    <ArrowRight className="h-6 w-6" />
                  </button>
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">إضافة عقد جديد</h1>
                    <p className="text-muted-foreground">أدخل بيانات العقد بشكل كامل ودقيق</p>
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-card border border-border rounded-2xl shadow-lg">
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  {/* القسم 1: نوع العقد وممثل المبيعات */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      معلومات أساسية
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          نوع العقد <span className="text-destructive">*</span>
                        </label>
                        <select
                          value={formData.contractType}
                          onChange={(e) => setFormData({...formData, contractType: e.target.value})}
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="SPECIFIC">معين</option>
                          <option value="BY_SPECIFICATIONS">حسب المواصفات</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          اسم ممثل المبيعات <span className="text-destructive">*</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={formData.salesRepName}
                            onChange={(e) => setFormData({...formData, salesRepName: e.target.value})}
                            className="flex-1 px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                            className="px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 font-semibold group"
                            title="إدارة ممثلي المبيعات"
                          >
                            <Users className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span className="hidden sm:inline">إدارة</span>
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          يمكنك إضافة أو حذف ممثلي المبيعات من زر الإدارة ⬆️
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* القسم 2: رقم الجواز والبحث عن السيرة */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      بيانات العاملة
                    </h2>
                    
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
                            const value = e.target.value
                            if (value.length >= 5) {
                              searchCVByPassport(value)
                            } else {
                              setSelectedCV(null)
                              setCvSearchMessage('')
                            }
                          }}
                          className="w-full px-4 py-3 bg-input border-2 border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          placeholder="أدخل رقم الجواز للبحث عن السيرة الذاتية"
                          required
                        />
                        {isSearchingCV && (
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <div className="spinner w-5 h-5"></div>
                          </div>
                        )}
                      </div>
                      {cvSearchMessage && (
                        <div className={`mt-3 p-4 rounded-lg border ${
                          cvSearchMessage.startsWith('✅') 
                            ? 'bg-success/10 border-success/30 text-success' 
                            : 'bg-warning/10 border-warning/30 text-warning'
                        }`}>
                          <p className="text-sm font-medium">{cvSearchMessage}</p>
                        </div>
                      )}
                    </div>

                    {/* بطاقة السيرة الذاتية */}
                    {selectedCV && (
                      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-success" />
                            السيرة الذاتية المختارة للتعاقد
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCV(null)
                              setCvSearchMessage('')
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-muted"
                            title="إلغاء الاختيار"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="flex gap-6">
                          <img
                            src={selectedCV.profileImage || selectedCV.cvImageUrl || '/placeholder.jpg'}
                            alt={selectedCV.fullName}
                            className="w-24 h-24 rounded-xl object-cover border-2 border-border shadow-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'data:image/svg+xml,%3Csvg width="80" height="80" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="80" height="80" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E👤%3C/text%3E%3C/svg%3E'
                            }}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-bold text-foreground">{selectedCV.fullName}</h4>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
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
                            <div className="flex gap-6 text-sm text-muted-foreground">
                              {selectedCV.nationality && (
                                <span className="flex items-center gap-1">🌍 {selectedCV.nationality}</span>
                              )}
                              {selectedCV.position && (
                                <span className="flex items-center gap-1">💼 {selectedCV.position}</span>
                              )}
                              {selectedCV.age && (
                                <span className="flex items-center gap-1">🎂 {selectedCV.age} سنة</span>
                              )}
                            </div>
                            {selectedCV.contractStatus && (
                              <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                                <p className="text-sm text-warning font-medium flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  {selectedCV.contractStatus}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* القسم 3: معلومات العميل والعقد */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      معلومات العميل والعقد
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          اسم العميل <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.clientName}
                          onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          رقم الجوال المساند
                        </label>
                        <input
                          type="text"
                          value={formData.supportMobileNumber}
                          onChange={(e) => setFormData({...formData, supportMobileNumber: e.target.value})}
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* القسم 4: التاريخ والمكان */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      التاريخ والمكان
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* القسم 5: المهنة والهويات */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      المهنة والهويات
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          المهنة <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.profession}
                          onChange={(e) => setFormData({...formData, profession: e.target.value})}
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* القسم 6: المكتب */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      المكتب
                    </h2>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        اختيار المكتب <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={formData.office}
                        onChange={(e) => setFormData({...formData, office: e.target.value})}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="">اختر المكتب</option>
                        {OFFICES.map((office) => (
                          <option key={office} value={office}>{office}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* القسم 7: الحالة */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      حالة العقد
                    </h2>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        الحالة <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as keyof typeof CONTRACT_STATUSES})}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      >
                        {Object.entries(CONTRACT_STATUSES).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>

                    {formData.status === 'CV_REQUEST' && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          تاريخ طلب رفع السيرة
                        </label>
                        <input
                          type="date"
                          value={formData.cvUploadRequestDate}
                          onChange={(e) => setFormData({...formData, cvUploadRequestDate: e.target.value})}
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}

                    {formData.status === 'EXTERNAL_OFFICE_APPROVAL' && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          تاريخ طلب التوظيف
                        </label>
                        <input
                          type="date"
                          value={formData.employmentRequestDate}
                          onChange={(e) => setFormData({...formData, employmentRequestDate: e.target.value})}
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}
                  </div>

                  {/* القسم 8: ملاحظات ومشاكل */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      ملاحظات ومشاكل
                    </h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ملاحظات المتابعة
                      </label>
                      <textarea
                        value={formData.followUpNotes}
                        onChange={(e) => setFormData({...formData, followUpNotes: e.target.value})}
                        rows={5}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="أدخل أي ملاحظات متعلقة بالعقد..."
                      />
                    </div>

                    <div className="space-y-4 bg-muted/30 p-6 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="hasCVIssue"
                          checked={formData.hasCVIssue}
                          onChange={(e) => setFormData({...formData, hasCVIssue: e.target.checked})}
                          className="w-5 h-5 text-primary bg-input border-border rounded focus:ring-2 focus:ring-primary"
                        />
                        <label htmlFor="hasCVIssue" className="text-sm font-medium text-foreground cursor-pointer">
                          يوجد مشكلة في السيرة الذاتية (تبديل أو توثيق)
                        </label>
                      </div>

                      {formData.hasCVIssue && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            نوع المشكلة
                          </label>
                          <select
                            value={formData.cvIssueType}
                            onChange={(e) => setFormData({...formData, cvIssueType: e.target.value})}
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">اختر نوع المشكلة</option>
                            <option value="تبديل">تبديل</option>
                            <option value="توثيق">توثيق</option>
                            <option value="تبديل وتوثيق">تبديل وتوثيق</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* القسم 9: الموظف المنشئ */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      معلومات النظام
                    </h2>
                    
                    <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-muted-foreground mb-1">
                            الموظف المنشئ للعقد
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={userData?.name || 'جاري التحميل...'}
                              readOnly
                              className="flex-1 px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground font-semibold cursor-not-allowed"
                            />
                            <div className="px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
                              <span className="text-sm font-medium text-primary">
                                {userData?.role === 'ADMIN' ? 'مدير' :
                                 userData?.role === 'SUB_ADMIN' ? 'أبوريشن' :
                                 userData?.role === 'CUSTOMER_SERVICE' ? 'خدمة عملاء' :
                                 userData?.role === 'SALES' ? 'مبيعات' :
                                 userData?.role === 'DEVELOPER' ? 'مطور' : 'موظف'}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            سيتم حفظ اسمك تلقائياً مع هذا العقد
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-border">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/add-contracts')}
                      className="flex-1 px-6 py-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-all"
                      disabled={isSubmitting}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-4 bg-primary hover:opacity-90 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner w-5 h-5"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          حفظ العقد
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* مودال إضافة ممثل مبيعات */}
            {showAddSalesRepModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-2.5 rounded-xl border border-primary/20">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">
                            إدارة ممثلي المبيعات
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            إضافة، عرض، أو حذف ممثلي المبيعات
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddSalesRepModal(false)
                          setNewSalesRepName('')
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-muted"
                        disabled={isSubmitting}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-6">
                    {/* إضافة جديد */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        الاسم الكامل <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={newSalesRepName}
                        onChange={(e) => setNewSalesRepName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSalesRepName.trim()) {
                            handleAddSalesRep()
                          }
                        }}
                        className="w-full px-4 py-3 bg-input border-2 border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="مثال: أحمد محمد"
                        autoFocus
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        سيتم إضافة هذا الاسم إلى قائمة ممثلي المبيعات
                      </p>
                    </div>

                    {/* قائمة ممثلي المبيعات الحاليين */}
                    {salesReps.length === 0 ? (
                      <div className="border-t border-border pt-4">
                        <div className="text-center py-8 px-4 bg-muted/20 border-2 border-dashed border-border rounded-xl">
                          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <h5 className="text-sm font-semibold text-foreground mb-1">لا يوجد ممثلي مبيعات بعد</h5>
                          <p className="text-xs text-muted-foreground">أضف أول ممثل مبيعات من الحقل أعلاه</p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            ممثلو المبيعات الحاليون
                          </h4>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                            {salesReps.length} ممثل
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {salesReps.map((rep, index) => (
                            <div 
                              key={rep.id} 
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/40 rounded-lg border border-border/50 hover:border-border transition-all group shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                  {index + 1}
                                </div>
                                <span className="text-sm font-semibold text-foreground">{rep.name}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteSalesRep(rep.id, rep.name)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/30 rounded-lg transition-all duration-200 opacity-70 group-hover:opacity-100"
                                title={`حذف ${rep.name}`}
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 bg-blue-500/5 border border-blue-500/10 p-2 rounded-lg">
                          💡 <strong>نصيحة:</strong> مرر فوق الاسم لإظهار زر الحذف
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-muted/20 border-t border-border rounded-b-2xl">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAddSalesRepModal(false)
                          setNewSalesRepName('')
                        }}
                        className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-all"
                        disabled={isSubmitting}
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleAddSalesRep}
                        className="flex-1 px-4 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting || !newSalesRepName.trim()}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="spinner w-4 h-4 border-white"></div>
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            حفظ الآن
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
  )
}

export default function AddContractPage() {
  return (
    <DashboardLayout>
      {(userData) => <AddContractPageContent userData={userData} />}
    </DashboardLayout>
  )
}

