import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import XLSX from 'xlsx'
import fs from 'fs'

const db = new PrismaClient()

// GET - جلب السير الذاتية المتاحة فقط (NEW status) للمعرض وصفحات السيلز
export async function GET() {
  try {
    const cvs = await db.cV.findMany({
      where: {
        status: 'NEW' // فقط السير الذاتية المتاحة (غير محجوزة وغير متعاقدة)
      },
      select: {
        id: true,
        fullName: true,
        fullNameArabic: true,
        email: true,
        phone: true,
        referenceCode: true,
        monthlySalary: true,
        contractPeriod: true,
        position: true,
        nationality: true,
        maritalStatus: true,
        age: true,
        profileImage: true,
        cvImageUrl: true, // صورة السيرة الذاتية الكاملة
        videoLink: true, // إضافة حقل الفيديو
        status: true,
        priority: true,
        babySitting: true,
        childrenCare: true,
        tutoring: true,
        disabledCare: true,
        cleaning: true,
        washing: true,
        ironing: true,
        arabicCooking: true,
        sewing: true,
        driving: true,
        experience: true,
        arabicLevel: true,
        englishLevel: true,
        religion: true,
        educationLevel: true,
        passportNumber: true,
        passportExpiryDate: true,
        height: true,
        weight: true,
        numberOfChildren: true,
        livingTown: true,
        placeOfBirth: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // تغذية التعليم والخبرة من إكسل DUKA.xlsx إذا كان الملف متاحاً
    let enriched = cvs
    try {
      const excelPath = 'c://Users//engel//qsr-final//DUKA.xlsx'
      if (fs.existsSync(excelPath)) {
        const wb = XLSX.readFile(excelPath)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' })
        const normalize = (v: any) => String(v || '').trim()

        const headers = Object.keys(rows[0] || {})
        const findCol = (names: string[]) =>
          headers.find(h => names.some(n => h.toLowerCase() === n.toLowerCase()))

        const fullNameCol = findCol(['الاسم الكامل','Full Name','Name','الاسم'])
        const refCol = findCol(['رمز المرجع','Reference Code','Reference','Ref','Code'])
        const eduCol = findCol(['الدرجة العلمية','المؤهل العلمي','Education Level','Qualification','Degree','التعليم','Education'])
        const expCol = findCol(['الخبرة','سنوات الخبرة','عدد سنوات الخبرة','Experience','Experience Years','Work Experience'])

        const arCol = findCol(['العربية','اللغة العربية','مستوى اللغة العربية','Arabic','Arabic Level'])
        const enCol = findCol(['الإنجليزية','اللغة الإنجليزية','مستوى اللغة الإنجليزية','English','English Level'])

        const toLatinDigits = (s: string) => s.replace(/[\u0660-\u0669]/g, d => String('0123456789'[d.charCodeAt(0) - 0x0660]))
        const toSkillLevel = (raw: string): 'YES' | 'WILLING' | 'NO' | undefined => {
          const s = toLatinDigits(String(raw || '').trim().toLowerCase())
          if (!s) return undefined
          // تطبيع سريع للقيم الشائعة
          if (['yes','y','true','ok'].some(k => s.includes(k)) || ['نعم','ممتاز','جيدة','جيد جدا','جيد جداً','fluent','excellent'].some(k => s.includes(k)) || s === '2') {
            return 'YES'
          }
          if (['willing','ready','fair','average','good'].some(k => s.includes(k)) || ['راغب','راغبة','مستعد','مستعدة','يرغب','ترغب','جيد','متوسط','مقبول'].some(k => s.includes(k)) || s === '1') {
            return 'WILLING'
          }
          if (['no','n','false','none','poor','weak'].some(k => s.includes(k)) || ['لا','ضعيف','غير متاح'].some(k => s.includes(k)) || s === '0') {
            return 'NO'
          }
          // دعم القيم القياسية مباشرة
          if (s === 'yes') return 'YES'
          if (s === 'willing') return 'WILLING'
          if (s === 'no') return 'NO'
          return undefined
        }

        const excelMap = new Map<string, { educationLevel?: string; experience?: string; arabicLevel?: 'YES'|'WILLING'|'NO'; englishLevel?: 'YES'|'WILLING'|'NO' }>()
        for (const r of rows) {
          const key = normalize(refCol ? (r as any)[refCol] : '') || normalize(fullNameCol ? (r as any)[fullNameCol] : '')
          if (!key) continue
          const eduRaw = normalize(eduCol ? (r as any)[eduCol] : '')
          const expRaw = normalize(expCol ? (r as any)[expCol] : '')
          const arRaw = normalize(arCol ? (r as any)[arCol] : '')
          const enRaw = normalize(enCol ? (r as any)[enCol] : '')
          excelMap.set(key, {
            educationLevel: eduRaw || undefined,
            experience: expRaw || undefined,
            arabicLevel: toSkillLevel(arRaw),
            englishLevel: toSkillLevel(enRaw)
          })
        }

        enriched = cvs.map(cv => {
          const key = normalize(cv.referenceCode) || normalize(cv.fullName)
          const excel = excelMap.get(key)
          if (!excel) return cv
          return {
            ...cv,
            educationLevel: excel.educationLevel ?? cv.educationLevel,
            experience: excel.experience ?? cv.experience,
            arabicLevel: excel.arabicLevel ?? cv.arabicLevel,
            englishLevel: excel.englishLevel ?? cv.englishLevel
          }
        })
      }
    } catch (e) {
      console.error('Excel enrichment error:', e)
    }

    console.log(`Found ${enriched.length} available CVs (NEW status only)`) 
    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching CVs for gallery:', error)
    return NextResponse.json(
      { error: 'فشل في جلب السير الذاتية' },
      { status: 500 }
    )
  }
}

