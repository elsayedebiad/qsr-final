'use client'

import Script from 'next/script'
import { useEffect } from 'react'

/**
 * Microsoft Clarity Analytics Script
 * Tracks user behavior on sales pages with enhanced CSS capture
 */
export default function ClarityScript() {
  useEffect(() => {
    // تأكيد تحميل Clarity بشكل صحيح
    if (typeof window !== 'undefined' && window.clarity) {
      // إعدادات إضافية لتحسين جودة التسجيلات
      window.clarity('set', 'maskTextSelector', '[]'); // عدم إخفاء أي نص
      window.clarity('set', 'contentMask', 'false'); // عدم إخفاء المحتوى
    }
  }, [])

  return (
    <>
      <Script
        id="clarity-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "tm2mmbe50i");
          `,
        }}
      />
      
      {/* Clarity Configuration */}
      <Script
        id="clarity-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              window.clarity = window.clarity || function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};
              // تأكيد تسجيل الـ CSS بشكل صحيح
              if (window.clarity) {
                clarity('set', 'maskTextSelector', '[]');
                clarity('set', 'contentMask', 'false');
                clarity('set', 'unmaskTextSelector', '*');
              }
            }
          `,
        }}
      />
    </>
  )
}

