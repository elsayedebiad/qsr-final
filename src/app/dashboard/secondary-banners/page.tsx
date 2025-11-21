'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import SmoothProgressBar from '@/components/SmoothProgressBar'
import { 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  X,
  Save,
  RefreshCw,
  FileImage,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
  ChevronDown,
  Monitor,
  Smartphone
} from 'lucide-react'
import { compressAndConvertImage, isValidImageFile, isValidFileSize, getImageInfo } from '@/lib/image-utils'

interface SecondaryBanner {
  id: number
  salesPageId: string
  imageUrl: string
  deviceType: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function SecondaryBannersPage() {
  const [banners, setBanners] = useState<SecondaryBanner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSalesPage, setSelectedSalesPage] = useState('sales1')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<SecondaryBanner | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imagePreviews, setImagePreviews] = useState<Array<{preview: string, info: {width: number, height: number, size: string}, url: string}>>([]) 
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedBanners, setSelectedBanners] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // بيانات النموذج
  const [formData, setFormData] = useState({
    deviceType: 'DESKTOP',
    order: 0
  })

  const salesPages = [
    { id: 'sales1', name: 'Sales 1' },
    { id: 'sales2', name: 'Sales 2' },
    { id: 'sales3', name: 'Sales 3' },
    { id: 'sales4', name: 'Sales 4' },
    { id: 'sales5', name: 'Sales 5' },
    { id: 'sales6', name: 'Sales 6' },
    { id: 'sales7', name: 'Sales 7' },
    { id: 'sales8', name: 'Sales 8' },
    { id: 'sales9', name: 'Sales 9' },
    { id: 'sales10', name: 'Sales 10' },
    { id: 'sales11', name: 'Sales 11' }
  ]

  // جلب البنرات
  const fetchBanners = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/secondary-banners?salesPageId=${selectedSalesPage}`)
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
      } else {
        toast.error('فشل في جلب البنرات')
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('حدث خطأ أثناء جلب البنرات')
    } finally {
      setIsLoading(false)
    }
  }, [selectedSalesPage])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  // معالجة اختيار الصور المتعددة
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    
    // التحقق من صحة جميع الملفات
    for (const file of fileArray) {
      if (!isValidImageFile(file)) {
        toast.error(`نوع الملف "${file.name}" غير مدعوم`)
        continue
      }
      if (!isValidFileSize(file, 5)) {
        toast.error(`حجم الملف "${file.name}" كبير جداً. الحد الأقصى 5 ميجابايت`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const processedImages = []
      const totalFiles = validFiles.length
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const progressBase = (i / totalFiles) * 100
        const progressStep = 100 / totalFiles

        // محاكاة تقدم سلس للرفع
        const simulateProgress = async (target: number, duration: number) => {
          const steps = 5
          const stepDelay = duration / steps
          const stepSize = (target - uploadProgress) / steps
          
          for (let j = 1; j <= steps; j++) {
            await new Promise(resolve => setTimeout(resolve, stepDelay))
            setUploadProgress(prev => Math.min(prev + stepSize, target))
          }
        }

        // الحصول على معلومات الصورة
        await simulateProgress(progressBase + progressStep * 0.3, 200)
        const info = await getImageInfo(file)

        // إنشاء معاينة
        await simulateProgress(progressBase + progressStep * 0.6, 300)
        const preview = await compressAndConvertImage(file, 400, 300, 0.7)

        // ضغط الصورة للتخزين
        await simulateProgress(progressBase + progressStep * 0.9, 400)
        const maxWidth = formData.deviceType === 'DESKTOP' ? 1200 : 800
        const maxHeight = formData.deviceType === 'DESKTOP' ? 600 : 800
        
        const compressedImage = await compressAndConvertImage(file, maxWidth, maxHeight, 0.8)
        
        processedImages.push({
          preview,
          info,
          url: compressedImage
        })

        await simulateProgress(progressBase + progressStep, 100)
      }
      
      // إضافة الصور الجديدة للقائمة الموجودة (أو استبدالها في حالة التعديل)
      setImagePreviews(prev => editingBanner ? processedImages : [...prev, ...processedImages])
      setSelectedFiles(prev => [...prev, ...validFiles])
      toast.success(`تم رفع ${validFiles.length} صورة بنجاح`)
      
      // إعادة تعيين الـ input
      event.target.value = ''
    } catch (error) {
      console.error('Error processing images:', error)
      toast.error('فشل في معالجة بعض الصور')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // إزالة صورة معينة من القائمة
  const handleRemoveImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // إزالة جميع الصور
  const handleRemoveAllImages = () => {
    setImagePreviews([])
    setSelectedFiles([])
  }

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({ deviceType: 'DESKTOP', order: 0 })
    setImagePreviews([])
    setSelectedFiles([])
    setEditingBanner(null)
  }

  // إضافة بنرات جديدة (متعددة)
  const handleAddBanner = async () => {
    if (imagePreviews.length === 0) {
      toast.error('يرجى اختيار صورة واحدة على الأقل')
      return
    }

    try {
      setIsUploading(true)
      let successCount = 0
      let failCount = 0

      // رفع كل صورة على حدة
      for (let i = 0; i < imagePreviews.length; i++) {
        const image = imagePreviews[i]
        try {
          const response = await fetch('/api/secondary-banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              salesPageId: selectedSalesPage,
              imageUrl: image.url,
              deviceType: formData.deviceType,
              order: formData.order + i // ترتيب تلقائي متسلسل
            })
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error('Error adding banner:', error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`تم إضافة ${successCount} بنر بنجاح`)
        resetForm()
        setShowAddModal(false)
        fetchBanners()
      }
      
      if (failCount > 0) {
        toast.error(`فشل في إضافة ${failCount} بنر`)
      }
    } catch (error) {
      console.error('Error adding banners:', error)
      toast.error('حدث خطأ أثناء إضافة البنرات')
    } finally {
      setIsUploading(false)
    }
  }

  // تحديث بنر
  const handleUpdateBanner = async () => {
    if (!editingBanner) return

    try {
      const updateData: any = {
        id: editingBanner.id,
        deviceType: formData.deviceType,
        order: formData.order
      }

      // إذا تم اختيار صورة جديدة
      if (imagePreviews.length > 0) {
        updateData.imageUrl = imagePreviews[0].url
      }

      const response = await fetch('/api/secondary-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success('تم تحديث البنر بنجاح')
        resetForm()
        fetchBanners()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'فشل في تحديث البنر')
      }
    } catch (error) {
      console.error('Error updating banner:', error)
      toast.error('حدث خطأ أثناء تحديث البنر')
    }
  }

  // حذف بنر
  const handleDeleteBanner = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا البنر؟')) return

    try {
      const response = await fetch(`/api/secondary-banners?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('تم حذف البنر بنجاح')
        fetchBanners()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'فشل في حذف البنر')
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('حدث خطأ أثناء حذف البنر')
    }
  }

  // تبديل حالة البنر
  const toggleBannerStatus = async (banner: SecondaryBanner) => {
    try {
      const response = await fetch('/api/secondary-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: banner.id,
          isActive: !banner.isActive
        })
      })

      if (response.ok) {
        toast.success(`تم ${banner.isActive ? 'إخفاء' : 'إظهار'} البنر`)
        fetchBanners()
      } else {
        toast.error('فشل في تحديث حالة البنر')
      }
    } catch (error) {
      console.error('Error toggling banner status:', error)
      toast.error('حدث خطأ أثناء تحديث حالة البنر')
    }
  }

  // فتح نموذج التعديل
  const openEditModal = (banner: SecondaryBanner) => {
    setEditingBanner(banner)
    setFormData({
      deviceType: banner.deviceType,
      order: banner.order
    })
    // عرض الصورة الحالية كمعاينة
    if (banner.imageUrl) {
      setImagePreviews([{
        preview: banner.imageUrl,
        url: banner.imageUrl,
        info: { width: 0, height: 0, size: '' }
      }])
    }
  }

  // تحديد/إلغاء تحديد بنر
  const toggleSelectBanner = (id: number) => {
    setSelectedBanners(prev => 
      prev.includes(id) ? prev.filter(bannerId => bannerId !== id) : [...prev, id]
    )
  }

  // تحديد/إلغاء تحديد الكل
  const toggleSelectAll = () => {
    if (selectedBanners.length === banners.length) {
      setSelectedBanners([])
    } else {
      setSelectedBanners(banners.map(b => b.id))
    }
  }

  // حذف البانرات المحددة
  const handleBulkDelete = async () => {
    if (selectedBanners.length === 0) {
      toast.error('لم تقم بتحديد أي بنرات')
      return
    }

    if (!confirm(`هل أنت متأكد من حذف ${selectedBanners.length} بنر؟`)) return

    try {
      let successCount = 0
      let failCount = 0

      for (const id of selectedBanners) {
        try {
          const response = await fetch(`/api/secondary-banners?id=${id}`, {
            method: 'DELETE'
          })
          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error('Error deleting banner:', error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`تم حذف ${successCount} بنر بنجاح`)
        setSelectedBanners([])
        fetchBanners()
      }

      if (failCount > 0) {
        toast.error(`فشل في حذف ${failCount} بنر`)
      }
    } catch (error) {
      console.error('Error in bulk delete:', error)
      toast.error('حدث خطأ أثناء الحذف الجماعي')
    }
  }

  // تفعيل/تعطيل البانرات المحددة
  const handleBulkToggleStatus = async (isActive: boolean) => {
    if (selectedBanners.length === 0) {
      toast.error('لم تقم بتحديد أي بنرات')
      return
    }

    try {
      let successCount = 0
      let failCount = 0

      for (const id of selectedBanners) {
        try {
          const response = await fetch('/api/secondary-banners', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isActive })
          })
          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error('Error updating banner:', error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`تم ${isActive ? 'تفعيل' : 'تعطيل'} ${successCount} بنر بنجاح`)
        setSelectedBanners([])
        fetchBanners()
      }

      if (failCount > 0) {
        toast.error(`فشل في تحديث ${failCount} بنر`)
      }
    } catch (error) {
      console.error('Error in bulk status update:', error)
      toast.error('حدث خطأ أثناء التحديث الجماعي')
    }
  }

  // تغيير نوع الجهاز للبانرات المحددة
  const handleBulkChangeDeviceType = async (deviceType: string) => {
    if (selectedBanners.length === 0) {
      toast.error('لم تقم بتحديد أي بنرات')
      return
    }

    try {
      let successCount = 0
      let failCount = 0

      for (const id of selectedBanners) {
        try {
          const response = await fetch('/api/secondary-banners', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, deviceType })
          })
          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error('Error updating banner:', error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`تم تحديث ${successCount} بنر بنجاح`)
        setSelectedBanners([])
        fetchBanners()
      }

      if (failCount > 0) {
        toast.error(`فشل في تحديث ${failCount} بنر`)
      }
    } catch (error) {
      console.error('Error in bulk device type update:', error)
      toast.error('حدث خطأ أثناء التحديث الجماعي')
    }
  }

  return (
    <DashboardLayout>
      {() => (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ImageIcon className="h-8 w-8 text-primary ml-3" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">إدارة البنرات الإضافية</h1>
                <p className="text-muted-foreground">إدارة صور الكاروسل الإضافي في صفحات المبيعات</p>
                <p className="text-xs text-blue-600 font-medium mt-1">✨ جديد: رفع أكثر من صورة في نفس الوقت</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchBanners}
                className="bg-success hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" />
                إضافة بنر
              </button>
            </div>
          </div>

          {/* اختيار صفحة المبيعات */}
          <div className="bg-card p-4 rounded-lg border border-border">
            <label className="block text-sm font-medium text-foreground mb-2">
              اختر صفحة المبيعات:
            </label>
            <select
              value={selectedSalesPage}
              onChange={(e) => setSelectedSalesPage(e.target.value)}
              className="w-full max-w-xs px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {salesPages.map(page => (
                <option key={page.id} value={page.id}>{page.name}</option>
              ))}
            </select>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 نصائح مهمة:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• ✨ <strong>يمكنك رفع أكثر من صورة في نفس الوقت!</strong></li>
                <li>• 🎯 <strong>استخدم التحديد الجماعي لحذف أو تعديل عدة بنرات دفعة واحدة</strong></li>
                <li>• أضف صور منفصلة للكمبيوتر (💻) والموبايل (📱) لأفضل عرض</li>
                <li>• صور الكمبيوتر يُفضل أن تكون عريضة (مثل 1200x400)</li>
                <li>• صور الموبايل يُفضل أن تكون أكثر طولاً (مثل 800x600)</li>
                <li>• استخدم الترتيب للتحكم في تسلسل عرض الصور</li>
              </ul>
            </div>
          </div>

          {/* شريط العمليات الجماعية */}
          {banners.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    {selectedBanners.length === banners.length ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    <span className="text-sm font-medium">
                      {selectedBanners.length === banners.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </span>
                  </button>
                  
                  {selectedBanners.length > 0 && (
                    <span className="text-sm text-muted-foreground bg-primary/10 px-3 py-2 rounded-lg">
                      محدد: <strong className="text-primary">{selectedBanners.length}</strong> من {banners.length}
                    </span>
                  )}
                </div>

                {selectedBanners.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleBulkToggleStatus(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-success hover:opacity-90 text-white rounded-lg transition-all text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      تفعيل المحدد
                    </button>
                    
                    <button
                      onClick={() => handleBulkToggleStatus(false)}
                      className="flex items-center gap-2 px-3 py-2 bg-warning hover:opacity-90 text-white rounded-lg transition-all text-sm"
                    >
                      <EyeOff className="h-4 w-4" />
                      تعطيل المحدد
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setShowBulkActions(!showBulkActions)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        تعديل النوع
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      
                      {showBulkActions && (
                        <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[180px]">
                          <button
                            onClick={() => {
                              handleBulkChangeDeviceType('DESKTOP')
                              setShowBulkActions(false)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted transition-colors text-sm"
                          >
                            <Monitor className="h-4 w-4" />
                            كمبيوتر
                          </button>
                          <button
                            onClick={() => {
                              handleBulkChangeDeviceType('MOBILE')
                              setShowBulkActions(false)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted transition-colors text-sm"
                          >
                            <Smartphone className="h-4 w-4" />
                            موبايل
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 px-3 py-2 bg-destructive hover:opacity-90 text-white rounded-lg transition-all text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف المحدد ({selectedBanners.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* قائمة البنرات */}
          <div className="bg-card border border-border overflow-hidden rounded-lg">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-muted-foreground">جاري تحميل البنرات...</p>
              </div>
            ) : banners.length === 0 ? (
              <div className="p-8 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">لا توجد بنرات</h3>
                <p className="text-muted-foreground mb-4">ابدأ بإضافة بنر جديد للكاروسل الإضافي</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  إضافة بنر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="bg-muted rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all">
                    <div className="relative">
                      {/* Checkbox للتحديد */}
                      <div className="absolute top-2 left-2 z-10">
                        <button
                          onClick={() => toggleSelectBanner(banner.id)}
                          className="bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-lg"
                        >
                          {selectedBanners.includes(banner.id) ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      </div>

                      <img
                        src={banner.imageUrl}
                        alt={`Banner ${banner.id}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-image.png'
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          banner.isActive 
                            ? 'bg-success text-white' 
                            : 'bg-muted-foreground text-white'
                        }`}>
                          {banner.isActive ? 'مفعل' : 'معطل'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${
                          banner.deviceType === 'DESKTOP' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                          {banner.deviceType === 'DESKTOP' ? '💻 كمبيوتر' : '📱 موبايل'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">
                          الترتيب: {banner.order}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          #{banner.id}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleBannerStatus(banner)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                            banner.isActive
                              ? 'bg-warning hover:opacity-90 text-white'
                              : 'bg-success hover:opacity-90 text-white'
                          }`}
                        >
                          {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(banner)}
                          className="flex-1 bg-primary hover:opacity-90 text-white px-3 py-2 rounded-lg text-sm transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="flex-1 bg-destructive hover:opacity-90 text-white px-3 py-2 rounded-lg text-sm transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* مودال إضافة/تعديل بنر */}
          {(showAddModal || editingBanner) && (
            <div className="modal-overlay">
              <div className="modal-content p-6 max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {editingBanner ? 'تعديل البنر' : 'إضافة بنر جديد'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* رفع الصور */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {editingBanner ? 'رفع صورة جديدة (اختياري):' : 'رفع الصور:'}
                    </label>
                    
                    {imagePreviews.length === 0 ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple={!editingBanner}
                          onChange={handleFileSelect}
                          className="hidden"
                          id="image-upload"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          {isUploading ? (
                            <div className="w-full max-w-xs">
                              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                              <SmoothProgressBar 
                                targetProgress={uploadProgress}
                                duration={300}
                                showPercentage={true}
                                height="8px"
                                color="bg-gradient-to-r from-primary to-primary/80"
                              />
                              <p className="text-sm text-muted-foreground text-center mt-2">
                                جاري معالجة الصور...
                              </p>
                            </div>
                          ) : (
                            <>
                              <FileImage className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                {editingBanner ? 'اضغط لاختيار صورة' : 'اضغط لاختيار صور متعددة أو اسحبها هنا'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPG, PNG, WebP, GIF (حتى 5 ميجابايت لكل صورة)
                              </p>
                              {!editingBanner && (
                                <p className="text-xs text-blue-600 font-medium mt-1">
                                  ✨ يمكنك اختيار أكثر من صورة في نفس الوقت
                                </p>
                              )}
                            </>
                          )}
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* عرض جميع الصور المختارة */}
                        <div className="grid grid-cols-2 gap-3">
                          {imagePreviews.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image.preview}
                                alt={`معاينة ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-border"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              {image.info && image.info.width > 0 && (
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                                  {image.info.width}×{image.info.height}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* عداد الصور وأزرار التحكم */}
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-2">
                            <FileImage className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                              {imagePreviews.length} {imagePreviews.length === 1 ? 'صورة مختارة' : 'صور مختارة'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {!editingBanner && (
                              <label
                                htmlFor="image-upload-more"
                                className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
                              >
                                + إضافة المزيد
                              </label>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              multiple={!editingBanner}
                              onChange={handleFileSelect}
                              className="hidden"
                              id="image-upload-more"
                              disabled={isUploading}
                            />
                            <button
                              type="button"
                              onClick={handleRemoveAllImages}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              حذف الكل
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* نوع الجهاز */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      نوع الجهاز:
                    </label>
                    <select
                      value={formData.deviceType}
                      onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="DESKTOP">كمبيوتر</option>
                      <option value="MOBILE">موبايل</option>
                    </select>
                  </div>

                  {/* الترتيب */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      الترتيب:
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* تحذير إذا لم يتم اختيار صورة */}
                  {!editingBanner && imagePreviews.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        يرجى اختيار صورة واحدة على الأقل قبل الحفظ
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    className="flex-1 btn-secondary"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={editingBanner ? handleUpdateBanner : handleAddBanner}
                    disabled={(imagePreviews.length === 0 && !editingBanner) || isUploading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isUploading ? 'جاري الحفظ...' : (editingBanner ? 'تحديث' : `إضافة ${imagePreviews.length > 0 ? `(${imagePreviews.length})` : ''}`)}
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
