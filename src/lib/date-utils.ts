/**
 * تحويل التاريخ والوقت لتوقيت مصر (بورسعيد) بنظام 12 ساعة
 */
export function formatEgyptDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // تحويل لتوقيت مصر (UTC+2)
  const egyptTime = new Date(dateObj.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
  
  // الحصول على مكونات التاريخ
  const year = egyptTime.getFullYear()
  const month = String(egyptTime.getMonth() + 1).padStart(2, '0')
  const day = String(egyptTime.getDate()).padStart(2, '0')
  
  // الحصول على مكونات الوقت
  let hours = egyptTime.getHours()
  const minutes = String(egyptTime.getMinutes()).padStart(2, '0')
  const seconds = String(egyptTime.getSeconds()).padStart(2, '0')
  
  // تحويل لنظام 12 ساعة
  const period = hours >= 12 ? 'مساءً' : 'صباحاً'
  hours = hours % 12 || 12 // تحويل 0 إلى 12
  const hoursStr = String(hours).padStart(2, '0')
  
  // التنسيق النهائي
  return `${year}/${month}/${day} - ${hoursStr}:${minutes}:${seconds} ${period}`
}

/**
 * الحصول على الوقت الحالي بتوقيت مصر
 */
export function getCurrentEgyptTime(): string {
  return formatEgyptDateTime(new Date())
}

/**
 * تنسيق التاريخ فقط بدون وقت
 */
export function formatEgyptDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // تحويل لتوقيت مصر
  const egyptTime = new Date(dateObj.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
  
  const year = egyptTime.getFullYear()
  const month = String(egyptTime.getMonth() + 1).padStart(2, '0')
  const day = String(egyptTime.getDate()).padStart(2, '0')
  
  return `${year}/${month}/${day}`
}

/**
 * تنسيق الوقت فقط بدون تاريخ
 */
export function formatEgyptTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // تحويل لتوقيت مصر
  const egyptTime = new Date(dateObj.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
  
  let hours = egyptTime.getHours()
  const minutes = String(egyptTime.getMinutes()).padStart(2, '0')
  
  // تحويل لنظام 12 ساعة
  const period = hours >= 12 ? 'م' : 'ص'
  hours = hours % 12 || 12
  
  return `${hours}:${minutes} ${period}`
}

/**
 * الحصول على أيام الأسبوع بالعربية
 */
export function getArabicDayName(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const egyptTime = new Date(dateObj.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
  return days[egyptTime.getDay()]
}

/**
 * الحصول على أسماء الشهور بالعربية
 */
export function getArabicMonthName(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ]
  const egyptTime = new Date(dateObj.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
  return months[egyptTime.getMonth()]
}

/**
 * تنسيق شامل بالعربية
 */
export function formatEgyptDateTimeArabic(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const egyptTime = new Date(dateObj.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
  
  const dayName = getArabicDayName(egyptTime)
  const day = egyptTime.getDate()
  const monthName = getArabicMonthName(egyptTime)
  const year = egyptTime.getFullYear()
  
  let hours = egyptTime.getHours()
  const minutes = String(egyptTime.getMinutes()).padStart(2, '0')
  
  const period = hours >= 12 ? 'مساءً' : 'صباحاً'
  hours = hours % 12 || 12
  
  return `${dayName} ${day} ${monthName} ${year} - الساعة ${hours}:${minutes} ${period}`
}
