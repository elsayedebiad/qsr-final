'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Plus, Trash2, Download, Upload, RefreshCw, Copy, FileSpreadsheet, Info } from 'lucide-react'

interface CVRow {
  id: string
  fullName: string
  fullNameArabic: string
  email: string
  phone: string
  referenceCode: string
  monthlySalary: string
  contractPeriod: string
  position: string
  nationality: string
  religion: string
  age: string
  maritalStatus: string
  driving: string
  babySitting: string
  childrenCare: string
  cleaning: string
  washing: string
  ironing: string
  arabicCooking: string
  sewing: string
  englishLevel: string
  arabicLevel: string
  experience: string
  educationLevel: string
}

const emptyRow: Omit<CVRow, 'id'> = {
  fullName: '',
  fullNameArabic: '',
  email: '',
  phone: '',
  referenceCode: '',
  monthlySalary: '',
  contractPeriod: '',
  position: '',
  nationality: '',
  religion: '',
  age: '',
  maritalStatus: '',
  driving: 'NO',
  babySitting: 'NO',
  childrenCare: 'NO',
  cleaning: 'NO',
  washing: 'NO',
  ironing: 'NO',
  arabicCooking: 'NO',
  sewing: 'NO',
  englishLevel: 'BASIC',
  arabicLevel: 'BASIC',
  experience: '',
  educationLevel: '',
}

export default function DataEntryPage() {
  const router = useRouter()
  const [rows, setRows] = useState<CVRow[]>([
    { id: '1', ...emptyRow }
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showPasteHelp, setShowPasteHelp] = useState(true)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          setIsLoggedIn(true)
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  // دالة معالجة اللصق من Excel
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    
    if (!pastedData) return

    // تقسيم البيانات حسب الصفوف والأعمدة
    const rowsData = pastedData.split('\n').filter(row => row.trim() !== '')
    
    const newRows: CVRow[] = rowsData.map((rowData, index) => {
      const cells = rowData.split('\t')
      
      return {
        id: (Date.now() + index).toString(),
        fullName: cells[0] || '',
        fullNameArabic: cells[1] || '',
        phone: cells[2] || '',
        email: cells[3] || '',
        referenceCode: cells[4] || '',
        position: cells[5] || '',
        nationality: cells[6] || '',
        religion: cells[7] || '',
        age: cells[8] || '',
        maritalStatus: cells[9] || '',
        monthlySalary: cells[10] || '',
        contractPeriod: cells[11] || '',
        driving: cells[12] || 'NO',
        babySitting: cells[13] || 'NO',
        cleaning: cells[14] || 'NO',
        arabicCooking: cells[15] || 'NO',
        englishLevel: cells[16] || 'BASIC',
        arabicLevel: cells[17] || 'BASIC',
        experience: cells[18] || '',
        childrenCare: 'NO',
        washing: 'NO',
        ironing: 'NO',
        sewing: 'NO',
        educationLevel: '',
      }
    })

    if (newRows.length > 0) {
      setRows(newRows)
      toast.success(`تم لصق ${newRows.length} صف بنجاح! ✅`)
    }
  }

  const addRow = () => {
    const newId = (Date.now()).toString()
    setRows([...rows, { id: newId, ...emptyRow }])
  }

  const deleteRow = (id: string) => {
    if (rows.length === 1) {
      toast.error('يجب أن يكون هناك صف واحد على الأقل')
      return
    }
    setRows(rows.filter(row => row.id !== id))
    toast.success('تم حذف الصف')
  }

  const updateRow = (id: string, field: keyof CVRow, value: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const clearAll = () => {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟')) {
      setRows([{ id: '1', ...emptyRow }])
      toast.success('تم مسح جميع البيانات')
    }
  }

  const saveAllRows = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      
      const validRows = rows.filter(row => 
        row.fullName.trim() !== '' || row.fullNameArabic.trim() !== ''
      )

      if (validRows.length === 0) {
        toast.error('يجب ملء بيانات الاسم على الأقل')
        setIsSaving(false)
        return
      }

      let successCount = 0
      for (const row of validRows) {
        const response = await fetch('/api/cvs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fullName: row.fullName,
            fullNameArabic: row.fullNameArabic,
            email: row.email,
            phone: row.phone,
            referenceCode: row.referenceCode || `REF${Date.now()}${successCount}`,
            monthlySalary: row.monthlySalary,
            contractPeriod: row.contractPeriod,
            position: row.position,
            nationality: row.nationality,
            religion: row.religion,
            age: row.age ? parseInt(row.age) : undefined,
            maritalStatus: row.maritalStatus,
            driving: row.driving,
            babySitting: row.babySitting,
            childrenCare: row.childrenCare,
            cleaning: row.cleaning,
            washing: row.washing,
            ironing: row.ironing,
            arabicCooking: row.arabicCooking,
            sewing: row.sewing,
            englishLevel: row.englishLevel,
            arabicLevel: row.arabicLevel,
            experience: row.experience,
            educationLevel: row.educationLevel,
            status: 'NEW',
            priority: 'NORMAL'
          })
        })

        if (response.ok) {
          successCount++
        }
      }

      toast.success(`تم حفظ ${successCount} سيرة ذاتية بنجاح! 🎉`)
      setRows([{ id: '1', ...emptyRow }])
      
    } catch (error) {
      console.error('Error saving data:', error)
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const downloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/قالب_السير_الذاتية.xlsx'
    link.download = 'قالب_السير_الذاتية.xlsx'
    link.click()
  }
  
  const downloadGuide = () => {
    window.open('/دليل_ملء_القالب.txt', '_blank')
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="العودة للداشبورد"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  إدخال البيانات - جدول Excel
                </h1>
                <p className="text-sm text-gray-600">الصق بياناتك من Excel مباشرة أو أدخلها يدوياً</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={downloadGuide}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">دليل الاستخدام</span>
              </button>
              
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">تحميل قالب Excel</span>
              </button>

              <button
                onClick={saveAllRows}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>حفظ الكل ({rows.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* تعليمات اللصق */}
      {showPasteHelp && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setShowPasteHelp(false)}
              className="absolute top-4 left-4 text-white/80 hover:text-white"
            >
              ✕
            </button>
            
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-lg flex-shrink-0">
                <Copy className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3">🚀 كيف تلصق البيانات من Excel؟</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="font-bold mb-2">1️⃣ افتح Excel</p>
                    <p className="text-white/90">حدد البيانات واضغط Ctrl+C</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="font-bold mb-2">2️⃣ ارجع للموقع</p>
                    <p className="text-white/90">اضغط في أي مكان بالجدول</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="font-bold mb-2">3️⃣ الصق البيانات</p>
                    <p className="text-white/90">اضغط Ctrl+V وسيتم اللصق تلقائياً!</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/80">
                  ⚠️ تأكد من ترتيب الأعمدة: الاسم | الاسم بالعربي | الهاتف | البريد | الكود | الوظيفة | الجنسية | الديانة | العمر ...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* أزرار التحكم */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={addRow}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة صف</span>
            </button>
            
            <button
              onClick={clearAll}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <Trash2 className="h-4 w-4" />
              <span>مسح الكل</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-bold text-blue-600">{rows.length}</span> صف
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="text-sm text-gray-600">
              <span className="font-bold text-green-600">{rows.filter(r => r.fullName.trim() !== '').length}</span> صف ممتلئ
            </div>
          </div>
        </div>
      </div>

      {/* الجدول */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 mt-6 pb-6">
        <div 
          ref={tableRef}
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
          onPaste={handlePaste}
          tabIndex={0}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 sticky right-0 bg-blue-600 z-10 min-w-[60px]">
                    #
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[180px]">
                    الاسم الكامل *
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[180px]">
                    الاسم بالعربي
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[150px]">
                    رقم الهاتف
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[200px]">
                    البريد
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[130px]">
                    الكود
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[150px] bg-yellow-500">
                    الوظيفة *
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[120px]">
                    الجنسية
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[100px]">
                    الديانة
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[80px]">
                    العمر
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[130px]">
                    الحالة
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[130px]">
                    الراتب
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[120px]">
                    مدة العقد
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[100px]">
                    القيادة
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[120px]">
                    رعاية أطفال
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[100px]">
                    تنظيف
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[100px]">
                    طبخ عربي
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[120px]">
                    إنجليزي
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[120px]">
                    عربي
                  </th>
                  <th className="px-3 py-4 text-sm font-bold border-r border-blue-500 min-w-[150px]">
                    الخبرة
                  </th>
                  <th className="px-3 py-4 text-sm font-bold min-w-[80px]">
                    حذف
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr 
                    key={row.id} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-3 py-2 border-r border-b border-gray-200 sticky right-0 bg-inherit z-10 font-bold text-gray-600 text-center">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <input
                        type="text"
                        value={row.fullName}
                        onChange={(e) => updateRow(row.id, 'fullName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="الاسم الكامل"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <input
                        type="text"
                        value={row.fullNameArabic}
                        onChange={(e) => updateRow(row.id, 'fullNameArabic', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="الاسم بالعربي"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <input
                        type="text"
                        value={row.phone}
                        onChange={(e) => updateRow(row.id, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="966500000000"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <input
                        type="email"
                        value={row.email}
                        onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="email@example.com"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <input
                        type="text"
                        value={row.referenceCode}
                        onChange={(e) => updateRow(row.id, 'referenceCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="REF001"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200 bg-yellow-50">
                      <select
                        value={row.position}
                        onChange={(e) => updateRow(row.id, 'position', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white font-bold"
                      >
                        <option value="">اختر الوظيفة</option>
                        <option value="سائق">🚗 سائق</option>
                        <option value="سائق خاص">🚗 سائق خاص</option>
                        <option value="عاملة منزلية">🏠 عاملة منزلية</option>
                        <option value="خدمات">🏠 خدمات</option>
                        <option value="خادمة">🏠 خادمة</option>
                        <option value="مربية">👶 مربية</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <select
                        value={row.nationality}
                        onChange={(e) => updateRow(row.id, 'nationality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">اختر</option>
                        <option value="فلبينية">🇵🇭 فلبينية</option>
                        <option value="سريلانكية">🇱🇰 سريلانكية</option>
                        <option value="بنغلاديشي">🇧🇩 بنغلاديشي</option>
                        <option value="إثيوبية">🇪🇹 إثيوبية</option>
                        <option value="كينية">🇰🇪 كينية</option>
                        <option value="أوغندية">🇺🇬 أوغندية</option>
                        <option value="بوروندية">🇧🇮 بوروندية</option>
                        <option value="هندي">🇮🇳 هندي</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <select
                        value={row.religion}
                        onChange={(e) => updateRow(row.id, 'religion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">اختر</option>
                        <option value="مسلم">🕌 مسلم</option>
                        <option value="مسيحي">✝️ مسيحي</option>
                        <option value="بوذي">☸️ بوذي</option>
                        <option value="هندوسي">🕉️ هندوسي</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <input
                        type="number"
                        value={row.age}
                        onChange={(e) => updateRow(row.id, 'age', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="25"
                        min="18"
                        max="65"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <select
                        value={row.maritalStatus}
                        onChange={(e) => updateRow(row.id, 'maritalStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">اختر</option>
                        <option value="عازب">عازب</option>
                        <option value="متزوج">متزوج</option>
                        <option value="مطلق">مطلق</option>
                        <option value="أرمل">أرمل</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <input
                        type="text"
                        value={row.monthlySalary}
                        onChange={(e) => updateRow(row.id, 'monthlySalary', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="1500"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <input
                        type="text"
                        value={row.contractPeriod}
                        onChange={(e) => updateRow(row.id, 'contractPeriod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="سنتين"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <select
                        value={row.driving}
                        onChange={(e) => updateRow(row.id, 'driving', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="NO">❌ لا</option>
                        <option value="YES">✅ نعم</option>
                        <option value="GOOD">⭐ جيد</option>
                        <option value="EXCELLENT">🌟 ممتاز</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <select
                        value={row.babySitting}
                        onChange={(e) => updateRow(row.id, 'babySitting', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="NO">❌ لا</option>
                        <option value="YES">✅ نعم</option>
                        <option value="GOOD">⭐ جيد</option>
                        <option value="EXCELLENT">🌟 ممتاز</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <select
                        value={row.cleaning}
                        onChange={(e) => updateRow(row.id, 'cleaning', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="NO">❌ لا</option>
                        <option value="YES">✅ نعم</option>
                        <option value="GOOD">⭐ جيد</option>
                        <option value="EXCELLENT">🌟 ممتاز</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <select
                        value={row.arabicCooking}
                        onChange={(e) => updateRow(row.id, 'arabicCooking', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="NO">❌ لا</option>
                        <option value="YES">✅ نعم</option>
                        <option value="GOOD">⭐ جيد</option>
                        <option value="EXCELLENT">🌟 ممتاز</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <select
                        value={row.englishLevel}
                        onChange={(e) => updateRow(row.id, 'englishLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="NO">❌ لا يوجد</option>
                        <option value="BASIC">📘 أساسي</option>
                        <option value="GOOD">📗 جيد</option>
                        <option value="EXCELLENT">📕 ممتاز</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <select
                        value={row.arabicLevel}
                        onChange={(e) => updateRow(row.id, 'arabicLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="NO">❌ لا يوجد</option>
                        <option value="BASIC">📘 أساسي</option>
                        <option value="GOOD">📗 جيد</option>
                        <option value="EXCELLENT">📕 ممتاز</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-b border-gray-200">
                      <input
                        type="text"
                        value={row.experience}
                        onChange={(e) => updateRow(row.id, 'experience', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="5 سنوات"
                      />
                    </td>
                    <td className="px-2 py-2 border-b border-gray-200 text-center">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        title="حذف الصف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ملاحظة */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">💡 ملاحظات مهمة:</h3>
              <ul className="text-sm text-blue-800 space-y-1.5 leading-relaxed">
                <li>• الحقول المميزة بـ (*) إلزامية - خاصة <strong>حقل "الوظيفة"</strong> لتصنيف السير</li>
                <li>• يمكنك <strong>نسخ من Excel ولصق مباشرة</strong> (Ctrl+C ثم Ctrl+V)</li>
                <li>• تأكد من ترتيب الأعمدة مطابق للجدول أعلاه</li>
                <li>• يمكنك <strong>حفظ عدة صفوف دفعة واحدة</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
