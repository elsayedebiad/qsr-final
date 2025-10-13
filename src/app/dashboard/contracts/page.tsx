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
import ProfileImage from '@/components/ProfileImage'

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
    status: string
  }
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // فلترة التعاقدات حسب البحث
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredContracts(contracts)
    } else {
      const filtered = contracts.filter(contract =>
        contract.cv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.identityNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contract.cv.referenceCode && contract.cv.referenceCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.cv.nationality && contract.cv.nationality.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredContracts(filtered)
    }
  }, [searchTerm, contracts])

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

          {/* شريط البحث */}
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="البحث بالاسم أو رقم الهوية أو الكود المرجعي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
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
                  <th>تاريخ وقت التعاقد</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>
                      <div className="flex items-center">
                        <ProfileImage
                          src={contract.cv.profileImage}
                          alt={contract.cv.fullName}
                          size="md"
                          className="flex-shrink-0"
                          clickable={true}
                          title={`صورة ${contract.cv.fullName}`}
                          subtitle={`الكود المرجعي: ${contract.cv.referenceCode || 'غير محدد'}`}
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
                          onClick={() => router.push(`/dashboard/cv/${contract.cv.id}/alqaeid`)} 
                          className="text-muted-foreground hover:text-primary transition-colors" 
                          title="عرض السيرة الذاتية"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* حذف التعاقد - متاح للمدراء فقط (ليس للمبيعات) */}
                        {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
                          <button 
                            onClick={() => openDeleteModal(contract)} 
                            className="text-muted-foreground hover:text-destructive transition-colors" 
                            title="حذف التعاقد"
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
        </div>
      )}
    </DashboardLayout>
  )
}
