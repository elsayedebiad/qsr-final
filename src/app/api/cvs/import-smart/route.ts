import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { processImage } from '@/lib/image-processor'
import { NotificationService } from '@/lib/notification-service'

// استخدام dynamic imports لتقليل حجم الـbundle
// import * as XLSX from 'xlsx' - سيتم تحميله عند الحاجة

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Interface for Excel data
interface ExcelRow {
  'الاسم الكامل'?: string
  'الاسم بالعربية'?: string
  'البريد الإلكتروني'?: string
  'رقم الهاتف'?: string
  'الكود المرجعي'?: string
  'الرقم المرجعي'?: string
  'كود مرجعي'?: string
  'رقم مرجعي'?: string
  'رمز المرجع'?: string  // إضافة اسم العمود من القالب
  'Reference Code'?: string
  'Ref Code'?: string
  'Code'?: string
  'ID'?: string
  'الراتب الشهري'?: string
  'مدة العقد'?: string
  'فترة العقد'?: string  // إضافة اسم العمود من القالب
  'الوظيفة المطلوبة'?: string
  'المنصب'?: string  // إضافة اسم العمود من القالب
  'الوظيفة'?: string  // إضافة عمود الوظيفة من ملف System.csv
  'رقم الجواز'?: string
  'رقم جواز السفر'?: string  // إضافة اسم العمود من القالب
  'تاريخ إصدار الجواز'?: string
  'تاريخ انتهاء الجواز'?: string
  'مكان إصدار الجواز'?: string
  'الجنسية'?: string
  'الديانة'?: string
  'تاريخ الميلاد'?: string
  'مكان الميلاد'?: string
  'مكان السكن'?: string
  'الحالة الاجتماعية'?: string
  'عدد الأطفال'?: string
  'الوزن'?: string
  'الطول'?: string
  'لون البشرة'?: string
  'العمر'?: string
  'الإنجليزية'?: string
  'العربية'?: string
  'مستوى الإنجليزية'?: string
  'مستوى العربية'?: string
  'English'?: string
  'Arabic'?: string
  'English Level'?: string
  'Arabic Level'?: string
  'انجليزي'?: string
  'انجليزية'?: string
  'عربي'?: string
  'عربية'?: string
  'الدرجة العلمية'?: string
  'المؤهل العلمي'?: string
  'Education'?: string
  'Education Level'?: string
  'رعاية الأطفال'?: string
  'كي الملابس'?: string
  'العناية بالوالدين'?: string
  'الطبخ'?: string
  'العمل المنزلي'?: string
  'التنظيف'?: string
  'الغسيل'?: string
  'الطبخ العربي'?: string
  'الخياطة'?: string
  'القيادة'?: string
  'تعليم الأطفال'?: string
  'رعاية المعوقين'?: string
  'رعاية المسنين'?: string
  'التدبير المنزلي'?: string
  'الخبرة في الخارج'?: string
  'الصورة الشخصية'?: string
  'رابط الصورة الشخصية'?: string
  // Additional image column variations
  'صورة شخصية'?: string
  'رابط الصورة'?: string
  'صورة'?: string
  'Image URL'?: string
  'Profile Image'?: string
  'Photo'?: string
  'Picture'?: string
  'التعليم'?: string
  'المهارات'?: string
  'الملخص'?: string
  'الأولوية'?: string
  'ملاحظات'?: string
  // Video URL columns
  'رابط الفيديو'?: string
  'فيديو'?: string
  'Video URL'?: string
  'Video'?: string
  'Video Link'?: string
  // CV Image URL columns (full designed CV image)
  'صورة السيرة'?: string
  'رابط صورة السيرة'?: string
  'صورة السيرة الكاملة'?: string
  'CV Image'?: string
  'CV Image URL'?: string
  'Resume Image'?: string
  // Allow any additional columns that might exist in Excel files
  [key: string]: any
}

// Interface for processed CV data
interface ProcessedCV {
  rowNumber: number
  fullName: string
  fullNameArabic?: string
  email?: string
  phone?: string
  referenceCode?: string
  monthlySalary?: string
  contractPeriod?: string
  position?: string
  passportNumber?: string
  passportIssueDate?: string
  passportExpiryDate?: string
  passportIssuePlace?: string
  nationality?: string
  religion?: string
  dateOfBirth?: string
  placeOfBirth?: string
  livingTown?: string
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'
  numberOfChildren?: number
  weight?: string
  height?: string
  complexion?: string
  age?: number
  englishLevel?: 'YES' | 'NO' | 'WILLING' | null
  arabicLevel?: 'YES' | 'NO' | 'WILLING' | null
  educationLevel?: string
  babySitting?: 'YES' | 'NO' | 'WILLING'
  childrenCare?: 'YES' | 'NO' | 'WILLING'
  tutoring?: 'YES' | 'NO' | 'WILLING'
  disabledCare?: 'YES' | 'NO' | 'WILLING'
  cleaning?: 'YES' | 'NO' | 'WILLING'
  washing?: 'YES' | 'NO' | 'WILLING'
  ironing?: 'YES' | 'NO' | 'WILLING'
  arabicCooking?: 'YES' | 'NO' | 'WILLING'
  sewing?: 'YES' | 'NO' | 'WILLING'
  driving?: 'YES' | 'NO' | 'WILLING'
  elderCare?: 'YES' | 'NO' | 'WILLING'
  housekeeping?: 'YES' | 'NO' | 'WILLING'
  cooking?: 'YES' | 'NO' | 'WILLING'
  experience?: string
  education?: string
  skills?: string
  summary?: string
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
  notes?: string
  isUpdate: boolean
  existingId?: number
  duplicateReason?: string
  profileImage?: string // Added for image handling
  cvImageUrl?: string // رابط صورة السيرة الكاملة المصممة
  videoUrl?: string // Added for video handling
}

// Interface for import results
interface ImportResult {
  totalRows: number
  newRecords: number
  updatedRecords: number
  skippedRecords: number
  errorRecords: number
  details: {
    newCVs: ProcessedCV[]
    updatedCVs: ProcessedCV[]
    skippedCVs: ProcessedCV[]
    errorCVs: ProcessedCV[]
  }
  summary: string
}

// Helper function to normalize skill levels
const normalizeSkillLevel = (value?: string): 'YES' | 'NO' | 'WILLING' | undefined => {
  if (!value) return undefined
  const normalized = value.toString().trim().toUpperCase()
  if (normalized === 'YES' || normalized === 'نعم' || normalized === '1') return 'YES'
  if (normalized === 'NO' || normalized === 'لا' || normalized === '0') return 'NO'
  if (normalized === 'WILLING' || normalized === 'راغب' || normalized === 'مستعد') return 'WILLING'
  return undefined
}

// Helper function to normalize marital status
const normalizeMaritalStatus = (value?: string): 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | undefined => {
  if (!value) return undefined
  const normalized = value.toString().trim().toUpperCase()
  if (normalized === 'SINGLE' || normalized === 'أعزب' || normalized === 'عزباء') return 'SINGLE'
  if (normalized === 'MARRIED' || normalized === 'متزوج' || normalized === 'متزوجة') return 'MARRIED'
  if (normalized === 'DIVORCED' || normalized === 'مطلق' || normalized === 'مطلقة') return 'DIVORCED'
  if (normalized === 'WIDOWED' || normalized === 'أرمل' || normalized === 'أرملة') return 'WIDOWED'
  return undefined
}

// Helper function to normalize priority
const normalizePriority = (value?: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (!value) return 'MEDIUM'
  const normalized = value.toString().trim().toUpperCase()
  if (normalized === 'HIGH' || normalized === 'عالية' || normalized === 'مرتفعة') return 'HIGH'
  if (normalized === 'LOW' || normalized === 'منخفضة' || normalized === 'قليلة') return 'LOW'
  return 'MEDIUM'
}

// Helper function to download and save an image from a URL
const downloadImage = async (imageUrl: string): Promise<string | null> => {
  if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
    return null
  }

  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.statusText}`)
      return null
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('URL does not point to a valid image')
      return null
    }

    const { mkdir, writeFile } = await import('fs/promises')
    const { join } = await import('path')
    const { existsSync } = await import('fs')
    
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const extension = contentType.split('/')[1] || 'jpg'
    const filename = `${timestamp}_imported.${extension}`
    const filepath = join(uploadsDir, filename)

    const buffer = Buffer.from(await response.arrayBuffer())
    await writeFile(filepath, buffer)

    return `/uploads/images/${filename}`
  } catch (error) {
    console.error(`Error downloading image from ${imageUrl}:`, error)
    return null
  }
}


// Helper function to check for duplicate CVs
const checkForDuplicates = async (cv: ProcessedCV, processedPassports: Set<string>) => {
  try {
    // فحص التكرار بناءً على الكود المرجعي (له قيد unique في قاعدة البيانات)
    if (cv.referenceCode && cv.referenceCode.trim()) {
      try {
        const referenceCode = cv.referenceCode.trim()
        
        const existingByRefCode = await db.cV.findFirst({
          where: { referenceCode: referenceCode },
          select: {
            id: true,
            fullName: true,
            referenceCode: true
          }
        })
        
        if (existingByRefCode) {
          console.log(`✅ تم العثور على تكرار بالكود المرجعي: ${referenceCode} موجود مسبقاً للشخص ${existingByRefCode.fullName} (ID: ${existingByRefCode.id})`)
          return { 
            isDuplicate: true, 
            existingId: existingByRefCode.id,
            reason: `الكود المرجعي موجود مسبقاً في قاعدة البيانات للشخص: ${existingByRefCode.fullName}` 
          }
        }
      } catch (refCodeError) {
        console.error('خطأ في فحص الكود المرجعي:', refCodeError)
        // Continue with other checks even if reference code check fails
      }
    }
    
    // فحص التكرار بناءً على رقم جواز السفر
    if (cv.passportNumber && cv.passportNumber.trim()) {
      try {
        const passportNumber = cv.passportNumber.trim().toUpperCase() // تحويل إلى أحرف كبيرة للمقارنة
        
        // فحص التكرار في نفس الملف المرفوع
        if (processedPassports.has(passportNumber)) {
          console.log(`⚠️ رقم جواز السفر ${passportNumber} مكرر في نفس الملف`)
          return { 
            isDuplicate: true, 
            existingId: null, 
            reason: 'رقم جواز السفر مكرر في نفس الملف' 
          }
        }
        
        // فحص التكرار في قاعدة البيانات باستخدام البحث الغير حساس للحالة
        const existingByPassport = await db.cV.findFirst({
          where: { 
            passportNumber: {
              equals: passportNumber,
              mode: 'insensitive'
            }
          },
          select: {
            id: true,
            fullName: true,
            passportNumber: true
          }
        })
        
        if (existingByPassport) {
          console.log(`✅ تم العثور على تكرار: ${cv.fullName} (${passportNumber}) موجود مسبقاً باسم ${existingByPassport.fullName} (ID: ${existingByPassport.id})`)
          return { 
            isDuplicate: true, 
            existingId: existingByPassport.id, // This is an Int from schema
            reason: `رقم جواز السفر موجود مسبقاً في قاعدة البيانات للشخص: ${existingByPassport.fullName}` 
          }
        }
        
        // إضافة رقم الجواز إلى المعالجة
        processedPassports.add(passportNumber)
      } catch (passportError) {
        console.error('خطأ في فحص رقم جواز السفر:', passportError)
        // Continue with other checks
      }
    } else {
      // إذا لم يكن هناك رقم جواز، تحقق من الاسم الكامل كحل احتياطي
      if (cv.fullName && cv.fullName.trim()) {
        try {
          const fullName = cv.fullName.trim()
          const existingByName = await db.cV.findFirst({
            where: { 
              fullName: {
                equals: fullName,
                mode: 'insensitive'
              }
            },
            select: {
              id: true,
              fullName: true,
              passportNumber: true
            }
          })
          
          if (existingByName) {
            console.log(`✅ تم العثور على تكرار بالاسم: ${cv.fullName} موجود مسبقاً (ID: ${existingByName.id})`)
            return { 
              isDuplicate: true, 
              existingId: existingByName.id,
              reason: `الاسم الكامل موجود مسبقاً في قاعدة البيانات (لا يوجد رقم جواز)` 
            }
          }
        } catch (nameError) {
          console.error('خطأ في فحص الاسم الكامل:', nameError)
          // No duplicates found
        }
      }
    }

    // إذا لم يكن هناك تكرار
    return { isDuplicate: false }
  } catch (error) {
    console.error('❌ خطأ عام في فحص التكرارات:', error)
    // في حالة فشل فحص التكرارات، نفترض عدم وجود تكرار لتجنب تعطيل العملية بالكامل
    return { isDuplicate: false }
  }
}

// Helper functions for data cleaning
const cleanPhoneNumber = (phone: any): string | undefined => {
  if (!phone) return undefined
  // Convert to string and clean
  const phoneStr = String(phone).replace(/[^\d+]/g, '')
  return phoneStr || undefined
}

const cleanDateValue = (dateValue: any): string | undefined => {
  if (!dateValue) return undefined
  
  // If it's a number (Excel serial date), convert it
  if (typeof dateValue === 'number') {
    try {
      // Excel serial date to JavaScript date
      const date = new Date((dateValue - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0] // YYYY-MM-DD format
    } catch {
      return undefined
    }
  }
  
  // If it's already a string, return as is
  return String(dateValue).trim() || undefined
}

const cleanStringValue = (value: any): string | undefined => {
  if (!value) return undefined
  const cleaned = String(value).trim()
  
  // تحويل القيم الافتراضية الفارغة إلى undefined
  const emptyValues = [
    'غير مستخدم', 
    'غير متوفر', 
    'لا يوجد',
    'N/A', 
    'n/a', 
    'NA', 
    'na',
    'NULL',
    'null',
    '-',
    '--',
    '---',
    ''
  ]
  
  if (!cleaned || emptyValues.includes(cleaned)) {
    return undefined
  }
  
  return cleaned
}

const cleanNumberValue = (value: any): number | undefined => {
  if (!value) return undefined
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  return isNaN(num) ? undefined : num
}

// Process Excel row to CV object
const processExcelRow = (row: ExcelRow, rowNumber: number): ProcessedCV => {
  try {
    // Debug: Log image and reference code data for first few rows
    if (rowNumber <= 5) {
      console.log(`🔍 الصف ${rowNumber} - فحص الحقول:`)
      
      // Check image fields
      const imageFields = [
        'رابط الصورة الشخصية', 'الصورة الشخصية', 'صورة شخصية', 
        'رابط الصورة', 'صورة', 'Image URL', 'Profile Image', 'Photo', 'Picture'
      ]
      
      imageFields.forEach(field => {
        if (row[field]) {
          const value = String(row[field])
          console.log(`  🖼️ ${field}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`)
        }
      })
      
      // Check reference code fields
      const refCodeFields = [
        'الكود المرجعي', 'الرقم المرجعي', 'كود مرجعي', 'رقم مرجعي',
        'Reference Code', 'Ref Code', 'Code', 'ID'
      ]
      
      refCodeFields.forEach(field => {
        if (row[field]) {
          console.log(`  🔢 ${field}: ${row[field]}`)
        }
      })
    }

    return {
      rowNumber,
      fullName: cleanStringValue(row['الاسم الكامل']) || '',
      fullNameArabic: cleanStringValue(row['الاسم بالعربية']),
      email: cleanStringValue(row['البريد الإلكتروني']),
      phone: cleanPhoneNumber(row['رقم الهاتف']),
      referenceCode: cleanStringValue(
        row['الكود المرجعي'] || 
        row['الرقم المرجعي'] ||
        row['كود مرجعي'] ||
        row['رقم مرجعي'] ||
        row['رمز المرجع'] ||  // إضافة اسم العمود من القالب
        row['Reference Code'] ||
        row['Ref Code'] ||
        row['Code'] ||
        row['ID']
      ),
      monthlySalary: cleanStringValue(row['الراتب الشهري']),
      contractPeriod: cleanStringValue(row['مدة العقد'] || row['فترة العقد']), // إضافة اسم العمود من القالب
      position: cleanStringValue(row['الوظيفة المطلوبة'] || row['المنصب'] || row['الوظيفة']), // إضافة عمود الوظيفة من System.csv
      passportNumber: cleanStringValue(row['رقم الجواز'] || row['رقم جواز السفر']), // إضافة اسم العمود من القالب
      passportIssueDate: cleanDateValue(row['تاريخ إصدار الجواز']),
      passportExpiryDate: cleanDateValue(row['تاريخ انتهاء الجواز']),
      passportIssuePlace: cleanStringValue(row['مكان إصدار الجواز']),
      nationality: cleanStringValue(row['الجنسية']),
      religion: cleanStringValue(row['الديانة']),
      dateOfBirth: cleanDateValue(row['تاريخ الميلاد']),
      placeOfBirth: cleanStringValue(row['مكان الميلاد']),
      livingTown: cleanStringValue(row['مكان السكن']),
      maritalStatus: normalizeMaritalStatus(row['الحالة الاجتماعية']),
      numberOfChildren: cleanNumberValue(row['عدد الأطفال']),
      weight: cleanStringValue(row['الوزن']),
      height: cleanStringValue(row['الطول']),
      complexion: cleanStringValue(row['لون البشرة']),
      age: cleanNumberValue(row['العمر']),
      englishLevel: (() => {
        // البحث عن عمود الإنجليزية بأسماء مختلفة
        const rawValue = row['مستوى الإنجليزية'] || row['الإنجليزية'] || row['English'] || row['English Level'] || row['انجليزي'] || row['انجليزية']
        if (!rawValue) return null // لا توجد قيمة
        
        // تحويل القيم الفعلية من الشيت إلى YES/NO/WILLING/null
        const normalized = rawValue.toString().trim()
        
        if (normalized === 'ممتاز') return 'YES' // ممتاز
        if (normalized === 'جيد') return 'WILLING' // جيد
        if (normalized === 'ضعيف') return null // ضعيف = null
        if (normalized === 'لا' || normalized === '') return 'NO' // لا يتحدث اللغة
        
        // للقيم الإنجليزية
        if (normalized.toLowerCase() === 'excellent' || normalized === 'نعم') return 'YES'
        if (normalized.toLowerCase() === 'good') return 'WILLING'
        if (normalized.toLowerCase() === 'weak' || normalized.toLowerCase() === 'poor') return null
        if (normalized.toLowerCase() === 'no' || normalized.toLowerCase() === 'none') return 'NO'
        
        return null // افتراضي للقيم غير المعروفة
      })(),
      arabicLevel: (() => {
        // البحث عن عمود العربية بأسماء مختلفة
        const rawValue = row['مستوى العربية'] || row['العربية'] || row['Arabic'] || row['Arabic Level'] || row['عربي'] || row['عربية']
        if (!rawValue) return null // لا توجد قيمة
        
        // تحويل القيم الفعلية من الشيت إلى YES/NO/WILLING/null
        const normalized = rawValue.toString().trim()
        
        if (normalized === 'ممتاز') return 'YES' // ممتاز
        if (normalized === 'جيد') return 'WILLING' // جيد
        if (normalized === 'ضعيف') return null // ضعيف = null
        if (normalized === 'لا' || normalized === '') return 'NO' // لا يتحدث اللغة
        
        // معالجة القيم الإضافية المحتملة
        if (normalized === 'متوسط') return 'WILLING' // متوسط = جيد
        if (normalized === 'نعم') return 'YES' // نعم = ممتاز
        
        // للقيم الإنجليزية
        if (normalized.toLowerCase() === 'excellent') return 'YES'
        if (normalized.toLowerCase() === 'good') return 'WILLING'
        if (normalized.toLowerCase() === 'weak' || normalized.toLowerCase() === 'poor') return null
        if (normalized.toLowerCase() === 'no' || normalized.toLowerCase() === 'none') return 'NO'
        
        return null // افتراضي للقيم غير المعروفة
      })(),
      educationLevel: cleanStringValue(row['الدرجة العلمية'] || row['التعليم'] || row['المؤهل العلمي'] || row['Education'] || row['Education Level']),
      babySitting: normalizeSkillLevel(row['رعاية الأطفال']),
      childrenCare: normalizeSkillLevel(row['رعاية الأطفال']),
      tutoring: normalizeSkillLevel(row['تعليم الأطفال']),
      disabledCare: normalizeSkillLevel(row['رعاية المعوقين']),
      cleaning: normalizeSkillLevel(row['التنظيف']),
      washing: normalizeSkillLevel(row['الغسيل']),
      ironing: normalizeSkillLevel(row['كي الملابس']),
      arabicCooking: normalizeSkillLevel(row['الطبخ العربي']),
      sewing: normalizeSkillLevel(row['الخياطة']),
      driving: normalizeSkillLevel(row['القيادة']),
      elderCare: normalizeSkillLevel(row['رعاية المسنين']),
      housekeeping: normalizeSkillLevel(row['التدبير المنزلي']),
      cooking: normalizeSkillLevel(row['الطبخ']),
      experience: cleanStringValue(row['الخبرة'] || row['الخبرة في الخارج'] || row['الخبرة السابقة']),
      education: cleanStringValue(row['التعليم']),
      skills: cleanStringValue(row['المهارات']),
      summary: cleanStringValue(row['الملخص']),
      priority: normalizePriority(row['الأولوية']),
      notes: cleanStringValue(row['ملاحظات']),
      isUpdate: false,
      profileImage: cleanStringValue(
        row['رابط الصورة الشخصية'] || 
        row['الصورة الشخصية'] ||
        row['صورة شخصية'] ||
        row['رابط الصورة'] ||
        row['صورة'] ||
        row['Image URL'] ||
        row['Profile Image'] ||
        row['Photo'] ||
        row['Picture']
      ), // Process profile image with multiple column name attempts
      cvImageUrl: cleanStringValue(
        row['صورة السيرة'] ||
        row['رابط صورة السيرة'] ||
        row['صورة السيرة الكاملة'] ||
        row['CV Image'] ||
        row['CV Image URL'] ||
        row['Resume Image']
      ), // رابط صورة السيرة الكاملة المصممة مسبقاً
      videoUrl: cleanStringValue(
        row['رابط الفيديو'] ||
        row['فيديو'] ||
        row['Video URL'] ||
        row['Video'] ||
        row['Video Link']
      ) // Process video URL with multiple column name attempts
    }
  } catch (error) {
    console.error('Error processing row:', error)
    throw error
  }
}

// Safe database operation wrapper
const safeDBOperation = async (operation: () => Promise<any>, errorMessage: string) => {
  try {
    return await operation()
  } catch (error) {
    console.error(errorMessage, error)
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const userIdString = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userIdString) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const userId = parseInt(userIdString, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'معرف المستخدم غير صحيح' }, { status: 400 })
    }

    // Check permissions
    if (userRole !== 'ADMIN' && userRole !== 'SUB_ADMIN') {
      return NextResponse.json(
        { error: 'صلاحيات غير كافية' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const action = formData.get('action') as string || 'analyze'

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم تحديد ملف' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'نوع الملف غير صحيح. يرجى رفع ملف Excel (.xlsx, .xls) أو CSV' },
        { status: 400 }
      )
    }

    // Read and parse Excel file
    let jsonData: ExcelRow[]
    try {
      // Dynamic import لتقليل حجم الـbundle
      const XLSX = await import('xlsx')
      
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[]
    } catch (error) {
      return NextResponse.json(
        { error: 'فشل في قراءة ملف Excel. تأكد من أن الملف غير تالف' },
        { status: 400 }
      )
    }

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'ملف Excel فارغ أو لا يحتوي على بيانات صحيحة' },
        { status: 400 }
      )
    }

    // Process each row
    const results: ImportResult = {
      totalRows: jsonData.length,
      newRecords: 0,
      updatedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      details: {
        newCVs: [],
        updatedCVs: [],
        skippedCVs: [],
        errorCVs: []
      },
      summary: ''
    }

    // مجموعة لتتبع أرقام الجوازات المعالجة في نفس الملف
    const processedPassports = new Set<string>()
    
    // تتبع الأرقام المرجعية وإحصائياتها
    const referenceCodeStats = new Map<string, number>()
    const processedReferenceCodes = new Set<string>()

    // Log column names from first row for debugging
    if (jsonData.length > 0) {
      console.log('🔍 أسماء الأعمدة المتاحة في ملف Excel:')
      const columns = Object.keys(jsonData[0])
      columns.forEach((col, index) => {
        console.log(`  ${index + 1}. "${col}"`)
      })
      
      // Check specifically for image-related columns
      const imageColumns = columns.filter(col => 
        col.includes('صورة') || col.includes('رابط') || 
        col.toLowerCase().includes('image') || col.toLowerCase().includes('photo') ||
        col.toLowerCase().includes('picture')
      )
      console.log('🖼️ أعمدة الصور المكتشفة:', imageColumns)
      
      // Check for reference code columns
      const refCodeColumns = columns.filter(col => 
        col.includes('كود') || col.includes('رقم') || col.includes('مرجعي') ||
        col.toLowerCase().includes('reference') || col.toLowerCase().includes('code') ||
        col.toLowerCase().includes('ref') || col === 'ID'
      )
      console.log('🔢 أعمدة الأرقام المرجعية المكتشفة:', refCodeColumns)
      
      // Check for video-related columns
      const videoColumns = columns.filter(col => 
        col.includes('فيديو') || col.includes('رابط الفيديو') ||
        col.toLowerCase().includes('video') || col.toLowerCase().includes('Video URL') ||
        col.toLowerCase().includes('Video Link')
      )
      console.log('🎬 أعمدة الفيديو المكتشفة:', videoColumns)
    }

    // Analyze each row for duplicates
    for (let i = 0; i < jsonData.length; i++) {
      try {
        const cv = processExcelRow(jsonData[i], i + 2) // +2 because Excel starts from row 1 and has header

        // Skip empty rows
        if (!cv.fullName || !cv.fullName.trim()) {
          cv.duplicateReason = 'الصف فارغ - لا يحتوي على اسم'
          results.details.skippedCVs.push(cv)
          results.skippedRecords++
          continue
        }

        // تتبع الأرقام المرجعية
        if (cv.referenceCode && cv.referenceCode.trim()) {
          const refCode = cv.referenceCode.trim()
          referenceCodeStats.set(refCode, (referenceCodeStats.get(refCode) || 0) + 1)
          processedReferenceCodes.add(refCode)
        }

        // Check for duplicates
        const duplicateCheck = await checkForDuplicates(cv, processedPassports)
        
        console.log(`الصف ${cv.rowNumber}: ${cv.fullName} - رقم الجواز: ${cv.passportNumber || 'غير محدد'} - تكرار: ${duplicateCheck.isDuplicate ? 'نعم' : 'لا'}`)
        
        if (duplicateCheck.isDuplicate) {
          cv.duplicateReason = duplicateCheck.reason
          
          if (duplicateCheck.existingId) {
            // تكرار مع سجل موجود في قاعدة البيانات - يمكن تحديثه
            cv.isUpdate = true
            cv.existingId = duplicateCheck.existingId
            results.details.updatedCVs.push(cv)
            results.updatedRecords++
            console.log(`✅ سيتم تحديث السجل الموجود (ID: ${duplicateCheck.existingId})`)
          } else {
            // تكرار داخل نفس الملف - تجاهل
            cv.isUpdate = false
            results.details.skippedCVs.push(cv)
            results.skippedRecords++
            console.log(`⚠️ تم تخطي السجل (تكرار في نفس الملف)`)
          }
        } else {
          results.details.newCVs.push(cv)
          results.newRecords++
          console.log(`✅ سجل جديد سيتم إضافته`)
        }
      } catch (error) {
        const errorCV: ProcessedCV = {
          rowNumber: i + 2,
          fullName: jsonData[i]['الاسم الكامل'] || `الصف ${i + 2}`,
          isUpdate: false,
          duplicateReason: `خطأ في معالجة البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        }
        results.details.errorCVs.push(errorCV)
        results.errorRecords++
      }
    }

    // If action is 'execute', perform the actual import/update
    if (action === 'execute') {
      const errors: string[] = []
      const importStartTime = Date.now() // Track import start time
      
      console.log(`🚀 بدء تنفيذ الاستيراد: ${results.newRecords} جديد، ${results.updatedRecords} تحديث`)

      // Insert new records
      for (const cv of results.details.newCVs) {
        try {
          console.log(`📝 إنشاء سجل جديد: ${cv.fullName} (الصف ${cv.rowNumber})`)
          
          // Handle image URL download
          let finalProfileImage = cleanStringValue(cv.profileImage)
          if (finalProfileImage) {
            console.log(`🖼️ محاولة تحميل صورة شخصية من: ${finalProfileImage}`)
            const downloadedPath = await processImage(finalProfileImage)
            if (downloadedPath) {
              finalProfileImage = downloadedPath
              console.log(`✅ تم تحميل الصورة الشخصية إلى: ${finalProfileImage}`)
            } else {
              console.log(`❌ فشل في تحميل الصورة الشخصية`)
            }
          }
          
          // Handle CV Image URL (رابط صورة السيرة الكاملة - لا يتم تحميلها، فقط حفظ الرابط)
          const cvImageUrl = cleanStringValue(cv.cvImageUrl)
          if (cvImageUrl) {
            console.log(`📄 رابط صورة السيرة الكاملة: ${cvImageUrl}`)
          }
        
          await db.cV.create({
              data: {
                fullName: cv.fullName,
                fullNameArabic: cv.fullNameArabic || null,
                email: cv.email || null,
                phone: cv.phone || null,
                referenceCode: cv.referenceCode || null,
                monthlySalary: cv.monthlySalary || null,
                contractPeriod: cv.contractPeriod || null,
                position: cv.position || null,
                passportNumber: cv.passportNumber && cv.passportNumber.trim() ? cv.passportNumber.trim() : null,
                passportIssueDate: cv.passportIssueDate || null,
                passportExpiryDate: cv.passportExpiryDate || null,
                passportIssuePlace: cv.passportIssuePlace || null,
                nationality: cv.nationality || null,
                religion: cv.religion || null,
                dateOfBirth: cv.dateOfBirth || null,
                placeOfBirth: cv.placeOfBirth || null,
                livingTown: cv.livingTown || null,
                maritalStatus: cv.maritalStatus || null,
                numberOfChildren: cv.numberOfChildren || null,
                weight: cv.weight || null,
                height: cv.height || null,
                complexion: cv.complexion || null,
                age: cv.age || null,
                englishLevel: cv.englishLevel || null,
                arabicLevel: cv.arabicLevel || null,
                educationLevel: cv.educationLevel || null,
                babySitting: cv.babySitting || null,
                childrenCare: cv.childrenCare || null,
                tutoring: cv.tutoring || null,
                disabledCare: cv.disabledCare || null,
                cleaning: cv.cleaning || null,
                washing: cv.washing || null,
                ironing: cv.ironing || null,
                arabicCooking: cv.arabicCooking || null,
                sewing: cv.sewing || null,
                driving: cv.driving || null,
                elderCare: cv.elderCare || null,
                housekeeping: cv.housekeeping || null,
                cooking: cv.cooking || null,
                experience: cv.experience || null,
                education: cv.education || null,
                skills: cv.skills || null,
                summary: cv.summary || null,
                notes: cv.notes || null,
                priority: cv.priority || 'MEDIUM',
                profileImage: finalProfileImage || null,
                cvImageUrl: cvImageUrl || null,
                videoLink: cv.videoUrl || null,
                source: 'Excel Smart Import',
                createdById: userId,
                updatedById: userId
              }
            })
            
          // Log individual CV creation activity
          try {
            await db.activityLog.create({
              data: {
                userId: userId,
                action: 'CV_CREATED',
                description: `تم إنشاء سيرة ذاتية جديدة لـ ${cv.fullName} عبر الاستيراد`,
                targetType: 'CV',
                targetName: cv.fullName,
                metadata: JSON.stringify({
                  source: 'Excel Smart Import',
                  fileName: file.name,
                  rowNumber: cv.rowNumber,
                  referenceCode: cv.referenceCode || null,
                  hasVideo: !!cv.videoUrl
                })
              }
            })
          } catch (activityError) {
            console.error(`خطأ في تسجيل نشاط الإنشاء:`, activityError)
          }
        } catch (error) {
          console.error(`فشل في إنشاء السيرة الذاتية للصف ${cv.rowNumber}:`, error)
          
          // نقل السيرة من newCVs إلى errorCVs
          const errorCV: ProcessedCV = {
            ...cv,
            duplicateReason: `خطأ في الحفظ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
          }
          results.details.errorCVs.push(errorCV)
          results.errorRecords++
          results.newRecords--
          
          errors.push(`الصف ${cv.rowNumber} (${cv.fullName}): ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
        }
      }

      // Update existing records
      for (const cv of results.details.updatedCVs) {
        if (cv.existingId) {
          try {
            console.log(`🔄 تحديث سجل موجود: ${cv.fullName} (ID: ${cv.existingId}, الصف ${cv.rowNumber})`)
            
            // Handle image URL download
            let finalProfileImage = cleanStringValue(cv.profileImage)
            if (finalProfileImage) {
              console.log(`🖼️ محاولة تحميل صورة شخصية من: ${finalProfileImage}`)
              const downloadedPath = await processImage(finalProfileImage)
              if (downloadedPath) {
                finalProfileImage = downloadedPath
                console.log(`✅ تم تحميل الصورة الشخصية إلى: ${finalProfileImage}`)
              } else {
                console.log(`❌ فشل في تحميل الصورة الشخصية`)
              }
            }
            
            // Handle CV Image URL (رابط صورة السيرة الكاملة - لا يتم تحميلها، فقط حفظ الرابط)
            const cvImageUrl = cleanStringValue(cv.cvImageUrl)
            if (cvImageUrl) {
              console.log(`📄 رابط صورة السيرة الكاملة: ${cvImageUrl}`)
            }
            
            // Handle video URL processing and validation for updates
            const updateVideoUrl = cleanStringValue(cv.videoUrl)
            if (updateVideoUrl) {
              console.log(`🎬 تحديث رابط الفيديو: ${updateVideoUrl}`)
              
              // Validate video URL
              const isValidVideo = updateVideoUrl.includes('youtube.com') || 
                                 updateVideoUrl.includes('youtu.be') || 
                                 updateVideoUrl.includes('vimeo.com') ||
                                 updateVideoUrl.includes('drive.google.com') ||
                                 updateVideoUrl.includes('.mp4') ||
                                 updateVideoUrl.includes('.webm')
              
              if (isValidVideo) {
                console.log(`✅ رابط فيديو صحيح للتحديث: ${updateVideoUrl}`)
              } else {
                console.log(`⚠️ رابط فيديو غير مدعوم للتحديث: ${updateVideoUrl}`)
              }
            } else {
              console.log(`❌ لا يوجد رابط فيديو للتحديث في الصف ${cv.rowNumber}`)
            }
            
            // Handle video URL processing and validation
            const videoUrl = cleanStringValue(cv.videoUrl)
            if (videoUrl) {
              console.log(`🎬 رابط الفيديو المكتشف: ${videoUrl}`)
              
              // Validate video URL
              const isValidVideo = videoUrl.includes('youtube.com') || 
                                 videoUrl.includes('youtu.be') || 
                                 videoUrl.includes('vimeo.com') ||
                                 videoUrl.includes('drive.google.com') ||
                                 videoUrl.includes('.mp4') ||
                                 videoUrl.includes('.webm')
              
              if (isValidVideo) {
                console.log(`✅ رابط فيديو صحيح: ${videoUrl}`)
              } else {
                console.log(`⚠️ رابط فيديو غير مدعوم: ${videoUrl}`)
              }
            } else {
              console.log(`❌ لا يوجد رابط فيديو للصف ${cv.rowNumber}`)
            }
          
            await db.cV.update({
                where: { id: cv.existingId },
                data: {
                  fullName: cv.fullName,
                  fullNameArabic: cv.fullNameArabic || null,
                  email: cv.email || null,
                  phone: cv.phone || null,
                  referenceCode: cv.referenceCode || null,
                  monthlySalary: cv.monthlySalary || null,
                  contractPeriod: cv.contractPeriod || null,
                  position: cv.position || null,
                  passportNumber: cv.passportNumber && cv.passportNumber.trim() ? cv.passportNumber.trim() : null,
                  passportIssueDate: cv.passportIssueDate || null,
                  passportExpiryDate: cv.passportExpiryDate || null,
                  passportIssuePlace: cv.passportIssuePlace || null,
                  nationality: cv.nationality || null,
                  religion: cv.religion || null,
                  dateOfBirth: cv.dateOfBirth || null,
                  placeOfBirth: cv.placeOfBirth || null,
                  livingTown: cv.livingTown || null,
                  maritalStatus: cv.maritalStatus || null,
                  numberOfChildren: cv.numberOfChildren || null,
                  weight: cv.weight || null,
                  height: cv.height || null,
                  complexion: cv.complexion || null,
                  age: cv.age || null,
                  englishLevel: cv.englishLevel || null,
                  arabicLevel: cv.arabicLevel || null,
                  educationLevel: cv.educationLevel || null,
                  babySitting: cv.babySitting || null,
                  childrenCare: cv.childrenCare || null,
                  tutoring: cv.tutoring || null,
                  disabledCare: cv.disabledCare || null,
                  cleaning: cv.cleaning || null,
                  washing: cv.washing || null,
                  ironing: cv.ironing || null,
                  arabicCooking: cv.arabicCooking || null,
                  sewing: cv.sewing || null,
                  driving: cv.driving || null,
                  elderCare: cv.elderCare || null,
                  housekeeping: cv.housekeeping || null,
                  cooking: cv.cooking || null,
                  experience: cv.experience || null,
                  education: cv.education || null,
                  skills: cv.skills || null,
                  summary: cv.summary || null,
                  notes: cv.notes || null,
                  priority: cv.priority || 'MEDIUM',
                  profileImage: finalProfileImage || null,
                  cvImageUrl: cvImageUrl || null,
                  videoLink: cv.videoUrl || null,
                  updatedById: userId
                }
              })
              
            // Log individual CV update activity
            try {
              await db.activityLog.create({
                data: {
                  userId: userId,
                  action: 'CV_UPDATED',
                  description: `تم تحديث السيرة الذاتية لـ ${cv.fullName} عبر الاستيراد`,
                  targetType: 'CV',
                  targetId: cv.existingId.toString(),
                  targetName: cv.fullName,
                  metadata: JSON.stringify({
                    source: 'Excel Smart Import',
                    fileName: file.name,
                    rowNumber: cv.rowNumber,
                    referenceCode: cv.referenceCode || null,
                    hasVideo: !!cv.videoUrl,
                    updateReason: cv.duplicateReason
                  })
                }
              })
            } catch (activityError) {
              console.error(`خطأ في تسجيل نشاط التحديث:`, activityError)
            }
          } catch (error) {
            console.error(`فشل في تحديث السيرة الذاتية للصف ${cv.rowNumber}:`, error)
            
            // نقل السيرة من updatedCVs إلى errorCVs
            const errorCV: ProcessedCV = {
              ...cv,
              duplicateReason: `خطأ في التحديث: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
            }
            results.details.errorCVs.push(errorCV)
            results.errorRecords++
            results.updatedRecords--
            
            errors.push(`الصف ${cv.rowNumber} (${cv.fullName}): ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
          }
        }
      }

      // Send notification about the import
      try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (user) {
          await NotificationService.notifyImport({
            fileName: file.name,
            totalRows: results.totalRows,
            newRecords: results.newRecords,
            updatedRecords: results.updatedRecords,
            skippedRecords: results.skippedRecords,
            errorRecords: results.errorRecords + errors.length,
            importType: 'الاستيراد الذكي',
            userId: userId,
            userName: user.name
          })
        }
      } catch (notificationError) {
        console.error('Error sending import notification:', notificationError)
      }

      // Log import activity to database
      try {
        await db.activityLog.create({
          data: {
            userId: userId,
            action: 'EXCEL_IMPORT',
            description: `تم استيراد ملف Excel "${file.name}" - ${results.totalRows} صف: ${results.newRecords} جديد، ${results.updatedRecords} محدث، ${results.skippedRecords} متخطى، ${results.errorRecords + errors.length} خطأ`,
            targetType: 'SYSTEM',
            targetName: file.name,
            metadata: JSON.stringify({
              fileName: file.name,
              totalRows: results.totalRows,
              newRecords: results.newRecords,
              updatedRecords: results.updatedRecords,
              skippedRecords: results.skippedRecords,
              errorRecords: results.errorRecords + errors.length,
              importType: 'الاستيراد الذكي',
              processingTime: Date.now() - importStartTime,
              referenceCodes: processedReferenceCodes.size,
              videoLinks: Array.from(referenceCodeStats.keys()).filter(code => 
                results.details.newCVs.concat(results.details.updatedCVs)
                  .some(cv => cv.referenceCode === code && cv.videoUrl)
              ).length
            })
          }
        })
        console.log('✅ Activity logged to database successfully')
      } catch (activityError) {
        console.error('❌ Error logging activity to database:', activityError)
      }

      // If there were errors during execution, include them in the response
      if (errors.length > 0) {
        results.summary += ` - أخطاء في التنفيذ: ${errors.length}`
        return NextResponse.json({
          ...results,
          executionErrors: errors,
          warning: 'تم تنفيذ بعض العمليات بنجاح مع وجود أخطاء'
        })
      }
    }

    // Generate summary with reference code statistics
    let summary = `تم تحليل ${results.totalRows} صف: ${results.newRecords} جديد، ${results.updatedRecords} تحديث، ${results.skippedRecords} تم تخطيه، ${results.errorRecords} خطأ`
    
    // إضافة إحصائيات الأرقام المرجعية
    if (processedReferenceCodes.size > 0) {
      summary += `\n\n📊 إحصائيات الأرقام المرجعية:`
      summary += `\n🔢 إجمالي الأرقام المرجعية المختلفة: ${processedReferenceCodes.size}`
      
      // عرض تفاصيل كل رقم مرجعي
      const sortedRefCodes = Array.from(referenceCodeStats.entries())
        .sort((a, b) => b[1] - a[1]) // ترتيب حسب العدد (الأكثر أولاً)
      
      summary += `\n\n📋 تفاصيل الأرقام المرجعية:`
      sortedRefCodes.forEach(([refCode, count]) => {
        summary += `\n  • ${refCode}: ${count} سيرة ذاتية`
      })
      
      console.log('📊 إحصائيات الأرقام المرجعية:')
      console.log(`🔢 إجمالي الأرقام المرجعية المختلفة: ${processedReferenceCodes.size}`)
      sortedRefCodes.forEach(([refCode, count]) => {
        console.log(`  • ${refCode}: ${count} سيرة ذاتية`)
      })
    }
    
    results.summary = summary

    // إضافة إحصائيات الأرقام المرجعية إلى النتائج
    const enhancedResults = {
      ...results,
      referenceCodeStats: {
        totalUniqueCodes: processedReferenceCodes.size,
        codeDetails: Object.fromEntries(referenceCodeStats)
      }
    }

    return NextResponse.json(enhancedResults)

  } catch (error) {
    console.error('خطأ في استيراد البيانات الذكي:', error)
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء معالجة الملف',
        details: error instanceof Error ? error.message : 'خطأ غير معروف',
        suggestion: 'تأكد من أن الملف يحتوي على البيانات الصحيحة والأعمدة المطلوبة'
      },
      { status: 500 }
    )
  }
}