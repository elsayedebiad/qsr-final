/**
 * تحويل ملف الصورة إلى Base64
 * @param file - ملف الصورة
 * @returns Promise<string> - الصورة كـ Base64
 */
export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('فشل في قراءة الملف'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('خطأ في قراءة الملف'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * ضغط الصورة قبل التحويل إلى Base64
 * @param file - ملف الصورة
 * @param maxWidth - العرض الأقصى
 * @param maxHeight - الارتفاع الأقصى
 * @param quality - جودة الضغط (0.1 - 1.0)
 * @returns Promise<string> - الصورة المضغوطة كـ Base64
 */
export const compressAndConvertImage = (
  file: File, 
  maxWidth: number = 1200, 
  maxHeight: number = 800, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // حساب الأبعاد الجديدة مع الحفاظ على النسبة
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      // تعيين أبعاد الكانفاس
      canvas.width = width
      canvas.height = height
      
      // رسم الصورة المضغوطة
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        
        // تحويل إلى Base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      } else {
        reject(new Error('فشل في إنشاء context للكانفاس'))
      }
    }
    
    img.onerror = () => {
      reject(new Error('فشل في تحميل الصورة'))
    }
    
    // تحويل الملف إلى URL للصورة
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }
    reader.readAsDataURL(file)
  })
}

/**
 * التحقق من نوع الملف
 * @param file - الملف
 * @returns boolean - true إذا كان ملف صورة صالح
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  return validTypes.includes(file.type)
}

/**
 * التحقق من حجم الملف
 * @param file - الملف
 * @param maxSizeMB - الحد الأقصى بالميجابايت
 * @returns boolean - true إذا كان الحجم مقبول
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * الحصول على معلومات الصورة
 * @param file - ملف الصورة
 * @returns Promise<{width: number, height: number, size: string}>
 */
export const getImageInfo = (file: File): Promise<{width: number, height: number, size: string}> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      })
    }
    
    img.onerror = () => {
      reject(new Error('فشل في قراءة معلومات الصورة'))
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }
    reader.readAsDataURL(file)
  })
}
