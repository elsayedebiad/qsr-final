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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl transform animate-scaleIn">
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-5 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-1.5 sm:p-2 rounded-lg">
              <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">فيديو السيرة الذاتية</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition-all duration-300 hover:rotate-90 hover:scale-110 p-1.5 sm:p-2 rounded-lg hover:bg-red-50"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-4 lg:p-6 bg-gray-50">
          <div className="relative w-full aspect-video rounded-lg sm:rounded-xl overflow-hidden shadow-xl bg-black">
            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="h-12 w-12 text-white animate-spin" />
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
                    title="فيديو السيرة الذاتية"
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
                title="فيديو السيرة الذاتية"
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
                title="فيديو السيرة الذاتية"
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

          {/* معلومات إضافية لـ Google Drive */}
          {videoType === 'drive' && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              <p>إذا لم يظهر الفيديو بشكل صحيح، اضغط على زر التشغيل في المنتصف</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
