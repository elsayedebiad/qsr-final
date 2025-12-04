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
    const processedUrl = imageData.trim()
    
    // 🚀 NEW: If it's a Google Drive URL, return it directly without downloading
    // The frontend will handle conversion using url-utils.ts
    if (processedUrl.includes('drive.google.com')) {
      return processedUrl // Return the original Google Drive URL
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)

    // Check if it's a Base64 image
    if (processedUrl.startsWith('data:image/')) {
      // Extract the base64 data and mime type
      const matches = processedUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
      if (!matches) {
        return null
      }

      const [, extension, base64Data] = matches
      const filename = `${timestamp}_${randomId}_base64.${extension}`
      const filepath = join(uploadsDir, filename)

      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data, 'base64')
      await writeFile(filepath, buffer)

      return `/uploads/images/${filename}`
    }
    
    // Check if it's an HTTP/HTTPS URL (but NOT Google Drive - already handled above)
    else if (processedUrl.startsWith('http://') || processedUrl.startsWith('https://')) {
      try {
        const response = await fetch(processedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
        
        if (!response.ok) {
          return processedUrl // Return original URL as fallback
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.startsWith('image/')) {
          return processedUrl // Return original URL as fallback
        }

        const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg'
        const filename = `${timestamp}_${randomId}_url.${extension}`
        const filepath = join(uploadsDir, filename)

        const buffer = Buffer.from(await response.arrayBuffer())
        await writeFile(filepath, buffer)

        return `/uploads/images/${filename}`
      } catch (error) {
        return processedUrl // Return original URL as fallback
      }
    }
    
    // If it's neither Base64 nor URL, treat it as a local path
    else {
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
    return null
  }
}

// Legacy function for backward compatibility
export const downloadImage = processImage
