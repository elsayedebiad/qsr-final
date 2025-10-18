/**
 * Utility functions for handling URLs, especially Google Drive links
 */

/**
 * Convert Google Drive sharing links to direct image URLs
 * @param url - The Google Drive URL
 * @returns Direct image URL that can be used in <img> src
 */
export const convertGoogleDriveUrl = (url: string): string => {
  if (!url || !url.includes('drive.google.com')) {
    return url
  }

  // Extract file ID from various Google Drive URL formats
  let fileId: string | null = null

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const pattern1 = /drive\.google\.com\/file\/d\/([^\/\?]+)/
  const match1 = url.match(pattern1)
  if (match1) {
    fileId = match1[1]
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID
  const pattern2 = /drive\.google\.com\/open\?id=([^&]+)/
  const match2 = url.match(pattern2)
  if (match2) {
    fileId = match2[1]
  }

  // Pattern 3: https://drive.google.com/uc?id=FILE_ID (old format)
  const pattern3 = /drive\.google\.com\/uc\?.*id=([^&]+)/
  const match3 = url.match(pattern3)
  if (match3) {
    fileId = match3[1]
  }

  // If we found a file ID, use the thumbnail API for better reliability
  if (fileId) {
    // Use Google Drive's thumbnail API with large size
    // This works better than direct uc?export=view for large images
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`
  }

  // If already in correct format, return as is
  if (url.includes('drive.google.com/thumbnail')) {
    return url
  }

  // Fallback: return original URL
  return url
}

/**
 * Get a thumbnail URL from Google Drive link
 * @param url - The Google Drive URL
 * @param size - Thumbnail size (default: 1000)
 * @returns Thumbnail URL
 */
export const getGoogleDriveThumbnail = (url: string, size: number = 1000): string => {
  if (!url || !url.includes('drive.google.com')) {
    return url
  }

  // Extract file ID
  const patterns = [
    /drive\.google\.com\/file\/d\/([^\/\?]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /drive\.google\.com\/uc\?(?:export=view&)?id=([^&]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const fileId = match[1]
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`
    }
  }

  return url
}

/**
 * Check if a URL is a Google Drive link
 * @param url - The URL to check
 * @returns true if it's a Google Drive link
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  return url && url.includes('drive.google.com')
}

/**
 * Process image URL for display (handles Google Drive, direct URLs, local paths)
 * @param url - The image URL
 * @returns Processed URL ready for use in <img> src
 */
export const processImageUrl = (url: string | undefined | null): string => {
  if (!url || url.trim() === '') {
    console.log('No image URL provided, using placeholder')
    return getPlaceholderImage()
  }

  // Clean the URL
  const cleanUrl = url.trim()

  // Convert Google Drive URLs
  if (isGoogleDriveUrl(cleanUrl)) {
    const processedUrl = convertGoogleDriveUrl(cleanUrl)
    console.log('Processed Google Drive URL:', cleanUrl, '->', processedUrl)
    return processedUrl
  }

  // Handle local uploads - ensure they're accessible
  if (cleanUrl.startsWith('/uploads/')) {
    console.log('Local upload URL:', cleanUrl)
    return cleanUrl
  }

  // Handle data URLs (base64 images)
  if (cleanUrl.startsWith('data:')) {
    console.log('Data URL detected')
    return cleanUrl
  }

  // Handle relative URLs
  if (cleanUrl.startsWith('./') || cleanUrl.startsWith('../')) {
    console.log('Relative URL:', cleanUrl)
    return cleanUrl
  }

  // Return other URLs as is
  console.log('Direct URL:', cleanUrl)
  return cleanUrl
}

/**
 * Get placeholder image URL (SVG for better performance)
 * @returns Placeholder image URL
 */
export const getPlaceholderImage = (): string => {
  // استخدام SVG inline data URL لضمان العمل دائماً
  return 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23grad1)"/%3E%3Ccircle cx="200" cy="200" r="120" fill="rgba(255, 255, 255, 0.1)"/%3E%3Cg fill="white" opacity="0.9"%3E%3Ccircle cx="200" cy="170" r="40"/%3E%3Cellipse cx="200" cy="280" rx="70" ry="80"/%3E%3Crect x="130" y="260" width="140" height="140" fill="url(%23grad1)"/%3E%3C/g%3E%3Ctext x="200" y="350" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" opacity="0.8"%3E%D9%84%D8%A7 %D8%AA%D9%88%D8%AC%D8%AF %D8%B5%D9%88%D8%B1%D8%A9%3C/text%3E%3C/svg%3E'
}

