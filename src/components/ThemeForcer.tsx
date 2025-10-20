'use client'

import { useEffect } from 'react'

/**
 * مكون لفرض الوضع المظلم وتجاهل إعدادات النظام
 */
export default function ThemeForcer() {
  useEffect(() => {
    // فرض الوضع المظلم عند تحميل الصفحة
    const forceTheme = () => {
      const html = document.documentElement
      const body = document.body
      
      // إضافة classes للوضع المظلم
      html.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
      html.style.colorScheme = 'dark'
      
      // فرض ألوان الخلفية
      body.style.backgroundColor = '#0D1117'
      body.style.color = '#FFFFFF'
      
      // منع تغيير الوضع
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            const target = mutation.target as HTMLElement
            if (target === html) {
              if (!html.classList.contains('dark')) {
                html.classList.add('dark')
              }
              if (html.getAttribute('data-theme') !== 'dark') {
                html.setAttribute('data-theme', 'dark')
              }
              if (html.style.colorScheme !== 'dark') {
                html.style.colorScheme = 'dark'
              }
            }
          }
        })
      })
      
      // مراقبة التغييرات على HTML element
      observer.observe(html, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'style']
      })
      
      return observer
    }
    
    // تطبيق فوري
    const observer = forceTheme()
    
    // إعادة تطبيق عند تغيير حالة النظام
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = () => {
      forceTheme()
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    // تنظيف عند إلغاء المكون
    return () => {
      observer?.disconnect()
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return null // هذا المكون لا يعرض شيء
}
