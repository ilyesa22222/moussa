const { ipcRenderer } = require('electron');

let currentClient = null;
let clientNotes = [];

// Load client dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadClientData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('backToClientsBtn').addEventListener('click', () => {
        ipcRenderer.send('navigate-to-clients');
    });

    document.getElementById('dashboardLink').addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.send('navigate-to-dashboard');
    });

    document.getElementById('clientsLink').addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.send('navigate-to-clients');
    });
}

// Load client data from URL parameters or localStorage
async function loadClientData() {
    try {
        console.log('Loading client data...');
        
        // Get client ID from URL parameters or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        let clientId = urlParams.get('clientId');
        
        if (!clientId) {
            // Try to get from localStorage as fallback
            clientId = localStorage.getItem('currentClientId');
            console.log('Client ID from localStorage:', clientId);
        }

        if (!clientId) {
            console.error('No client ID provided');
            showNotification('لم يتم العثور على معرف العميل', 'error');
            // Navigate back to clients page after a delay
            setTimeout(() => {
                ipcRenderer.send('navigate-to-clients');
            }, 2000);
            return;
        }

        console.log('Loading data for client ID:', clientId);

        // Load client data
        const clients = await ipcRenderer.invoke('clients:get');
        console.log('All clients:', clients);
        
        currentClient = clients.find(c => c.id == clientId);

        if (!currentClient) {
            console.error('Client not found:', clientId);
            showNotification('لم يتم العثور على العميل', 'error');
            // Navigate back to clients page after a delay
            setTimeout(() => {
                ipcRenderer.send('navigate-to-clients');
            }, 2000);
            return;
        }

        console.log('Found client:', currentClient);

        // Load delivery notes for this client
        const allNotes = await ipcRenderer.invoke('deliveryNotes:get');
        console.log('All delivery notes:', allNotes);
        
        clientNotes = allNotes.filter(note => note.clientId == clientId);
        console.log('Client delivery notes:', clientNotes);

        // Display client information
        displayClientInfo();
        displayClientStats();
        displayDeliveryNotes();

    } catch (error) {
        console.error('Error loading client data:', error);
        showNotification('خطأ في تحميل بيانات العميل', 'error');
        // Navigate back to clients page after a delay
        setTimeout(() => {
            ipcRenderer.send('navigate-to-clients');
        }, 2000);
    }
}

// Display client information
function displayClientInfo() {
    document.getElementById('clientName').textContent = currentClient.name;
    
    // Format creation date
    const createdDate = new Date(currentClient.createdAt).toLocaleDateString('ar-DZ');
    document.getElementById('clientInfo').textContent = `تم إنشاؤه في ${createdDate}`;
}

// Display client statistics
function displayClientStats() {
    const totalNotes = clientNotes.length;
    const totalAmount = clientNotes.reduce((sum, note) => sum + (note.overallTotal || 0), 0);
    
    // Get last note date
    let lastNoteDate = '-';
    if (clientNotes.length > 0) {
        const sortedNotes = clientNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        lastNoteDate = new Date(sortedNotes[0].date).toLocaleDateString('ar-DZ');
    }

    document.getElementById('totalNotes').textContent = totalNotes;
    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2) + ' د.ج';
    document.getElementById('lastNoteDate').textContent = lastNoteDate;
}

// Display delivery notes
function displayDeliveryNotes() {
    const notesGrid = document.getElementById('notesGrid');
    const emptyState = document.getElementById('emptyState');

    notesGrid.innerHTML = '';

    if (clientNotes.length === 0) {
        emptyState.style.display = 'block';
        notesGrid.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    notesGrid.style.display = 'grid';

    // Sort notes by date (newest first)
    const sortedNotes = clientNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sortedNotes.forEach(note => {
        const noteCard = createNoteCard(note);
        notesGrid.appendChild(noteCard);
    });
}

// Create a delivery note card
function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.setAttribute('data-note-id', note.id);

    // Format date
    const noteDate = new Date(note.date).toLocaleDateString('ar-DZ');
    
    // Get items summary
    const itemsCount = note.items ? note.items.length : 0;
    const itemsSummary = itemsCount > 0 
        ? `${itemsCount} ${itemsCount === 1 ? 'منتج' : 'منتجات'}`
        : 'بدون منتجات';

    card.innerHTML = `
        <div class="note-id">رقم الوصل: ${note.id}</div>
        <div class="note-date">${noteDate}</div>
        <div class="note-total">${(note.overallTotal || 0).toFixed(2)} د.ج</div>
        <div class="note-items">${itemsSummary}</div>
        <div class="note-actions">
            <button class="btn btn-preview" onclick="previewNote('${note.id}')">معاينة</button>
            <button class="btn btn-print" onclick="printNote('${note.id}')">طباعة</button>
        </div>
    `;

    return card;
}

// Preview delivery note
async function previewNote(noteId) {
    try {
        const note = clientNotes.find(n => n.id === noteId);
        if (!note) {
            console.error('Note not found:', noteId);
            return;
        }

        // Use the preview functionality from main.js
        const result = await ipcRenderer.invoke('preview-pdf', note);
        
        if (!result.success) {
            console.error('Error previewing note:', result.error);
            showNotification('خطأ في معاينة الوصل', 'error');
        }
    } catch (error) {
        console.error('Error previewing note:', error);
        showNotification('خطأ في معاينة الوصل', 'error');
    }
}

// Print delivery note
async function printNote(noteId) {
    try {
        const note = clientNotes.find(n => n.id === noteId);
        if (!note) {
            console.error('Note not found:', noteId);
            return;
        }

        // Use the print functionality from main.js
        const result = await ipcRenderer.invoke('print-note', note);
        
        if (result.success) {
            showNotification('تم إرسال الوصل للطباعة', 'success');
        } else {
            console.error('Error printing note:', result.error);
            showNotification('خطأ في طباعة الوصل', 'error');
        }
    } catch (error) {
        console.error('Error printing note:', error);
        showNotification('خطأ في طباعة الوصل', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#2c3e50'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);