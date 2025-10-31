// ===================================
// Export Functions (CSV, Excel, PDF)
// ===================================

const ExportManager = {
    
    // Export to CSV
    exportToCSV: function(data, filename = 'attendance_report.csv') {
        const tableData = [];
        
        // Headers
        tableData.push([
            'ID',
            'اسم الموظف',
            'التاريخ',
            'اليوم',
            'أول_دخول',
            'آخر_خروج',
            'صافي_ساعات_العمل',
            'صافي_بالدقائق',
            'حالة_السجل',
            'عطلة'
        ]);

        // Data rows
        data.forEach(record => {
            const status = record.isSingleSwipe 
                ? 'بصمة واحدة' 
                : (record.deviationMs >= 0 ? 'التزام بالهدف' : 'أقل من الهدف');
            
            tableData.push([
                record.id,
                record.name,
                record.date,
                record.dayName || '',
                record.checkIn,
                record.checkOut,
                record.duration,
                Math.floor(record.netDurationMs / (1000 * 60)),
                status,
                record.isWeekend ? 'نعم' : 'لا'
            ]);
        });

        const csv = Papa.unparse(tableData, {
            quotes: true,
            delimiter: ',',
            newline: '\r\n'
        });

        this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
        showSuccess('تم تصدير الملف بنجاح! (CSV)');
    },
    
    // Export to Excel
    exportToExcel: function(data, filename = 'attendance_report.xlsx') {
        if (typeof XLSX === 'undefined') {
            showError('مكتبة Excel غير محملة');
            return;
        }
        
        const worksheetData = [];
        
        // Headers
        worksheetData.push([
            'ID',
            'اسم الموظف',
            'التاريخ',
            'اليوم',
            'أول دخول',
            'آخر خروج',
            'صافي ساعات العمل',
            'صافي بالدقائق',
            'حالة السجل',
            'عطلة'
        ]);
        
        // Data rows
        data.forEach(record => {
            const status = record.isSingleSwipe 
                ? 'بصمة واحدة' 
                : (record.deviationMs >= 0 ? 'التزام بالهدف' : 'أقل من الهدف');
            
            worksheetData.push([
                record.id,
                record.name,
                record.date,
                record.dayName || '',
                record.checkIn,
                record.checkOut,
                record.duration,
                Math.floor(record.netDurationMs / (1000 * 60)),
                status,
                record.isWeekend ? 'نعم' : 'لا'
            ]);
        });
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير الحضور');
        
        // Set column widths
        worksheet['!cols'] = [
            { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
            { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }
        ];
        
        XLSX.writeFile(workbook, filename);
        showSuccess('تم تصدير الملف بنجاح! (Excel)');
    },
    
    // Export to PDF
    exportToPDF: function(data, title = 'تقرير سجلات الحضور') {
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            showError('مكتبة PDF غير محملة. جاري إعادة المحاولة...');
            // Try to reload the library
            setTimeout(() => {
                if (typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined') {
                    this.exportToPDF(data, title);
                } else {
                    showError('فشل تحميل مكتبة PDF. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
                }
            }, 1000);
            return;
        }
        
        try {
            // Try both ways to access jsPDF
            const { jsPDF } = window.jspdf || window;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // Add Arabic font support (if available)
            // For full Arabic support, you would need to add a custom Arabic font
            
            // Add header background
            doc.setFillColor(30, 58, 138);
            doc.rect(0, 0, 297, 28, 'F');
            
            // Company name
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('ELMALLAH', 148, 12, { align: 'center' });
            
            // Title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text('Attendance Report', 148, 20, { align: 'center' });
            
            // Date info
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')} | Generated at: ${new Date().toLocaleTimeString('en-US')}`, 148, 33, { align: 'center' });
            
            // Prepare table data
            const tableData = data.map(record => {
                return [
                    record.id,
                    record.name,
                    record.date,
                    record.dayName || '',
                    record.checkIn,
                    record.checkOut,
                    record.duration
                ];
            });
        
            // Add table
            if (typeof doc.autoTable !== 'function') {
                showError('مكتبة autoTable غير محملة');
                return;
            }
            
            doc.autoTable({
                head: [['ID', 'Name', 'Date', 'Day', 'Check In', 'Check Out', 'Net Hours']],
                body: tableData,
                startY: 38,
                styles: {
                    font: 'helvetica',
                    fontSize: 8,
                    cellPadding: 3,
                    halign: 'center',
                    textColor: [30, 30, 30]
                },
                headStyles: {
                    fillColor: [30, 58, 138],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 9
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    0: { cellWidth: 15 },  // ID
                    1: { cellWidth: 40 },  // Name
                    2: { cellWidth: 25 },  // Date
                    3: { cellWidth: 25 },  // Day
                    4: { cellWidth: 25 },  // Check In
                    5: { cellWidth: 25 },  // Check Out
                    6: { cellWidth: 30 }   // Hours
                },
                margin: { top: 38, right: 10, bottom: 20, left: 10 }
            });
            
            // Add footer with summary
            const pageCount = doc.internal.getNumberOfPages();
            const totalRecords = data.length;
            const totalHours = data.reduce((sum, r) => sum + (r.netDurationMs || 0), 0);
            const hours = Math.floor(totalHours / (1000 * 60 * 60));
            const minutes = Math.floor((totalHours % (1000 * 60 * 60)) / (1000 * 60));
            
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Footer line
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.line(10, doc.internal.pageSize.getHeight() - 15, 287, doc.internal.pageSize.getHeight() - 15);
                
                // Footer text
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(8);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.getWidth() / 2,
                    doc.internal.pageSize.getHeight() - 8,
                    { align: 'center' }
                );
                
                // Summary on first page
                if (i === 1) {
                    doc.setFontSize(7);
                    doc.text(
                        `Total Records: ${totalRecords} | Total Hours: ${hours}h ${minutes}m`,
                        15,
                        doc.internal.pageSize.getHeight() - 8
                    );
                }
                
                // Company name on all pages
                doc.setFontSize(7);
                doc.text(
                    '© 2024 ELMALLAH - HR System',
                    doc.internal.pageSize.getWidth() - 15,
                    doc.internal.pageSize.getHeight() - 8,
                    { align: 'right' }
                );
            }
            
            doc.save(`ELMALLAH_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            showSuccess('تم تصدير ملف PDF بنجاح! ✅');
            
        } catch (error) {
            console.error('PDF Export Error:', error);
            showError('حدث خطأ أثناء إنشاء ملف PDF: ' + error.message);
        }
    },
    
    // Helper function to download file
    downloadFile: function(content, filename, mimeType) {
        const blob = new Blob(["\uFEFF" + content], { type: mimeType });
        const link = document.createElement("a");
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
};

// Global export functions
function exportToCSV() {
    const data = window.globalDailyRecords || [];
    if (data.length === 0) {
        showError('لا توجد بيانات للتصدير. يرجى تحميل ملف البصمات أولاً وتحليل البيانات.');
        console.log('Export error: No data in window.globalDailyRecords');
        return;
    }
    
    const selectedID = document.getElementById('employeeDailyFilter')?.value;
    const selectedDate = document.getElementById('dateDailyFilter')?.value;
    
    let filteredData = [...data];
    
    if (selectedID) {
        filteredData = filteredData.filter(r => r.id === selectedID);
    }
    if (selectedDate) {
        filteredData = filteredData.filter(r => r.date === selectedDate);
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Attendance_Report_${timestamp}.csv`;
    
    ExportManager.exportToCSV(filteredData, filename);
}

function exportToExcel() {
    const data = window.globalDailyRecords || [];
    if (data.length === 0) {
        showError('لا توجد بيانات للتصدير. يرجى تحميل ملف البصمات أولاً وتحليل البيانات.');
        console.log('Export error: No data in window.globalDailyRecords');
        return;
    }
    
    const selectedID = document.getElementById('employeeDailyFilter')?.value;
    const selectedDate = document.getElementById('dateDailyFilter')?.value;
    
    let filteredData = [...data];
    
    if (selectedID) {
        filteredData = filteredData.filter(r => r.id === selectedID);
    }
    if (selectedDate) {
        filteredData = filteredData.filter(r => r.date === selectedDate);
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Attendance_Report_${timestamp}.xlsx`;
    
    ExportManager.exportToExcel(filteredData, filename);
}

function exportToPDF() {
    const data = window.globalDailyRecords || [];
    
    console.log('PDF Export - Data check:', {
        hasWindow: typeof window !== 'undefined',
        hasGlobalData: typeof window.globalDailyRecords !== 'undefined',
        dataLength: data.length,
        data: data
    });
    
    if (data.length === 0) {
        showError('لا توجد بيانات للتصدير. يرجى تحميل ملف البصمات أولاً وتحليل البيانات.');
        console.log('Export error: No data in window.globalDailyRecords');
        return;
    }
    
    const selectedID = document.getElementById('employeeDailyFilter')?.value;
    const selectedDate = document.getElementById('dateDailyFilter')?.value;
    
    let filteredData = [...data];
    
    if (selectedID) {
        filteredData = filteredData.filter(r => r.id === selectedID);
    }
    if (selectedDate) {
        filteredData = filteredData.filter(r => r.date === selectedDate);
    }
    
    const title = selectedID 
        ? `تقرير حضور الموظف: ${filteredData[0]?.name || selectedID}`
        : 'تقرير سجلات الحضور';
    
    ExportManager.exportToPDF(filteredData, title);
}

