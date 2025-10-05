'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Upload,
  X,
  Save,
  RefreshCw,
  FileImage,
  AlertCircle
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: string} | null>(null)

  // بيانات النموذج
  const [formData, setFormData] = useState({
    imageUrl: '',
    deviceType: 'DESKTOP',
    order: 0
  })

  const salesPages = [
    { id: 'sales1', name: 'Sales 1' },
    { id: 'sales2', name: 'Sales 2' },
    { id: 'sales3', name: 'Sales 3' },
    { id: 'sales4', name: 'Sales 4' },
    { id: 'sales5', name: 'Sales 5' }
  ]

  // جلب البنرات
  const fetchBanners = async () => {
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
  }

  useEffect(() => {
    fetchBanners()
  }, [selectedSalesPage])

  // معالجة اختيار الصورة
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // التحقق من نوع الملف
      if (!isValidImageFile(file)) {
        toast.error('نوع الملف غير مدعوم. يرجى اختيار صورة (JPG, PNG, WebP, GIF)')
        return
      }

      // التحقق من حجم الملف
      if (!isValidFileSize(file, 5)) {
        toast.error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت')
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      // الحصول على معلومات الصورة
      const info = await getImageInfo(file)
      setImageInfo(info)

      // إنشاء معاينة
      const preview = await compressAndConvertImage(file, 400, 300, 0.7)
      setImagePreview(preview)

      // ضغط الصورة للتخزين
      setUploadProgress(50)
      const maxWidth = formData.deviceType === 'DESKTOP' ? 1200 : 800
      const maxHeight = formData.deviceType === 'DESKTOP' ? 600 : 800
      
      const compressedImage = await compressAndConvertImage(file, maxWidth, maxHeight, 0.8)
      
      setUploadProgress(100)
      setSelectedFile(file)
      setFormData(prev => ({ ...prev, imageUrl: compressedImage }))
      
      toast.success('تم رفع الصورة بنجاح')
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('فشل في معالجة الصورة')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // إزالة الصورة المختارة
  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview('')
    setImageInfo(null)
    setFormData(prev => ({ ...prev, imageUrl: '' }))
  }

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({ imageUrl: '', deviceType: 'DESKTOP', order: 0 })
    setSelectedFile(null)
    setImagePreview('')
    setImageInfo(null)
    setEditingBanner(null)
  }

  // إضافة بنر جديد
  const handleAddBanner = async () => {
    try {
      const response = await fetch('/api/secondary-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesPageId: selectedSalesPage,
          ...formData
        })
      })

      if (response.ok) {
        toast.success('تم إضافة البنر بنجاح')
        resetForm()
        setShowAddModal(false)
        fetchBanners()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'فشل في إضافة البنر')
      }
    } catch (error) {
      console.error('Error adding banner:', error)
      toast.error('حدث خطأ أثناء إضافة البنر')
    }
  }

  // تحديث بنر
  const handleUpdateBanner = async () => {
    if (!editingBanner) return

    try {
      const response = await fetch('/api/secondary-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBanner.id,
          ...formData
        })
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
      imageUrl: banner.imageUrl,
      deviceType: banner.deviceType,
      order: banner.order
    })
    // عرض الصورة الحالية كمعاينة
    if (banner.imageUrl) {
      setImagePreview(banner.imageUrl)
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
                <li>• أضف صور منفصلة للكمبيوتر (💻) والموبايل (📱) لأفضل عرض</li>
                <li>• صور الكمبيوتر يُفضل أن تكون عريضة (مثل 1200x400)</li>
                <li>• صور الموبايل يُفضل أن تكون أكثر طولاً (مثل 800x600)</li>
                <li>• استخدم الترتيب للتحكم في تسلسل عرض الصور</li>
              </ul>
            </div>
          </div>

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
                  <div key={banner.id} className="bg-muted rounded-lg overflow-hidden">
                    <div className="relative">
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
                      setEditingBanner(null)
                      setFormData({ imageUrl: '', deviceType: 'DESKTOP', order: 0 })
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* رفع الصورة */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      رفع الصورة:
                    </label>
                    
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <input
                          type="file"
                          accept="image/*"
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
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              <p className="text-sm text-muted-foreground">
                                جاري المعالجة... {uploadProgress}%
                              </p>
                            </>
                          ) : (
                            <>
                              <FileImage className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                اضغط لاختيار صورة أو اسحبها هنا
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPG, PNG, WebP, GIF (حتى 5 ميجابايت)
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="معاينة"
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {imageInfo && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            📏 {imageInfo.width}×{imageInfo.height} • 📁 {imageInfo.size}
                          </div>
                        )}
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
                  {!formData.imageUrl && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        يرجى اختيار صورة قبل الحفظ
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
                    disabled={!formData.imageUrl || isUploading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingBanner ? 'تحديث' : 'إضافة'}
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
