const { ipcRenderer } = require('electron');

let availableYears = [];
let selectedYear = null;

// Load available years when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadAvailableYears();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('createYearBtn').addEventListener('click', handleCreateYear);
    document.getElementById('continueBtn').addEventListener('click', handleContinue);
    
    // Enter key in input
    document.getElementById('newYearInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCreateYear();
        }
    });
}

// Load available years
async function loadAvailableYears() {
    try {
        const years = await ipcRenderer.invoke('years:get');
        availableYears = years;
        displayAvailableYears();
    } catch (error) {
        console.error('Error loading years:', error);
    }
}

// Display available years
function displayAvailableYears() {
    const yearsGrid = document.getElementById('yearsGrid');
    const existingYearsSection = document.getElementById('existingYearsSection');
    
    yearsGrid.innerHTML = '';
    
    if (availableYears.length === 0) {
        existingYearsSection.style.display = 'none';
        return;
    }
    
    existingYearsSection.style.display = 'block';
    
    availableYears.forEach(year => {
        const yearCard = document.createElement('div');
        yearCard.className = 'year-card';
        yearCard.textContent = year;
        
        yearCard.addEventListener('click', () => {
            selectYear(year);
        });
        
        yearsGrid.appendChild(yearCard);
    });
}

// Select a year
function selectYear(year) {
    selectedYear = year;
    
    // Update UI
    document.querySelectorAll('.year-card').forEach(card => {
        card.classList.remove('current');
    });
    
    event.target.classList.add('current');
    document.getElementById('continueBtn').style.display = 'inline-block';
    
    // Clear new year input
    document.getElementById('newYearInput').value = '';
}

// Handle create new year
async function handleCreateYear() {
    const yearInput = document.getElementById('newYearInput');
    const yearValue = yearInput.value.trim();
    
    if (!yearValue) {
        showNotification('يرجى إدخال السنة الدراسية', 'error');
        return;
    }
    
    // Validate year format (should be like 2024/2025)
    const yearPattern = /^\d{4}\/\d{4}$/;
    if (!yearPattern.test(yearValue)) {
        showNotification('يرجى إدخال السنة بالصيغة الصحيحة (مثال: 2024/2025)', 'error');
        return;
    }
    
    // Check if year already exists
    if (availableYears.includes(yearValue)) {
        showNotification('هذه السنة الدراسية موجودة بالفعل', 'error');
        return;
    }
    
    try {
        const result = await ipcRenderer.invoke('years:create', yearValue);
        
        if (result.success) {
            showNotification('تم إنشاء السنة الدراسية بنجاح', 'success');
            selectedYear = yearValue;
            await loadAvailableYears();
            
            // Automatically continue with new year
            setTimeout(() => {
                handleContinue();
            }, 1500);
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Error creating year:', error);
        showNotification('خطأ في إنشاء السنة الدراسية', 'error');
    }
}

// Handle continue with selected year
async function handleContinue() {
    if (!selectedYear) {
        showNotification('يرجى اختيار سنة دراسية', 'error');
        return;
    }
    
    try {
        // Set current year in the main process
        await ipcRenderer.invoke('years:set-current', selectedYear);
        
        // Navigate to dashboard
        ipcRenderer.send('navigate-to-dashboard');
    } catch (error) {
        console.error('Error setting current year:', error);
        showNotification('خطأ في تحديد السنة الدراسية', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}