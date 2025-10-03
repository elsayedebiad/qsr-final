import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    // إنشاء قالب Excel شامل مع جميع الحقول من الصورة
    const templateData = [
      {
        // Basic Information - المعلومات الأساسية
        'الاسم الكامل': 'مثال: فاطمة علي أحمد',
        'الاسم بالعربية': 'فاطمة علي أحمد',
        'البريد الإلكتروني': 'fatima@example.com',
        'رقم الهاتف': '+251912345678',
        'الكود المرجعي': 'SZ-0007',
        
        // Employment Details - تفاصيل العمل
        'الراتب الشهري': '1300 ريال',
        'مدة العقد': 'سنتان',
        'الوظيفة المطلوبة': 'عاملة منزلية',
        
        // Passport Information - معلومات الجواز
        'رقم الجواز': 'P0211688',
        'تاريخ إصدار الجواز': '2025-02-19',
        'تاريخ انتهاء الجواز': '2035-02-19',
        'مكان إصدار الجواز': 'كولومبو',
        
        // Personal Information - المعلومات الشخصية
        'الجنسية': 'سريلانكية',
        'الديانة': 'مسلمة',
        'تاريخ الميلاد': '1980-02-01',
        'مكان الميلاد': 'KALUGAMUWA',
        'مكان السكن': 'KALUGAMUWA',
        'الحالة الاجتماعية': 'متزوجة',
        'عدد الأطفال': '3',
        'الوزن': '55 كجم',
        'الطول': '5.3',
        'لون البشرة': 'بشرة بنية فاتحة',
        'العمر': '45',
        
        // Languages and Education - اللغات والتعليم
        'الإنجليزية': 'ضعيف',
        'العربية': 'بطلاقة',
        'الدرجة العلمية': 'الصف 11',
        
        // Skills and Experiences - المهارات والخبرات
        'رعاية الأطفال': 'نعم',
        'كي الملابس': 'نعم',
        'العناية بالوالدين': 'نعم',
        'الطبخ': 'نعم',
        'العمل المنزلي': 'نعم',
        'التنظيف': 'نعم',
        'الغسيل': 'نعم',
        'الطبخ العربي': 'نعم',
        'الخياطة': 'لا',
        'القيادة': 'لا',
        'تعليم الأطفال': 'نعم',
        'رعاية المعوقين': 'لا',
        'رعاية المسنين': 'نعم',
        'التدبير المنزلي': 'نعم',
        
        // Previous Employment - الخبرة السابقة
        'الخبرة في الخارج': 'السعودية - السعودية (2018-2020)',
        
        // Additional Information - معلومات إضافية
        'الصورة الشخصية': 'رابط الصورة',
        'الأولوية': 'متوسطة',
        'ملاحظات': 'ملاحظات إضافية'
      }
    ]

    // إنشاء workbook
    const wb = XLSX.utils.book_new()
    
    // إنشاء worksheet
    const ws = XLSX.utils.json_to_sheet(templateData)
    
    // تحسين عرض الأعمدة
    const colWidths = Object.keys(templateData[0]).map(key => ({
      wch: Math.max(key.length, String(templateData[0][key as keyof typeof templateData[0]]).length) + 5
    }))
    ws['!cols'] = colWidths
    
    // إضافة worksheet إلى workbook
    XLSX.utils.book_append_sheet(wb, ws, 'قالب السير الذاتية')
    
    // إنشاء buffer
    const excelBuffer = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    })
    
    // إرسال الملف
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="cv-template-complete.xlsx"; filename*=UTF-8\'\'%D9%82%D8%A7%D9%84%D8%A8-%D8%A7%D9%84%D8%B3%D9%8A%D8%B1-%D8%A7%D9%84%D8%B0%D8%A7%D8%AA%D9%8A%D8%A9-%D8%A7%D9%84%D8%B4%D8%A7%D9%85%D9%84.xlsx',
        'Content-Length': excelBuffer.length.toString(),
      },
    })
    
  } catch (error) {
    console.error('Error creating Excel template:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء قالب Excel' },
      { status: 500 }
    )
  }
}
