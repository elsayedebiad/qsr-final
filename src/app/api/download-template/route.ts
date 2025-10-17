import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // استيراد xlsx ديناميكياً
    const XLSX = await import('xlsx')
    
    // إنشاء بيانات القالب
    const templateData = [
      // صف العناوين
      [
        'الاسم الكامل',
        'الاسم بالعربي',
        'رقم الهاتف',
        'البريد الإلكتروني',
        'الكود المرجعي',
        'الوظيفة المطلوبة',
        'الجنسية',
        'الديانة',
        'العمر',
        'الحالة الاجتماعية',
        'الراتب الشهري',
        'مدة العقد',
        'القيادة',
        'رعاية الأطفال',
        'التنظيف',
        'الطبخ العربي',
        'مستوى الإنجليزية',
        'مستوى العربية',
        'الخبرة'
      ],
      // أمثلة
      [
        'MOHD ARISH',
        'محمد أريش',
        '966500000001',
        'mohamed@example.com',
        'REF001',
        'سائق',
        'هندي',
        'مسلم',
        '30',
        'متزوج',
        '1500',
        'سنتين',
        'YES',
        'NO',
        'YES',
        'NO',
        'GOOD',
        'BASIC',
        '5 سنوات'
      ],
      [
        'JENNIFER AMACNA',
        'جنيفر أماكنا',
        '966500000002',
        'jennifer@example.com',
        'REF002',
        'عاملة منزلية',
        'فلبينية',
        'مسيحي',
        '28',
        'عازب',
        '1200',
        'سنتين',
        'NO',
        'YES',
        'YES',
        'YES',
        'GOOD',
        'BASIC',
        '3 سنوات'
      ],
      [
        'ARFAT SHAH',
        'عرفات شاه',
        '966500000003',
        'arfat@example.com',
        'REF003',
        'سائق خاص',
        'بنغلاديشي',
        'مسلم',
        '35',
        'متزوج',
        '1400',
        'سنتين',
        'YES',
        'NO',
        'YES',
        'NO',
        'BASIC',
        'GOOD',
        '7 سنوات'
      ],
      [
        'BIIRA MORREN',
        'بيرا مورين',
        '966500000004',
        'biira@example.com',
        'REF004',
        'خدمات',
        'أوغندية',
        'مسيحي',
        '25',
        'عازب',
        '1100',
        'سنتين',
        'NO',
        'YES',
        'YES',
        'YES',
        'BASIC',
        'BASIC',
        '2 سنة'
      ]
    ]

    // إنشاء workbook و worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(templateData)

    // تنسيق العرض
    const colWidths = [
      { wch: 20 }, // الاسم الكامل
      { wch: 20 }, // الاسم بالعربي
      { wch: 15 }, // رقم الهاتف
      { wch: 25 }, // البريد
      { wch: 12 }, // الكود
      { wch: 18 }, // الوظيفة
      { wch: 12 }, // الجنسية
      { wch: 10 }, // الديانة
      { wch: 8 },  // العمر
      { wch: 15 }, // الحالة
      { wch: 12 }, // الراتب
      { wch: 12 }, // مدة العقد
      { wch: 10 }, // القيادة
      { wch: 12 }, // رعاية أطفال
      { wch: 10 }, // التنظيف
      { wch: 12 }, // الطبخ
      { wch: 15 }, // الإنجليزية
      { wch: 15 }, // العربية
      { wch: 20 }  // الخبرة
    ]
    ws['!cols'] = colWidths

    // إضافة الـworksheet للـworkbook
    XLSX.utils.book_append_sheet(wb, ws, 'قالب السير الذاتية')

    // تحويل لـbuffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // إرجاع الملف
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="قالب_السير_الذاتية.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json({ 
      error: 'Failed to generate template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

