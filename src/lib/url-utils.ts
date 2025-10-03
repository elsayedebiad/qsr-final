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
  if (!url) {
    return ''
  }

  // Convert Google Drive URLs
  if (isGoogleDriveUrl(url)) {
    return convertGoogleDriveUrl(url)
  }

  // Return other URLs as is
  return url
}

