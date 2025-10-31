'use client'

import { useState, useRef } from 'react'
import { 
  Users, 
  Calendar, 
  Clock, 
  Upload, 
  FileText, 
  BarChart3,
  Download,
  Trash2,
  FileSpreadsheet,
  User,
  Printer
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { toast } from 'react-hot-toast'

interface AttendanceRecord {
  id: string
  name: string
  date: string
  checkIn: string
  checkOut: string
  hours: number
  dayName: string
}

interface EmployeeStats {
  id: string
  name: string
  totalHours: number
  workDays: number
  absentDays: number
  avgHours: number
}

// أسماء الموظفين الافتراضية
const DEFAULT_EMPLOYEE_NAMES: Record<string, string> = {
  '1': 'Ahmed',
  '2': 'Yehia',
  '3': 'Seif',
  '4': 'Omar',
  '5': 'Sasa',
  '6': 'Omar elbasha',
  '7': 'Mallah',
  '8': 'Salma',
  '9': 'Ahmed Elsayed',
  '10': 'Saied',
  '11': 'shadofa'
}

export default function AttendanceAnalysisPage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [employeeNames] = useState<Record<string, string>>(DEFAULT_EMPLOYEE_NAMES)
  const [isLoading, setIsLoading] = useState(false)
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // معالجة رفع الملف
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      // تحليل البيانات - نفس منطق النظام الأصلي
      const recordsByEmployee: Record<string, Record<string, Date[]>> = {}
      
      lines.forEach(line => {
        const parts = line.trim().split(/\t+|\s{2,}/)
        if (parts.length < 2) return
        
        const id = parts[0].trim()
        const datetime = parts.slice(1).join(' ').trim()
        
        // Parse timestamp
        let timestamp: Date
        const dateParts = datetime.split(/[\s\-:T]/)
        if (dateParts.length >= 5) {
          timestamp = new Date(
            parseInt(dateParts[0]), // year
            parseInt(dateParts[1]) - 1, // month (0-indexed)
            parseInt(dateParts[2]), // day
            parseInt(dateParts[3]) || 0, // hour
            parseInt(dateParts[4]) || 0, // minute
            parseInt(dateParts[5]) || 0  // second
          )
        } else {
          timestamp = new Date(datetime)
        }
        
        // تحقق من صحة التاريخ
        if (isNaN(timestamp.getTime())) {
          console.warn(`تاريخ غير صالح: ${datetime}`)
          return
        }
        
        const dateKey = timestamp.toISOString().split('T')[0]
        
        if (!recordsByEmployee[id]) recordsByEmployee[id] = {}
        if (!recordsByEmployee[id][dateKey]) recordsByEmployee[id][dateKey] = []
        
        recordsByEmployee[id][dateKey].push(timestamp)
      })

      // تحويل إلى سجلات - نفس منطق calculateWorkHours
      const parsedData: AttendanceRecord[] = []
      
      for (const id in recordsByEmployee) {
        const dailyData = recordsByEmployee[id]
        
        for (const dateKey in dailyData) {
          const sortedTimes = dailyData[dateKey].sort((a, b) => a.getTime() - b.getTime())
          
          const firstSwipe = sortedTimes[0]
          const lastSwipe = sortedTimes[sortedTimes.length - 1]
          
          let hours = 0
          let checkIn = 'N/A'
          let checkOut = 'N/A'
          
          if (sortedTimes.length >= 2) {
            // حساب الفرق بالميلي ثانية
            const durationMs = lastSwipe.getTime() - firstSwipe.getTime()
            hours = durationMs / (1000 * 60 * 60)
            
            checkIn = firstSwipe.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: false 
            })
            checkOut = lastSwipe.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: false 
            })
          } else if (sortedTimes.length === 1) {
            checkIn = firstSwipe.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: false 
            })
          }

          const dateObj = new Date(dateKey)
          const dayOfWeek = dateObj.getDay()
          const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
          const dayName = dayNames[dayOfWeek]

          parsedData.push({
            id,
            name: employeeNames[id] || `موظف ${id}`,
            date: dateKey,
            checkIn,
            checkOut,
            hours: Math.max(0, hours),
            dayName
          })
        }
      }

      setAttendanceData(parsedData.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ))
      toast.success(`تم تحليل ${parsedData.length} سجل بنجاح`)
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('حدث خطأ أثناء معالجة الملف')
    } finally {
      setIsLoading(false)
    }
  }

  // إحصائيات عامة
  const totalEmployees = new Set(attendanceData.map(r => r.id)).size
  const totalRecords = attendanceData.length
  const avgHours = attendanceData.length > 0 
    ? attendanceData.reduce((sum, r) => sum + r.hours, 0) / attendanceData.length 
    : 0

  // الموظفين الفريدين
  const uniqueEmployees = Array.from(new Set(attendanceData.map(r => r.id)))

  // الفلترة
  const filteredData = attendanceData.filter(record => {
    if (filterEmployeeId && record.id !== filterEmployeeId) return false
    if (filterDate && record.date !== filterDate) return false
    if (selectedMonth && !record.date.includes(selectedMonth)) return false
    return true
  })

  // حساب إحصائيات الموظفين مع أيام الغياب
  const getEmployeeStats = (): EmployeeStats[] => {
    const stats: Record<string, EmployeeStats> = {}
    
    if (attendanceData.length === 0) return []
    
    uniqueEmployees.forEach(id => {
      const employeeRecords = filteredData.filter(r => r.id === id)
      if (employeeRecords.length === 0) return
      
      const totalHours = employeeRecords.reduce((sum, r) => sum + r.hours, 0)
      const workDays = employeeRecords.length
      
      // حساب أيام الغياب من سجلات الموظف نفسه فقط
      const employeeDatesArray = employeeRecords.map(r => r.date).sort()
      const employeeDates = new Set(employeeDatesArray)
      
      // استخدام أول وآخر تاريخ من سجلات الموظف المحدد
      const minDateStr = employeeDatesArray[0]
      const maxDateStr = employeeDatesArray[employeeDatesArray.length - 1]
      
      // حساب الأيام باستخدام string comparison لتجنب مشاكل timezone
      let absentDays = 0
      const [minYear, minMonth, minDay] = minDateStr.split('-').map(Number)
      const [maxYear, maxMonth, maxDay] = maxDateStr.split('-').map(Number)
      
      let currentYear = minYear
      let currentMonth = minMonth
      let currentDay = minDay
      
      while (currentYear < maxYear || 
             (currentYear === maxYear && currentMonth < maxMonth) || 
             (currentYear === maxYear && currentMonth === maxMonth && currentDay <= maxDay)) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`
        const tempDate = new Date(currentYear, currentMonth - 1, currentDay)
        const dayOfWeek = tempDate.getDay()
        
        // استثناء الجمعة (5) من حساب الغياب
        if (!employeeDates.has(dateStr) && dayOfWeek !== 5) {
          absentDays++
        }
        
        // الانتقال لليوم التالي
        currentDay++
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
        if (currentDay > daysInMonth) {
          currentDay = 1
          currentMonth++
          if (currentMonth > 12) {
            currentMonth = 1
            currentYear++
          }
        }
      }
      
      stats[id] = {
        id,
        name: employeeNames[id] || `موظف ${id}`,
        totalHours,
        workDays,
        absentDays,
        avgHours: workDays > 0 ? totalHours / workDays : 0
      }
    })
    
    return Object.values(stats)
  }

  // تحويل الوقت إلى نظام 12 ساعة
  const convertTo12Hour = (time: string): string => {
    if (!time || time === 'N/A') return time
    
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // تحويل الساعات العشرية إلى ساعات ودقائق
  const formatHoursMinutes = (totalHours: number): string => {
    const hours = Math.floor(totalHours)
    const minutes = Math.round((totalHours - hours) * 60)
    
    if (hours === 0) return `${minutes} د`
    if (minutes === 0) return `${hours} س`
    return `${hours} س و ${minutes} د`
  }

  // طباعة تقرير موظف
  const printEmployeeReport = (employeeId: string) => {
    const employeeName = employeeNames[employeeId] || `موظف ${employeeId}`
    const employeeRecords = attendanceData.filter(r => r.id === employeeId).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    if (employeeRecords.length === 0) {
      toast.error('لا توجد سجلات لهذا الموظف')
      return
    }

    // دمج سجلات الحضور مع أيام الغياب من سجلات الموظف فقط
    const employeeDatesArray = employeeRecords.map(r => r.date).sort()
    const minDateStr = employeeDatesArray[0]
    const maxDateStr = employeeDatesArray[employeeDatesArray.length - 1]
    const employeeDates = new Set(employeeDatesArray)
    
    const allRecords: Array<{
      date: string
      dayName: string
      checkIn: string
      checkOut: string
      hours: number
      isAbsent: boolean
      isFriday: boolean
    }> = []
    
    // حساب الأيام باستخدام string-based approach لتجنب timezone issues
    let absentDays = 0
    const [minYear, minMonth, minDay] = minDateStr.split('-').map(Number)
    const [maxYear, maxMonth, maxDay] = maxDateStr.split('-').map(Number)
    
    let currentYear = minYear
    let currentMonth = minMonth
    let currentDay = minDay
    
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    
    while (currentYear < maxYear || 
           (currentYear === maxYear && currentMonth < maxMonth) || 
           (currentYear === maxYear && currentMonth === maxMonth && currentDay <= maxDay)) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`
      const tempDate = new Date(currentYear, currentMonth - 1, currentDay)
      const dayOfWeek = tempDate.getDay()
      const dayName = dayNames[dayOfWeek]
      const isFriday = dayOfWeek === 5
      
      if (employeeDates.has(dateStr)) {
        const record = employeeRecords.find(r => r.date === dateStr)!
        allRecords.push({
          date: dateStr,
          dayName: record.dayName,
          checkIn: record.checkIn,
          checkOut: record.checkOut,
          hours: record.hours,
          isAbsent: false,
          isFriday: isFriday
        })
      } else if (!isFriday) {
        allRecords.push({
          date: dateStr,
          dayName: dayName,
          checkIn: '---',
          checkOut: '---',
          hours: 0,
          isAbsent: true,
          isFriday: false
        })
        absentDays++
      }
      
      // الانتقال لليوم التالي
      currentDay++
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
      if (currentDay > daysInMonth) {
        currentDay = 1
        currentMonth++
        if (currentMonth > 12) {
          currentMonth = 1
          currentYear++
        }
      }
    }

    const totalHours = employeeRecords.reduce((sum, r) => sum + r.hours, 0)
    const workDays = employeeRecords.length
    const avgHours = workDays > 0 ? totalHours / workDays : 0

    // إنشاء نافذة طباعة
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) {
      toast.error('فشل فتح نافذة الطباعة')
      return
    }

    const today = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير حضور - ${employeeName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Cairo', sans-serif;
            padding: 20px;
            background: white;
            font-size: 10pt;
          }
          
          /* Professional Header */
          .print-header {
            margin-bottom: 20px;
          }
          
          .company-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            border-radius: 8px;
            margin-bottom: 15px;
          }
          
          .company-logo {
            font-size: 24pt;
            font-weight: 900;
            letter-spacing: 2px;
          }
          
          .company-info {
            text-align: left;
            font-size: 9pt;
            line-height: 1.6;
          }
          
          .report-title {
            text-align: center;
            font-size: 18pt;
            font-weight: 700;
            margin: 15px 0;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 3px double #3b82f6;
            padding-bottom: 10px;
          }
          
          .metadata {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            padding: 10px;
            background: #f8fafc;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 9pt;
          }
          
          .meta-item {
            display: flex;
            align-items: center;
          }
          
          .meta-label {
            font-weight: 600;
            color: #475569;
            margin-left: 5px;
          }
          
          .meta-value {
            color: #1e293b;
          }
          
          .summary-box {
            background: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            text-align: center;
          }
          
          .summary-item {
            padding: 8px;
            background: white;
            border-radius: 6px;
            border: 1px solid #bfdbfe;
          }
          
          .summary-label {
            font-size: 8pt;
            color: #475569;
            margin-bottom: 4px;
          }
          
          .summary-value {
            font-size: 12pt;
            font-weight: 700;
            color: #1e40af;
          }
          
          .table-header {
            font-size: 10pt;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 8px;
            padding: 6px 10px;
            background: #f1f5f9;
            border-left: 4px solid #3b82f6;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            border: 2px solid #3b82f6;
          }
          
          thead {
            background-color: #1e40af;
          }
          
          thead th {
            color: #ffffff;
            font-weight: 700;
            font-size: 10pt;
            letter-spacing: 0.5px;
            padding: 10px 8px;
            border: 2px solid #1e3a8a;
            text-align: right;
          }
          
          tbody tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          td {
            border: 1px solid #cbd5e0;
            color: #1e293b;
            padding: 8px 6px;
            text-align: right;
          }
          
          /* Friday styling */
          .friday-row {
            background-color: #fef2f2 !important;
            border-right: 4px solid #ef4444;
          }
          
          .friday-row td {
            color: #991b1b !important;
            font-weight: 600;
          }
          
          .friday-badge {
            display: inline-block;
            background: #ef4444;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 7pt;
            font-weight: 700;
            margin-right: 5px;
          }
          
          /* Absent styling */
          .absent-row {
            background-color: #fef3cd !important;
            border-right: 4px solid #f59e0b;
          }
          
          .absent-row td {
            color: #92400e !important;
            font-weight: 600;
          }
          
          .absent-badge {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 7pt;
            font-weight: 700;
            margin-right: 5px;
            box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
          }
          
          /* Single swipe styling */
          .single-swipe-row {
            background-color: #fef9e6 !important;
            border-right: 4px solid #eab308;
          }
          
          .single-swipe-row td {
            color: #854d0e !important;
            font-weight: 600;
          }
          
          .single-swipe-badge {
            display: inline-block;
            background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 7pt;
            font-weight: 700;
            margin-right: 5px;
            box-shadow: 0 2px 4px rgba(234, 179, 8, 0.3);
          }
          
          .footer-section {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 2px solid #cbd5e0;
          }
          
          .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 8pt;
            margin-bottom: 10px;
          }
          
          .footer-box {
            padding: 10px;
            background: #f8fafc;
            border-radius: 4px;
          }
          
          .footer-title {
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 5px;
          }
          
          .footer-text {
            color: #64748b;
            line-height: 1.6;
          }
          
          .copyright {
            text-align: center;
            font-size: 7pt;
            color: #94a3b8;
            margin-top: 10px;
          }
          
          @media print {
            body { padding: 0; }
            @page {
              size: A4;
              margin: 10mm 8mm;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="print-header">
          <div class="company-header">
            <div>
              <div class="company-logo">ELMALLAH</div>
            </div>
            <div class="company-info">
              <div><strong>HR Portal System</strong></div>
              <div>Attendance Management</div>
            </div>
          </div>
          
          <h1 class="report-title">📋 تقرير سجلات الحضور والانصراف</h1>
          
          <div class="metadata">
            <div class="meta-item">
              <span class="meta-label">📅 تاريخ التقرير:</span>
              <span class="meta-value">${today}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">⏰ وقت الإنشاء:</span>
              <span class="meta-value">${new Date().toLocaleTimeString('ar-EG')}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">👤 اسم الموظف:</span>
              <span class="meta-value">${employeeName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">🆔 رقم الموظف:</span>
              <span class="meta-value">${employeeId}</span>
            </div>
          </div>
          
          <div class="summary-box">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">📆 أيام الحضور</div>
                <div class="summary-value">${workDays}</div>
              </div>
              <div class="summary-item" style="background: #fef2f2; border-color: #fca5a5;">
                <div class="summary-label" style="color: #991b1b;">❌ أيام الغياب</div>
                <div class="summary-value" style="color: #dc2626;">${absentDays}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">⏱️ إجمالي الساعات</div>
                <div class="summary-value">${formatHoursMinutes(totalHours)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">📊 متوسط يومي</div>
                <div class="summary-value">${formatHoursMinutes(avgHours)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="table-header">
          📋 تفاصيل السجلات اليومية
        </div>
        
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>اليوم</th>
              <th>أول دخول</th>
              <th>آخر خروج</th>
              <th>صافي ساعات العمل</th>
            </tr>
          </thead>
          <tbody>
            ${allRecords.map(record => {
              const isSingleSwipe = !record.isAbsent && (record.checkOut === 'N/A' || record.checkOut === '---')
              const rowClass = record.isAbsent 
                ? 'absent-row' 
                : (isSingleSwipe ? 'single-swipe-row' : (record.isFriday ? 'friday-row' : ''))
              const badge = record.isAbsent 
                ? '<span class="absent-badge">غياب</span>' 
                : (isSingleSwipe 
                  ? '<span class="single-swipe-badge">بصمة واحدة</span>'
                  : (record.isFriday ? '<span class="friday-badge">إجازة الجمعة</span>' : ''))
              
              return `
              <tr class="${rowClass}">
                <td><strong>${record.date}</strong></td>
                <td>${badge}${record.dayName}</td>
                <td>${record.isAbsent ? '---' : convertTo12Hour(record.checkIn)}</td>
                <td>${record.isAbsent ? '---' : convertTo12Hour(record.checkOut)}</td>
                <td><strong>${record.isAbsent ? 'غياب' : (isSingleSwipe ? 'سجل واحد فقط' : formatHoursMinutes(record.hours))}</strong></td>
              </tr>
            `}).join('')}
          </tbody>
        </table>

        <!-- Footer -->
        <div class="footer-section">
          <div class="footer-grid">
            <div class="footer-box">
              <div class="footer-title">📊 ملاحظات التقرير</div>
              <div class="footer-text">
                • تم حساب صافي ساعات العمل من أول دخول لآخر خروج<br>
                • التقرير يعرض جميع أيام العمل المسجلة<br>
                • الساعات محسوبة بدقة عالية
              </div>
            </div>
            <div class="footer-box">
              <div class="footer-title">ℹ️ معلومات التقرير</div>
              <div class="footer-text">
                • تاريخ الإنشاء: ${today}<br>
                • النظام: ELMALLAH HR System v2.0<br>
                • نوع التقرير: تقرير حضور فردي
              </div>
            </div>
          </div>
          
          <div class="copyright">
            تم إنشاء هذا النظام بواسطة engelsayedebaid | © 2024 ELMALLAH
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => window.print(), 100);
          }
        </script>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  // تصدير CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error('لا توجد بيانات للتصدير')
      return
    }

    const headers = ['ID', 'الاسم', 'التاريخ', 'اليوم', 'دخول', 'خروج', 'الساعات']
    const rows = filteredData.map(r => [
      r.id, r.name, r.date, r.dayName, r.checkIn, r.checkOut, r.hours.toFixed(2)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast.success('تم التصدير بنجاح')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              نظام تحليل الحضور
            </h1>
            <p className="text-muted-foreground mt-1">
              تحليل شامل لبيانات حضور الموظفين
            </p>
          </div>

          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".dat,.txt,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-all shadow-md font-medium"
            >
              <Upload className="h-5 w-5" />
              رفع ملف الحضور
            </button>
            
            {attendanceData.length > 0 && (
              <button
                onClick={() => {
                  setAttendanceData([])
                  setFilterEmployeeId('')
                  setFilterDate('')
                  setSelectedMonth('')
                  toast.success('تم مسح البيانات')
                }}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-all shadow-md font-medium"
              >
                <Trash2 className="h-5 w-5" />
                مسح البيانات
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12 bg-card rounded-xl border-2 border-dashed border-border">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحليل البيانات...</p>
            </div>
          </div>
        )}

        {!isLoading && attendanceData.length === 0 && (
          <div className="text-center py-16 bg-card rounded-xl border-2 border-dashed border-border">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              لا توجد بيانات حضور
            </h3>
            <p className="text-muted-foreground mb-6">
              قم برفع ملف الحضور (.dat أو .csv) للبدء في التحليل
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-all shadow-md font-medium"
            >
              <Upload className="h-5 w-5" />
              رفع الملف الآن
            </button>
          </div>
        )}

        {attendanceData.length > 0 && (
          <>
            {/* الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8" />
                </div>
                <p className="text-sm opacity-90">إجمالي الموظفين</p>
                <p className="text-4xl font-bold mt-2">{totalEmployees}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-8 w-8" />
                </div>
                <p className="text-sm opacity-90">إجمالي السجلات</p>
                <p className="text-4xl font-bold mt-2">{totalRecords}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-8 w-8" />
                </div>
                <p className="text-sm opacity-90">متوسط ساعات العمل</p>
                <p className="text-4xl font-bold mt-2">{avgHours.toFixed(1)}</p>
              </div>
            </div>


            {/* الفلاتر */}
            <div className="bg-card rounded-xl p-6 shadow-md border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    🔍 الموظف
                  </label>
                  <select
                    value={filterEmployeeId}
                    onChange={(e) => setFilterEmployeeId(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary"
                  >
                    <option value="">الكل</option>
                    {uniqueEmployees.map(id => (
                      <option key={id} value={id}>
                        {employeeNames[id] || `موظف ${id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    📅 التاريخ
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    📆 الشهر
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilterEmployeeId('')
                      setFilterDate('')
                      setSelectedMonth('')
                    }}
                    className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                  >
                    إعادة تعيين
                  </button>
                </div>
              </div>
            </div>

            {/* إحصائيات الموظفين */}
            <div className="bg-card rounded-xl p-6 shadow-md border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    إحصائيات الموظفين
                  </h3>
                </div>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all"
                >
                  <Download className="h-4 w-4" />
                  تصدير CSV
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getEmployeeStats().map(stat => (
                  <div key={stat.id} className="bg-background rounded-lg p-4 border border-border hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{stat.name}</h4>
                          <p className="text-sm text-muted-foreground">ID: {stat.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => printEmployeeReport(stat.id)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm text-sm"
                        title="طباعة تقرير"
                      >
                        <Printer className="h-4 w-4" />
                        طباعة
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">إجمالي الساعات:</span>
                        <span className="font-semibold text-foreground">{formatHoursMinutes(stat.totalHours)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">أيام العمل:</span>
                        <span className="font-semibold text-green-600">{stat.workDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">أيام الغياب:</span>
                        <span className="font-semibold text-red-600">{stat.absentDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">متوسط يومي:</span>
                        <span className="font-semibold text-foreground">{formatHoursMinutes(stat.avgHours)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* جدول السجلات */}
            <div className="bg-card rounded-xl p-6 shadow-md border">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  سجلات الحضور ({filteredData.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">ID</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">الاسم</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">التاريخ</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">اليوم</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">دخول</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">خروج</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">الساعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 100).map((record, idx) => {
                      const isFriday = record.dayName === 'الجمعة'
                      const isSingleSwipe = record.checkOut === 'N/A' || record.checkOut === '---'
                      
                      // تحديد اللون والخلفية
                      const rowBg = isSingleSwipe 
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 border-r-4 border-r-yellow-500'
                        : (isFriday ? 'bg-red-50 dark:bg-red-950/30 border-r-4 border-r-red-500' : '')
                      
                      const textColor = isSingleSwipe
                        ? 'text-yellow-800 dark:text-yellow-400'
                        : (isFriday ? 'text-red-700 dark:text-red-400' : 'text-foreground')
                      
                      return (
                      <tr key={idx} className={`border-b border-border hover:bg-accent/50 transition-colors ${rowBg}`}>
                        <td className={`py-3 px-4 text-sm font-medium ${textColor}`}>{record.id}</td>
                        <td className={`py-3 px-4 text-sm font-medium ${textColor}`}>{record.name}</td>
                        <td className={`py-3 px-4 text-sm ${textColor}`}>{record.date}</td>
                        <td className={`py-3 px-4 text-sm ${textColor} ${(isFriday || isSingleSwipe) ? 'font-bold' : ''}`}>
                          {isSingleSwipe && (
                            <span className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs px-2 py-1 rounded-full mr-2">
                              بصمة واحدة
                            </span>
                          )}
                          {isFriday && (
                            <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                              إجازة
                            </span>
                          )}
                          {record.dayName}
                        </td>
                        <td className={`py-3 px-4 text-sm ${textColor}`}>{convertTo12Hour(record.checkIn)}</td>
                        <td className={`py-3 px-4 text-sm ${textColor}`}>{convertTo12Hour(record.checkOut)}</td>
                        <td className={`py-3 px-4 text-sm font-semibold ${isSingleSwipe ? 'text-yellow-700 dark:text-yellow-400' : (isFriday ? 'text-red-600 dark:text-red-400' : 'text-primary')}`}>
                          {isSingleSwipe ? 'سجل واحد فقط' : formatHoursMinutes(record.hours)}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {filteredData.length > 100 && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  عرض 100 سجل من أصل {filteredData.length}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
