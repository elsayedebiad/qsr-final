'use client'

import { X, Copy, Check, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface SalesPage {
  id: string
  name: string
  url: string
  color: string
}

interface SalesPagesSharePopupProps {
  isOpen: boolean
  onClose: () => void
  salesPages: SalesPage[]
  cvId: string
}

const SALES_PAGE_NAMES: Record<string, string> = {
  'sales1': 'Sales 1',
  'sales2': 'Sales 2',
  'sales3': 'Sales 3',
  'sales4': 'Sales 4',
  'sales5': 'Sales 5',
  'sales6': 'Sales 6',
  'sales7': 'Sales 7',
  'sales8': 'Sales 8',
  'sales9': 'Sales 9',
  'sales10': 'Sales 10',
  'sales11': 'Sales 11',
  'gallery': 'المعرض الرئيسي',
  'transfer-services': 'معرض نقل الخدمات'
}

const SALES_PAGE_COLORS: Record<string, string> = {
  'sales1': 'from-green-500 to-blue-500',
  'sales2': 'from-purple-500 to-pink-500',
  'sales3': 'from-orange-500 to-red-500',
  'sales4': 'from-indigo-500 to-blue-500',
  'sales5': 'from-pink-500 to-rose-500',
  'sales6': 'from-teal-500 to-green-500',
  'sales7': 'from-red-500 to-orange-500',
  'sales8': 'from-yellow-500 to-amber-500',
  'sales9': 'from-cyan-500 to-blue-500',
  'sales10': 'from-lime-500 to-green-500',
  'sales11': 'from-fuchsia-500 to-purple-500',
  'gallery': 'from-blue-500 to-cyan-500',
  'transfer-services': 'from-amber-500 to-orange-600'
}

export default function SalesPagesSharePopup({ isOpen, onClose, salesPages, cvId }: SalesPagesSharePopupProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  if (!isOpen) return null

  const handleCopy = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedIndex(index)
      toast.success('تم نسخ الرابط بنجاح!')
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      toast.error('فشل في نسخ الرابط')
    }
  }

  const handleShare = async (page: SalesPage) => {
    const shareUrl = `${window.location.origin}/cv/${cvId}?from=${page.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `سيرة ذاتية - ${page.name}`,
          text: `تحقق من هذه السيرة الذاتية من ${page.name}`,
          url: shareUrl
        })
        toast.success('تمت المشاركة بنجاح!')
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error('فشل في المشاركة')
        }
      }
    } else {
      handleCopy(shareUrl, salesPages.indexOf(page))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <ExternalLink className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">صفحات المبيعات المخصصة</h3>
                <p className="text-white/90 text-sm">اختر صفحة للمشاركة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salesPages.map((page, index) => {
              const shareUrl = `${window.location.origin}/cv/${cvId}?from=${page.id}`
              const isCopied = copiedIndex === index
              
              return (
                <div
                  key={page.id}
                  className={`bg-gradient-to-r ${page.color} rounded-xl p-5 text-white relative group hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold mb-1">{page.name}</h4>
                      <p className="text-xs opacity-90 font-mono break-all bg-white/10 px-2 py-1 rounded">
                        /cv/{cvId}?from={page.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCopy(shareUrl, index)
                      }}
                      className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          تم النسخ
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          نسخ الرابط
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleShare(page)
                      }}
                      className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      مشاركة
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center"
                      title="فتح السيرة"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/50 border-t border-border p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}

