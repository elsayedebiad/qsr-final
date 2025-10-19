'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import ProfessionalProgressBar from './ProfessionalProgressBar'

interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  details?: string
}

interface SmartImportProgressProps {
  isVisible: boolean
  currentStep: string
  steps: ProgressStep[]
  onClose?: () => void
  executionProgress?: number
  showTimeEstimate?: boolean
}

export default function SmartImportProgress({ 
  isVisible, 
  currentStep, 
  steps, 
  onClose,
  executionProgress = 0,
  showTimeEstimate = true
}: SmartImportProgressProps) {
  const [progress, setProgress] = useState(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [processedSteps, setProcessedSteps] = useState(0)

  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').length
    const processingSteps = steps.filter(step => step.status === 'processing').length
    const totalSteps = steps.length
    
    // تتبع وقت البداية
    if (!startTime && processingSteps > 0) {
      setStartTime(Date.now())
    }
    
    // حساب التقدم بشكل أكثر دقة
    // كل خطوة مكتملة = 100% من حصتها
    // كل خطوة قيد المعالجة = 50% من حصتها  
    const stepValue = 100 / totalSteps
    const completedValue = completedSteps * stepValue
    const processingValue = processingSteps * (stepValue * 0.5)
    
    setProgress(completedValue + processingValue)
    setProcessedSteps(completedSteps)
  }, [steps, startTime])

  if (!isVisible) return null

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 border-success/30'
      case 'processing':
        return 'bg-primary/10 border-primary/30'
      case 'error':
        return 'bg-destructive/10 border-destructive/30'
      default:
        return 'bg-muted border-border'
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            جاري المعالجة الذكية
          </h3>
          <p className="text-muted-foreground">
            يرجى الانتظار أثناء معالجة البيانات...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <ProfessionalProgressBar
            targetProgress={executionProgress > 0 ? executionProgress : progress}
            label="معالجة البيانات"
            subLabel={steps.find(s => s.id === currentStep)?.label || 'جاري التحليل...'}
            showPercentage={true}
            showTimeRemaining={showTimeEstimate}
            variant="primary"
            size="lg"
            showIcon={true}
            startTime={startTime}
            processedItems={processedSteps}
            totalItems={steps.length}
            animationStyle="smooth"
            showDetails={true}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-3 rounded-lg border transition-all duration-200 ${getStepColor(step.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {step.label}
                    </p>
                    {step.details && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.details}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground flex-shrink-0 ml-3">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Step Indicator */}
        <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            <p className="text-primary font-medium">
              الخطوة الحالية: {steps.find(s => s.id === currentStep)?.label || 'معالجة البيانات...'}
            </p>
          </div>
        </div>

        {/* Close Button (only show when all steps are completed) */}
        {progress === 100 && onClose && (
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-success hover:bg-success/90 text-white rounded-xl transition-all shadow-lg font-medium inline-flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              تم الانتهاء
            </button>
          </div>
        )}
      </div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  )
}
