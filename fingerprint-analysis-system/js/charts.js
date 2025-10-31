// ===================================
// Charts Management with Chart.js
// ===================================

const ChartsManager = {
    charts: {},
    
    // Initialize all charts
    init: function() {
        // Will be called after data is analyzed
    },
    
    // Destroy all charts
    destroyAll: function() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    },
    
    // Create Employee Hours Chart
    createEmployeeHoursChart: function(employeeSummary) {
        const ctx = document.getElementById('employeeHoursChart');
        if (!ctx) {
            console.error('❌ Element employeeHoursChart not found');
            return;
        }
        
        // Destroy existing chart
        if (this.charts.employeeHours) {
            this.charts.employeeHours.destroy();
        }
        
        const employees = Object.values(employeeSummary)
            .sort((a, b) => b.totalNetDurationMs - a.totalNetDurationMs)
            .slice(0, 10); // Top 10
        
        const labels = employees.map(e => e.name);
        const data = employees.map(e => (e.totalNetDurationMs / (1000 * 60 * 60)).toFixed(2));
        
        this.charts.employeeHours = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'إجمالي ساعات العمل',
                    data: data,
                    backgroundColor: CONFIG.CHART_COLORS.gradient.slice(0, employees.length),
                    borderColor: CONFIG.CHART_COLORS.primary,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'أفضل 10 موظفين من حيث ساعات العمل',
                        font: {
                            family: 'Cairo',
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `الساعات: ${context.parsed.y} ساعة`;
                            }
                        },
                        titleFont: {
                            family: 'Cairo'
                        },
                        bodyFont: {
                            family: 'Cairo'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Cairo'
                            }
                        },
                        title: {
                            display: true,
                            text: 'الساعات',
                            font: {
                                family: 'Cairo'
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: 'Cairo'
                            }
                        }
                    }
                }
            }
        });
    },
    
    // Create KPI Chart (Target Achievement)
    createKPIChart: function(dailyRecords, targetHoursMs) {
        const ctx = document.getElementById('kpiChart');
        if (!ctx) {
            console.error('❌ Element kpiChart not found');
            return;
        }
        
        if (this.charts.kpi) {
            this.charts.kpi.destroy();
        }
        
        const validRecords = dailyRecords.filter(r => !r.isSingleSwipe);
        const achieved = validRecords.filter(r => r.netDurationMs >= targetHoursMs).length;
        const notAchieved = validRecords.length - achieved;
        
        this.charts.kpi = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['محقق للهدف', 'أقل من الهدف'],
                datasets: [{
                    data: [achieved, notAchieved],
                    backgroundColor: [
                        CONFIG.CHART_COLORS.success,
                        CONFIG.CHART_COLORS.danger
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Cairo',
                                size: 14
                            },
                            padding: 15
                        }
                    },
                    title: {
                        display: true,
                        text: `نسبة تحقيق الهدف اليومي (${validRecords.length} يوم)`,
                        font: {
                            family: 'Cairo',
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const percentage = ((context.parsed / validRecords.length) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        },
                        titleFont: {
                            family: 'Cairo'
                        },
                        bodyFont: {
                            family: 'Cairo'
                        }
                    }
                }
            }
        });
    },
    
    // Create Attendance Trend Chart
    createAttendanceTrendChart: function(dailyRecords) {
        const ctx = document.getElementById('attendanceTrendChart');
        if (!ctx) {
            console.error('❌ Element attendanceTrendChart not found');
            return;
        }
        
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }
        
        // Group by date
        const dateMap = {};
        dailyRecords.filter(r => !r.isSingleSwipe).forEach(record => {
            if (!dateMap[record.date]) {
                dateMap[record.date] = {
                    totalMs: 0,
                    count: 0
                };
            }
            dateMap[record.date].totalMs += record.netDurationMs;
            dateMap[record.date].count += 1;
        });
        
        const sortedDates = Object.keys(dateMap).sort();
        const labels = sortedDates;
        const avgHours = sortedDates.map(date => {
            const avg = dateMap[date].totalMs / dateMap[date].count;
            return (avg / (1000 * 60 * 60)).toFixed(2);
        });
        
        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'متوسط ساعات العمل اليومية',
                    data: avgHours,
                    borderColor: CONFIG.CHART_COLORS.primary,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                family: 'Cairo',
                                size: 14
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'اتجاه متوسط ساعات العمل عبر الزمن',
                        font: {
                            family: 'Cairo',
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `المتوسط: ${context.parsed.y} ساعة`;
                            }
                        },
                        titleFont: {
                            family: 'Cairo'
                        },
                        bodyFont: {
                            family: 'Cairo'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Cairo'
                            }
                        },
                        title: {
                            display: true,
                            text: 'الساعات',
                            font: {
                                family: 'Cairo'
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: 'Cairo'
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },
    
    // Update all charts
    updateAllCharts: function(dailyRecords, employeeSummary, targetHoursMs) {
        if (!dailyRecords || dailyRecords.length === 0) {
            console.warn('⚠️ No data available for charts');
            return;
        }
        
        if (!employeeSummary || Object.keys(employeeSummary).length === 0) {
            console.warn('⚠️ No employee summary available for charts');
            return;
        }
        
        console.log('📊 Updating charts with:', {
            recordsCount: dailyRecords.length,
            employeesCount: Object.keys(employeeSummary).length
        });
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.createEmployeeHoursChart(employeeSummary);
            this.createKPIChart(dailyRecords, targetHoursMs);
            this.createAttendanceTrendChart(dailyRecords);
        }, 100);
    }
};

// Initialize Chart.js defaults
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = 'Cairo';
    Chart.defaults.color = '#374151';
}

