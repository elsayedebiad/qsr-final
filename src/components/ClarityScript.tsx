'use client'

import Script from 'next/script'

/**
 * Microsoft Clarity Analytics Script
 * Tracks user behavior on sales pages
 */
export default function ClarityScript() {
  return (
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
  )
}

