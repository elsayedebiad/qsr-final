import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import puppeteer from 'puppeteer'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من الـ token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.substring(7)
    
    try {
      jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // البحث عن السيرة الذاتية
    const cv = await db.cV.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }

    // إنشاء HTML لقالب القعيد
    const htmlTemplate = generateAlQaeidHTML(cv)

    // إنشاء صورة PNG باستخدام Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // تعيين حجم الصفحة لـ A4
    await page.setViewport({ width: 794, height: 1123 }) // A4 في 96 DPI
    
    await page.setContent(htmlTemplate, { 
      waitUntil: 'networkidle0' 
    })

    // إنشاء صورة PNG
    const imageBuffer = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: false
    })

    await browser.close()

    // إرجاع الصورة
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="AlQaeid_CV_${(cv.fullName || 'CV').replace(/\s+/g, '_')}.png"`
      }
    })

  } catch (error) {
    console.error('Error generating Alqaeid image:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}

// وظيفة إنشاء HTML لقالب القعيد
function generateAlQaeidHTML(cv: any): string {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طلب توظيف - ${cv.fullName || 'CV'}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Noto Sans Arabic', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.4;
                color: #000;
                background: #fff;
                direction: rtl;
                padding: 20px;
            }
            
            .container {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                padding: 30px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #1E3A8A;
                padding-bottom: 20px;
            }
            
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #1E3A8A;
                margin-bottom: 10px;
            }
            
            .form-title {
                font-size: 20px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .subtitle {
                font-size: 16px;
                color: #666;
            }
            
            .section {
                margin-bottom: 25px;
            }
            
            .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #1E3A8A;
                margin-bottom: 15px;
                border-bottom: 2px solid #E5E7EB;
                padding-bottom: 5px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .info-item {
                display: flex;
                align-items: center;
            }
            
            .info-label {
                font-weight: bold;
                color: #374151;
                margin-left: 10px;
                min-width: 120px;
            }
            
            .info-value {
                color: #1F2937;
                border-bottom: 1px solid #D1D5DB;
                padding-bottom: 2px;
                flex: 1;
            }
            
            .photo-section {
                float: left;
                width: 150px;
                height: 200px;
                border: 2px solid #1E3A8A;
                margin: 0 0 20px 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #F9FAFB;
            }
            
            .photo-placeholder {
                color: #6B7280;
                text-align: center;
                font-size: 12px;
            }
            
            .cv-photo {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .skills-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-top: 15px;
            }
            
            .skill-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                background: #F3F4F6;
                border-radius: 5px;
            }
            
            .skill-name {
                font-weight: 500;
            }
            
            .skill-value {
                font-weight: bold;
                color: #1E3A8A;
            }
            
            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 48px;
                color: rgba(30, 58, 138, 0.1);
                font-weight: bold;
                z-index: -1;
                pointer-events: none;
            }
        </style>
    </head>
    <body>
        <div class="watermark">الاسناد السريع</div>
        
        <div class="container">
            <div class="header">
                <div class="company-name">الاسناد السريع لخدمات العمالة المنزلية</div>
                <div class="form-title">طلب توظيف عاملة منزلية</div>
                <div class="subtitle">Al-Asnad Al-Sarie for Domestic Workers Services</div>
            </div>
            
            <div class="photo-section">
                ${cv.profileImage ? 
                  `<img src="${cv.profileImage}" alt="صورة شخصية" class="cv-photo" />` :
                  `<div class="photo-placeholder">صورة شخصية<br>Personal Photo</div>`
                }
            </div>
            
            <div class="section">
                <div class="section-title">المعلومات الشخصية</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">الاسم الكامل:</span>
                        <span class="info-value">${cv.fullName || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">الاسم بالعربية:</span>
                        <span class="info-value">${cv.fullNameArabic || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">الجنسية:</span>
                        <span class="info-value">${cv.nationality || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">العمر:</span>
                        <span class="info-value">${cv.age || ''} سنة</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">الديانة:</span>
                        <span class="info-value">${cv.religion || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">الحالة الاجتماعية:</span>
                        <span class="info-value">${cv.maritalStatus || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">عدد الأطفال:</span>
                        <span class="info-value">${cv.numberOfChildren || '0'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">الطول:</span>
                        <span class="info-value">${cv.height || ''} سم</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">الوزن:</span>
                        <span class="info-value">${cv.weight || ''} كجم</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">مكان الإقامة:</span>
                        <span class="info-value">${cv.livingTown || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">مكان الميلاد:</span>
                        <span class="info-value">${cv.placeOfBirth || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">رقم الهاتف:</span>
                        <span class="info-value">${cv.phone || ''}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">المهارات والخبرات</div>
                <div class="skills-grid">
                    <div class="skill-item">
                        <span class="skill-name">رعاية الأطفال</span>
                        <span class="skill-value">${cv.babySitting || 'NO'}</span>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">التنظيف</span>
                        <span class="skill-value">${cv.cleaning || 'NO'}</span>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">الطبخ</span>
                        <span class="skill-value">${cv.cooking || 'NO'}</span>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">رعاية المسنين</span>
                        <span class="skill-value">${cv.elderlyCare || 'NO'}</span>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">الغسيل</span>
                        <span class="skill-value">${cv.washing || 'NO'}</span>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">الكي</span>
                        <span class="skill-value">${cv.ironing || 'NO'}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">معلومات إضافية</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">سنوات الخبرة:</span>
                        <span class="info-value">${cv.workExperience || '0'} سنة</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">مستوى اللغة العربية:</span>
                        <span class="info-value">${cv.arabicLevel || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">مستوى اللغة الإنجليزية:</span>
                        <span class="info-value">${cv.languageLevel || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">المؤهل التعليمي:</span>
                        <span class="info-value">${cv.education || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">الراتب المطلوب:</span>
                        <span class="info-value">${cv.monthlySalary || ''} ريال</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">مدة العقد:</span>
                        <span class="info-value">${cv.contractPeriod || ''}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">معلومات الاتصال</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">البريد الإلكتروني:</span>
                        <span class="info-value">${cv.email || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">الرقم المرجعي:</span>
                        <span class="info-value">${cv.referenceCode || ''}</span>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `
}
