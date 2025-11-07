'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Briefcase, 
  Search, 
  Eye, 
  X, 
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { processImageUrl } from '@/lib/url-utils'

interface Contract {
  id: number
  cvId: number
  identityNumber: string
  contractStartDate: string
  contractEndDate?: string | null
  createdAt: string
  updatedAt: string
  cv: {
    id: number
    fullName: string
    fullNameArabic?: string
    referenceCode?: string
    nationality?: string
    position?: string
    profileImage?: string
    cvImageUrl?: string
    status: string
  }
  createdBy?: {
    id: number
    name: string
    email: string
    role: string
  } | null
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState<string>('')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCVForView, setSelectedCVForView] = useState<Contract | null>(null)
  
  // قائمة الموظفين الفريدة
  const uniqueEmployees = Array.from(
    new Set(contracts.map(c => c.createdBy?.name).filter(Boolean))
  ).sort()

  // جلب التعاقدات من قاعدة البيانات
  const fetchContracts = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 جلب التعاقدات من قاعدة البيانات...')
      const response = await fetch('/api/contracts')
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ تم جلب ${data.length} تعاقد`)
        setContracts(data || [])
        setFilteredContracts(data || [])
        
        if (data.length > 0) {
          toast.success(`تم تحميل ${data.length} تعاقد من قاعدة البيانات`)
        }
      } else {
        const errorData = await response.json()
        console.error('❌ خطأ في جلب التعاقدات:', errorData)
        toast.error(`فشل في تحميل التعاقدات: ${errorData.error || 'خطأ غير معروف'}`)
      }
    } catch (error) {
      console.error('❌ خطأ في الشبكة:', error)
      toast.error('حدث خطأ أثناء الاتصال بقاعدة البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  // تحميل التعاقدات عند بدء الصفحة
  useEffect(() => {
    fetchContracts()
  }, [])

  // إدارة modal السيرة الذاتية
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCVForView(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  // منع التمرير عند فتح modal
  useEffect(() => {
    if (selectedCVForView) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedCVForView])

  // فلترة التعاقدات حسب البحث والموظف
  useEffect(() => {
    let filtered = contracts

    // فلترة حسب البحث
    if (searchTerm !== '') {
      filtered = filtered.filter(contract =>
        contract.cv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.identityNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contract.cv.referenceCode && contract.cv.referenceCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.cv.nationality && contract.cv.nationality.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.createdBy?.name && contract.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // فلترة حسب الموظف
    if (employeeFilter !== '') {
      filtered = filtered.filter(contract => 
        contract.createdBy?.name === employeeFilter
      )
    }

    setFilteredContracts(filtered)
  }, [searchTerm, employeeFilter, contracts])

  // تنسيق التاريخ والوقت (12 ساعة)
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const timeFormatted = format(date, 'hh:mm a')
      // تحويل AM/PM للعربية
      const timeArabic = timeFormatted
        .replace('AM', 'ص')
        .replace('PM', 'م')
      
      return {
        date: format(date, 'dd/MM/yyyy', { locale: ar }),
        time: timeArabic
      }
    } catch (error) {
      return { date: 'غير محدد', time: '' }
    }
  }

  // فتح مودال الحذف
  const openDeleteModal = (contract: Contract) => {
    setSelectedContract(contract)
    setShowDeleteModal(true)
  }

  // إغلاق مودال الحذف
  const closeDeleteModal = () => {
    setSelectedContract(null)
    setShowDeleteModal(false)
    setIsDeleting(false)
  }

  // تأكيد حذف التعاقد
  const confirmDeleteContract = async () => {
    if (!selectedContract) return

    setIsDeleting(true)
    
    try {
      console.log('🗑️ حذف التعاقد:', selectedContract.id)
      
      const response = await fetch(`/api/contracts?id=${selectedContract.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('تم حذف التعاقد بنجاح. السيرة الذاتية متاحة الآن للحجز.')
        closeDeleteModal()
        fetchContracts() // إعادة تحميل التعاقدات
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في حذف التعاقد')
      }
    } catch (error) {
      console.error('❌ خطأ في حذف التعاقد:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف التعاقد')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        {() => (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="spinner w-32 h-32 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">جاري تحميل التعاقدات من قاعدة البيانات...</p>
            </div>
          </div>
        )}
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {(user) => (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-primary ml-3" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">إدارة التعاقدات</h1>
                <p className="text-muted-foreground">عرض وإدارة جميع التعاقدات من قاعدة البيانات</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchContracts}
                className="bg-success hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <div className="bg-primary/10 px-4 py-2 rounded-lg">
                <span className="text-primary font-semibold">
                  {filteredContracts.length} تعاقد
                </span>
              </div>
            </div>
          </div>

          {/* شريط البحث والفلاتر */}
          <div className="bg-card p-4 rounded-lg border border-border space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="البحث بالاسم أو رقم الهوية أو الكود المرجعي أو اسم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
            
            {/* فلتر الموظفين */}
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              >
                <option value="">جميع الموظفين</option>
                {uniqueEmployees.map((employee) => (
                  <option key={employee} value={employee}>
                    {employee}
                  </option>
                ))}
              </select>
              {employeeFilter && (
                <button
                  onClick={() => setEmployeeFilter('')}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="إلغاء الفلتر"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* جدول التعاقدات */}
          <div className="bg-card border border-border overflow-hidden rounded-lg">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>رقم الهوية</th>
                  <th>الجنسية</th>
                  <th>الوظيفة</th>
                  <th>الموظف المنشئ</th>
                  <th>تاريخ وقت التعاقد</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>
                      <div className="flex items-center">
                        <img 
                          src={processImageUrl(contract.cv.profileImage)}
                          alt={contract.cv.fullName}
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (!target.src.startsWith('data:')) {
                              target.src = 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3C/svg%3E'
                            }
                          }}
                        />
                        <div className="mr-4">
                          <div className="text-sm font-medium text-foreground">
                            {contract.cv.fullName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {contract.cv.referenceCode || 'بدون كود'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {contract.identityNumber || 'غير متوفر'}
                      </span>
                    </td>
                    <td className="text-muted-foreground">
                      {contract.cv.nationality || 'غير محدد'}
                    </td>
                    <td className="text-muted-foreground">
                      {contract.cv.position || 'غير محدد'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`${contract.createdBy ? 'bg-primary/10' : 'bg-muted'} rounded-full p-1.5`}>
                          <User className={`h-3.5 w-3.5 ${contract.createdBy ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {contract.createdBy?.name || 'غير معروف'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {contract.createdBy ? (
                              contract.createdBy.role === 'ADMIN' ? 'أدمن' :
                              contract.createdBy.role === 'SUB_ADMIN' ? 'أبوريشن' :
                              contract.createdBy.role === 'CUSTOMER_SERVICE' ? 'خدمة عملاء' :
                              contract.createdBy.role === 'SALES' ? 'مبيعات' :
                              contract.createdBy.role === 'DEVELOPER' ? 'مطور' :
                              'موظف'
                            ) : (
                              'عقد قديم'
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="bg-muted rounded-lg p-3 space-y-2 border border-border">
                        <div className="flex items-center text-foreground">
                          <div className="bg-primary/10 rounded-full p-1 ml-2">
                            <Calendar className="h-3 w-3 text-primary" />
                          </div>
                          <span className="font-semibold text-xs">
                            {formatDateTime(contract.contractStartDate || contract.createdAt).date}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-success/10 rounded-full p-1 ml-2">
                            <Clock className="h-3 w-3 text-success" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(contract.contractStartDate || contract.createdAt).time}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground text-center pt-1 border-t border-border">
                          تاريخ التعاقد (12 ساعة)
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setSelectedCVForView(contract)} 
                          className="text-muted-foreground hover:text-primary transition-colors" 
                          title="عرض صورة السيرة الذاتية (CV Image)"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* إرجاع/حذف التعاقد - متاح للأدمن والأبوريشن وخدمة العملاء */}
                        {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'DEVELOPER' || user?.role === 'CUSTOMER_SERVICE') && (
                          <button 
                            onClick={() => openDeleteModal(contract)} 
                            className="text-muted-foreground hover:text-destructive transition-colors" 
                            title="إرجاع/حذف التعاقد"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* رسالة عدم وجود تعاقدات */}
          {filteredContracts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                {searchTerm ? 'لا توجد نتائج تطابق بحثك' : 'لا توجد تعاقدات في قاعدة البيانات'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? 'جرّب البحث بكلمات أخرى.' : 'ابدأ بالتعاقد مع السير الذاتية من صفحة الحجوزات.'}
              </p>
              {!searchTerm && (
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/dashboard/bookings')}
                    className="btn-primary"
                  >
                    اذهب لصفحة الحجوزات
                  </button>
                </div>
              )}
            </div>
          )}

          {/* مودال حذف التعاقد */}
          {showDeleteModal && selectedContract && (
            <div className="modal-overlay">
              <div className="modal-content p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    تأكيد حذف التعاقد
                  </h3>
                  <button
                    onClick={closeDeleteModal}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isDeleting}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-foreground mb-2">معلومات التعاقد:</h4>
                    <div className="text-sm text-foreground space-y-1">
                      <p><span className="font-medium">الاسم:</span> {selectedContract.cv.fullName}</p>
                      <p><span className="font-medium">رقم الهوية:</span> {selectedContract.identityNumber || 'غير محدد'}</p>
                      <p><span className="font-medium">الكود المرجعي:</span> {selectedContract.cv.referenceCode || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4">
                    <p className="text-sm text-foreground">
                      <strong>تحذير:</strong> عند حذف التعاقد سيتم:
                    </p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                      <li>• حذف التعاقد نهائياً من قاعدة البيانات</li>
                      <li>• إرجاع السيرة الذاتية إلى حالة "جديد"</li>
                      <li>• إتاحة السيرة للحجز والتعاقد مرة أخرى</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 btn-secondary"
                    disabled={isDeleting}
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmDeleteContract}
                    className="flex-1 btn-destructive flex items-center justify-center gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="spinner w-4 h-4"></div>
                        جاري الحذف...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        تأكيد الحذف
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal عرض صورة السيرة الذاتية - نفس أسلوب cv/[id] */}
          {selectedCVForView && (
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-2 sm:p-4 overflow-y-auto"
              onClick={() => setSelectedCVForView(null)}
            >
              <div 
                className="bg-background w-full max-w-7xl my-8"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header - مبسط */}
                <div className="bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">
                        {selectedCVForView.cv.fullName}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        الكود المرجعي: {selectedCVForView.cv.referenceCode || 'غير محدد'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCVForView(null)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-muted"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* صورة السيرة - عرض مباشر بسيط */}
                <div className="bg-muted p-4 sm:p-8">
                  {(selectedCVForView.cv.cvImageUrl || selectedCVForView.cv.profileImage) ? (
                    <div className="relative w-full flex justify-center">
                      <img
                        src={(() => {
                          // أولوية: cvImageUrl (صورة قالب السيرة الكامل)
                          if (selectedCVForView.cv.cvImageUrl) {
                            const fileId = selectedCVForView.cv.cvImageUrl.match(/[-\w]{25,}/)?.[0]
                            if (fileId) {
                              return `https://images.weserv.nl/?url=${encodeURIComponent(`https://drive.google.com/uc?export=view&id=${fileId}`)}&w=2000&output=webp`
                            }
                            return selectedCVForView.cv.cvImageUrl
                          }
                          // بديل: profileImage
                          return processImageUrl(selectedCVForView.cv.profileImage)
                        })()}
                        alt={`سيرة ذاتية - ${selectedCVForView.cv.fullName}`}
                        className="max-w-full h-auto shadow-2xl rounded-lg border border-border"
                        style={{ 
                          maxHeight: '2000px',
                          width: 'auto',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          // جرب cvImageUrl أولاً
                          if (selectedCVForView.cv.cvImageUrl && !target.src.includes(selectedCVForView.cv.cvImageUrl)) {
                            target.src = selectedCVForView.cv.cvImageUrl
                          } 
                          // ثم جرب profileImage
                          else if (selectedCVForView.cv.profileImage && !target.src.includes(selectedCVForView.cv.profileImage)) {
                            target.src = processImageUrl(selectedCVForView.cv.profileImage)
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-muted rounded-lg w-32 h-40 mx-auto mb-4 flex items-center justify-center">
                        <User className="h-16 w-16 text-muted-foreground" />
                      </div>
                      <p className="text-foreground text-lg font-semibold">لا توجد صورة سيرة ذاتية</p>
                      <p className="text-muted-foreground text-sm mt-2">لم يتم رفع صورة السيرة الذاتية لهذا المتعاقد</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
