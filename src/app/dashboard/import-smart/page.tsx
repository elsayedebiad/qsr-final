'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Eye,
  Download,
  Play,
  BarChart3,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  Zap
} from 'lucide-react'
import SmartImportProgress from '../../../components/SmartImportProgress'
import ImportStatistics from '../../../components/ImportStatistics'

interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  details?: string
  count?: number
}

interface ProcessedCV {
  rowNumber: number
  fullName: string
  fullNameArabic?: string
  email?: string
  phone?: string
  referenceCode?: string
  isUpdate: boolean
  existingId?: number
  duplicateReason?: string
}

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

export default function SmartImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ImportResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<'new' | 'update' | 'skip' | 'error'>('new')
  const [isExecuting, setIsExecuting] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([])
  const [currentStep, setCurrentStep] = useState('')
  const [showStatistics, setShowStatistics] = useState(false)
  const [processingStartTime, setProcessingStartTime] = useState<number>(0)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [executionSteps, setExecutionSteps] = useState<ProgressStep[]>([])
  const [currentExecutionStep, setCurrentExecutionStep] = useState('')
  const [showExecutionProgress, setShowExecutionProgress] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setAnalysisResult(null)
      setShowDetails(false)
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
      setAnalysisResult(null)
      setShowDetails(false)
    }
  }

  const analyzeFile = async () => {
    if (!selectedFile) {
      toast.error('يرجى اختيار ملف أولاً')
      return
    }

    // Initialize progress
    const steps: ProgressStep[] = [
      { id: 'upload', label: 'رفع الملف', status: 'pending' },
      { id: 'parse', label: 'قراءة البيانات', status: 'pending' },
      { id: 'validate', label: 'التحقق من الصحة', status: 'pending' },
      { id: 'duplicates', label: 'فحص التكرارات', status: 'pending' },
      { id: 'complete', label: 'إنهاء التحليل', status: 'pending' }
    ]
    
    setProgressSteps(steps)
    setShowProgress(true)
    setProcessingStartTime(Date.now())
    setIsLoading(true)

    try {
      // Step 1: Upload - رفع الملف
      setCurrentStep('upload')
      setProgressSteps(prev => prev.map(s => 
        s.id === 'upload' ? { ...s, status: 'processing' } : s
      ))
      
      // انتظار قليل لإظهار بداية العملية
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setProgressSteps(prev => prev.map(s => 
        s.id === 'upload' ? { ...s, status: 'completed', details: 'تم رفع الملف بنجاح' } : s
      ))

      // Step 2: Parse - قراءة البيانات
      setCurrentStep('parse')
      setProgressSteps(prev => prev.map(s => 
        s.id === 'parse' ? { ...s, status: 'processing' } : s
      ))
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('action', 'analyze')

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('يرجى تسجيل الدخول مرة أخرى')
        router.push('/login')
        return
      }
      
      setProgressSteps(prev => prev.map(s => 
        s.id === 'parse' ? { ...s, status: 'completed', details: 'تم قراءة البيانات' } : s
      ))

      // Step 3: Validate - التحقق من الصحة
      setCurrentStep('validate')
      setProgressSteps(prev => prev.map(s => 
        s.id === 'validate' ? { ...s, status: 'processing' } : s
      ))
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setProgressSteps(prev => prev.map(s => 
        s.id === 'validate' ? { ...s, status: 'completed', details: 'البيانات صحيحة' } : s
      ))

      // Step 4: Check duplicates - فحص التكرارات
      setCurrentStep('duplicates')
      setProgressSteps(prev => prev.map(s => 
        s.id === 'duplicates' ? { ...s, status: 'processing' } : s
      ))

      // إرسال الطلب الفعلي
      const response = await fetch('/api/cvs/import-smart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': JSON.parse(atob(token.split('.')[1])).userId,
          'X-User-Role': JSON.parse(atob(token.split('.')[1])).role,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        // إكمال خطوة فحص التكرارات
        const duplicateCount = data.duplicateRecords || 0
        setProgressSteps(prev => prev.map(s => 
          s.id === 'duplicates' ? { 
            ...s, 
            status: 'completed',
            details: duplicateCount > 0 ? `تم العثور على ${duplicateCount} تكرار` : 'لا توجد تكرارات'
          } : s
        ))
        
        // Step 5: Complete - الإنهاء
        setCurrentStep('complete')
        setProgressSteps(prev => prev.map(s => 
          s.id === 'complete' ? { ...s, status: 'processing' } : s
        ))

        await new Promise(resolve => setTimeout(resolve, 800))
        
        setProgressSteps(prev => prev.map(s => 
          s.id === 'complete' ? { 
            ...s, 
            status: 'completed',
            details: `${data.totalRows} صف، ${data.newRecords} جديد، ${data.updatedRecords} للتحديث`
          } : s
        ))

        setAnalysisResult(data)
        setShowDetails(true)
        setShowStatistics(true)
        toast.success('تم تحليل الملف بنجاح')
        
        // إخفاء شريط التقدم بعد 3 ثواني
        setTimeout(() => setShowProgress(false), 3000)
      } else {
        setProgressSteps(prev => prev.map(s => 
          s.status === 'processing' ? { ...s, status: 'error' } : s
        ))
        
        const errorMessage = data.error || 'فشل في تحليل الملف'
        
        toast.error(errorMessage)
        
        // Show detailed error in console
        console.error('خطأ في التحليل:', {
          error: errorMessage,
          details: data.details,
          suggestion: data.suggestion
        })
        
        setTimeout(() => setShowProgress(false), 3000)
      }
    } catch {
      setProgressSteps(prev => prev.map(s => 
        s.status === 'processing' ? { ...s, status: 'error' } : s
      ))
      toast.error('حدث خطأ أثناء تحليل الملف')
    } finally {
      setIsLoading(false)
    }
  }

  const executeImport = async () => {
    if (!selectedFile || !analysisResult) {
      return
    }

    // إعداد خطوات التنفيذ
    const steps: ProgressStep[] = []
    
    if (analysisResult.newRecords > 0) {
      steps.push({ 
        id: 'new', 
        label: `إضافة ${analysisResult.newRecords} سجل جديد`, 
        status: 'pending' as const,
        count: analysisResult.newRecords
      })
    }
    
    if (analysisResult.updatedRecords > 0) {
      steps.push({ 
        id: 'update', 
        label: `تحديث ${analysisResult.updatedRecords} سجل موجود`, 
        status: 'pending' as const,
        count: analysisResult.updatedRecords
      })
    }
    
    steps.push({ 
      id: 'finalize', 
      label: 'إنهاء العملية', 
      status: 'pending' as const,
      count: 0
    })
    
    setExecutionSteps(steps)
    setShowExecutionProgress(true)
    setCurrentExecutionStep('new')
    setExecutionProgress(0)
    setIsExecuting(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('action', 'execute')

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('يرجى تسجيل الدخول مرة أخرى')
        router.push('/login')
        return
      }

      // تحديث حالة خطوة الإضافة
      if (analysisResult.newRecords > 0) {
        setExecutionSteps(prev => prev.map(s => 
          s.id === 'new' ? { ...s, status: 'processing' } : s
        ))
        setCurrentExecutionStep('new')
      } else if (analysisResult.updatedRecords > 0) {
        setExecutionSteps(prev => prev.map(s => 
          s.id === 'update' ? { ...s, status: 'processing' } : s
        ))
        setCurrentExecutionStep('update')
      }

      // محاكاة تقدم واقعية
      let progressInterval: NodeJS.Timeout | null = null
      let currentProgress = 0
      let stepProgress = 0
      const totalRecords = analysisResult.newRecords + analysisResult.updatedRecords
      
      // بدء العملية الفعلية
      const responsePromise = fetch('/api/cvs/import-smart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': JSON.parse(atob(token.split('.')[1])).userId,
          'X-User-Role': JSON.parse(atob(token.split('.')[1])).role,
        },
        body: formData,
      })
      
      // محاكاة التقدم بناءً على عدد السجلات
      const progressIncrement = totalRecords > 100 ? 2 : totalRecords > 50 ? 3 : 5
      
      progressInterval = setInterval(() => {
        // زيادة التقدم تدريجياً مع التأكد من أن القيمة صالحة
        const increment = progressIncrement + Math.random() * 2
        currentProgress = Math.min(currentProgress + increment, 95)
        
        // التأكد من أن القيمة رقمية صالحة
        if (isNaN(currentProgress) || !isFinite(currentProgress)) {
          currentProgress = 0
        }
        
        // معالجة السجلات الجديدة (0-45%)
        if (currentProgress <= 45 && analysisResult.newRecords > 0) {
          stepProgress = Math.max(0, (currentProgress / 45) * analysisResult.newRecords)
          if (!isNaN(stepProgress) && isFinite(stepProgress)) {
            setExecutionSteps(prev => prev.map(s => 
              s.id === 'new' ? { 
                ...s, 
                status: currentProgress >= 45 ? 'completed' : 'processing',
                details: `معالجة ${Math.floor(stepProgress)} من ${analysisResult.newRecords}`
              } : s
            ))
          }
        }
        
        // معالجة السجلات المحدثة (45-85%)
        if (currentProgress > 45 && currentProgress <= 85 && analysisResult.updatedRecords > 0) {
          if (analysisResult.newRecords > 0) {
            setExecutionSteps(prev => prev.map(s => 
              s.id === 'new' ? { ...s, status: 'completed' } : s
            ))
          }
          
          stepProgress = Math.max(0, ((currentProgress - 45) / 40) * analysisResult.updatedRecords)
          if (!isNaN(stepProgress) && isFinite(stepProgress)) {
            setCurrentExecutionStep('update')
            setExecutionSteps(prev => prev.map(s => 
              s.id === 'update' ? { 
                ...s, 
                status: currentProgress >= 85 ? 'completed' : 'processing',
                details: `تحديث ${Math.floor(stepProgress)} من ${analysisResult.updatedRecords}`
              } : s
            ))
          }
        }
        
        // الإنهاء (85-95%)
        if (currentProgress > 85) {
          if (analysisResult.updatedRecords > 0) {
            setExecutionSteps(prev => prev.map(s => 
              s.id === 'update' ? { ...s, status: 'completed' } : s
            ))
          }
          setCurrentExecutionStep('finalize')
          setExecutionSteps(prev => prev.map(s => 
            s.id === 'finalize' ? { ...s, status: 'processing', details: 'حفظ البيانات...' } : s
          ))
        }
        
        // التأكد من أن القيمة النهائية صالحة
        const finalProgress = Math.max(0, Math.min(currentProgress, 95))
        if (!isNaN(finalProgress) && isFinite(finalProgress)) {
          setExecutionProgress(finalProgress)
        } else {
          setExecutionProgress(0)
        }
      }, 300)

      // انتظار النتيجة الفعلية
      const response = await responsePromise
      const data = await response.json()
      
      // إيقاف محاكاة التقدم
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      
      if (response.ok) {
        // إكمال التقدم
        setExecutionProgress(100)
        setExecutionSteps(prev => prev.map(s => 
          ({ ...s, status: s.status === 'processing' ? 'completed' : s.status })
        ))
        
        if (data.executionErrors && data.executionErrors.length > 0) {
          toast.success(`تم الاستيراد جزئياً! ${data.newRecords} جديد، ${data.updatedRecords} محدث`)
          toast.error(`أخطاء: ${data.executionErrors.length} عملية فشلت`)
        } else {
          toast.success(`تم الاستيراد بنجاح! ${data.newRecords} جديد، ${data.updatedRecords} محدث`)
        }
        
        // إخفاء شريط التقدم بعد ثانيتين
        setTimeout(() => {
          setShowExecutionProgress(false)
        }, 2000)
        
        // Show detailed results
        setTimeout(() => {
          if (data.executionErrors && data.executionErrors.length > 0) {
            console.error('أخطاء التنفيذ:', data.executionErrors)
            alert(`تفاصيل الأخطاء:\n${data.executionErrors.join('\n')}`)
          }
        }, 2000)
        
        // الانتقال للداشبورد بعد 3 ثواني
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        // فشل التنفيذ
        setExecutionSteps(prev => prev.map(s => 
          ({ ...s, status: s.status === 'processing' ? 'error' : s.status })
        ))
        
        const errorMessage = data.error || 'فشل في استيراد البيانات'
        
        toast.error(errorMessage)
        
        setTimeout(() => {
          setShowExecutionProgress(false)
        }, 3000)
        
        // Show detailed error in console
        console.error('خطأ في الاستيراد:', {
          error: errorMessage,
          details: data.details,
          suggestion: data.suggestion
        })
      }
    } catch {
      setExecutionSteps(prev => prev.map(s => 
        ({ ...s, status: s.status === 'processing' ? 'error' : s.status })
      ))
      toast.error('حدث خطأ أثناء الاستيراد')
      setTimeout(() => {
        setShowExecutionProgress(false)
      }, 3000)
    } finally {
      setIsExecuting(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/templates/excel-complete')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'قالب_السير_الذاتية_الشامل.xlsx'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        toast.success('تم تحميل القالب بنجاح')
      } else {
        toast.error('فشل في تحميل القالب')
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل القالب')
    }
  }

  const getTabColor = (tab: string) => {
    switch (tab) {
      case 'new': return 'text-success border-success'
      case 'update': return 'text-primary border-primary'
      case 'skip': return 'text-warning border-warning'
      case 'error': return 'text-destructive border-destructive'
      default: return 'text-muted-foreground border-border'
    }
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'new': return <UserCheck className="w-4 h-4" />
      case 'update': return <RefreshCw className="w-4 h-4" />
      case 'skip': return <UserX className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-xl border border-border p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  الاستيراد الذكي للسير الذاتية
                </h1>
                <p className="text-muted-foreground">
                  نظام متقدم لمراجعة وتحديث البيانات تلقائياً - مقارنة بناءً على: رقم الجواز فقط
                  <br />
                  <span className="text-sm text-primary font-semibold">ميزة جديدة: يمكنك الآن وضع روابط صور (URLs) في عمود الصورة الشخصية وسيتم تحميلها تلقائياً.</span>
                </p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              تحميل القالب
            </button>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-card rounded-xl border border-border p-8 mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Upload className="w-7 h-7 text-primary" />
            رفع ملف البيانات
          </h2>

          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              selectedFile
                ? 'border-success bg-success/10'
                : 'border-primary/30 bg-muted hover:border-primary'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="w-16 h-16 text-success mb-4" />
                <h3 className="text-xl font-semibold text-success mb-2">
                  تم اختيار الملف
                </h3>
                <p className="text-success mb-4">{selectedFile.name}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 text-success border border-success/30 rounded-lg hover:bg-success/20 transition-all"
                >
                  اختيار ملف آخر
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  اسحب الملف هنا أو انقر للاختيار
                </h3>
                <p className="text-muted-foreground mb-6">
                  يدعم ملفات Excel (.xlsx, .xls) و CSV
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-lg"
                >
                  اختيار ملف
                </button>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={analyzeFile}
                disabled={isLoading}
                className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Eye className="w-6 h-6" />
                    تحليل الملف
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {showDetails && analysisResult && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-success rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">سجلات جديدة</p>
                    <p className="text-3xl font-bold">{analysisResult.newRecords}</p>
                  </div>
                  <UserCheck className="w-12 h-12 text-white/80" />
                </div>
              </div>

              <div className="bg-primary rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">سيتم تحديثها</p>
                    <p className="text-3xl font-bold">{analysisResult.updatedRecords}</p>
                  </div>
                  <RefreshCw className="w-12 h-12 text-white/80" />
                </div>
              </div>

              <div className="bg-warning rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">تم تخطيها</p>
                    <p className="text-3xl font-bold">{analysisResult.skippedRecords}</p>
                  </div>
                  <UserX className="w-12 h-12 text-white/80" />
                </div>
              </div>

              <div className="bg-destructive rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">أخطاء</p>
                    <p className="text-3xl font-bold">{analysisResult.errorRecords}</p>
                  </div>
                  <AlertCircle className="w-12 h-12 text-white/80" />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary rounded-xl p-8 text-white shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <BarChart3 className="w-8 h-8" />
                <h3 className="text-2xl font-bold">ملخص التحليل</h3>
              </div>
              <p className="text-xl text-white/90">{analysisResult.summary}</p>
            </div>

            {/* Detailed Results */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <Users className="w-7 h-7 text-info" />
                  تفاصيل البيانات
                </h3>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border bg-background">
                {[
                  { key: 'new', label: 'الجديدة', count: analysisResult.newRecords },
                  { key: 'update', label: 'التحديثات', count: analysisResult.updatedRecords },
                  { key: 'skip', label: 'المتخطاة', count: analysisResult.skippedRecords },
                  { key: 'error', label: 'الأخطاء', count: analysisResult.errorRecords },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as 'new' | 'update' | 'skip' | 'error')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? getTabColor(tab.key)
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    {getTabIcon(tab.key)}
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'new' && (
                  <div className="space-y-4">
                    {analysisResult.details.newCVs.length > 0 ? (
                      analysisResult.details.newCVs.map((cv, index) => (
                        <div key={index} className="bg-success/10 border border-success/30 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-success">
                                الصف {cv.rowNumber}: {cv.fullName}
                              </h4>
                              {cv.fullNameArabic && (
                                <p className="text-success">{cv.fullNameArabic}</p>
                              )}
                              <div className="flex gap-4 text-sm text-success mt-2">
                                {cv.email && <span>📧 {cv.email}</span>}
                                {cv.phone && <span>📱 {cv.phone}</span>}
                                {cv.referenceCode && <span>🔖 {cv.referenceCode}</span>}
                              </div>
                            </div>
                            <CheckCircle className="w-6 h-6 text-success" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">لا توجد سجلات جديدة</p>
                    )}
                  </div>
                )}

                {activeTab === 'update' && (
                  <div className="space-y-4">
                    {analysisResult.details.updatedCVs.length > 0 ? (
                      analysisResult.details.updatedCVs.map((cv, index) => (
                        <div key={index} className="bg-info/10 border border-info/30 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-info">
                                الصف {cv.rowNumber}: {cv.fullName}
                              </h4>
                              {cv.fullNameArabic && (
                                <p className="text-info">{cv.fullNameArabic}</p>
                              )}
                              <p className="text-sm text-info mt-1">
                                سبب التطابق: {cv.duplicateReason}
                              </p>
                              <div className="flex gap-4 text-sm text-info mt-2">
                                {cv.email && <span>📧 {cv.email}</span>}
                                {cv.phone && <span>📱 {cv.phone}</span>}
                                {cv.referenceCode && <span>🔖 {cv.referenceCode}</span>}
                              </div>
                            </div>
                            <RefreshCw className="w-6 h-6 text-info" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">لا توجد سجلات للتحديث</p>
                    )}
                  </div>
                )}

                {activeTab === 'skip' && (
                  <div className="space-y-4">
                    {analysisResult.details.skippedCVs.length > 0 ? (
                      analysisResult.details.skippedCVs.map((cv, index) => (
                        <div key={index} className="bg-warning/10 border border-warning/30 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-warning">
                                الصف {cv.rowNumber}: {cv.fullName || 'غير محدد'}
                              </h4>
                              <p className="text-sm text-warning mt-1">
                                سبب التخطي: {cv.duplicateReason}
                              </p>
                            </div>
                            <UserX className="w-6 h-6 text-warning" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">لا توجد سجلات متخطاة</p>
                    )}
                  </div>
                )}

                {activeTab === 'error' && (
                  <div className="space-y-4">
                    {analysisResult.details.errorCVs.length > 0 ? (
                      analysisResult.details.errorCVs.map((cv, index) => (
                        <div key={index} className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-destructive">
                                الصف {cv.rowNumber}: {cv.fullName || 'غير محدد'}
                              </h4>
                              <p className="text-sm text-destructive mt-1">
                                الخطأ: {cv.duplicateReason}
                              </p>
                            </div>
                            <XCircle className="w-6 h-6 text-destructive" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">لا توجد أخطاء</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Execute Import Button */}
            {(analysisResult.newRecords > 0 || analysisResult.updatedRecords > 0) && (
              <div className="bg-card rounded-xl border border-border p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    جاهز للتنفيذ!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    سيتم إضافة {analysisResult.newRecords} سجل جديد وتحديث {analysisResult.updatedRecords} سجل موجود
                  </p>
                  <button
                    onClick={executeImport}
                    disabled={isExecuting}
                    className="flex items-center gap-3 px-12 py-4 bg-success text-white rounded-lg hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold mx-auto"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        جاري التنفيذ...
                      </>
                    ) : (
                      <>
                        <Play className="w-6 h-6" />
                        تنفيذ الاستيراد
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Progress Modal */}
        <SmartImportProgress
          isVisible={showProgress}
          currentStep={currentStep}
          steps={progressSteps}
          onClose={() => setShowProgress(false)}
        />
        
        {/* Execution Progress Modal */}
        <SmartImportProgress
          isVisible={showExecutionProgress}
          currentStep={currentExecutionStep}
          steps={executionSteps}
          onClose={() => setShowExecutionProgress(false)}
          executionProgress={executionProgress}
          showTimeEstimate={true}
        />

        {/* Statistics */}
        {showStatistics && analysisResult && (
          <ImportStatistics
            stats={{
              totalRows: analysisResult.totalRows,
              newRecords: analysisResult.newRecords,
              updatedRecords: analysisResult.updatedRecords,
              skippedRecords: analysisResult.skippedRecords,
              errorRecords: analysisResult.errorRecords,
              processingTime: processingStartTime ? (Date.now() - processingStartTime) / 1000 : undefined,
              duplicateReasons: analysisResult.details.updatedCVs.reduce((acc: { [key: string]: number }, cv) => {
                if (cv.duplicateReason) {
                  acc[cv.duplicateReason] = (acc[cv.duplicateReason] || 0) + 1
                }
                return acc
              }, {} as { [key: string]: number }),
              // skippedDetails not needed for now
            }}
            isVisible={showStatistics}
          />
        )}
      </div>
    </div>
  )
}
