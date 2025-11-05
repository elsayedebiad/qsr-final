'use client'

import React, { useState, useEffect } from 'react'
import { X, Play, Loader2 } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string | null
  onClose: () => void
  videoModalKey?: number
}

export default function VideoPlayer({ videoUrl, onClose }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [embedUrl, setEmbedUrl] = useState('')
  const [originalUrl, setOriginalUrl] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [useNoCookie, setUseNoCookie] = useState(false)
  
  useEffect(() => {
    if (!videoUrl) return
    
    setOriginalUrl(videoUrl)
    setIsLoading(true)
    setHasError(false)
    
    // معالجة روابط YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      let videoId = ''
      
      try {
        // إنشاء URL object لاستخراج المعاملات بشكل أفضل
        const url = new URL(videoUrl)
        
        if (videoUrl.includes('youtu.be/')) {
          // https://youtu.be/VIDEO_ID
          videoId = url.pathname.substring(1).split('?')[0].split('/')[0]
        } else if (videoUrl.includes('youtube.com/shorts/')) {
          // https://www.youtube.com/shorts/VIDEO_ID
          videoId = url.pathname.split('/shorts/')[1]?.split('?')[0].split('/')[0] || ''
        } else if (videoUrl.includes('youtube.com/embed/')) {
          // https://www.youtube.com/embed/VIDEO_ID
          videoId = url.pathname.split('/embed/')[1]?.split('?')[0].split('/')[0] || ''
        } else if (url.searchParams.has('v')) {
          // https://www.youtube.com/watch?v=VIDEO_ID
          videoId = url.searchParams.get('v') || ''
        }
        
        // تنظيف videoId من أي معاملات إضافية
        videoId = videoId.split('&')[0].split('?')[0].trim()
        
      } catch (e) {
        // إذا فشل URL parsing، استخدم الطريقة القديمة
        console.log('URL parsing failed, using fallback method')
        if (videoUrl.includes('youtu.be/')) {
          videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0].split('&')[0] || ''
        } else if (videoUrl.includes('watch?v=')) {
          videoId = videoUrl.split('watch?v=')[1]?.split('&')[0].split('?')[0] || ''
        } else if (videoUrl.includes('/embed/')) {
          videoId = videoUrl.split('/embed/')[1]?.split('?')[0].split('&')[0] || ''
        } else if (videoUrl.includes('/shorts/')) {
          videoId = videoUrl.split('/shorts/')[1]?.split('?')[0].split('&')[0] || ''
        }
      }
      
      if (videoId && videoId.length >= 10) {
        console.log('YouTube Video ID extracted:', videoId)
        
        // محاولة استخدام طرق مختلفة للتضمين
        const embedParams = [
          'autoplay=0',          // إيقاف التشغيل التلقائي
          'mute=0',              // السماح بالصوت
          'controls=1',
          'playsinline=1',
          'rel=0',
          'modestbranding=1',
          'fs=1',
          'iv_load_policy=3',
          'disablekb=0',
          'enablejsapi=1',
          'origin=' + encodeURIComponent(window.location.origin)
        ].join('&')
        
        // استخدام nocookie أو youtube.com حسب عدد المحاولات
        const domain = useNoCookie ? 'youtube-nocookie.com' : 'youtube.com'
        setEmbedUrl(`https://www.${domain}/embed/${videoId}?${embedParams}`)
      } else {
        console.error('Failed to extract YouTube video ID from:', videoUrl)
        setHasError(true)
      }
    } else {
      setEmbedUrl(videoUrl)
    }
  }, [videoUrl, useNoCookie])

  if (!videoUrl) return null

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl flex flex-col shadow-2xl border border-purple-500/30 transform animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - تصميم احترافي بتدرج بنفسجي */}
        <div className="relative flex justify-between items-center p-4 sm:p-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 overflow-hidden rounded-t-2xl flex-shrink-0">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 via-indigo-600/50 to-blue-600/50 animate-pulse"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl shadow-lg">
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-bold text-white drop-shadow-lg">شاهد طريقة استخراج التأشيرة</h3>
              <p className="text-xs text-white/90 mt-0.5">شرح خطوة بخطوة</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="relative z-10 text-white/80 hover:text-white transition-all duration-300 hover:rotate-90 hover:scale-110 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm group"
          >
            <X className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></span>
          </button>
        </div>

        {/* Content - تصميم محسن */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-b-2xl">
          <div className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-black border-2 border-purple-500/30" style={{ aspectRatio: '16/9' }}>
            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm z-10">
                <Loader2 className="h-12 w-12 sm:h-20 sm:w-20 text-white animate-spin mb-3 sm:mb-4" />
                <p className="text-white text-xs sm:text-base font-semibold animate-pulse px-4 text-center">جاري تحميل الفيديو...</p>
              </div>
            )}

            {/* Error Message */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-900/90 to-pink-900/90 backdrop-blur-sm z-20 p-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md text-center border-2 border-red-400/30">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-8 w-8 text-red-300" />
                  </div>
                  <h4 className="text-white text-lg sm:text-xl font-bold mb-3">⚠️ الفيديو محظور من التضمين</h4>
                  <p className="text-white/80 text-sm mb-4">
                    <strong>صاحب الفيديو على YouTube منع تشغيله على المواقع الأخرى</strong><br /><br />
                    <strong>💡 الحل:</strong><br />
                    • افتح إعدادات الفيديو على YouTube Studio<br />
                    • فعّل خيار "السماح بالتضمين" (Allow embedding)<br />
                    • أو استخدم فيديو من قناتك الخاصة<br /><br />
                    📖 راجع ملف <code className="bg-white/20 px-2 py-0.5 rounded">VIDEO_BLOCKED_SOLUTION.md</code> للتفاصيل
                  </p>
                  <div className="flex flex-col gap-3">
                    {retryCount < 2 && (
                      <button
                        onClick={() => {
                          setRetryCount(prev => prev + 1)
                          setUseNoCookie(!useNoCookie)
                          setHasError(false)
                          setIsLoading(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-300 font-bold flex items-center justify-center gap-2"
                      >
                        🔄 حاول مرة أخرى
                      </button>
                    )}
                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg transition-all duration-300 font-bold flex items-center justify-center gap-2"
                    >
                      <Play className="h-5 w-5 fill-white" />
                      افتح على YouTube مباشرة
                    </a>
                    <button
                      onClick={onClose}
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-lg transition-colors duration-300 font-semibold"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* YouTube Embed */}
            {!hasError && embedUrl && (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="فيديو السيرة الذاتية"
                loading="lazy"
                onLoad={(e) => {
                  const iframe = e.target as HTMLIFrameElement
                  
                  // كشف فوري للفيديوهات المحظورة
                  const checkEmbed = () => {
                    // فحص ارتفاع الـ iframe
                    if (iframe.clientHeight === 0 || iframe.clientWidth === 0) {
                      console.log('Video embed failed - dimensions are 0 (Error 153)')
                      setIsLoading(false)
                      setHasError(true)
                      return true
                    }
                    
                    // فحص محتوى الـ iframe
                    try {
                      if (iframe.contentDocument) {
                        const body = iframe.contentDocument.body
                        if (body && body.textContent?.includes('Video unavailable')) {
                          console.log('Video unavailable message detected')
                          setIsLoading(false)
                          setHasError(true)
                          return true
                        }
                      }
                    } catch (e) {
                      // خطأ CORS عادي - الفيديو يعمل على الأرجح
                    }
                    
                    return false
                  }
                  
                  // فحص فوري
                  const hasError = checkEmbed()
                  
                  if (!hasError) {
                    // إذا لم يكن هناك خطأ، أوقف التحميل بعد 500ms
                    setTimeout(() => setIsLoading(false), 500)
                    
                    // فحص ثانوي بعد ثانية
                    setTimeout(checkEmbed, 1000)
                    
                    // فحص نهائي بعد 2 ثانية
                    setTimeout(checkEmbed, 2000)
                  }
                }}
                onError={() => {
                  console.log('iframe error occurred - video embed restricted')
                  setIsLoading(false)
                  setHasError(true)
                }}
                style={{
                  border: 'none'
                }}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
