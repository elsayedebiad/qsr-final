'use client'

import React, { useEffect, useState } from 'react'
import { X, Play, Loader2 } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string | null
  onClose: () => void
  videoModalKey?: number
}

export default function VideoPlayer({ videoUrl, onClose, videoModalKey = 0 }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [embedUrl, setEmbedUrl] = useState<string>('')
  const [videoType, setVideoType] = useState<'youtube' | 'drive' | 'vimeo' | 'direct'>('direct')

  useEffect(() => {
    if (!videoUrl) return

    setIsLoading(true)
    
    // تحديد نوع الفيديو وإنشاء رابط التضمين
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      setVideoType('youtube')
      let videoId = ''
      if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || ''
      } else if (videoUrl.includes('watch?v=')) {
        videoId = videoUrl.split('watch?v=')[1]?.split('&')[0] || ''
      }
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1`)
    } 
    else if (videoUrl.includes('drive.google.com')) {
      setVideoType('drive')
      const fileIdMatch = videoUrl.match(/\/file\/d\/([^\/]+)/)
      if (fileIdMatch && fileIdMatch[1]) {
        // معاملات محسنة لـ Google Drive للهواتف
        const driveId = fileIdMatch[1]
        // استخدام المعاملات المناسبة للموبايل
        setEmbedUrl(`https://drive.google.com/file/d/${driveId}/preview`)
      } else {
        // معالجة الروابط الأخرى
        const cleanUrl = videoUrl
          .replace('/view?usp=sharing', '/preview')
          .replace('/view?usp=share_link', '/preview')
          .replace('/view', '/preview')
        setEmbedUrl(cleanUrl)
      }
    }
    else if (videoUrl.includes('vimeo.com')) {
      setVideoType('vimeo')
      const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0] || ''
      setEmbedUrl(`https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&playsinline=1`)
    }
    else {
      setVideoType('direct')
      setEmbedUrl(videoUrl)
    }

    // محاكاة تحميل الفيديو
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [videoUrl])

  if (!videoUrl) return null

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-1 sm:p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg sm:rounded-2xl w-full h-full sm:h-auto max-w-full sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] sm:max-h-[98vh] overflow-y-auto shadow-2xl border-0 sm:border border-purple-500/20 transform animate-scaleIn">
        {/* Header - تصميم احترافي بتدرج بنفسجي */}
        <div className="relative flex justify-between items-center p-3 sm:p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 overflow-hidden">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 via-indigo-600/50 to-blue-600/50 animate-pulse"></div>
          
          <div className="relative z-10 flex items-center gap-2 sm:gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-3 rounded-lg sm:rounded-xl shadow-lg animate-bounce">
              <Play className="h-4 w-4 sm:h-6 sm:w-6 text-white fill-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-2xl font-bold text-white drop-shadow-lg">شوف طريقة استخراج التأشيرة</h3>
              <p className="hidden sm:block text-xs sm:text-sm text-white/90 mt-0.5">شرح خطوة بخطوة</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="relative z-10 text-white/80 hover:text-white transition-all duration-300 hover:rotate-90 hover:scale-110 p-1.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-white/20 backdrop-blur-sm group"
          >
            <X className="h-5 w-5 sm:h-7 sm:w-7" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></span>
          </button>
        </div>

        {/* Content - تصميم محسن */}
        <div className="flex-1 p-2 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center">
          <div className="relative w-full rounded-lg sm:rounded-2xl overflow-hidden shadow-2xl bg-black border border-purple-500/30 sm:border-2" style={{ aspectRatio: '16/9', width: '100%', maxHeight: '90vh' }}>
            {/* Loading Spinner - تصميم احترافي */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm z-10">
                <Loader2 className="h-12 w-12 sm:h-20 sm:w-20 text-white animate-spin mb-3 sm:mb-4" />
                <p className="text-white text-xs sm:text-base font-semibold animate-pulse px-4 text-center">جاري تحميل الفيديو...</p>
              </div>
            )}

            {/* Video Container with special handling for Google Drive */}
            {videoType === 'drive' ? (
              <div className="google-drive-wrapper relative w-full h-full bg-black">
                {/* Container محسن لـ Google Drive على الهواتف */}
                <div 
                  className="absolute inset-0"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <iframe
                    key={`drive-${videoModalKey}`}
                    src={embedUrl}
                    className="w-full h-full"
                    style={{
                      border: 'none',
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      zIndex: 10,
                      backgroundColor: 'black'
                    }}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title="شوف طريقة استخراج التأشيرة"
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
                
                {/* Styles خاصة للموبايل */}
                <style jsx global>{`
                  @media (max-width: 768px) {
                    .google-drive-wrapper iframe {
                      transform: scale(1) !important;
                      -webkit-transform: scale(1) !important;
                      object-fit: contain !important;
                    }
                    
                    /* إخفاء عناصر Google Drive غير المرغوبة */
                    .google-drive-wrapper iframe[src*="drive.google.com"] {
                      clip-path: inset(0px 0px 0px 0px);
                    }
                  }
                `}</style>
              </div>
            ) : videoType === 'youtube' ? (
              <iframe
                key={`youtube-${videoModalKey}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="شوف طريقة استخراج التأشيرة"
                onLoad={() => setIsLoading(false)}
              />
            ) : videoType === 'vimeo' ? (
              <iframe
                key={`vimeo-${videoModalKey}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="شوف طريقة استخراج التأشيرة"
                onLoad={() => setIsLoading(false)}
              />
            ) : (
              <video
                key={`video-${videoModalKey}`}
                src={embedUrl}
                controls
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full bg-black object-contain"
                preload="metadata"
                onLoadedData={() => setIsLoading(false)}
              >
                <source src={embedUrl} type="video/mp4" />
                <source src={embedUrl} type="video/webm" />
                <source src={embedUrl} type="video/ogg" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            )}
          </div>

          {/* شريط زخرفي سفلي */}
          <div className="mt-2 sm:mt-4 h-0.5 sm:h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
