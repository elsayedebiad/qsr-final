/**
/**
 * Mobile Download Utilities
 * 
 * This module provides robust download functionality that works across different
 * platforms including Android apps, iOS apps, and regular web browsers.
 */

import { toast } from 'react-hot-toast'

export interface DownloadOptions {
  fileName: string
  mimeType?: string
  fallbackToNewWindow?: boolean
  showProgress?: boolean
}

/**
 * Detect if we're running in a mobile app webview
 */
export function isMobileApp(): boolean {
  const userAgent = navigator.userAgent.toLowerCase()
  
  // Check for Android app indicators
  if (userAgent.includes('wv') || // WebView
      userAgent.includes('android') && userAgent.includes('version/') ||
      window.matchMedia('(display-mode: standalone)').matches || // PWA
      // @ts-ignore
      window.navigator.standalone === true || // iOS PWA
      userAgent.includes('capacitor') || // Capacitor
      userAgent.includes('cordova') || // Cordova
      userAgent.includes('ionic')) { // Ionic
    return true
  }
  
  return false
}

/**
 * Check if the browser supports native download
 */
export function supportsNativeDownload(): boolean {
  const a = document.createElement('a')
  return typeof a.download !== 'undefined'
}

/**
 * Enhanced download function that works in mobile apps
 */
export async function downloadFile(
  blob: Blob, 
  options: DownloadOptions
): Promise<boolean> {
  const { fileName, mimeType = blob.type, fallbackToNewWindow = true } = options
  
  // Method 1: Try standard download (works in most browsers)
  if (supportsNativeDownload() && !isMobileApp()) {
    try {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      
      return true
    } catch (error) {
      // Silent error
    }
  }
  
  // Method 2: Mobile app specific download using data URLs
  if (isMobileApp()) {
    try {
      const reader = new FileReader()
      
      return new Promise((resolve) => {
        reader.onload = () => {
          const dataUrl = reader.result as string
          
          // For mobile apps, try multiple approaches
          
          // Approach 1: Data URL with download
          try {
            const link = document.createElement('a')
            link.href = dataUrl
            link.download = fileName
            link.target = '_blank'
            link.style.display = 'none'
            
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            resolve(true)
            return
          } catch (error) {
            // Silent error
          }
          
          // Approach 2: Open in new window/tab
          if (fallbackToNewWindow) {
            try {
              const newWindow = window.open()
              if (newWindow) {
                newWindow.document.write(`
                  <html>
                    <head>
                      <title>تحميل ${fileName}</title>
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { 
                          font-family: Arial, sans-serif; 
                          text-align: center; 
                          padding: 20px; 
                          background: #f5f5f5;
                        }
                        .container {
                          max-width: 500px;
                          margin: 0 auto;
                          background: white;
                          padding: 30px;
                          border-radius: 10px;
                          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        .image {
                          max-width: 100%;
                          height: auto;
                          border: 1px solid #ddd;
                          border-radius: 5px;
                          margin: 20px 0;
                        }
                        .download-btn {
                          background: #28a745;
                          color: white;
                          padding: 12px 24px;
                          border: none;
                          border-radius: 5px;
                          font-size: 16px;
                          cursor: pointer;
                          text-decoration: none;
                          display: inline-block;
                          margin: 10px;
                        }
                        .download-btn:hover {
                          background: #218838;
                        }
                        .instructions {
                          background: #e3f2fd;
                          padding: 15px;
                          border-radius: 5px;
                          margin: 15px 0;
                          font-size: 14px;
                          line-height: 1.5;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <h2>📥 تحميل الملف</h2>
                        <h3>${fileName}</h3>
                        
                        ${blob.type.startsWith('image/') ? 
                          `<img src="${dataUrl}" alt="${fileName}" class="image">` : 
                          `<div style="padding: 40px; border: 2px dashed #ccc; margin: 20px 0;">
                             <div style="font-size: 48px; margin-bottom: 10px;">📄</div>
                             <div>${fileName}</div>
                           </div>`
                        }
                        
                        <div style="margin: 20px 0;">
                          <a href="${dataUrl}" download="${fileName}" class="download-btn">
                            📥 تحميل الملف
                          </a>
                        </div>
                        
                        <div class="instructions">
                          <strong>📱 للتطبيقات:</strong><br>
                          • اضغط على "تحميل الملف" أعلاه<br>
                          • أو اضغط مطولاً على الصورة → "حفظ الصورة"<br>
                          • أو قم بأخذ لقطة شاشة
                        </div>
                        
                        <div style="margin-top: 20px; font-size: 12px; color: #666;">
                          يمكنك إغلاق هذه النافذة بعد التحميل
                        </div>
                      </div>
                    </body>
                  </html>
                `)
                newWindow.document.close()
                
                resolve(true)
                return
              }
            } catch (error) {
              // Silent error
            }
          }
          
          // If all else fails
          resolve(false)
        }
        
        reader.onerror = () => {
          resolve(false)
        }
        
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      return false
    }
  }
  
  // Method 3: Fallback - open in new window
  if (fallbackToNewWindow) {
    try {
      const url = URL.createObjectURL(blob)
      const newWindow = window.open(url, '_blank')
      
      if (newWindow) {
        // Clean up after a delay
        setTimeout(() => URL.revokeObjectURL(url), 10000)
        return true
      }
    } catch (error) {
      // Silent error
    }
  }
  
  return false
}

/**
 * Download from URL with mobile app support
 */
export async function downloadFromUrl(
  url: string, 
  options: DownloadOptions
): Promise<boolean> {
  
  try {
    // For mobile apps, try direct navigation first
    if (isMobileApp()) {
      // Method 1: Try direct download link
      try {
        const link = document.createElement('a')
        link.href = url
        link.download = options.fileName
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.style.display = 'none'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        return true
      } catch (error) {
        // Silent error
      }
      
      // Method 2: Open in new window for manual download
      try {
        window.open(url, '_blank', 'noopener,noreferrer')
        return true
      } catch (error) {
        // Silent error
      }
    }
    
    // For regular browsers, fetch and download
    const response = await fetch(url, { 
      mode: 'cors',
      credentials: 'omit'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    return await downloadFile(blob, options)
    
  } catch (error) {
    // Final fallback: just open the URL
    if (options.fallbackToNewWindow) {
      try {
        window.open(url, '_blank')
        return true
      } catch (fallbackError) {
        // Silent error
      }
    }
    
    return false
  }
}

/**
 * Show download instructions for mobile users
 */
export function showMobileDownloadInstructions(fileName: string) {
  toast(
    `📱 للتحميل في التطبيق:\n` +
    `• انتظر حتى يفتح الملف\n` +
    `• اضغط مطولاً على الصورة\n` +
    `• اختر "حفظ الصورة"\n` +
    `• أو خذ لقطة شاشة`,
    { 
      duration: 8000,
      style: {
        fontSize: '14px',
        textAlign: 'right'
      }
    }
  )
}