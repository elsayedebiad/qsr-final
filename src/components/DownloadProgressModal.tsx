'use client'

import { Download, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface DownloadProgressModalProps {
  isOpen: boolean
  onClose: () => void
  progress: number
  status: 'preparing' | 'downloading' | 'success' | 'error'
  fileName?: string
  errorMessage?: string
}

export default function DownloadProgressModal({
  isOpen,
  onClose,
  progress,
  status,
  fileName = 'السيرة الذاتية',
  errorMessage
}: DownloadProgressModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${
          status === 'success' ? 'bg-success/10' : 
          status === 'error' ? 'bg-destructive/10' : 
          'bg-primary/10'
        }`}>
          <div className="flex items-center gap-3">
            {status === 'preparing' && (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
            {status === 'downloading' && (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary animate-bounce" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                {status === 'preparing' && 'جاري التحضير...'}
                {status === 'downloading' && 'جاري التحميل...'}
                {status === 'success' && 'تم التحميل بنجاح!'}
                {status === 'error' && 'فشل التحميل'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {fileName}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Progress Bar */}
          {(status === 'preparing' || status === 'downloading') && (
            <div className="space-y-3">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {status === 'preparing' ? 'جاري التحضير...' : 'جاري التحميل...'}
                </span>
                <span className="font-semibold text-primary">
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Loading tips */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  💡 يرجى الانتظار، جاري معالجة الصورة...
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="text-foreground font-semibold mb-1">
                  ✅ تم تحميل الملف بنجاح!
                </p>
                <p className="text-sm text-muted-foreground">
                  يمكنك العثور على الملف في مجلد التنزيلات
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <p className="text-foreground font-semibold mb-1">
                  ⚠️ فشل في تحميل الملف
                </p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage || 'حدث خطأ أثناء التحميل. يرجى المحاولة مرة أخرى.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(status === 'success' || status === 'error') && (
          <div className="px-6 py-4 bg-muted/30 border-t border-border">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>

      {/* CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

