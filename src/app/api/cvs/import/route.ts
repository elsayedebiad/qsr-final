import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

/** تطابق أعمدة الإكسل (حسب القالب العربي) */
const COLUMN_MAP = {
  // مفاتيح المطابقة
  passportNumber: ['رقم الجواز'],
  // شملت الشكلين عربي + إنجليزي
  referenceCode: ['الكود المرجعي', 'كود المرجع', 'Reference Code', 'ReferenceCode', 'Code'],

  // أساسية
  fullName: ['الاسم الكامل'],
  fullNameArabic: ['الاسم بالعربية'],
  email: ['البريد الإلكتروني'],
  phone: ['رقم الهاتف'],
  position: ['المنصب'],

  // بيانات اختيارية مذكورة بالقالب
  profileImage: ['رابط الصورة الشخصية'],
  monthlySalary: ['الراتب الشهري'],
  contractPeriod: ['مدة العقد'],

  nationality: ['الجنسية'],
  religion: ['الديانة'],
  dateOfBirth: ['تاريخ الميلاد'],
  placeOfBirth: ['مكان الميلاد'],
  livingTown: ['مدينة السكن'],
  maritalStatus: ['الحالة الاجتماعية'],
  numberOfChildren: ['عدد الأطفال'],
  weight: ['الوزن'],
  height: ['الطول'],
  complexion: ['لون البشرة'],
  age: ['العمر'],

  // اللغات
  englishLevel: ['الإنجليزية'],
  arabicLevel: ['العربية'],

  // المهارات (YES/NO/WILLING)
  babySitting: ['عناية الرضع'],
  childrenCare: ['عناية الأطفال'],
  tutoring: ['تعليم الأطفال'],
  disabledCare: ['عناية المعوقين'],
  cleaning: ['التنظيف'],
  washing: ['الغسيل'],
  ironing: ['الكي'],
  arabicCooking: ['الطبخ العربي'],
  sewing: ['الخياطة'],
  driving: ['القيادة'],

  // أولوية وملاحظات
  priority: ['الأولوية'],
  notes: ['ملاحظات'],

  // حقول وصفية قديمة (لو موجودة)
  experience: ['سنوات الخبرة'],
  education: ['المؤهل العلمي'],
  skills: ['المهارات'],
  summary: ['الملخص المهني'],
} as const

type ColumnKey = keyof typeof COLUMN_MAP
type ExcelRow = Record<string, any>

const pickCell = (row: ExcelRow, key: ColumnKey) => {
  for (const n of COLUMN_MAP[key]) {
    const v = row[n]
    if (v !== undefined && v !== null) return String(v)
  }
  return ''
}
const clean = (v: string) => (v ?? '').toString().trim()

const normalizePriority = (p: string) => {
  const s = (p || '').toLowerCase().trim()
  if (['low', 'منخفض', 'منخفضة'].includes(s)) return 'LOW'
  if (['high', 'عالي', 'عالية'].includes(s)) return 'HIGH'
  if (['urgent', 'عاجل', 'عاجلة'].includes(s)) return 'URGENT'
  return 'MEDIUM'
}

// تحويل المهارة لenum SkillLevel
const toSkill = (v: string) => {
  const s = (v || '').toLowerCase().trim()
  if (['yes', 'نعم', 'y'].includes(s)) return 'YES'
  if (['no', 'لا', 'n'].includes(s)) return 'NO'
  if (['willing', 'مستعد', 'مستعدة'].includes(s)) return 'WILLING'
  return null // نتركها null لو غير معروفة
}

export async function POST(request: NextRequest) {
  try {
    // صلاحيات مبسطة
    const userIdString = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    if (!userIdString) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = Number(userIdString)
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    if (userRole !== 'ADMIN' && userRole !== 'SUB_ADMIN')
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const action = (formData.get('action') as string) || 'import'
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // قراءة الشيت
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) return NextResponse.json({ error: 'No sheet found' }, { status: 400 })
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws, { defval: '' })
    if (!rows.length) return NextResponse.json({ error: 'Excel is empty' }, { status: 400 })

    // Parse & validate
    const parsed = rows.map((row, i) => {
      const fullName = clean(pickCell(row, 'fullName'))
      const passportNumber = clean(pickCell(row, 'passportNumber'))
      const referenceCode = clean(pickCell(row, 'referenceCode'))

      const email = clean(pickCell(row, 'email')).toLowerCase()
      const phone = clean(pickCell(row, 'phone'))
      const position = clean(pickCell(row, 'position'))

      const obj: any = {
        fullName,
        fullNameArabic: clean(pickCell(row, 'fullNameArabic')) || null,
        passportNumber: passportNumber || null,
        referenceCode: referenceCode || null,

        email: email || null,
        phone: phone || null,
        position: position || null,

        profileImage: clean(pickCell(row, 'profileImage')) || null,
        monthlySalary: clean(pickCell(row, 'monthlySalary')) || null,
        contractPeriod: clean(pickCell(row, 'contractPeriod')) || null,

        nationality: clean(pickCell(row, 'nationality')) || null,
        religion: clean(pickCell(row, 'religion')) || null,
        dateOfBirth: clean(pickCell(row, 'dateOfBirth')) || null,
        placeOfBirth: clean(pickCell(row, 'placeOfBirth')) || null,
        livingTown: clean(pickCell(row, 'livingTown')) || null,
        maritalStatus: clean(pickCell(row, 'maritalStatus')) || null,
        numberOfChildren: Number(clean(pickCell(row, 'numberOfChildren'))) || null,
        weight: clean(pickCell(row, 'weight')) || null,
        height: clean(pickCell(row, 'height')) || null,
        complexion: clean(pickCell(row, 'complexion')) || null,
        age: Number(clean(pickCell(row, 'age'))) || null,

        englishLevel: toSkill(pickCell(row, 'englishLevel')),
        arabicLevel: toSkill(pickCell(row, 'arabicLevel')),

        babySitting: toSkill(pickCell(row, 'babySitting')),
        childrenCare: toSkill(pickCell(row, 'childrenCare')),
        tutoring: toSkill(pickCell(row, 'tutoring')),
        disabledCare: toSkill(pickCell(row, 'disabledCare')),
        cleaning: toSkill(pickCell(row, 'cleaning')),
        washing: toSkill(pickCell(row, 'washing')),
        ironing: toSkill(pickCell(row, 'ironing')),
        arabicCooking: toSkill(pickCell(row, 'arabicCooking')),
        sewing: toSkill(pickCell(row, 'sewing')),
        driving: toSkill(pickCell(row, 'driving')),

        priority: normalizePriority(pickCell(row, 'priority')),
        notes: clean(pickCell(row, 'notes')) || null,

        experience: clean(pickCell(row, 'experience')) || null,
        education: clean(pickCell(row, 'education')) || null,
        skills: clean(pickCell(row, 'skills')) || null,
        summary: clean(pickCell(row, 'summary')) || null,
      }

      const errors: string[] = []
      if (!obj.fullName) errors.push(`Row ${i + 1}: Full name is required`)
      if (!obj.passportNumber && !obj.referenceCode)
        errors.push(`Row ${i + 1}: Need Passport OR Reference Code for matching`)
      if (obj.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email))
        errors.push(`Row ${i + 1}: Invalid email format`)

      return { ...obj, isValid: errors.length === 0, errors }
    })

    const valid = parsed.filter((x: any) => x.isValid)
    const invalid = parsed.filter((x: any) => !x.isValid)

    // PREVIEW (+DEBUG)
    if (action === 'preview') {
      const debug = (formData.get('debug') as string) === '1'
      let mappedSample: any[] = []
      if (debug) {
        mappedSample = rows.slice(0, 5).map((row, i) => ({
          _row: i + 1,
          fullName: clean(pickCell(row, 'fullName')),
          passportNumber: clean(pickCell(row, 'passportNumber')),
          referenceCode: clean(pickCell(row, 'referenceCode')),
          email: clean(pickCell(row, 'email')),
          phone: clean(pickCell(row, 'phone')),
          position: clean(pickCell(row, 'position')),
        }))
      }

      return NextResponse.json({
        total: parsed.length,
        valid: valid.length,
        invalid: invalid.length,
        sampleValid: valid.slice(0, 10),
        invalidErrors: invalid.flatMap((x: any) => x.errors),
        ...(debug ? { mappedSample } : {}),
      })
    }

    // IMPORT: Update-or-Create
    let processed = 0, created = 0, updated = 0
    const skipped: string[] = invalid.flatMap((x: any) => x.errors)

    const chunkSize = 200
    for (let i = 0; i < valid.length; i += chunkSize) {
      const chunk = valid.slice(i, i + chunkSize)

      await db.$transaction(async (tx) => {
        for (const cv of chunk) {
          processed++

          // البيانات المشتركة للتحديث/الإضافة
          const commonData: any = {
            fullName: cv.fullName,
            fullNameArabic: cv.fullNameArabic,
            email: cv.email,
            phone: cv.phone,
            position: cv.position,
            profileImage: cv.profileImage,
            monthlySalary: cv.monthlySalary,
            contractPeriod: cv.contractPeriod,

            nationality: cv.nationality,
            religion: cv.religion,
            dateOfBirth: cv.dateOfBirth,
            placeOfBirth: cv.placeOfBirth,
            livingTown: cv.livingTown,
            maritalStatus: cv.maritalStatus,
            numberOfChildren: cv.numberOfChildren,
            weight: cv.weight,
            height: cv.height,
            complexion: cv.complexion,
            age: cv.age,

            englishLevel: cv.englishLevel,
            arabicLevel: cv.arabicLevel,

            babySitting: cv.babySitting,
            childrenCare: cv.childrenCare,
            tutoring: cv.tutoring,
            disabledCare: cv.disabledCare,
            cleaning: cv.cleaning,
            washing: cv.washing,
            ironing: cv.ironing,
            arabicCooking: cv.arabicCooking,
            sewing: cv.sewing,
            driving: cv.driving,

            priority: cv.priority,
            notes: cv.notes,

            experience: cv.experience,
            education: cv.education,
            skills: cv.skills,
            summary: cv.summary,

            updatedById: userId,
          }

          // 1) المطابقة برقم الجواز أولاً
          if (cv.passportNumber) {
            const res = await tx.cV.updateMany({
              where: { passportNumber: cv.passportNumber },
              data: { ...commonData, referenceCode: cv.referenceCode || undefined },
            })
            if (res.count > 0) { updated += res.count; continue }

            await tx.cV.create({
              data: {
                ...commonData,
                passportNumber: cv.passportNumber,
                referenceCode: cv.referenceCode || null,
                source: 'Excel Import',
                status: 'NEW',
                createdById: userId,
              }
            })
            created++; continue
          }

          // 2) وإلا المطابقة بالكود المرجعي
          if (cv.referenceCode) {
            const res = await tx.cV.updateMany({
              where: { referenceCode: cv.referenceCode },
              data: { ...commonData, passportNumber: cv.passportNumber || undefined },
            })
            if (res.count > 0) { updated += res.count; continue }

            await tx.cV.create({
              data: {
                ...commonData,
                referenceCode: cv.referenceCode,
                passportNumber: cv.passportNumber || null,
                source: 'Excel Import',
                status: 'NEW',
                createdById: userId,
              }
            })
            created++; continue
          }

          // المفروض ما نوصلش هنا لأن غير الصالحين اتشالوا
          skipped.push(`Skipped one row: missing keys`)
        }
      }, { timeout: 60_000 })
    }

    // Activity Log
    await db.activityLog.create({
      data: {
        userId,
        action: 'EXCEL_IMPORT',
        description: `Upserted ${processed} rows from ${file.name}`,
        metadata: {
          fileName: file.name,
          totalRows: parsed.length,
          validRows: valid.length,
          invalidRows: invalid.length,
          created,
          updated,
          skipped: skipped.length,
        } as any,
      },
    })

    return NextResponse.json({
      ok: true,
      total: parsed.length,
      processed,
      created,
      updated,
      skipped: skipped.length,
      errors: skipped,
    })
  } catch (error) {
    console.error('Error importing CVs:', error)
    return NextResponse.json(
      { error: 'Failed to import CVs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Use POST with multipart/form-data (file, action=preview|import, debug=1)',
  })
}
