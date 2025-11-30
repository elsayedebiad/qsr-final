import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { ToasterProvider } from '@/components/ToasterProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import Script from 'next/script';
import "./globals.css";
import "@/styles/animations.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "نظام إدارة مكاتب الاستقدام",
  description: "نظام شامل لإدارة مكاتب الاستقدام مع إمكانيات التعاون المباشر",
  other: {
    'facebook-domain-verification': 'vhq21gzzksi4dz5wnf4tl0x1obh9c5',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Theme Loader - Prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Load theme from localStorage
                const savedTheme = localStorage.getItem('theme') || 'dark';
                const root = document.documentElement;
                
                if (savedTheme === 'light') {
                  root.setAttribute('data-theme', 'light');
                  root.classList.remove('dark');
                  root.classList.add('light-mode');
                  root.style.colorScheme = 'light';
                } else {
                  root.setAttribute('data-theme', 'dark');
                  root.classList.add('dark');
                  root.classList.remove('light-mode');
                  root.style.colorScheme = 'dark';
                }
              })();
            `
          }}
        />

        {/* Google Tag Manager */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');`,
            }}
          />
        )}

        {/* Microsoft Clarity - بديل TikTok Pixel */}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "mv43q3vjmh");`,
          }}
        />

        {/* Facebook Pixel */}
        {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
          <>
            <Script
              id="facebook-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
fbq('track', 'PageView');`,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

        {/* Sentry Error Tracking */}
        {process.env.NEXT_PUBLIC_SENTRY_DSN && (
          <Script
            src="https://browser.sentry-cdn.com/7.x/bundle.min.js"
            strategy="afterInteractive"
            onLoad={() => {
              if (window.Sentry) {
                window.Sentry.init({
                  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
                  environment: process.env.NODE_ENV,
                  tracesSampleRate: 1.0,
                });
              }
            }}
          />
        )}
      </head>
      <body
        className={`${cairo.variable} font-cairo antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Google Tag Manager (noscript) */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        <AuthProvider>
          {children}
        </AuthProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
