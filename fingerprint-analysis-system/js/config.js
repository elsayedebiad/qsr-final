// ===================================
// Configuration File
// ===================================

const CONFIG = {
    // Gemini AI API Configuration
    GEMINI_API_KEY: "", // أدخل API Key الخاص بك هنا
    GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
    
    // Default Settings
    DEFAULT_BREAK_DURATION: 60, // minutes
    DEFAULT_TARGET_HOURS: 8, // hours (fixed - user cannot change)
    
    // Storage Keys
    STORAGE_KEYS: {
        ATTENDANCE_DATA: 'hr_portal_attendance_data',
        USER_MAP: 'hr_portal_user_map',
        SETTINGS: 'hr_portal_settings',
        ANALYSIS_CACHE: 'hr_portal_analysis_cache'
    },
    
    // Default Employee Names Map
    DEFAULT_USER_MAP: {
        "1": "Ahmed",
        "2": "Yehia",
        "3": "Seif",
        "4": "Omar",
        "5": "Sasa",
        "6": "Omar (2)", 
        "7": "Mallah",
        "8": "Salma",
        "9": "Ahmed (2)", 
        "10": "Saied",
        "11": "Shadofa",
    },
    
    // Month Names in Arabic
    MONTH_NAMES: [
        "يناير", "فبراير", "مارس", "أبريل", 
        "مايو", "يونيو", "يوليو", "أغسطس", 
        "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ],
    
    // Day Names in Arabic
    DAY_NAMES: [
        "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", 
        "الخميس", "الجمعة", "السبت"
    ],
    
    // Weekend Days (0 = Sunday, 6 = Saturday)
    WEEKEND_DAYS: [5], // الجمعة
    
    // Chart Colors
    CHART_COLORS: {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#6366f1',
        purple: '#8b5cf6',
        pink: '#ec4899',
        gradient: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(99, 102, 241, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(6, 182, 212, 0.8)'
        ]
    },
    
    // Export Settings
    EXPORT: {
        CSV_DELIMITER: ',',
        DATE_FORMAT: 'YYYY-MM-DD',
        TIME_FORMAT: 'HH:mm:ss'
    },
    
    // Notification Duration (ms)
    NOTIFICATION_DURATION: 4000,
    
    // Auto-save interval (ms)
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    
    // Application Info
    APP_INFO: {
        name: 'HR Portal',
        version: '2.0',
        description: 'نظام تحليل حضور احترافي وشامل',
        author: 'HR Team'
    }
};

// Get API URL with Key
CONFIG.getGeminiURL = function() {
    return `${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`;
};

// Validate Configuration
CONFIG.validate = function() {
    if (!this.GEMINI_API_KEY || this.GEMINI_API_KEY === "") {
        console.warn('⚠️ Gemini API Key غير مُعرف. خاصية الذكاء الاصطناعي لن تعمل.');
        return false;
    }
    return true;
};

// Initialize on load
CONFIG.validate();

