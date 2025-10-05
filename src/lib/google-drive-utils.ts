/**
 * تحويل رابط Google Drive من صيغة المشاهدة إلى صيغة مباشرة للعرض
 * @param driveUrl - رابط Google Drive الأصلي
 * @returns رابط مباشر للصورة أو الرابط الأصلي إذا لم يكن من Google Drive
 */
export function convertGoogleDriveUrl(driveUrl: string | null | undefined): string | null {
  if (!driveUrl) return null
  
  // التحقق من أن الرابط من Google Drive
  if (!driveUrl.includes('drive.google.com')) {
    return driveUrl
  }
  
  try {
    // استخراج معرف الملف من الرابط
    const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
    
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1]
      // تحويل إلى رابط مباشر
      return `https://drive.google.com/uc?export=view&id=${fileId}`
    }
    
    // إذا كان الرابط يحتوي على معرف الملف بطريقة أخرى
    const idMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/)
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`
    }
    
    return driveUrl
  } catch (error) {
    console.error('خطأ في تحويل رابط Google Drive:', error)
    return driveUrl
  }
}

/**
 * التحقق من صحة رابط الصورة
 * @param imageUrl - رابط الصورة
 * @returns true إذا كان الرابط صحيحاً
 */
export function isValidImageUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false
  
  // التحقق من الروابط المحلية
  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/images/')) {
    return true
  }
  
  // التحقق من الروابط الخارجية
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return true
  }
  
  // التحقق من صور Base64
  if (imageUrl.startsWith('data:image/')) {
    return true
  }
  
  return false
}

/**
 * الحصول على رابط الصورة المحسن للعرض
 * @param profileImage - رابط الصورة الأصلي
 * @returns رابط محسن للعرض أو null
 */
export function getOptimizedImageUrl(profileImage: string | null | undefined): string | null {
  if (!profileImage) return null
  
  // تحويل روابط Google Drive
  const convertedUrl = convertGoogleDriveUrl(profileImage)
  
  // التحقق من صحة الرابط
  if (isValidImageUrl(convertedUrl)) {
    return convertedUrl
  }
  
  return null
}
