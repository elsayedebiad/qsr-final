// ===================================
// Local Storage Management
// ===================================

const StorageManager = {
    
    // Save data to localStorage
    save: function(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    // Load data from localStorage
    load: function(key) {
        try {
            const jsonData = localStorage.getItem(key);
            return jsonData ? JSON.parse(jsonData) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    },
    
    // Remove item from localStorage
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    // Clear all app data
    clearAll: function() {
        const keys = Object.values(CONFIG.STORAGE_KEYS);
        keys.forEach(key => this.remove(key));
        return true;
    },
    
    // Save settings
    saveSettings: function(settings) {
        return this.save(CONFIG.STORAGE_KEYS.SETTINGS, settings);
    },
    
    // Load settings
    loadSettings: function() {
        const settings = this.load(CONFIG.STORAGE_KEYS.SETTINGS);
        return settings || {
            breakDuration: CONFIG.DEFAULT_BREAK_DURATION,
            targetHours: CONFIG.DEFAULT_TARGET_HOURS
        };
    },
    
    // Save user map
    saveUserMap: function(userMap) {
        return this.save(CONFIG.STORAGE_KEYS.USER_MAP, userMap);
    },
    
    // Load user map
    loadUserMap: function() {
        const userMap = this.load(CONFIG.STORAGE_KEYS.USER_MAP);
        return userMap || { ...CONFIG.DEFAULT_USER_MAP };
    },
    
    // Save attendance data
    saveAttendanceData: function(data) {
        return this.save(CONFIG.STORAGE_KEYS.ATTENDANCE_DATA, data);
    },
    
    // Load attendance data
    loadAttendanceData: function() {
        return this.load(CONFIG.STORAGE_KEYS.ATTENDANCE_DATA);
    },
    
    // Save analysis cache
    saveAnalysisCache: function(cache) {
        return this.save(CONFIG.STORAGE_KEYS.ANALYSIS_CACHE, cache);
    },
    
    // Load analysis cache
    loadAnalysisCache: function() {
        return this.load(CONFIG.STORAGE_KEYS.ANALYSIS_CACHE);
    },
    
    // Get storage size
    getStorageSize: function() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return (total / 1024).toFixed(2); // KB
    },
    
    // Export all data as JSON
    exportData: function() {
        const data = {};
        Object.entries(CONFIG.STORAGE_KEYS).forEach(([name, key]) => {
            data[name] = this.load(key);
        });
        return data;
    },
    
    // Import data from JSON
    importData: function(data) {
        try {
            Object.entries(CONFIG.STORAGE_KEYS).forEach(([name, key]) => {
                if (data[name]) {
                    this.save(key, data[name]);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};

// Auto-save functionality
let autoSaveInterval = null;

function startAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    autoSaveInterval = setInterval(() => {
        if (window.attendanceData && window.originalDailyRecords.length > 0) {
            StorageManager.saveAttendanceData(window.attendanceData);
            StorageManager.saveAnalysisCache({
                originalDailyRecords: window.originalDailyRecords,
                globalDailyRecords: window.globalDailyRecords,
                globalEmployeeSummary: window.globalEmployeeSummary,
                globalCompanyTotalDurationMs: window.globalCompanyTotalDurationMs,
                timestamp: new Date().toISOString()
            });
            updateAutoSaveStatus('✓ حُفظت البيانات تلقائياً');
        }
    }, CONFIG.AUTO_SAVE_INTERVAL);
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

function updateAutoSaveStatus(message) {
    const statusEl = document.getElementById('autoSaveStatus');
    if (statusEl) {
        statusEl.textContent = message;
        setTimeout(() => {
            statusEl.textContent = 'حفظ تلقائي نشط';
        }, 3000);
    }
}

// Load settings on page load
window.addEventListener('DOMContentLoaded', () => {
    const settings = StorageManager.loadSettings();
    const breakDurationInput = document.getElementById('breakDuration');
    
    if (breakDurationInput) breakDurationInput.value = settings.breakDuration;
    
    // Load cached data
    const cachedData = StorageManager.loadAttendanceData();
    const cachedAnalysis = StorageManager.loadAnalysisCache();
    
    if (cachedData && cachedAnalysis) {
        console.log('📦 تم العثور على بيانات محفوظة');
        // يمكن استعادة البيانات هنا إذا لزم الأمر
    }
    
    // Start auto-save
    startAutoSave();
});

// Save settings when changed
window.addEventListener('DOMContentLoaded', () => {
    const breakDurationInput = document.getElementById('breakDuration');
    
    const saveSettings = () => {
        StorageManager.saveSettings({
            breakDuration: parseInt(breakDurationInput.value),
            targetHours: CONFIG.DEFAULT_TARGET_HOURS // Fixed value
        });
    };
    
    if (breakDurationInput) breakDurationInput.addEventListener('change', saveSettings);
});

