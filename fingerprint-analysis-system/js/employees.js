// ===================================
// Employee Management
// ===================================

const EmployeeManager = {
    userMap: {},
    
    // Initialize user map from storage or defaults
    init: function() {
        this.userMap = StorageManager.loadUserMap();
        this.renderEmployeesList();
    },
    
    // Get employee name by ID
    getName: function(id) {
        return this.userMap[id] || id;
    },
    
    // Add or update employee
    addOrUpdate: function(id, name) {
        if (!id || !name) {
            showError('يجب إدخال رقم ID واسم الموظف');
            return false;
        }
        
        id = id.trim();
        name = name.trim();
        
        const isUpdate = this.userMap.hasOwnProperty(id);
        this.userMap[id] = name;
        
        // Save to storage
        StorageManager.saveUserMap(this.userMap);
        
        // Update UI
        this.renderEmployeesList();
        
        if (isUpdate) {
            showSuccess(`تم تحديث الموظف: ${name}`);
        } else {
            showSuccess(`تم إضافة موظف جديد: ${name}`);
        }
        
        // Clear inputs
        document.getElementById('employeeIdInput').value = '';
        document.getElementById('employeeNameInput').value = '';
        
        return true;
    },
    
    // Remove employee
    remove: function(id) {
        if (!this.userMap.hasOwnProperty(id)) {
            showError('الموظف غير موجود');
            return false;
        }
        
        const name = this.userMap[id];
        
        if (confirm(`هل أنت متأكد من حذف الموظف: ${name}؟`)) {
            delete this.userMap[id];
            StorageManager.saveUserMap(this.userMap);
            this.renderEmployeesList();
            showSuccess(`تم حذف الموظف: ${name}`);
            return true;
        }
        
        return false;
    },
    
    // Edit employee
    edit: function(id) {
        if (!this.userMap.hasOwnProperty(id)) {
            showError('الموظف غير موجود');
            return;
        }
        
        document.getElementById('employeeIdInput').value = id;
        document.getElementById('employeeNameInput').value = this.userMap[id];
        
        // Scroll to form
        document.getElementById('employeeIdInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
        showInfo('يمكنك الآن تعديل بيانات الموظف');
    },
    
    // Render employees list
    renderEmployeesList: function() {
        const container = document.getElementById('employeesList');
        if (!container) return;
        
        const sortedEmployees = Object.entries(this.userMap).sort((a, b) => {
            return a[1].localeCompare(b[1], 'ar');
        });
        
        if (sortedEmployees.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-users text-4xl mb-3"></i>
                    <p>لا توجد موظفين مسجلين حالياً</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">';
        
        sortedEmployees.forEach(([id, name]) => {
            html += `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div class="flex items-center space-x-3 space-x-reverse">
                        <div class="bg-indigo-100 text-indigo-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <p class="font-bold text-gray-800">${name}</p>
                            <p class="text-sm text-gray-500">ID: ${id}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2 space-x-reverse">
                        <button onclick="EmployeeManager.edit('${id}')" class="text-blue-600 hover:text-blue-800 p-2" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="EmployeeManager.remove('${id}')" class="text-red-600 hover:text-red-800 p-2" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        html += `
            <div class="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p class="text-sm text-gray-700">
                    <i class="fas fa-info-circle ml-2"></i>
                    <strong>إجمالي الموظفين:</strong> ${sortedEmployees.length}
                </p>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Export employees list
    exportList: function() {
        const data = Object.entries(this.userMap).map(([id, name]) => {
            return { ID: id, Name: name };
        });
        
        const csv = Papa.unparse(data);
        
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `employees_list_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess('تم تصدير قائمة الموظفين بنجاح');
    },
    
    // Import employees from CSV
    importList: function(file) {
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                let imported = 0;
                
                results.data.forEach(row => {
                    if (row.ID && row.Name) {
                        this.userMap[row.ID.trim()] = row.Name.trim();
                        imported++;
                    }
                });
                
                if (imported > 0) {
                    StorageManager.saveUserMap(this.userMap);
                    this.renderEmployeesList();
                    showSuccess(`تم استيراد ${imported} موظف بنجاح`);
                } else {
                    showError('لم يتم العثور على بيانات صالحة في الملف');
                }
            },
            error: (error) => {
                showError(`خطأ في قراءة الملف: ${error.message}`);
            }
        });
    },
    
    // Get all employees
    getAll: function() {
        return { ...this.userMap };
    },
    
    // Get employee count
    getCount: function() {
        return Object.keys(this.userMap).length;
    },
    
    // Search employees
    search: function(query) {
        query = query.toLowerCase().trim();
        const results = {};
        
        Object.entries(this.userMap).forEach(([id, name]) => {
            if (id.toLowerCase().includes(query) || name.toLowerCase().includes(query)) {
                results[id] = name;
            }
        });
        
        return results;
    }
};

// Global functions for HTML onclick
function addOrUpdateEmployee() {
    const id = document.getElementById('employeeIdInput')?.value;
    const name = document.getElementById('employeeNameInput')?.value;
    EmployeeManager.addOrUpdate(id, name);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    EmployeeManager.init();
});

