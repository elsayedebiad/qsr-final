// ===================================
// Notification System
// ===================================

const NotificationManager = {
    container: null,
    
    init: function() {
        this.container = document.getElementById('notificationContainer');
        if (!this.container) {
            console.error('Notification container not found');
        }
    },
    
    show: function(message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
        if (!this.container) this.init();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = this.getIcon(type);
        
        notification.innerHTML = `
            <i class="${icon} text-xl"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.remove()" class="text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.container.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100px)';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
        
        return notification;
    },
    
    success: function(message, duration) {
        return this.show(message, 'success', duration);
    },
    
    error: function(message, duration) {
        return this.show(message, 'error', duration);
    },
    
    info: function(message, duration) {
        return this.show(message, 'info', duration);
    },
    
    warning: function(message, duration) {
        return this.show(message, 'warning', duration);
    },
    
    getIcon: function(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };
        return icons[type] || icons.info;
    },
    
    clear: function() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    NotificationManager.init();
});

// Convenience functions
function showNotification(message, type, duration) {
    return NotificationManager.show(message, type, duration);
}

function showSuccess(message) {
    return NotificationManager.success(message);
}

function showError(message) {
    return NotificationManager.error(message);
}

function showInfo(message) {
    return NotificationManager.info(message);
}

function showWarning(message) {
    return NotificationManager.warning(message);
}

