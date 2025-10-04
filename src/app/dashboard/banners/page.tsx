'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Upload, Trash2, Eye, EyeOff, Monitor, Smartphone, Plus, Save } from 'lucide-react'

interface Banner {
  id: number
  salesPageId: string
  imageUrl: string // Base64 data - محفوظة في قاعدة البيانات
  imageData?: string // للمستقبل
  deviceType: 'MOBILE' | 'DESKTOP'
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function BannersManagementPage() {
  const [allBanners, setAllBanners] = useState<Record<string, Banner[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('sales1')

  const salesPages = ['sales1', 'sales2', 'sales3', 'sales4', 'sales5']

  // جلب جميع البنرات لجميع الصفحات
  const fetchAllBanners = async () => {
    try {
      setIsLoading(true)
      const bannersData: Record<string, Banner[]> = {}
      
      for (const page of salesPages) {
        const response = await fetch(`/api/banners?salesPageId=${page}`)
        if (response.ok) {
          const data = await response.json()
          bannersData[page] = data
        } else {
          bannersData[page] = []
        }
      }
      
      setAllBanners(bannersData)
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('فشل في جلب البنرات')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllBanners()
  }, [])

  // رفع بنر جديد
  const handleUpload = async (file: File, deviceType: 'MOBILE' | 'DESKTOP', salesPageId: string) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('salesPageId', salesPageId)
      formData.append('deviceType', deviceType)
      const existingBanners = allBanners[salesPageId] || []
      formData.append('order', existingBanners.filter(b => b.deviceType === deviceType).length.toString())

      const response = await fetch('/api/banners', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('تم رفع البنر بنجاح')
        fetchAllBanners()
      } else {
        const errorData = await response.json()
        console.error('Banner upload error:', errorData)
        toast.error(`فشل في رفع البنر: ${errorData.error || 'خطأ غير معروف'}`)
      }
    } catch (error) {
      console.error('Error uploading banner:', error)
      toast.error('فشل في رفع البنر')
    } finally {
      setUploading(false)
    }
  }

  // حذف بنر
  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا البنر؟')) return

    try {
      const response = await fetch(`/api/banners?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('تم حذف البنر بنجاح')
        fetchAllBanners()
      } else {
        toast.error('فشل في حذف البنر')
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('فشل في حذف البنر')
    }
  }

  // تفعيل/تعطيل بنر
  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch('/api/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive })
      })

      if (response.ok) {
        toast.success(isActive ? 'تم تعطيل البنر' : 'تم تفعيل البنر')
        fetchAllBanners()
      } else {
        toast.error('فشل في تحديث البنر')
      }
    } catch (error) {
      console.error('Error toggling banner:', error)
      toast.error('فشل في تحديث البنر')
    }
  }

  // تحديث الترتيب
  const handleUpdateOrder = async (id: number, newOrder: number) => {
    try {
      const response = await fetch('/api/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, order: newOrder })
      })

      if (response.ok) {
        toast.success('تم تحديث الترتيب')
        fetchAllBanners()
      } else {
        toast.error('فشل في تحديث الترتيب')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('فشل في تحديث الترتيب')
    }
  }

  // Component لعرض بنرات صفحة واحدة
  const renderPageBanners = (salesPageId: string) => {
    const banners = allBanners[salesPageId] || []
    const mobileBanners = banners.filter(b => b.deviceType === 'MOBILE')
    const desktopBanners = banners.filter(b => b.deviceType === 'DESKTOP')

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* بنرات الكمبيوتر */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Monitor className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  بنرات الكمبيوتر
                </h2>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file, 'DESKTOP', salesPageId)
                  }}
                  disabled={uploading}
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>إضافة</span>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              {desktopBanners.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد بنرات</p>
              ) : (
                desktopBanners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`border-2 rounded-lg p-4 ${
                      banner.isActive
                        ? 'border-green-200 dark:border-green-800'
                        : 'border-gray-200 dark:border-gray-700 opacity-50'
                    }`}
                  >
                    <img
                      src={banner.imageUrl || banner.imageData}
                      alt={`Banner ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          الترتيب:
                        </label>
                        <input
                          type="number"
                          value={banner.order}
                          onChange={(e) =>
                            handleUpdateOrder(banner.id, parseInt(e.target.value))
                          }
                          className="w-16 px-2 py-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(banner.id, banner.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            banner.isActive
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={banner.isActive ? 'تعطيل' : 'تفعيل'}
                        >
                          {banner.isActive ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* بنرات الموبايل */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  بنرات الموبايل
                </h2>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file, 'MOBILE', salesPageId)
                  }}
                  disabled={uploading}
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>إضافة</span>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              {mobileBanners.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد بنرات</p>
              ) : (
                mobileBanners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`border-2 rounded-lg p-4 ${
                      banner.isActive
                        ? 'border-green-200 dark:border-green-800'
                        : 'border-gray-200 dark:border-gray-700 opacity-50'
                    }`}
                  >
                    <img
                      src={banner.imageUrl || banner.imageData}
                      alt={`Banner ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          الترتيب:
                        </label>
                        <input
                          type="number"
                          value={banner.order}
                          onChange={(e) =>
                            handleUpdateOrder(banner.id, parseInt(e.target.value))
                          }
                          className="w-16 px-2 py-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(banner.id, banner.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            banner.isActive
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={banner.isActive ? 'تعطيل' : 'تفعيل'}
                        >
                          {banner.isActive ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            إدارة البنرات الإعلانية
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            قم بإضافة وحذف وترتيب البنرات لكل صفحة مبيعات
          </p>
        </div>

        {/* Tabs للصفحات */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 p-4">
              {salesPages.map((page) => (
                <button
                  key={page}
                  onClick={() => setSelectedTab(page)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    selectedTab === page
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {page.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* عرض محتوى الصفحة المختارة */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderPageBanners(selectedTab)
        )}

        {/* Loading Overlay for Upload */}
        {uploading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 dark:text-white">
                جاري رفع البنر...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

