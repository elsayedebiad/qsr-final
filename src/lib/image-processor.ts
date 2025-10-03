import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Helper function to convert Google Drive links to direct image URLs
const convertGoogleDriveUrl = (url: string): string => {
  if (!url.includes('drive.google.com')) {
    return url
  }

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const pattern1 = /drive\.google\.com\/file\/d\/([^\/]+)/
  const match1 = url.match(pattern1)
  if (match1) {
    const fileId = match1[1]
    // Convert to direct download link
    return `https://drive.google.com/uc?export=view&id=${fileId}`
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID
  const pattern2 = /drive\.google\.com\/open\?id=([^&]+)/
  const match2 = url.match(pattern2)
  if (match2) {
    const fileId = match2[1]
    return `https://drive.google.com/uc?export=view&id=${fileId}`
  }

  // Pattern 3: Already in direct format
  if (url.includes('drive.google.com/uc?')) {
    return url
  }

  return url
}

// Helper function to process and save images (both URLs and Base64)
export const processImage = async (imageData: string): Promise<string | null> => {
  if (!imageData || !imageData.trim()) {
    return null
  }

  try {
    // Convert Google Drive URLs to direct links first
    let processedUrl = imageData
    if (imageData.includes('drive.google.com')) {
      processedUrl = convertGoogleDriveUrl(imageData)
      console.log(`🔄 تحويل رابط Google Drive: ${imageData} → ${processedUrl}`)
    }
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)

    // Check if it's a Base64 image
    if (processedUrl.startsWith('data:image/')) {
      console.log('🖼️ معالجة صورة Base64...')
      
      // Extract the base64 data and mime type
      const matches = processedUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
      if (!matches) {
        console.error('تنسيق Base64 غير صحيح')
        return null
      }

      const [, extension, base64Data] = matches
      const filename = `${timestamp}_${randomId}_base64.${extension}`
      const filepath = join(uploadsDir, filename)

      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data, 'base64')
      await writeFile(filepath, buffer)

      console.log(`✅ تم حفظ صورة Base64: ${filename}`)
      return `/uploads/images/${filename}`
    }
    
    // Check if it's an HTTP URL
    else if (processedUrl.startsWith('http://') || processedUrl.startsWith('https://')) {
      console.log(`🖼️ تحميل صورة من URL: ${processedUrl}`)
      
      const response = await fetch(processedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      if (!response.ok) {
        console.error(`فشل في تحميل الصورة: ${response.statusText}`)
        return null
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) {
        console.error('الرابط لا يشير إلى صورة صحيحة')
        return null
      }

      const extension = contentType.split('/')[1] || 'jpg'
      const filename = `${timestamp}_${randomId}_url.${extension}`
      const filepath = join(uploadsDir, filename)

      const buffer = Buffer.from(await response.arrayBuffer())
      await writeFile(filepath, buffer)

      console.log(`✅ تم تحميل الصورة من URL: ${filename}`)
      return `/uploads/images/${filename}`
    }
    
    // If it's neither Base64 nor URL, treat it as a local path
    else {
      console.log(`🖼️ مسار صورة محلي: ${processedUrl}`)
      // Return as is if it's already a valid local path
      if (processedUrl.startsWith('/uploads/') || processedUrl.startsWith('./uploads/')) {
        return processedUrl
      }
      
      // If it's just a filename, assume it's in uploads/images
      if (!processedUrl.includes('/')) {
        return `/uploads/images/${processedUrl}`
      }
      
      return processedUrl
    }
  } catch (error) {
    console.error(`خطأ في معالجة الصورة:`, error)
    return null
  }
}

// Legacy function for backward compatibility
export const downloadImage = processImage
