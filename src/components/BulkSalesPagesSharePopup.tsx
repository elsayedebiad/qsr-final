'use client'

import { X, Copy, Check, ExternalLink, FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface SalesPage {
  id: string
  name: string
  color: string
}

interface BulkSalesPagesSharePopupProps {
  isOpen: boolean
  onClose: () => void
  salesPages: SalesPage[]
  cvIds: string[]
  cvs: Array<{ id: string; fullName: string; referenceCode?: string }>
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

export default function BulkSalesPagesSharePopup({ 
  isOpen, 
  onClose, 
  salesPages, 
  cvIds,
  cvs 
}: BulkSalesPagesSharePopupProps) {
  const [copiedPageIndex, setCopiedPageIndex] = useState<number | null>(null)

  if (!isOpen) return null

  const selectedCvsData = cvs.filter(cv => cvIds.includes(cv.id))

  const handleCopyAllLinks = async (pageId: string, pageIndex: number) => {
    try {
      const links = cvIds.map(cvId => 
        `${window.location.origin}/cv/${cvId}?from=${pageId}`
      )
      const linksText = links.join('\n')
      
      await navigator.clipboard.writeText(linksText)
      setCopiedPageIndex(pageIndex)
      toast.success(`تم نسخ ${cvIds.length} رابط بنجاح!`)
      setTimeout(() => setCopiedPageIndex(null), 2000)
    } catch (error) {
      toast.error('فشل في نسخ الروابط')
    }
  }

  const handleShareAll = async (page: SalesPage, pageIndex: number) => {
    const links = cvIds.map(cvId => 
      `${window.location.origin}/cv/${cvId}?from=${page.id}`
    )
    const linksText = links.join('\n')
    const shareText = `مشاركة ${cvIds.length} سيرة ذاتية من ${page.name}:\n\n${linksText}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cvIds.length} سيرة ذاتية - ${page.name}`,
          text: shareText
        })
        toast.success('تمت المشاركة بنجاح!')
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error('فشل في المشاركة')
        }
      }
    } else {
      handleCopyAllLinks(page.id, pageIndex)
    }
  }

  const handleCopySingleLink = async (cvId: string, pageId: string) => {
    try {
      const link = `${window.location.origin}/cv/${cvId}?from=${pageId}`
      await navigator.clipboard.writeText(link)
      toast.success('تم نسخ الرابط بنجاح!')
    } catch (error) {
      toast.error('فشل في نسخ الرابط')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">مشاركة {cvIds.length} سيرة ذاتية</h3>
                <p className="text-white/90 text-sm">اختر صفحة مبيعات للمشاركة</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* قائمة السير المحددة */}
          <div className="mb-6 bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              السير المحددة ({cvIds.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedCvsData.map(cv => (
                <span 
                  key={cv.id}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                >
                  {cv.fullName} {cv.referenceCode && `(${cv.referenceCode})`}
                </span>
              ))}
            </div>
          </div>

          {/* صفحات المبيعات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salesPages.map((page, pageIndex) => {
              const isCopied = copiedPageIndex === pageIndex
              
              return (
                <div
                  key={page.id}
                  className={`bg-gradient-to-r ${page.color} rounded-xl p-5 text-white relative group hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold mb-1">{page.name}</h4>
                      <p className="text-xs opacity-90">
                        {cvIds.length} رابط مخصص
                      </p>
                    </div>
                  </div>

                  {/* أزرار الإجراءات الرئيسية */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCopyAllLinks(page.id, pageIndex)
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
                          نسخ جميع الروابط
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleShareAll(page, pageIndex)
                      }}
                      className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      مشاركة الكل
                    </button>
                  </div>

                  {/* قائمة الروابط الفردية */}
                  <div className="bg-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs font-semibold mb-2 opacity-90">الروابط الفردية:</p>
                    <div className="space-y-2">
                      {selectedCvsData.map((cv, cvIndex) => {
                        const link = `${window.location.origin}/cv/${cv.id}?from=${page.id}`
                        return (
                          <div 
                            key={cv.id}
                            className="flex items-center gap-2 bg-white/10 rounded p-2"
                          >
                            <span className="text-xs flex-1 truncate font-mono">
                              {cv.fullName}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleCopySingleLink(cv.id, page.id)
                              }}
                              className="bg-white/20 hover:bg-white/30 p-1.5 rounded transition-colors"
                              title="نسخ رابط هذه السيرة"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white/20 hover:bg-white/30 p-1.5 rounded transition-colors"
                              title="فتح السيرة"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )
                      })}
                    </div>
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

