const { ipcRenderer } = require('electron');

let clients = [];
let editingClientId = null;

// Load clients when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadClients();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add client form
    const addForm = document.getElementById('clientForm');
    addForm.addEventListener('submit', handleAddClient);

    // Navigation
    document.getElementById('backToDashboardBtn').addEventListener('click', () => {
        ipcRenderer.send('navigate-to-dashboard');
    });

    document.getElementById('dashboardLink').addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.send('navigate-to-dashboard');
    });
}

// Load and display clients
async function loadClients() {
    try {
        clients = await ipcRenderer.invoke('clients:get');
        displayClients();
    } catch (error) {
        console.error('Error loading clients:', error);
        showNotification('خطأ في تحميل العملاء', 'error');
    }
}

// Display clients in table
function displayClients() {
    const tbody = document.getElementById('clientsTableBody');

    tbody.innerHTML = '';

    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">لا توجد عملاء</td></tr>';
    } else {
        clients.forEach(client => {
            const row = createClientRow(client);
            tbody.appendChild(row);
        });
    }
}

// Create client row
function createClientRow(client) {
    const row = document.createElement('tr');
    row.setAttribute('data-client-id', client.id);
    row.style.cursor = 'pointer';

    // Format creation date
    const createdDate = new Date(client.createdAt).toLocaleDateString('ar-DZ');

    if (editingClientId === client.id) {
        row.innerHTML = `
            <td>
                <input type="text" id="editName${client.id}" value="${client.name}" class="edit-input">
            </td>
            <td>${createdDate}</td>
            <td>
                <button class="btn btn-save" onclick="saveClient(${client.id})">حفظ</button>
                <button class="btn btn-cancel" onclick="cancelEdit()">إلغاء</button>
            </td>
        `;
        row.style.cursor = 'default';
    } else {
        row.innerHTML = `
            <td class="client-name">${client.name}</td>
            <td>${createdDate}</td>
            <td>
                <button class="btn btn-edit" onclick="editClient(${client.id}); event.stopPropagation();">تعديل</button>
                <button class="btn btn-delete" onclick="deleteClient(${client.id}); event.stopPropagation();">حذف</button>
            </td>
        `;
        
        // Add click event to navigate to client dashboard
        row.addEventListener('click', () => {
            navigateToClientDashboard(client.id);
        });
    }

    return row;
}

// Navigate to client dashboard
function navigateToClientDashboard(clientId) {
    ipcRenderer.send('navigate-to-client-dashboard', clientId);
}

// Handle add client form submission
async function handleAddClient(e) {
    e.preventDefault();
    
    const name = document.getElementById('clientName').value.trim();

    if (!name) {
        showNotification('يرجى إدخال اسم العميل', 'error');
        return;
    }

    try {
        const result = await ipcRenderer.invoke('clients:add', { name });
        
        if (result.success) {
            showNotification('تم إضافة العميل بنجاح', 'success');
            document.getElementById('clientForm').reset();
            await loadClients();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Error adding client:', error);
        showNotification('خطأ في إضافة العميل', 'error');
    }
}

// Edit client
function editClient(clientId) {
    editingClientId = clientId;
    displayClients();
    
    // Focus on name input
    setTimeout(() => {
        document.getElementById(`editName${clientId}`).focus();
    }, 100);
}

// Save edited client
async function saveClient(clientId) {
    const name = document.getElementById(`editName${clientId}`).value.trim();

    if (!name) {
        showNotification('يرجى إدخال اسم العميل', 'error');
        return;
    }

    try {
        const result = await ipcRenderer.invoke('clients:update', clientId, { name });
        
        if (result.success) {
            showNotification('تم تحديث العميل بنجاح', 'success');
            editingClientId = null;
            await loadClients();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Error updating client:', error);
        showNotification('خطأ في تحديث العميل', 'error');
    }
}

// Cancel edit
function cancelEdit() {
    editingClientId = null;
    displayClients();
}

// Delete client
async function deleteClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    
    if (!confirm(`هل أنت متأكد أنك تريد حذف العميل "${client.name}"؟`)) {
        return;
    }

    try {
        const result = await ipcRenderer.invoke('clients:delete', clientId);
        
        if (result.success) {
            showNotification('تم حذف العميل بنجاح', 'success');
            await loadClients();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        showNotification('خطأ في حذف العميل', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Make functions global
window.editClient = editClient;
window.saveClient = saveClient;
window.cancelEdit = cancelEdit;
window.deleteClient = deleteClient;