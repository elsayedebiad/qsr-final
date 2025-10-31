// ===================================
// Main Application Logic
// ===================================

// Global Variables
let attendanceData = null;
let originalDailyRecords = [];
let globalDailyRecords = [];
let globalEmployeeSummary = {};
let globalCompanyTotalDurationMs = 0;
let availableMonths = [];

// Make data accessible globally for export functions
window.globalDailyRecords = globalDailyRecords;
window.globalEmployeeSummary = globalEmployeeSummary;

// DOM Elements
const loadingIndicator = document.getElementById('loadingIndicator');
const statusMessage = document.getElementById('statusMessage');
const errorMessage = document.getElementById('errorMessage');
const summarySection = document.getElementById('summarySection');
const resultsTableContainer = document.getElementById('resultsTableContainer');
const resultsTableBody = document.getElementById('resultsTableBody');
const employeeDailyFilter = document.getElementById('employeeDailyFilter');
const dateDailyFilter = document.getElementById('dateDailyFilter');
const employeeMonthlyFilter = document.getElementById('employeeMonthlyFilter');
const monthlySummaryContent = document.getElementById('monthlySummaryContent');
const monthlyReportFilter = document.getElementById('monthlyReportFilter');
const analyzeButton = document.getElementById('analyzeButton');
const attendanceStatus = document.getElementById('attendanceStatus');
const attendanceError = document.getElementById('attendanceError');
const breakDurationInput = document.getElementById('breakDuration');
// targetHours is now fixed at 8 hours (removed from UI)
const dailyReportTitle = document.getElementById('dailyReportTitle');
const dashboardView = document.getElementById('dashboardView');
const dailyReportView = document.getElementById('dailyReportView');
const chartsView = document.getElementById('chartsView');
const employeesView = document.getElementById('employeesView');
const navLinks = document.querySelectorAll('.nav-link');
const filterMonth = document.getElementById('filterMonth');
const filterYear = document.getElementById('filterYear');
const selectedUserTotalHoursContainer = document.getElementById('selectedUserTotalHours');
const userTotalHoursText = document.getElementById('userTotalHoursText');
const userNameText = document.getElementById('userNameText');
const userWorkDaysText = document.getElementById('userWorkDaysText');
const userAbsentDaysText = document.getElementById('userAbsentDaysText');

// Disable analyze button initially
if (analyzeButton) analyzeButton.disabled = true;

// ===================================
// Navigation Functions
// ===================================

function changeView(targetId, element) {
    // Hide all views
    if (dashboardView) dashboardView.classList.add('hidden');
    if (dailyReportView) dailyReportView.classList.add('hidden');
    if (chartsView) chartsView.classList.add('hidden');
    if (employeesView) employeesView.classList.add('hidden');

    // Show target view
    if (targetId === 'dashboard' && dashboardView) {
        dashboardView.classList.remove('hidden');
    } else if (targetId === 'dailyReport' && dailyReportView) {
        dailyReportView.classList.remove('hidden');
        if (globalDailyRecords.length > 0) {
            filterDailyTable();
        }
    } else if (targetId === 'charts' && chartsView) {
        chartsView.classList.remove('hidden');
        // Update charts when view is opened
        if (globalDailyRecords.length > 0) {
            const targetHoursMs = CONFIG.DEFAULT_TARGET_HOURS * 60 * 60 * 1000;
            ChartsManager.updateAllCharts(globalDailyRecords, globalEmployeeSummary, targetHoursMs);
        }
    } else if (targetId === 'employees' && employeesView) {
        employeesView.classList.remove('hidden');
    }

    // Update active link
    navLinks.forEach(link => link.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }
}

// ===================================
// File Upload Handler
// ===================================

function handleFileUpload(type, elementId) {
    const input = document.getElementById(elementId);
    const file = input.files[0];
    
    if (!file) return;
    
    if (attendanceError) attendanceError.classList.add('hidden');
    
    if (type === 'attendance') {
        if (attendanceStatus) attendanceStatus.textContent = `تم تحميل الملف: ${file.name}`;
        processAttendanceFile(file);
    }
}

// ===================================
// Process Attendance File
// ===================================

function processAttendanceFile(file) {
    const isDatFile = ['dat', 'txt'].includes(file.name.split('.').pop().toLowerCase());

    Papa.parse(file, {
        header: isDatFile ? false : true,
        delimiter: isDatFile ? '\t' : '',
        skipEmptyLines: true,
        complete: (results) => {
            if (results.errors.length > 0) {
                if (attendanceError) {
                    attendanceError.textContent = 'خطأ في تحليل ملف الحضور. تأكد من أن الملف نصي.';
                    attendanceError.classList.remove('hidden');
                }
                attendanceData = null;
                if (analyzeButton) analyzeButton.disabled = true;
                return;
            }
            
            let data = results.data;
            if (data.length === 0) {
                if (attendanceError) {
                    attendanceError.textContent = 'ملف الحضور فارغ أو لا يحتوي على بيانات صالحة.';
                    attendanceError.classList.remove('hidden');
                }
                attendanceData = null;
                if (analyzeButton) analyzeButton.disabled = true;
                return;
            }
            
            if (isDatFile) {
                data = data.map(row => {
                    const cleanedRow = row.map(item => 
                        typeof item === 'string' ? item.trim() : item
                    );
                    const id = cleanedRow[0];
                    const timestamp = cleanedRow[1];
                    
                    let cleanedId = String(id).trim();

                    if (cleanedId && timestamp && !isNaN(new Date(timestamp))) {
                        return {
                            Employee_ID: cleanedId,
                            Timestamp: timestamp
                        };
                    }
                    return null;
                }).filter(item => item !== null);
            }

            if (data.length === 0) {
                if (attendanceError) {
                    attendanceError.textContent = 'لم يتم العثور على سجلات حضور صالحة بعد التنظيف.';
                    attendanceError.classList.remove('hidden');
                }
                attendanceData = null;
                if (analyzeButton) analyzeButton.disabled = true;
                return;
            }

            originalDailyRecords = prepareRecords(data);
            generateDateFilters(originalDailyRecords);

            attendanceData = data;
            if (analyzeButton) analyzeButton.disabled = false;
            if (attendanceError) attendanceError.classList.add('hidden');
            
            showSuccess(`تم تحميل ${data.length} سجل بنجاح`);
        },
        error: (error) => {
            if (attendanceError) {
                attendanceError.textContent = `خطأ في قراءة ملف الحضور: ${error.message}`;
                attendanceError.classList.remove('hidden');
            }
            attendanceData = null;
            if (analyzeButton) analyzeButton.disabled = true;
        }
    });
}

// ===================================
// Prepare Records
// ===================================

function prepareRecords(data) {
    const prepared = [];
    data.forEach(record => {
        // Create timestamp and ensure it's in local timezone (Egypt)
        let timestamp = new Date(record.Timestamp);
        
        // If the timestamp string doesn't include timezone info, treat it as Egypt local time
        if (typeof record.Timestamp === 'string' && !record.Timestamp.includes('Z') && !record.Timestamp.includes('+')) {
            // Parse as local Egypt time
            const parts = record.Timestamp.split(/[\s\-:T]/);
            if (parts.length >= 5) {
                // Create date in local timezone
                timestamp = new Date(
                    parseInt(parts[0]), // year
                    parseInt(parts[1]) - 1, // month (0-indexed)
                    parseInt(parts[2]), // day
                    parseInt(parts[3]) || 0, // hour
                    parseInt(parts[4]) || 0, // minute
                    parseInt(parts[5]) || 0  // second
                );
            }
        }
        
        // Use the actual date from timestamp for grouping
        const dateKey = timestamp.toISOString().split('T')[0];
        const year = timestamp.getFullYear();
        const month = timestamp.getMonth() + 1;
        const dayOfWeek = timestamp.getDay(); // 0 = Sunday, 6 = Saturday
        const dayName = CONFIG.DAY_NAMES[dayOfWeek];
        const isWeekend = CONFIG.WEEKEND_DAYS.includes(dayOfWeek);
        
        prepared.push({
            ...record,
            timestamp: timestamp,
            dateKey: dateKey,
            year: year,
            month: month,
            dayOfWeek: dayOfWeek,
            dayName: dayName,
            isWeekend: isWeekend,
            dateTime: `${dateKey} ${timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
        });
    });
    return prepared;
}

// ===================================
// Generate Date Filters
// ===================================

function generateDateFilters(records) {
    const dateMap = {};
    records.forEach(record => {
        if (!dateMap[record.year]) {
            dateMap[record.year] = new Set();
        }
        dateMap[record.year].add(record.month);
    });

    availableMonths = [];
    if (filterYear) filterYear.innerHTML = '<option value="all">جميع السنوات</option>';
    if (filterMonth) filterMonth.innerHTML = '<option value="all">جميع الأشهر</option>';

    for (const year in dateMap) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (filterYear) filterYear.appendChild(option);
    }

    const latestYear = Math.max(...Object.keys(dateMap).map(Number));
    if (filterYear) filterYear.value = latestYear || 'all';

    if (dateMap[latestYear]) {
        const monthsArray = Array.from(dateMap[latestYear]).sort((a, b) => b - a);
        monthsArray.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = CONFIG.MONTH_NAMES[month - 1];
            if (filterMonth) filterMonth.appendChild(option);
        });
        if (filterMonth) filterMonth.value = monthsArray[0] || 'all';
    }
}

// ===================================
// Time Conversion Helper
// ===================================

function msToHoursMinutes(ms) {
    if (ms < 0) return `0 س و 0 د`;
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} س و ${minutes} د`;
}

// ===================================
// Start Analysis
// ===================================

function startAnalysis() {
    if (!attendanceData) {
        displayError('يرجى رفع ملف سجلات الحضور أولاً.');
        return;
    }

    if (errorMessage) errorMessage.classList.add('hidden');
    
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (statusMessage) statusMessage.textContent = 'جارٍ حساب ساعات العمل...';

    // Small delay to show loading indicator
    setTimeout(() => {
        filterDataByDate(true);
        showSuccess('تم تحليل البيانات بنجاح!');
    }, 500);
}

// ===================================
// Filter Data by Date
// ===================================

function filterDataByDate(isInitial = false) {
    const selectedMonth = filterMonth?.value || 'all';
    const selectedYear = filterYear?.value || 'all';
    
    let filteredRecords = originalDailyRecords;

    if (selectedYear !== 'all') {
        filteredRecords = filteredRecords.filter(r => String(r.year) === selectedYear);
    }
    if (selectedMonth !== 'all') {
        filteredRecords = filteredRecords.filter(r => String(r.month) === selectedMonth);
    }

    // No break deduction - set to 0
    const breakDurationMins = 0;
    const analysis = calculateWorkHours(filteredRecords, breakDurationMins);
        
    globalDailyRecords = analysis.dailyRecords;
    globalEmployeeSummary = analysis.employeeSummary;
    globalCompanyTotalDurationMs = analysis.companyTotalDurationMs;
    
    // Update window references for export functions
    window.globalDailyRecords = globalDailyRecords;
    window.globalEmployeeSummary = globalEmployeeSummary;
    
    console.log('✅ Data analyzed and stored:', {
        recordsCount: globalDailyRecords.length,
        employeesCount: Object.keys(globalEmployeeSummary).length,
        windowDataAvailable: typeof window.globalDailyRecords !== 'undefined'
    });

    if (isInitial && loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }

    renderResults(globalDailyRecords, globalEmployeeSummary, globalCompanyTotalDurationMs);
}

// ===================================
// Calculate Work Hours
// ===================================

function calculateWorkHours(data, breakDurationMins) {
    const recordsByEmployee = {};
    const dailyRecords = [];
    const employeeSummary = {};
    let companyTotalDurationMs = 0;
    let totalValidWorkDays = 0;
    const breakDurationMs = breakDurationMins * 60 * 1000;
    const targetHoursMs = CONFIG.DEFAULT_TARGET_HOURS * 60 * 60 * 1000;

    // Group by employee and date (using actual date without midnight shift adjustment)
    data.forEach(record => {
        const id = record.Employee_ID;
        const timestamp = record.timestamp;
        
        // Use the actual date from the timestamp
        const workDayKey = timestamp.toISOString().split('T')[0];
        
        if (!recordsByEmployee[id]) recordsByEmployee[id] = {};
        if (!recordsByEmployee[id][workDayKey]) recordsByEmployee[id][workDayKey] = [];
        
        recordsByEmployee[id][workDayKey].push(timestamp);
    });

    for (const id in recordsByEmployee) {
        const dailyData = recordsByEmployee[id];
        let totalDurationMs = 0;
        
        for (const dateKey in dailyData) {
            const sortedTimes = dailyData[dateKey].sort((a, b) => a - b);
            
            const firstSwipe = sortedTimes[0];
            const lastSwipe = sortedTimes[sortedTimes.length - 1];
            
            let hoursWorked = 'سجل واحد فقط';
            let durationMs = 0;
            let netDurationMs = 0;
            let deviationMs = 0;
            
            if (sortedTimes.length >= 2) {
                // Calculate difference in milliseconds (NO break deduction)
                durationMs = lastSwipe.getTime() - firstSwipe.getTime();
                // Use full duration without subtracting break
                netDurationMs = Math.max(0, durationMs);
                totalDurationMs += netDurationMs;
                deviationMs = netDurationMs - targetHoursMs;
                hoursWorked = msToHoursMinutes(netDurationMs);
                totalValidWorkDays++;
                companyTotalDurationMs += netDurationMs;
            }
            
            const employeeName = EmployeeManager.getName(id);
            
            // Get day info from first record of this date
            const dateRecord = data.find(r => r.dateKey === dateKey);
            const dayName = dateRecord ? dateRecord.dayName : '';
            const dayOfWeek = dateRecord ? dateRecord.dayOfWeek : 0;
            const isWeekend = dateRecord ? dateRecord.isWeekend : false;

            dailyRecords.push({
                id: id,
                name: employeeName,
                date: dateKey,
                dayName: dayName,
                dayOfWeek: dayOfWeek,
                isWeekend: isWeekend,
                checkIn: firstSwipe.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                checkOut: sortedTimes.length >= 2 ? lastSwipe.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '---',
                duration: hoursWorked,
                netDurationMs: netDurationMs,
                deviation: msToHoursMinutes(Math.abs(deviationMs)),
                deviationMs: deviationMs,
                isSingleSwipe: sortedTimes.length < 2
            });
        }
        
        const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
        const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        employeeSummary[id] = {
            id: id,
            name: EmployeeManager.getName(id),
            totalHours: totalHours,
            totalMinutes: totalMinutes,
            totalDays: Object.keys(dailyData).length,
            totalNetDurationMs: totalDurationMs
        };
    }
    
    return { 
        dailyRecords, 
        employeeSummary, 
        totalDaysAnalyzed: totalValidWorkDays, 
        companyTotalDurationMs 
    };
}

// ===================================
// Display Error
// ===================================

function displayError(message) {
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
    showError(message);
}

// ===================================
// Render Results
// ===================================

function renderResults(dailyRecords, employeeSummary, companyTotalDurationMs) {
    if (employeeDailyFilter) {
        employeeDailyFilter.innerHTML = '<option value="">عرض جميع الموظفين</option>';
    }
    if (employeeMonthlyFilter) {
        employeeMonthlyFilter.innerHTML = '<option value="">اختر موظفاً...</option>';
    }
    
    const employeeIDs = Object.keys(employeeSummary).sort((a, b) => {
        const nameA = employeeSummary[a].name.toLowerCase();
        const nameB = employeeSummary[b].name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    // Update dashboard
    const totalEmployeesEl = document.getElementById('totalEmployees');
    const totalWorkDaysEl = document.getElementById('totalWorkDays');
    const avgDailyWorkCompanyEl = document.getElementById('avgDailyWorkCompany');
    
    if (totalEmployeesEl) totalEmployeesEl.textContent = employeeIDs.length;
    if (totalWorkDaysEl) {
        // Calculate total days including absent days
        const workDays = dailyRecords.filter(r => !r.isSingleSwipe).length;
        
        // Get date range for all employees
        const allDates = [...new Set(dailyRecords.map(r => r.date))].sort();
        if (allDates.length > 0) {
            const startDate = new Date(allDates[0]);
            const endDate = new Date(allDates[allDates.length - 1]);
            const dateRange = [];
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const dayOfWeek = d.getDay();
                if (!CONFIG.WEEKEND_DAYS.includes(dayOfWeek)) {
                    dateRange.push(dateStr);
                }
            }
            const totalWorkingDays = dateRange.length * employeeIDs.length;
            totalWorkDaysEl.textContent = totalWorkingDays;
        } else {
            totalWorkDaysEl.textContent = workDays;
        }
    }

    const validWorkDays = dailyRecords.filter(r => !r.isSingleSwipe).length;
    const avgDurationMsCompany = validWorkDays > 0 ? companyTotalDurationMs / validWorkDays : 0;
    if (avgDailyWorkCompanyEl) {
        avgDailyWorkCompanyEl.textContent = msToHoursMinutes(avgDurationMsCompany);
    }

    // Fill filter dropdowns
    employeeIDs.forEach(id => {
        const summary = employeeSummary[id];
        const totalMinsFormatted = String(summary.totalMinutes).padStart(2, '0');
        
        if (employeeDailyFilter) {
            let dailyOption = document.createElement('option');
            dailyOption.value = id;
            dailyOption.textContent = `${summary.name} (ID: ${id})`;
            employeeDailyFilter.appendChild(dailyOption);
        }

        if (employeeMonthlyFilter) {
            let monthlyOption = document.createElement('option');
            monthlyOption.value = id;
            monthlyOption.textContent = `${summary.name} (ID: ${id}) - إجمالي: ${summary.totalHours} س و ${totalMinsFormatted} د`;
            employeeMonthlyFilter.appendChild(monthlyOption);
        }
    });
    
    filterDailyTable(dailyRecords);
    
    if (summarySection) summarySection.classList.remove('hidden');
    if (resultsTableContainer) resultsTableContainer.classList.remove('hidden');
    if (monthlyReportFilter) monthlyReportFilter.classList.remove('hidden');
    
    renderMonthlySummary();

    // Update charts
    const targetHoursMs = CONFIG.DEFAULT_TARGET_HOURS * 60 * 60 * 1000;
    ChartsManager.updateAllCharts(dailyRecords, employeeSummary, targetHoursMs);

    // Go to dashboard
    const dashboardLink = document.querySelector('.nav-link[data-target="dashboard"]');
    changeView('dashboard', dashboardLink);
}

// ===================================
// Render Monthly Summary
// ===================================

function renderMonthlySummary() {
    if (!monthlySummaryContent) return;
    
    const selectedID = employeeMonthlyFilter?.value;
    monthlySummaryContent.innerHTML = '';
    
    if (!selectedID) {
        monthlySummaryContent.innerHTML = `
            <p class="text-gray-500 text-center">يرجى اختيار موظف من القائمة أعلاه لعرض الملخص.</p>
            <div id="aiAnalysisResult"></div>
        `;
        return;
    }

    const summary = globalEmployeeSummary[selectedID];
    if (!summary) return;

    const employeeValidDays = globalDailyRecords.filter(r => r.id === selectedID && !r.isSingleSwipe).length;
    const avgDurationMs = employeeValidDays > 0 ? summary.totalNetDurationMs / employeeValidDays : 0;
    const avgHoursMinutes = msToHoursMinutes(avgDurationMs);

    const singleSwipeDays = globalDailyRecords.filter(r => r.id === selectedID && r.isSingleSwipe).length;
    
    monthlySummaryContent.innerHTML = `
        <div class="space-y-4 text-right">
            <h3 class="text-2xl font-extrabold text-indigo-700">${summary.name} (ID: ${summary.id})</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="p-4 bg-green-50 rounded-lg border-b-4 border-green-400 shadow">
                    <p class="text-lg font-medium text-gray-500">إجمالي صافي العمل</p>
                    <p class="text-3xl font-bold text-green-600">${summary.totalHours} س و ${String(summary.totalMinutes).padStart(2, '0')} د</p>
                </div>
                <div class="p-4 bg-blue-50 rounded-lg border-b-4 border-blue-400 shadow">
                    <p class="text-lg font-medium text-gray-500">عدد أيام العمل (بسجل كامل)</p>
                    <p class="text-3xl font-bold text-blue-600">${employeeValidDays} يوم</p>
                </div>
                <div class="p-4 bg-yellow-50 rounded-lg border-b-4 border-yellow-400 shadow">
                    <p class="text-lg font-medium text-gray-500">متوسط صافي العمل اليومي</p>
                    <p class="text-3xl font-bold text-yellow-600">${avgHoursMinutes}</p>
                </div>
            </div>

            ${singleSwipeDays > 0 ? `
                <div class="p-3 bg-red-50 rounded-lg border-l-4 border-red-500 text-red-700 shadow-inner">
                    <p class="font-bold">تنبيه: تم تسجيل ${singleSwipeDays} يوم ببصمة واحدة فقط (يحتاج مراجعة).</p>
                </div>
            ` : ''}

            <div class="pt-4 border-t border-gray-200">
                <button id="aiAnalyzeButton" onclick="analyzePerformance(globalEmployeeSummary['${selectedID}'])" class="bg-indigo-500 text-white font-semibold py-2 px-6 rounded-full shadow hover:bg-indigo-600 transition duration-300 disabled:opacity-50">
                    <i class="fas fa-magic ml-2"></i>
                    تحليل الأداء بالذكاء الاصطناعي
                </button>
                <div id="aiAnalysisResult" class="mt-3"></div>
            </div>
        </div>
    `;
}

// ===================================
// AI Performance Analysis
// ===================================

async function analyzePerformance(summary) {
    const loadingContainer = document.getElementById('aiAnalysisResult');
    const analyzeButton = document.getElementById('aiAnalyzeButton');

    if (!summary) return;
    
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === "") {
        if (loadingContainer) {
            loadingContainer.innerHTML = `
                <div class="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg text-yellow-700 shadow-md">
                    <i class="fas fa-exclamation-triangle ml-2"></i>
                    يرجى إضافة Gemini API Key في ملف config.js لتفعيل هذه الميزة.
                </div>
            `;
        }
        return;
    }

    if (loadingContainer) {
        loadingContainer.innerHTML = `
            <div class="flex items-center space-x-2 space-x-reverse text-blue-600">
                <div class="spinner"></div>
                <span>جارٍ تحليل الأداء بواسطة الذكاء الاصطناعي...</span>
            </div>
        `;
    }
    if (analyzeButton) analyzeButton.disabled = true;

    const totalHoursFormatted = `${summary.totalHours} س و ${String(summary.totalMinutes).padStart(2, '0')} د`;
    const employeeValidDays = globalDailyRecords.filter(r => r.id === summary.id && !r.isSingleSwipe).length;
    const avgDurationMs = employeeValidDays > 0 ? summary.totalNetDurationMs / employeeValidDays : 0;
    const avgHoursMinutes = msToHoursMinutes(avgDurationMs);
    const singleSwipeDays = globalDailyRecords.filter(r => r.id === summary.id && r.isSingleSwipe).length;

    const systemPrompt = `أنت خبير في الموارد البشرية (HR) وتحليل الأداء. مهمتك هي تقييم أداء موظف بناءً على سجلات الحضور. يجب أن يكون ردك موجزًا (لا يزيد عن 4 نقاط/فقرات) ومهنيًا وفي صيغة خطاب موجه لمدير الموارد البشرية. ساعات العمل القياسية المتوقعة هي ${CONFIG.DEFAULT_TARGET_HOURS} ساعات يومياً.`;

    const userQuery = `حلل أداء الموظف "${summary.name}" (ID: ${summary.id}) استنادًا إلى البيانات التالية:
    - إجمالي أيام العمل في التقرير: ${summary.totalDays} يوم.
    - إجمالي ساعات العمل المُسجلة (بعد خصم الاستراحة): ${totalHoursFormatted}.
    - متوسط صافي ساعات العمل اليومية: ${avgHoursMinutes}.
    - عدد الأيام التي سُجلت فيها بصمة دخول واحدة فقط (مما يشير إلى نسيان بصمة الخروج): ${singleSwipeDays} يوم.
    
    قدم تقييماً موجزاً وموضوعياً عن التزام الموظف وتوصيات للإدارة.`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
        const MAX_RETRIES = 3;
        let response = null;

        for (let i = 0; i < MAX_RETRIES; i++) {
            response = await fetch(CONFIG.getGeminiURL(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                break;
            }
            if (i < MAX_RETRIES - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        const result = await response.json();
        const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'تعذر الحصول على تحليل الأداء من الذكاء الاصطناعي.';
        
        if (loadingContainer) {
            loadingContainer.innerHTML = `
                <div class="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg text-gray-700 shadow-md">
                    <p class="font-bold text-indigo-700 mb-2">
                        <i class="fas fa-sparkles ml-2"></i>
                        تقييم الأداء بواسطة Gemini:
                    </p>
                    <p class="whitespace-pre-wrap">${aiText}</p>
                </div>
            `;
        }

    } catch (error) {
        if (loadingContainer) {
            loadingContainer.innerHTML = `
                <div class="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 shadow-md">
                    <i class="fas fa-exclamation-circle ml-2"></i>
                    خطأ في الاتصال بالذكاء الاصطناعي. (تأكد من إدخال API Key صالح)
                </div>
            `;
        }
    } finally {
        if (analyzeButton) analyzeButton.disabled = false;
    }
}

// ===================================
// Filter Daily Table
// ===================================

function filterDailyTable() {
    if (!resultsTableBody) return;
    
    resultsTableBody.innerHTML = '';
    const selectedID = employeeDailyFilter?.value || '';
    const selectedDate = dateDailyFilter?.value || '';
    
    let filteredRecords = globalDailyRecords;

    if (selectedID) {
        filteredRecords = filteredRecords.filter(record => record.id === selectedID);
    }

    if (selectedDate) {
        filteredRecords = filteredRecords.filter(record => record.date === selectedDate);
    }
    
    // Update title and total hours with absence tracking
    if (selectedID) {
        const summary = globalEmployeeSummary[selectedID];
        const employeeRecords = filteredRecords.filter(r => r.id === selectedID);
        
        if (summary && selectedUserTotalHoursContainer) {
            // Calculate total hours from filtered records
            let totalFilteredMs = 0;
            let workDaysCount = 0;
            
            employeeRecords.forEach(record => {
                if (!record.isSingleSwipe) {
                    totalFilteredMs += record.netDurationMs;
                    workDaysCount++;
                }
            });
            
            const totalHours = Math.floor(totalFilteredMs / (1000 * 60 * 60));
            const totalMinutes = Math.floor((totalFilteredMs % (1000 * 60 * 60)) / (1000 * 60));
            
            // Calculate absence days
            const dateRange = getDateRange(filteredRecords);
            const totalDaysInRange = dateRange.length;
            const workingDaysInRange = dateRange.filter(d => !CONFIG.WEEKEND_DAYS.includes(new Date(d).getDay())).length;
            const absentDays = workingDaysInRange - workDaysCount;
            
            if (userNameText) userNameText.textContent = summary.name;
            if (userTotalHoursText) userTotalHoursText.textContent = `${totalHours} س و ${String(totalMinutes).padStart(2, '0')} د`;
            if (userWorkDaysText) userWorkDaysText.textContent = workDaysCount;
            if (userAbsentDaysText) userAbsentDaysText.textContent = absentDays > 0 ? absentDays : 0;
            
            selectedUserTotalHoursContainer.classList.remove('hidden');
        }
    } else {
        if (selectedUserTotalHoursContainer) {
            selectedUserTotalHoursContainer.classList.add('hidden');
        }
    }
    
    if (dailyReportTitle) {
        if (selectedID || selectedDate) {
            const name = selectedID ? (EmployeeManager.getName(selectedID)) : 'جميع الموظفين';
            const dateText = selectedDate ? `لتاريخ: ${selectedDate}` : '';
            dailyReportTitle.innerHTML = `<i class="fas fa-file-alt ml-2"></i> تفاصيل سجلات العمل اليومية - ${name} ${dateText}`;
        } else {
            dailyReportTitle.innerHTML = '<i class="fas fa-file-alt ml-2"></i> تفاصيل سجلات العمل اليومية (جميع السجلات)';
        }
    }

    if (filteredRecords.length === 0) {
        const row = resultsTableBody.insertRow();
        row.innerHTML = `<td colspan="7" class="px-6 py-4 text-center text-gray-500">لا توجد بيانات لعرضها.</td>`;
        return;
    }

    // Combine records with absent days if filtering by employee
    let displayRecords = [...filteredRecords];
    
    if (selectedID) {
        const absentDays = getAbsentDays(selectedID, globalDailyRecords);
        
        // Add absent days to display records
        absentDays.forEach(absentDay => {
            displayRecords.push({
                id: selectedID,
                name: globalEmployeeSummary[selectedID]?.name || selectedID,
                date: absentDay.date,
                dayName: absentDay.dayName,
                dayOfWeek: absentDay.dayOfWeek,
                isWeekend: false,
                isAbsent: true,
                checkIn: '---',
                checkOut: '---',
                duration: 'غياب',
                netDurationMs: 0,
                deviation: '---',
                deviationMs: 0,
                isSingleSwipe: false
            });
        });
        
        // Sort by date
        displayRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    displayRecords.forEach(record => {
        const row = resultsTableBody.insertRow();
        row.classList.add('hover:bg-gray-50', 'transition', 'duration-150');
        
        // Add absent class for styling
        if (record.isAbsent) {
            row.classList.add('absent-row');
        }
        
        // Add weekend class for styling
        if (record.isWeekend) {
            row.classList.add('weekend-day');
        }

        // Simple styling for net hours - no color coding
        let netHoursClass = 'text-gray-700 font-semibold';
        
        // Day name with weekend indicator
        let dayNameDisplay = record.dayName;
        if (record.isWeekend) {
            dayNameDisplay = `${record.dayName} <span class="text-xs">(عطلة)</span>`;
        }
        
        // Special display for absent days
        if (record.isAbsent) {
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold">${record.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold">${record.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold">${record.date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold">${dayNameDisplay}</td>
                <td class="px-6 py-4 text-center text-sm" colspan="3">
                    <span class="absent-badge">
                        <i class="fas fa-exclamation-triangle ml-1"></i>
                        غياب
                    </span>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${record.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${record.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${record.isWeekend ? 'text-red-600 font-bold' : 'text-gray-600'}">${dayNameDisplay}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${record.checkIn}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${record.checkOut}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${netHoursClass}">
                    ${record.duration}
                    ${record.isSingleSwipe ? '<span class="text-xs text-red-600">(سجل واحد)</span>' : ''}
                </td>
            `;
        }
    });
    
    // Prepare print view with summary
    preparePrintView(filteredRecords, selectedID);
}

// ===================================
// Get Date Range Helper
// ===================================

function getDateRange(records) {
    if (records.length === 0) return [];
    
    const dates = records.map(r => r.date).sort();
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);
    
    const dateRange = [];
    const currentDate = new Date(firstDate);
    
    while (currentDate <= lastDate) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateRange;
}

// ===================================
// Get Absent Days for Employee
// ===================================

function getAbsentDays(employeeId, records) {
    if (!employeeId) return [];
    
    const employeeRecords = records.filter(r => r.id === employeeId);
    if (employeeRecords.length === 0) return [];
    
    const dateRange = getDateRange(employeeRecords);
    const recordedDates = new Set(employeeRecords.map(r => r.date));
    
    const absentDays = [];
    dateRange.forEach(date => {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();
        const dayName = CONFIG.DAY_NAMES[dayOfWeek];
        const isWeekend = CONFIG.WEEKEND_DAYS.includes(dayOfWeek);
        
        // Only add if it's not recorded and not a weekend
        if (!recordedDates.has(date) && !isWeekend) {
            absentDays.push({
                date: date,
                dayName: dayName,
                dayOfWeek: dayOfWeek,
                isWeekend: false,
                isAbsent: true
            });
        }
    });
    
    return absentDays;
}

// ===================================
// Prepare Print View with Summary
// ===================================

function preparePrintView(filteredRecords, selectedID) {
    const printMetadata = document.getElementById('printMetadata');
    const printSummaryBox = document.getElementById('printSummaryBox');
    const printDate = document.getElementById('printDate');
    const printTitle = document.getElementById('printTitle');
    
    if (!printMetadata || !printSummaryBox) return;
    
    // Update print date
    if (printDate) {
        const now = new Date();
        printDate.textContent = now.toLocaleDateString('ar-EG', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        }) + ' - ' + now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Calculate summary
    let totalMs = 0;
    let workDaysCount = 0;
    let singleSwipeCount = 0;
    let weekendWorkCount = 0;
    
    filteredRecords.forEach(record => {
        if (!record.isSingleSwipe) {
            totalMs += record.netDurationMs;
            workDaysCount++;
            if (record.isWeekend) weekendWorkCount++;
        } else {
            singleSwipeCount++;
        }
    });
    
    const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Calculate absence
    const dateRange = getDateRange(filteredRecords);
    const workingDaysInRange = dateRange.filter(d => !CONFIG.WEEKEND_DAYS.includes(new Date(d).getDay())).length;
    const absentDays = workingDaysInRange - workDaysCount;
    
    // Update print title
    if (selectedID && printTitle) {
        const summary = globalEmployeeSummary[selectedID];
        if (summary) {
            printTitle.textContent = `تقرير حضور الموظف: ${summary.name}`;
        }
    }
    
    // Update metadata
    const selectedMonth = filterMonth?.value;
    const selectedYear = filterYear?.value;
    let period = 'جميع الفترات';
    if (selectedMonth !== 'all' && selectedYear !== 'all') {
        period = `${CONFIG.MONTH_NAMES[parseInt(selectedMonth) - 1]} ${selectedYear}`;
    } else if (selectedYear !== 'all') {
        period = `سنة ${selectedYear}`;
    }
    
    const now = new Date();
    printMetadata.innerHTML = `
        <div class="print-meta-item">
            <span class="print-meta-label">📅 الفترة:</span>
            <span class="print-meta-value">${period}</span>
        </div>
        <div class="print-meta-item">
            <span class="print-meta-label">🕐 تاريخ الإصدار:</span>
            <span class="print-meta-value">${now.toLocaleDateString('ar-EG')}</span>
        </div>
        ${selectedID ? `
        <div class="print-meta-item">
            <span class="print-meta-label">👤 رقم الموظف:</span>
            <span class="print-meta-value">${selectedID}</span>
        </div>
        ` : ''}
        <div class="print-meta-item">
            <span class="print-meta-label">📄 رقم التقرير:</span>
            <span class="print-meta-value">#${now.getTime().toString().slice(-8)}</span>
        </div>
    `;
    
    // Update summary box
    printSummaryBox.innerHTML = `
        <div class="print-summary-grid">
            <div class="print-summary-item">
                <div class="print-summary-label">⏱️ إجمالي ساعات العمل</div>
                <div class="print-summary-value">${totalHours} س ${totalMinutes} د</div>
            </div>
            <div class="print-summary-item">
                <div class="print-summary-label">✅ أيام الحضور</div>
                <div class="print-summary-value" style="color: #059669;">${workDaysCount}</div>
            </div>
            <div class="print-summary-item">
                <div class="print-summary-label">❌ أيام الغياب</div>
                <div class="print-summary-value" style="color: #dc2626;">${absentDays > 0 ? absentDays : 0}</div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
            <div class="print-summary-item" style="text-align: center;">
                <div class="print-summary-label">📊 متوسط العمل اليومي</div>
                <div style="font-size: 11pt; font-weight: 600; color: #2563eb; margin-top: 5px;">
                    ${msToHoursMinutes(workDaysCount > 0 ? totalMs / workDaysCount : 0)}
                </div>
            </div>
            <div class="print-summary-item" style="text-align: center;">
                <div class="print-summary-label">📋 إجمالي الأيام المسجلة</div>
                <div style="font-size: 11pt; font-weight: 600; color: #2563eb; margin-top: 5px;">
                    ${workDaysCount + (absentDays > 0 ? absentDays : 0)} يوم
                </div>
            </div>
        </div>
        ${singleSwipeCount > 0 ? `
            <div class="print-alert" style="background: #fef3c7; border-left: 3px solid #f59e0b;">
                ⚠️ <strong>تنبيه:</strong> يوجد ${singleSwipeCount} يوم بسجل واحد فقط (يحتاج مراجعة)
            </div>
        ` : ''}
        ${weekendWorkCount > 0 ? `
            <div class="print-alert" style="background: #fee2e2; border-left: 3px solid #dc2626;">
                📌 <strong>ملاحظة:</strong> تم العمل في ${weekendWorkCount} يوم عطلة
            </div>
        ` : ''}
    `;
}

// ===================================
// Print Handler with Tips
// ===================================

function handlePrint() {
    // Show print tips
    const tips = `
        📋 نصائح للحصول على طباعة مثالية:
        
        ✅ في نافذة الطباعة:
        • اختر "طباعة الألوان الخلفية" أو "Print backgrounds"
        • حدد حجم الورق: A4
        • اختر الاتجاه: Portrait (عمودي)
        • الهوامش: Default أو Minimum
        
        ℹ️ سيتم تكرار العناوين في كل صفحة تلقائياً
        ℹ️ الجدول سيتم توزيعه على صفحات متعددة بشكل احترافي
        
        هل تريد المتابعة إلى الطباعة؟
    `.trim();
    
    if (confirm(tips)) {
        // Small delay to ensure alert closes before print dialog
        setTimeout(() => {
            window.print();
        }, 100);
    }
}

// ===================================
// Clear All Data
// ===================================

function clearData() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
        attendanceData = null;
        originalDailyRecords = [];
        globalDailyRecords = [];
        globalEmployeeSummary = {};
        globalCompanyTotalDurationMs = 0;
        
        // Update window references
        window.globalDailyRecords = [];
        window.globalEmployeeSummary = {};
        
        if (summarySection) summarySection.classList.add('hidden');
        if (resultsTableContainer) resultsTableContainer.classList.add('hidden');
        if (monthlyReportFilter) monthlyReportFilter.classList.add('hidden');
        if (attendanceStatus) attendanceStatus.textContent = '';
        if (analyzeButton) analyzeButton.disabled = true;
        
        // Clear file input
        const fileInput = document.getElementById('attendanceFile');
        if (fileInput) fileInput.value = '';
        
        ChartsManager.destroyAll();
        
        showSuccess('تم مسح جميع البيانات بنجاح');
    }
}

// ===================================
// Initialize Application
// ===================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ELMALLAH HR System v2.0 - تم تحميل التطبيق بنجاح');
    
    // Initialize global data references
    window.globalDailyRecords = window.globalDailyRecords || [];
    window.globalEmployeeSummary = window.globalEmployeeSummary || {};
    
    console.log('📊 Global data initialized:', {
        globalDailyRecords: typeof window.globalDailyRecords,
        globalEmployeeSummary: typeof window.globalEmployeeSummary
    });
    
    // Set initial view
    changeView('dashboard', document.querySelector('.nav-link[data-target="dashboard"]'));
    
    // Check for API key
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === "") {
        console.warn('⚠️ Gemini API Key غير مُعرف');
    }
});

