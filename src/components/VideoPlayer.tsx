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
  const [hasError, setHasError] = useState(false)
  const [originalUrl, setOriginalUrl] = useState<string>('')

  useEffect(() => {
    if (!videoUrl) return

    setIsLoading(true)
    setOriginalUrl(videoUrl) // حفظ الرابط الأصلي
    
    // تحديد نوع الفيديو وإنشاء رابط التضمين
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      setVideoType('youtube')
      let videoId = ''
      if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || ''
      } else if (videoUrl.includes('watch?v=')) {
        videoId = videoUrl.split('watch?v=')[1]?.split('&')[0] || ''
      } else if (videoUrl.includes('/embed/')) {
        videoId = videoUrl.split('/embed/')[1]?.split('?')[0] || ''
      }
      // معاملات محسنة لليوتيوب (بدون autoplay)
      const params = [
        'controls=1',           // إظهار التحكم
        'playsinline=1',        // تشغيل داخل الصفحة (للموبايل)
        'rel=0',                // عدم إظهار فيديوهات مقترحة
        'modestbranding=1',     // إخفاء شعار يوتيوب
        'fs=1',                 // السماح بملء الشاشة
        'iv_load_policy=3',     // إخفاء التعليقات
        'disablekb=0',          // السماح بالتحكم بالكيبورد
        'enablejsapi=1',        // تفعيل JS API
        'origin=' + (typeof window !== 'undefined' ? window.location.origin : ''), // إضافة origin للمصادقة
        'widget_referrer=' + (typeof window !== 'undefined' ? window.location.href : '') // referrer
      ].join('&')
      setEmbedUrl(`https://www.youtube-nocookie.com/embed/${videoId}?${params}`)
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
      setEmbedUrl(`https://player.vimeo.com/video/${videoId}?playsinline=1`)
    }
    else {
      setVideoType('direct')
      setEmbedUrl(videoUrl)
    }

    // محاكاة تحميل الفيديو
    setHasError(false)
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [videoUrl])

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
            {/* Loading Spinner - تصميم احترافي */}
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm z-10">
                <Loader2 className="h-12 w-12 sm:h-20 sm:w-20 text-white animate-spin mb-3 sm:mb-4" />
                <p className="text-white text-xs sm:text-base font-semibold animate-pulse px-4 text-center">جاري تحميل الفيديو...</p>
              </div>
            )}

            {/* Error Message - رسالة الخطأ */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-900/90 to-pink-900/90 backdrop-blur-sm z-20 p-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md text-center border-2 border-red-400/30">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="h-8 w-8 text-red-300" />
                  </div>
                  <h4 className="text-white text-lg sm:text-xl font-bold mb-3">عذراً، لا يمكن تشغيل الفيديو هنا</h4>
                  <p className="text-white/80 text-sm mb-4">قد يكون الفيديو:</p>
                  <ul className="text-white/70 text-sm space-y-2 text-right mb-6">
                    <li>• محظور من التشغيل المضمن</li>
                    <li>• خاص أو محدود</li>
                    <li>• الرابط غير صحيح</li>
                    <li>• غير متاح في منطقتك</li>
                  </ul>
                  <div className="flex gap-3 justify-center">
                    {originalUrl && videoType === 'youtube' && (
                      <a
                        href={originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-300 font-semibold flex items-center gap-2 shadow-lg"
                      >
                        <Play className="h-5 w-5" />
                        مشاهدة على YouTube
                      </a>
                    )}
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

            {/* Video Container - موحد لجميع الأنواع */}
            {videoType === 'youtube' ? (
              <iframe
                key={`youtube-${videoModalKey}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="فيديو السيرة الذاتية"
                onLoad={() => {
                  setIsLoading(false)
                  // فحص إذا الفيديو فشل في التحميل بعد 5 ثواني
                  const errorTimeout = setTimeout(() => {
                    const iframe = document.querySelector(`iframe[src*="${embedUrl}"]`) as HTMLIFrameElement
                    if (iframe) {
                      try {
                        // محاولة التحقق من حالة الـ iframe
                        // إذا الفيديو ما اشتغل بعد 5 ثواني، ممكن يكون فيه مشكلة
                        console.log('Video iframe loaded, checking status...')
                      } catch (e) {
                        console.error('Video iframe error:', e)
                        setHasError(true)
                      }
                    }
                  }, 5000)
                  
                  return () => clearTimeout(errorTimeout)
                }}
                onError={() => {
                  console.error('YouTube embed failed - video may be restricted')
                  setHasError(true)
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
            ) : videoType === 'drive' ? (
              <iframe
                key={`drive-${videoModalKey}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="فيديو السيرة الذاتية"
                onLoad={() => setIsLoading(false)}
                onError={() => setHasError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
            ) : videoType === 'vimeo' ? (
              <iframe
                key={`vimeo-${videoModalKey}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="فيديو السيرة الذاتية"
                onLoad={() => setIsLoading(false)}
                onError={() => setHasError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
            ) : (
              <video
                key={`video-${videoModalKey}`}
                src={embedUrl}
                controls
                playsInline
                className="absolute inset-0 w-full h-full bg-black object-contain"
                preload="metadata"
                onLoadedData={() => setIsLoading(false)}
                onError={() => setHasError(true)}
              >
                <source src={embedUrl} type="video/mp4" />
                <source src={embedUrl} type="video/webm" />
                <source src={embedUrl} type="video/ogg" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
