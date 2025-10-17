const { ipcRenderer } = require('electron');

// Global variables
let clients = [];
let products = [];
let selectedClient = null;
let selectedProducts = [];
let totalAmount = 0;
let currentProductForQuantity = null;

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadClients();
    loadProducts();
    setupEventListeners();
    setCurrentDate();
});

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('backToDashboardBtn').addEventListener('click', () => {
        ipcRenderer.send('navigate-to-dashboard');
    });

    // Add new client
    document.getElementById('addClientBtn').addEventListener('click', handleAddClient);

    // Modal buttons
    document.getElementById('confirmQuantityBtn').addEventListener('click', handleConfirmQuantity);
    document.getElementById('cancelQuantityBtn').addEventListener('click', hideQuantityModal);

    // Continue delivery modal buttons
    document.getElementById('continueDeliveryYesBtn').addEventListener('click', handleContinueDeliveryYes);
    document.getElementById('continueDeliveryNoBtn').addEventListener('click', handleContinueDeliveryNo);

    // Action buttons
    document.getElementById('printBtn').addEventListener('click', handlePrint);
    document.getElementById('previewPdfBtn').addEventListener('click', handlePreviewPdf);
    document.getElementById('downloadPdfBtn').addEventListener('click', handleDownloadPdf);
    document.getElementById('printPdfBtn').addEventListener('click', handlePrintPdf);

    // Close modal when clicking outside
    document.getElementById('quantityModal').addEventListener('click', (e) => {
        if (e.target.id === 'quantityModal') {
            hideQuantityModal();
        }
    });

    document.getElementById('continueDeliveryModal').addEventListener('click', (e) => {
        if (e.target.id === 'continueDeliveryModal') {
            hideContinueDeliveryModal();
        }
    });

    // Enter key in quantity modal
    document.getElementById('modalQuantity').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleConfirmQuantity();
        }
    });
}

// Set current date
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('deliveryDate').value = today;
}

// Load clients from database
async function loadClients() {
    try {
        clients = await ipcRenderer.invoke('clients:get');
        populateClientsList();
    } catch (error) {
        console.error('Error loading clients:', error);
        showNotification('خطأ في تحميل العملاء', 'error');
    }
}

// Load products from database
async function loadProducts() {
    try {
        products = await ipcRenderer.invoke('products:get');
        populateProductsList();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('خطأ في تحميل المنتجات', 'error');
    }
}

// Populate clients list
function populateClientsList() {
    console.log('populateClientsList called');
    const clientsList = document.getElementById('clientsList');
    clientsList.innerHTML = '';
    
    if (clients.length === 0) {
        clientsList.innerHTML = '<div class="empty-state">لا توجد عملاء مسجلين</div>';
        return;
    }
    
    console.log('Setting up client items, clients:', clients);
    
    clients.forEach(client => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = client.name;
        item.onclick = () => {
            console.log('Client clicked:', client.name);
            selectClient(client, item);
        };
        clientsList.appendChild(item);
        console.log('Added client item:', client.name);
    });
    
    console.log('Finished setting up client items');
}

// Populate products list
function populateProductsList() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';
    
    if (products.length === 0) {
        productsList.innerHTML = '<div class="empty-state">لا توجد منتجات مسجلة</div>';
        return;
    }
    
    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${product.name}</span>
                <span style="color: #6c757d; font-size: 0.9rem;">${product.price.toFixed(2)} د.ج</span>
            </div>
        `;
        item.onclick = () => selectProduct(product);
        productsList.appendChild(item);
    });
}

// Select client
async function selectClient(client, element) {
    try {
        console.log('selectClient called for client:', client);
        
        // Check if client has previous delivery notes
        const deliveryNotes = await ipcRenderer.invoke('deliveryNotes:get');
        console.log('All delivery notes:', deliveryNotes);
        
        const clientDeliveryNotes = deliveryNotes.filter(note => note.clientId === client.id);
        console.log('Client delivery notes:', clientDeliveryNotes);
        console.log('Client delivery notes count:', clientDeliveryNotes.length);
        
        if (clientDeliveryNotes.length > 0) {
            // Get the most recent delivery note
            const lastDeliveryNote = clientDeliveryNotes.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            
            console.log('Last delivery note:', lastDeliveryNote);
            console.log('Showing continue delivery modal...');
            
            // Show continue delivery modal
            showContinueDeliveryModal(client, element, lastDeliveryNote);
        } else {
            console.log('No previous delivery notes, proceeding normally');
            // No previous delivery notes, proceed normally
            completeClientSelection(client, element);
        }
    } catch (error) {
        console.error('Error checking delivery notes:', error);
        // If error, proceed normally
        completeClientSelection(client, element);
    }
}

// Complete client selection (used for both new and continuation)
function completeClientSelection(client, element) {
    selectedClient = client;
    
    // Update UI
    document.querySelectorAll('#clientsList .list-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    
    showNotification(`تم اختيار العميل: ${client.name}`, 'success');
}

// Select product and show quantity modal
function selectProduct(product) {
    currentProductForQuantity = product;
    showQuantityModal(product);
}

// Show quantity modal
function showQuantityModal(product) {
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalQuantity').value = '1';
    document.getElementById('quantityModal').classList.add('show');
    document.getElementById('modalQuantity').focus();
}

// Hide quantity modal
function hideQuantityModal() {
    document.getElementById('quantityModal').classList.remove('show');
    currentProductForQuantity = null;
    // Clear editing state
    window.editingProductIndex = undefined;
}

// Show continue delivery modal
function showContinueDeliveryModal(client, element, lastDeliveryNote) {
    console.log('showContinueDeliveryModal called with:', { client, element, lastDeliveryNote });
    
    // Store the client and element for later use
    window.pendingClientSelection = { client, element };
    
    // Format the date
    const deliveryDate = new Date(lastDeliveryNote.date);
    const formattedDate = deliveryDate.toLocaleDateString('ar-DZ');
    
    console.log('Setting modal data:', {
        date: formattedDate,
        itemsCount: lastDeliveryNote.items.length,
        total: lastDeliveryNote.overallTotal
    });
    
    // Fill modal information
    document.getElementById('lastDeliveryDate').textContent = formattedDate;
    document.getElementById('lastDeliveryItemsCount').textContent = lastDeliveryNote.items.length;
    document.getElementById('lastDeliveryTotal').textContent = lastDeliveryNote.overallTotal.toFixed(2);
    
    console.log('About to show modal...');
    
    // Show modal
    const modal = document.getElementById('continueDeliveryModal');
    console.log('Modal element:', modal);
    modal.classList.add('show');
    
    console.log('Modal should now be visible. Modal classes:', modal.classList);
}

// Hide continue delivery modal
function hideContinueDeliveryModal() {
    document.getElementById('continueDeliveryModal').classList.remove('show');
    window.pendingClientSelection = null;
}

// Handle continue delivery - Yes
async function handleContinueDeliveryYes() {
    try {
        const { client, element } = window.pendingClientSelection;
        
        // Complete client selection first
        completeClientSelection(client, element);
        
        // Get the last delivery note for this client
        const deliveryNotes = await ipcRenderer.invoke('deliveryNotes:get');
        const clientDeliveryNotes = deliveryNotes.filter(note => note.clientId === client.id);
        const lastDeliveryNote = clientDeliveryNotes.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        
        // Load products from last delivery note
        selectedProducts = lastDeliveryNote.items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total
        }));
        
        // Update the date to today
        setCurrentDate();
        
        // Update display
        updateSelectedProductsDisplay();
        calculateTotal();
        
        hideContinueDeliveryModal();
        showNotification(`تم تحميل المنتجات من آخر وصل تسليم (${lastDeliveryNote.items.length} منتج)`, 'success');
        
    } catch (error) {
        console.error('Error loading last delivery note:', error);
        showNotification('خطأ في تحميل آخر وصل تسليم', 'error');
        hideContinueDeliveryModal();
    }
}

// Handle continue delivery - No
function handleContinueDeliveryNo() {
    const { client, element } = window.pendingClientSelection;
    
    // Complete client selection normally (start fresh)
    completeClientSelection(client, element);
    
    hideContinueDeliveryModal();
}

// Handle confirm quantity
function handleConfirmQuantity() {
    const quantity = parseInt(document.getElementById('modalQuantity').value);
    
    if (!quantity || quantity < 1) {
        showNotification('يرجى إدخال كمية صحيحة', 'error');
        return;
    }
    
    // Check if we're editing an existing product
    if (window.editingProductIndex !== undefined) {
        // Edit existing product
        const product = selectedProducts[window.editingProductIndex];
        product.quantity = quantity;
        product.total = product.quantity * product.price;
        
        updateSelectedProductsDisplay();
        calculateTotal();
        showNotification('تم تحديث كمية المنتج', 'success');
        
        // Clear editing state
        window.editingProductIndex = undefined;
    } else {
        // Add new product
        if (!currentProductForQuantity) {
            showNotification('خطأ في المنتج المحدد', 'error');
            return;
        }
        
        addProductToOrder(currentProductForQuantity, quantity);
    }
    
    hideQuantityModal();
}

// Add product to order
function addProductToOrder(product, quantity) {
    const existingIndex = selectedProducts.findIndex(p => p.productId === product.id);
    
    if (existingIndex >= 0) {
        // Update existing product quantity
        selectedProducts[existingIndex].quantity += quantity;
        selectedProducts[existingIndex].total = selectedProducts[existingIndex].quantity * selectedProducts[existingIndex].price;
    } else {
        // Add new product
        selectedProducts.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            total: product.price * quantity
        });
    }
    
    updateSelectedProductsDisplay();
    calculateTotal();
    showNotification('تم إضافة المنتج', 'success');
}

// Update selected products display
function updateSelectedProductsDisplay() {
    const container = document.getElementById('selectedProductsContainer');
    
    if (selectedProducts.length === 0) {
        container.innerHTML = '<div class="empty-state">لم يتم اختيار أي منتجات بعد</div>';
        return;
    }
    
    let tableHTML = `
        <table class="products-table">
            <thead>
                <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>المجموع</th>
                    <th>العمليات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    selectedProducts.forEach((product, index) => {
        tableHTML += `
            <tr>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${product.price.toFixed(2)} د.ج</td>
                <td>${product.total.toFixed(2)} د.ج</td>
                <td>
                    <button class="edit-btn" onclick="editProductQuantity(${index})" style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 4px; margin-left: 5px; cursor: pointer;">تعديل</button>
                    <button class="remove-btn" onclick="removeProduct(${index})" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">حذف</button>
                </td>
            </tr>
        `;
    });
    
    // Add overall total row
    const overallTotal = selectedProducts.reduce((sum, product) => sum + product.total, 0);
    tableHTML += `
        <tr class="total-row">
            <td colspan="3" style="text-align: right;">المجموع الإجمالي:</td>
            <td>${overallTotal.toFixed(2)} د.ج</td>
            <td></td>
        </tr>
    `;
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

// Remove product from order
function removeProduct(index) {
    selectedProducts.splice(index, 1);
    updateSelectedProductsDisplay();
    calculateTotal();
    showNotification('تم حذف المنتج', 'success');
}

// Edit product quantity
function editProductQuantity(index) {
    const product = selectedProducts[index];
    
    // Show quantity modal with current quantity
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalQuantity').value = product.quantity;
    document.getElementById('quantityModal').classList.add('show');
    
    // Store the product index for editing
    window.editingProductIndex = index;
    
    // Focus on quantity input
    setTimeout(() => {
        document.getElementById('modalQuantity').focus();
        document.getElementById('modalQuantity').select();
    }, 100);
}

// Calculate total amount
function calculateTotal() {
    totalAmount = selectedProducts.reduce((sum, product) => sum + product.total, 0);
    
    const totalElement = document.getElementById('totalAmount');
    const totalSection = document.getElementById('totalSection');
    
    if (totalAmount > 0) {
        totalElement.textContent = `${totalAmount.toFixed(2)} د.ج`;
        totalSection.style.display = 'block';
    } else {
        totalSection.style.display = 'none';
    }
}

// Handle adding new client
async function handleAddClient() {
    const newClientName = document.getElementById('newClientName').value.trim();
    
    if (!newClientName) {
        showNotification('يرجى إدخال اسم العميل', 'error');
        return;
    }
    
    try {
        const result = await ipcRenderer.invoke('clients:add', { name: newClientName });
        
        if (result.success) {
            clients.push(result.client);
            populateClientsList();
            document.getElementById('newClientName').value = '';
            showNotification('تم إضافة العميل بنجاح', 'success');
        } else {
            showNotification(result.message || 'خطأ في إضافة العميل', 'error');
        }
    } catch (error) {
        console.error('Error adding client:', error);
        showNotification('خطأ في إضافة العميل', 'error');
    }
}

// Validate form data
function validateForm() {
    if (!selectedClient) {
        showNotification('يرجى اختيار عميل', 'error');
        return false;
    }
    
    const deliveryDate = document.getElementById('deliveryDate').value;
    if (!deliveryDate) {
        showNotification('يرجى تحديد تاريخ الوصل', 'error');
        return false;
    }
    
    if (selectedProducts.length === 0) {
        showNotification('يرجى إضافة منتج واحد على الأقل', 'error');
        return false;
    }
    
    return true;
}

// Get delivery note data
function getDeliveryNoteData() {
    const deliveryDate = document.getElementById('deliveryDate').value;
    
    return {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        date: deliveryDate,
        items: selectedProducts
    };
}

// Handle direct print
async function handlePrint() {
    if (!validateForm()) return;
    
    const deliveryNoteData = getDeliveryNoteData();
    
    try {
        // Print delivery note (this will also save it to database)
        const printResult = await ipcRenderer.invoke('print-note', deliveryNoteData);
        
        if (printResult.success) {
            showNotification('تم إنشاء وطباعة وصل التسليم بنجاح', 'success');
            
            // Navigate back to dashboard after successful print
            setTimeout(() => {
                ipcRenderer.send('navigate-to-dashboard');
            }, 2000);
        } else {
            showNotification(printResult.error || 'خطأ في الطباعة', 'error');
        }
    } catch (error) {
        console.error('Error in print:', error);
        showNotification('خطأ في الطباعة', 'error');
    }
}

// Handle PDF preview
async function handlePreviewPdf() {
    if (!validateForm()) return;
    
    const deliveryNoteData = getDeliveryNoteData();
    
    try {
        const saveResult = await ipcRenderer.invoke('deliveryNotes:add', deliveryNoteData);
        
        if (saveResult.success) {
            const previewResult = await ipcRenderer.invoke('preview-pdf', saveResult.deliveryNote);
            
            if (previewResult.success) {
                showNotification('تم فتح معاينة PDF', 'success');
            } else {
                showNotification('خطأ في معاينة PDF', 'error');
            }
        } else {
            showNotification(saveResult.message || 'خطأ في حفظ الوصل', 'error');
        }
    } catch (error) {
        console.error('Error in PDF preview:', error);
        showNotification('خطأ في معاينة PDF', 'error');
    }
}

// Handle PDF download
async function handleDownloadPdf() {
    if (!validateForm()) return;
    
    const deliveryNoteData = getDeliveryNoteData();
    
    try {
        const saveResult = await ipcRenderer.invoke('deliveryNotes:add', deliveryNoteData);
        
        if (saveResult.success) {
            const downloadResult = await ipcRenderer.invoke('save-pdf', saveResult.deliveryNote);
            
            if (downloadResult.success) {
                showNotification('تم حفظ ملف PDF بنجاح', 'success');
            } else {
                showNotification('خطأ في حفظ ملف PDF', 'error');
            }
        } else {
            showNotification(saveResult.message || 'خطأ في حفظ الوصل', 'error');
        }
    } catch (error) {
        console.error('Error in PDF download:', error);
        showNotification('خطأ في تحميل PDF', 'error');
    }
}

// Handle PDF print
async function handlePrintPdf() {
    if (!validateForm()) return;
    
    const deliveryNoteData = getDeliveryNoteData();
    
    try {
        const saveResult = await ipcRenderer.invoke('deliveryNotes:add', deliveryNoteData);
        
        if (saveResult.success) {
            const printResult = await ipcRenderer.invoke('print-pdf', saveResult.deliveryNote);
            
            if (printResult.success) {
                showNotification('تم طباعة PDF بنجاح', 'success');
            } else {
                showNotification('خطأ في طباعة PDF', 'error');
            }
        } else {
            showNotification(saveResult.message || 'خطأ في حفظ الوصل', 'error');
        }
    } catch (error) {
        console.error('Error in PDF print:', error);
        showNotification('خطأ في طباعة PDF', 'error');
    }
}

// Reset form
function resetForm() {
    selectedClient = null;
    selectedProducts = [];
    totalAmount = 0;
    
    // Clear selections
    document.querySelectorAll('#clientsList .list-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    document.getElementById('newClientName').value = '';
    setCurrentDate();
    updateSelectedProductsDisplay();
    calculateTotal();
    
    showNotification('تم إعادة تعيين النموذج', 'success');
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}