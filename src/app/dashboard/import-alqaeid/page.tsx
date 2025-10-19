'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
// Types for import result
interface ImportResult {
  imported: number
  skipped: number
  total: number
  errors?: string[]
}
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle,
  X,
  Loader2
} from 'lucide-react'
import SmoothProgressBar from '@/components/SmoothProgressBar'

export default function ImportAlQaeidPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<string>('idle')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const downloadAlQaeidTemplate = () => {
    // Create comprehensive CSV template for Al-Qaeid format
    const template = `الاسم الكامل,الاسم بالعربية,البريد الإلكتروني,رقم الهاتف,كود المرجع,رابط الصورة الشخصية,الراتب الشهري,مدة العقد,المنصب,رقم الجواز,تاريخ إصدار الجواز,تاريخ انتهاء الجواز,مكان إصدار الجواز,الجنسية,الديانة,تاريخ الميلاد,مكان الميلاد,مكان السكن,الحالة الاجتماعية,عدد الأطفال,الوزن,الطول,لون البشرة,العمر,الإنجليزية,العربية,عناية الرضع,عناية الأطفال,تعليم الأطفال,عناية المعوقين,التنظيف,الغسيل,الكي,الطبخ العربي,الخياطة,القيادة,الأولوية,ملاحظات
MEYRAMA MUSTEFA EDO,ميراما مصطفى إيدو,meyrama@example.com,+251912345678,EA125,https://example.com/image1.jpg,1000 SAR,2 YEARS,عاملة منزلية,EP8746771,08 MAR 24,07 MAR 29,ADDIS ABABA,ETHIOPIAN,MUSLIM,12 SEP 01,GUNA,GUNA,SINGLE,0,54kg,158cm,BROWN,24,NO,NO,NO,WILLING,NO,NO,YES,YES,YES,WILLING,NO,NO,متوسطة,مرشحة ممتازة
FATIMA ALI AHMED,فاطمة علي أحمد,fatima@example.com,+251923456789,EA126,https://example.com/image2.jpg,1200 SAR,2 YEARS,مربية أطفال,EP8746772,15 JAN 24,14 JAN 29,ADDIS ABABA,ETHIOPIAN,MUSLIM,05 MAR 99,DIRE DAWA,DIRE DAWA,MARRIED,2,58kg,162cm,BROWN,25,WILLING,YES,YES,YES,YES,NO,YES,YES,YES,YES,NO,NO,عالية,خبرة في رعاية الأطفال`

    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'alqaeid_cv_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('يرجى اختيار ملف أولاً');
      return;
    }

    setIsLoading(true);
    setImportResult(null);
    setProgress(0);
    setUploadStatus('uploading');

    const formData = new FormData();
    formData.append('file', selectedFile);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/cvs/import-alqaeid', true);

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      setIsLoading(false);
      return;
    }
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('X-User-Id', JSON.parse(atob(token.split('.')[1])).userId);
    xhr.setRequestHeader('X-User-Role', JSON.parse(atob(token.split('.')[1])).role);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // حساب التقدم بشكل أكثر دقة (50% للرفع، 50% للمعالجة)
        const uploadPercent = (event.loaded / event.total) * 50;
        setProgress(Math.round(uploadPercent));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        setUploadStatus('processing');
        // محاكاة تقدم المعالجة
        let processingProgress = 50;
        const interval = setInterval(() => {
          processingProgress += 10;
          setProgress(Math.min(processingProgress, 95));
          if (processingProgress >= 95) {
            clearInterval(interval);
          }
        }, 200);
        
        setTimeout(() => {
          clearInterval(interval);
          setProgress(100);
          const data = JSON.parse(xhr.responseText);
          setImportResult(data);
          setIsLoading(false);
          setUploadStatus('complete');
          toast.success(`اكتمل الاستيراد: ${data.imported} بنجاح, ${data.skipped} تم تخطيه`);
        }, 1000);
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          toast.error(errorData.error || 'فشل في استيراد الملف');
        } catch {
          toast.error('حدث خطأ غير متوقع أثناء الاستيراد');
        }
      }
    };

    xhr.onerror = () => {
      setIsLoading(false);
      toast.error('خطأ في الشبكة أثناء رفع الملف');
    };

    xhr.send(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="ml-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <FileSpreadsheet className="h-6 w-6 text-info ml-3" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">استيراد قالب القعيد من Excel</h1>
                <p className="text-sm text-muted-foreground">استيراد شامل لجميع حقول قالب شركة القعيد للاستقدام</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Instructions */}
          <div className="bg-info/10 border border-info/30 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">تعليمات الاستيراد - قالب القعيد</h3>
            <ul className="space-y-2 text-sm text-info">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-info ml-2" />
                يدعم النظام جميع حقول قالب شركة القعيد للاستقدام
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-info ml-2" />
                يشمل: المعلومات الشخصية، جواز السفر، المهارات، الخبرة السابقة
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-info ml-2" />
                القيم المقبولة للمهارات: YES, NO, WILLING
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-info ml-2" />
                الحالة الاجتماعية: SINGLE, MARRIED, DIVORCED, WIDOWED
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-info ml-2" />
                الأولوية: منخفضة، متوسطة، عالية، عاجلة
              </li>
            </ul>
          </div>

          {/* Template Download */}
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">قالب Excel - نموذج القعيد</h3>
              <button
                onClick={downloadAlQaeidTemplate}
                className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-background"
              >
                <Download className="h-4 w-4 ml-2" />
                تحميل القالب الشامل
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              احصل على قالب Excel يحتوي على جميع الحقول المطلوبة لقالب شركة القعيد مع أمثلة على البيانات
            </p>
          </div>

          {/* Sample Data Preview */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">نموذج البيانات المطلوبة</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-border">
                <thead>
                  <tr className="bg-background">
                    <th className="px-2 py-1 border text-right">الاسم الكامل</th>
                    <th className="px-2 py-1 border text-right">كود المرجع</th>
                    <th className="px-2 py-1 border text-right">الراتب</th>
                    <th className="px-2 py-1 border text-right">الجنسية</th>
                    <th className="px-2 py-1 border text-right">التنظيف</th>
                    <th className="px-2 py-1 border text-right">الطبخ العربي</th>
                    <th className="px-2 py-1 border text-right">عناية الأطفال</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1 border">MEYRAMA MUSTEFA EDO</td>
                    <td className="px-2 py-1 border">EA125</td>
                    <td className="px-2 py-1 border">1000 SAR</td>
                    <td className="px-2 py-1 border">ETHIOPIAN</td>
                    <td className="px-2 py-1 border">YES</td>
                    <td className="px-2 py-1 border">WILLING</td>
                    <td className="px-2 py-1 border">WILLING</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 border">FATIMA ALI AHMED</td>
                    <td className="px-2 py-1 border">EA126</td>
                    <td className="px-2 py-1 border">1200 SAR</td>
                    <td className="px-2 py-1 border">ETHIOPIAN</td>
                    <td className="px-2 py-1 border">YES</td>
                    <td className="px-2 py-1 border">YES</td>
                    <td className="px-2 py-1 border">YES</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">رفع ملف Excel</h3>
            
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  اسحب وأفلت ملف Excel هنا
                </p>
                <p className="text-sm text-muted-foreground">أو</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  اختر ملف
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                يدعم: .xlsx, .xls, .csv (حتى 10MB)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile && (
              <div className="mt-4 p-4 bg-background rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-5 w-5 text-success ml-2" />
                    <span className="text-sm font-medium text-foreground">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-muted-foreground mr-2">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Import Button */}
          {/* Progress and Import Button */}
          {selectedFile && !importResult && (
            <div className="space-y-4">
              {isLoading && (
                <div className="bg-card rounded-lg shadow p-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      {uploadStatus === 'uploading' && 'جاري رفع الملف...'}
                      {uploadStatus === 'processing' && 'جاري معالجة البيانات...'}
                      {uploadStatus === 'complete' && 'اكتمل الاستيراد!'}
                    </h4>
                    <SmoothProgressBar 
                      targetProgress={progress}
                      duration={300}
                      showPercentage={true}
                      height="10px"
                      color="bg-gradient-to-r from-blue-500 to-blue-600"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {uploadStatus === 'uploading' && 'يرجى الانتظار أثناء رفع الملف...'}
                      {uploadStatus === 'processing' && 'يتم الآن تحليل البيانات واستيرادها...'}
                    </span>
                  </div>
                </div>
              )}
              <div className="text-center">
                <button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : <Upload className="h-5 w-5 ml-2" />}
                  {isLoading ? 'جاري الاستيراد...' : 'استيراد البيانات'}
                </button>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="bg-card rounded-lg shadow p-6 mt-8">
              <h3 className="text-lg font-medium text-foreground mb-4">نتائج الاستيراد</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-success/10 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-success">{importResult.imported}</p>
                  <p className="text-sm text-success">تم الاستيراد بنجاح</p>
                </div>
                <div className="bg-destructive/10 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">{importResult.skipped}</p>
                  <p className="text-sm text-destructive">تم التخطي (أخطاء)</p>
                </div>
                <div className="bg-info/10 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-info">{importResult.total}</p>
                  <p className="text-sm text-info">الإجمالي في الملف</p>
                </div>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-foreground mb-2">تفاصيل الأخطاء:</h4>
                  <ul className="space-y-1 text-sm text-destructive bg-destructive/10 p-3 rounded-lg max-h-40 overflow-y-auto">
                    {importResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:opacity-90"
                >
                  العودة إلى لوحة التحكم
                </button>
              </div>
            </div>
          )}


          {/* Field Mapping Guide */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">دليل الحقول المطلوبة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-2">المعلومات الأساسية:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• الاسم الكامل (مطلوب)</li>
                  <li>• الاسم بالعربية</li>
                  <li>• البريد الإلكتروني</li>
                  <li>• رقم الهاتف</li>
                  <li>• كود المرجع</li>
                  <li>• الراتب الشهري</li>
                  <li>• مدة العقد</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">بيانات جواز السفر:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• رقم الجواز</li>
                  <li>• تاريخ الإصدار</li>
                  <li>• تاريخ الانتهاء</li>
                  <li>• مكان الإصدار</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">المعلومات الشخصية:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• الجنسية</li>
                  <li>• الديانة</li>
                  <li>• تاريخ الميلاد</li>
                  <li>• مكان الميلاد</li>
                  <li>• الحالة الاجتماعية</li>
                  <li>• عدد الأطفال</li>
                  <li>• الوزن/الطول/العمر</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">المهارات:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• عناية الرضع</li>
                  <li>• عناية الأطفال</li>
                  <li>• التنظيف</li>
                  <li>• الطبخ العربي</li>
                  <li>• الغسيل والكي</li>
                  <li>• القيادة</li>
                  <li>• وغيرها...</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
