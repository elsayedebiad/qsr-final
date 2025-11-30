import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import { NewContractStatus, ContractType } from '@prisma/client'

// تحويل اسم الحالة من العربية إلى الإنجليزية
const STATUS_MAP: { [key: string]: NewContractStatus } = {
  'طلب رفع سيرة': NewContractStatus.CV_REQUEST,
  'موافقة مكتب الإرسال الخارجي': NewContractStatus.EXTERNAL_OFFICE_APPROVAL,
  'موافقة وزارة العمل الأجنبية': NewContractStatus.FOREIGN_MINISTRY_APPROVAL,
  'تم إصدار التأشيرة': NewContractStatus.VISA_ISSUED,
  'تم الإرسال للسفارة السعودية': NewContractStatus.EMBASSY_SENT,
  'وصل للمملكة العربية السعودية': NewContractStatus.EMBASSY_APPROVAL,
  'تم التبليغ بموعد التذكرة': NewContractStatus.TICKET_DATE_NOTIFIED,
  'مرفوض': NewContractStatus.REJECTED,
  'ملغي': NewContractStatus.CANCELLED,
  'خارج المملكة': NewContractStatus.OUTSIDE_KINGDOM
}

// تحويل نوع العقد من العربية إلى الإنجليزية
const CONTRACT_TYPE_MAP: { [key: string]: ContractType } = {
  'معين': ContractType.SPECIFIC,
  'مواصفات': ContractType.BY_SPECIFICATIONS
}

// التحقق من صحة التاريخ
function parseDate(dateStr: string | number | undefined): Date | null {
  if (!dateStr) return null
  
  try {
    // إذا كان التاريخ بصيغة Excel serial number
    if (typeof dateStr === 'number') {
      const date = XLSX.SSF.parse_date_code(dateStr)
      return new Date(date.y, date.m - 1, date.d)
    }
    
    // إذا كان التاريخ بصيغة نصية (dd/MM/yyyy أو yyyy-MM-dd)
    if (typeof dateStr === 'string') {
      // محاولة dd/MM/yyyy
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          const day = parseInt(parts[0])
          const month = parseInt(parts[1])
          const year = parseInt(parts[2])
          return new Date(year, month - 1, day)
        }
      }
      
      // محاولة yyyy-MM-dd
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date
      }
    }
  } catch (error) {
    console.error('Error parsing date:', dateStr, error)
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'الرجاء تحميل ملف Excel' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // قراءة الملف
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // تحليل ملف Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'الملف فارغ أو لا يحتوي على بيانات' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // التحقق من تكرار أرقام العقود داخل الملف نفسه
    const contractNumbersInFile = new Map<string, number[]>()
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i]
      const contractNumber = String(row['رقم العقد'] || '').trim()
      if (contractNumber) {
        if (!contractNumbersInFile.has(contractNumber)) {
          contractNumbersInFile.set(contractNumber, [])
        }
        contractNumbersInFile.get(contractNumber)!.push(i + 2) // +2 لرقم الصف الفعلي
      }
    }

    // إضافة أخطاء للأرقام المكررة في الملف
    contractNumbersInFile.forEach((rows, contractNumber) => {
      if (rows.length > 1) {
        results.errors.push(`❌ رقم العقد "${contractNumber}" مكرر في الملف في الصفوف: ${rows.join(', ')}`)
      }
    })

    // معالجة كل صف
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i]
      const rowNumber = i + 2 // +2 لأن الصف الأول هو العناوين وبدأنا من 0

      try {
        // التحقق من الحقول المطلوبة
        if (!row['رقم العقد']) {
          results.errors.push(`الصف ${rowNumber}: رقم العقد مطلوب`)
          results.failed++
          continue
        }

        const contractNumber = String(row['رقم العقد']).trim()

        // تخطي إذا كان الرقم مكرر في الملف
        const duplicateRows = contractNumbersInFile.get(contractNumber) || []
        if (duplicateRows.length > 1) {
          results.failed++
          continue // تم إضافة الخطأ مسبقاً
        }

        if (!row['العميل']) {
          results.errors.push(`الصف ${rowNumber}: اسم العميل مطلوب`)
          results.failed++
          continue
        }

        if (!row['رقم جواز العاملة']) {
          results.errors.push(`الصف ${rowNumber}: رقم جواز العاملة مطلوب`)
          results.failed++
          continue
        }

        if (!row['الدولة']) {
          results.errors.push(`الصف ${rowNumber}: اسم الدولة مطلوب`)
          results.failed++
          continue
        }

        if (!row['المكتب']) {
          results.errors.push(`الصف ${rowNumber}: المكتب مطلوب`)
          results.failed++
          continue
        }

        if (!row['ممثل المبيعات']) {
          results.errors.push(`الصف ${rowNumber}: ممثل المبيعات مطلوب`)
          results.failed++
          continue
        }

        // التحقق من عدم تكرار رقم العقد في السيستم
        const existingContract = await prisma.newContract.findUnique({
          where: { contractNumber: contractNumber }
        })

        if (existingContract) {
          results.errors.push(`الصف ${rowNumber}: رقم العقد "${contractNumber}" موجود بالفعل في السيستم`)
          results.failed++
          continue
        }

        // تحويل نوع العقد
        const contractType = CONTRACT_TYPE_MAP[row['النوع']] || ContractType.SPECIFIC

        // تحويل الحالة
        const status = STATUS_MAP[row['الحالة']] || NewContractStatus.CV_REQUEST

        // تحويل المشكلة
        const hasCVIssue = row['يوجد مشكلة'] === 'نعم'

        // معالجة التواريخ
        const currentDate = parseDate(row['التاريخ الحالي']) || new Date()
        const cvUploadRequestDate = parseDate(row['تاريخ طلب رفع السيرة'])
        const employmentRequestDate = parseDate(row['تاريخ طلب التوظيف'])

        // إنشاء العقد
        await prisma.newContract.create({
          data: {
            contractType,
            salesRepName: String(row['ممثل المبيعات']),
            clientName: String(row['العميل']),
            contractNumber: String(row['رقم العقد']),
            supportMobileNumber: row['رقم الجوال المساند'] ? String(row['رقم الجوال المساند']) : null,
            salesMobileNumber: row['رقم المبيعات'] ? String(row['رقم المبيعات']) : null,
            currentMonth: row['رقم الشهر الميلادي'] ? parseInt(String(row['رقم الشهر الميلادي'])) : new Date().getMonth() + 1,
            currentDate,
            countryName: String(row['الدولة']),
            profession: row['المهنة'] ? String(row['المهنة']) : '',
            employerIdNumber: row['رقم هوية صاحب العمل'] ? String(row['رقم هوية صاحب العمل']) : '',
            workerPassportNumber: String(row['رقم جواز العاملة']),
            office: String(row['المكتب']),
            status,
            followUpNotes: row['ملاحظات المتابعة'] ? String(row['ملاحظات المتابعة']) : null,
            hasCVIssue,
            cvIssueType: hasCVIssue && row['نوع المشكلة'] ? String(row['نوع المشكلة']) : null,
            cvUploadRequestDate,
            employmentRequestDate,
            createdById: parseInt(userId),
            statusHistory: {
              [status]: currentDate.toISOString()
            }
          }
        })

        // إنشاء سجل تغيير الحالة الأولي
        const newContract = await prisma.newContract.findUnique({
          where: { contractNumber: String(row['رقم العقد']) }
        })

        if (newContract) {
          await prisma.contractStatusChange.create({
            data: {
              contractId: newContract.id,
              fromStatus: null,
              toStatus: status,
              changedById: parseInt(userId),
              notes: 'استيراد من Excel'
            }
          })
        }

        results.success++
      } catch (error) {
        console.error(`خطأ في الصف ${rowNumber}:`, error)
        results.errors.push(`الصف ${rowNumber}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
        results.failed++
      }
    }

    return NextResponse.json({
      message: `تم استيراد ${results.success} عقد بنجاح`,
      success: results.success,
      failed: results.failed,
      errors: results.errors
    })
  } catch (error) {
    console.error('❌ خطأ في استيراد العقود:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء استيراد العقود' },
      { status: 500 }
    )
  }
}
