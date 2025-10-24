/**
 * تحليل User Agent واستخراج معلومات الجهاز والمتصفح
 */

interface DeviceInfo {
  device: 'mobile' | 'tablet' | 'desktop'
  browser: string
  browserVersion: string
  os: string
  osVersion: string
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase()
  
  // تحديد نوع الجهاز
  let device: 'mobile' | 'tablet' | 'desktop' = 'desktop'
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    device = 'tablet'
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    device = 'mobile'
  }
  
  // تحديد المتصفح والإصدار
  let browser = 'Unknown'
  let browserVersion = ''
  
  if (ua.includes('edg/')) {
    browser = 'Edge'
    browserVersion = userAgent.match(/Edg\/(\d+)/)?.[1] || ''
  } else if (ua.includes('chrome/') && !ua.includes('edg')) {
    browser = 'Chrome'
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || ''
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Safari'
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || ''
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox'
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || ''
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera'
    browserVersion = userAgent.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || ''
  } else if (ua.includes('msie') || ua.includes('trident/')) {
    browser = 'IE'
    browserVersion = userAgent.match(/(?:MSIE |rv:)(\d+)/)?.[1] || ''
  }
  
  // تحديد نظام التشغيل والإصدار
  let os = 'Unknown'
  let osVersion = ''
  
  if (ua.includes('windows')) {
    os = 'Windows'
    if (ua.includes('windows nt 10.0')) {
      osVersion = '10/11'
    } else if (ua.includes('windows nt 6.3')) {
      osVersion = '8.1'
    } else if (ua.includes('windows nt 6.2')) {
      osVersion = '8'
    } else if (ua.includes('windows nt 6.1')) {
      osVersion = '7'
    }
  } else if (ua.includes('mac os x')) {
    os = 'macOS'
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/i)
    if (match) {
      osVersion = match[1].replace('_', '.')
    }
  } else if (ua.includes('android')) {
    os = 'Android'
    const match = userAgent.match(/Android (\d+(?:\.\d+)?)/i)
    if (match) {
      osVersion = match[1]
    }
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = ua.includes('ipad') ? 'iPad' : 'iOS'
    const match = userAgent.match(/OS (\d+[._]\d+)/i)
    if (match) {
      osVersion = match[1].replace('_', '.')
    }
  } else if (ua.includes('linux')) {
    os = 'Linux'
  }
  
  return {
    device,
    browser,
    browserVersion,
    os,
    osVersion
  }
}

/**
 * الحصول على معلومات إضافية من المتصفح (Client-side only)
 */
export function getClientInfo() {
  if (typeof window === 'undefined') {
    return null
  }
  
  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}
