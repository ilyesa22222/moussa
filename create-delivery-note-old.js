const { ipcRenderer } = require('electron');

let currentStep = 1;
let clients = [];
let products = [];
let selectedProducts = [];
let totalAmount = 0;
let selectedClient = null;
let selectedProduct = null;

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadClients();
    loadProducts();
    setupEventListeners();
    setCurrentDate();
    updateLivePreview();
});

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('backToDashboardBtn').addEventListener('click', () => {
        ipcRenderer.send('navigate-to-dashboard');
    });

    document.getElementById('dashboardLink').addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.send('navigate-to-dashboard');
    });

    // Add new client
    document.getElementById('addClientBtn').addEventListener('click', handleAddClient);

    // Add product
    document.getElementById('addProductBtn').addEventListener('click', handleAddProduct);

    // Navigation buttons
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (validateCurrentStep()) {
            if (currentStep < 3) {
                goToStep(currentStep + 1);
            }
        }
    });

    // Print button
    document.getElementById('printBtn').addEventListener('click', handlePrint);

    // PDF buttons
    document.getElementById('previewPdfBtn').addEventListener('click', handlePreviewPdf);
    document.getElementById('downloadPdfBtn').addEventListener('click', handleDownloadPdf);
    document.getElementById('printPdfBtn').addEventListener('click', handlePrintPdf);
    
    // Update preview when date changes
    document.getElementById('deliveryDate').addEventListener('change', updateLivePreview);
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
        populateClientSelect();
    } catch (error) {
        console.error('Error loading clients:', error);
        showNotification('خطأ في تحميل العملاء', 'error');
    }
}

// Load products from database
async function loadProducts() {
    try {
        products = await ipcRenderer.invoke('products:get');
        populateProductSelect();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('خطأ في تحميل المنتجات', 'error');
    }
}

// Populate clients list
function populateClientSelect() {
    const clientsList = document.getElementById('clientsList');
    clientsList.innerHTML = '';
    
    if (clients.length === 0) {
        clientsList.innerHTML = '<div style="padding: 1rem; text-align: center; color: rgba(255,255,255,0.5);">لا توجد عملاء</div>';
        return;
    }
    
    clients.forEach(client => {
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.textContent = client.name;
        item.addEventListener('click', () => selectClient(client));
        clientsList.appendChild(item);
    });
}

// Populate products list
function populateProductSelect() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';
    
    if (products.length === 0) {
        productsList.innerHTML = '<div style="padding: 1rem; text-align: center; color: rgba(255,255,255,0.5);">لا توجد منتجات</div>';
        return;
    }
    
    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.innerHTML = `<strong>${product.name}</strong><br><small>${product.price.toFixed(2)} د.ج</small>`;
        item.addEventListener('click', () => selectProduct(product));
        productsList.appendChild(item);
    });
}

// Select client
function selectClient(client) {
    selectedClient = client;
    
    // Update UI
    document.querySelectorAll('#clientsList .selection-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    updateLivePreview();
}

// Select product
function selectProduct(product) {
    selectedProduct = product;
    
    // Update UI
    document.querySelectorAll('#productsList .selection-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Focus on quantity input
    document.getElementById('productQuantity').focus();
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
            showNotification('تم إضافة العميل بنجاح', 'success');
            document.getElementById('newClientName').value = '';
            await loadClients();
            
            // Auto-select the newly added client
            selectClient(result.client);
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Error adding client:', error);
        showNotification('خطأ في إضافة العميل', 'error');
    }
}

// Handle adding product to delivery note
function handleAddProduct() {
    const quantityInput = document.getElementById('productQuantity');
    const quantity = parseFloat(quantityInput.value);
    
    if (!selectedProduct) {
        showNotification('يرجى اختيار منتج', 'error');
        return;
    }
    
    if (!quantity || quantity <= 0) {
        showNotification('يرجى إدخال كمية صحيحة', 'error');
        return;
    }
    
    const existingIndex = selectedProducts.findIndex(p => p.productId === selectedProduct.id);
    
    if (existingIndex >= 0) {
        // Update existing product quantity
        selectedProducts[existingIndex].quantity += quantity;
        selectedProducts[existingIndex].total = selectedProducts[existingIndex].quantity * selectedProducts[existingIndex].price;
    } else {
        // Add new product
        selectedProducts.push({
            productId: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            quantity: quantity,
            total: selectedProduct.price * quantity
        });
    }
    
    // Clear inputs
    quantityInput.value = '';
    selectedProduct = null;
    
    // Clear selection
    document.querySelectorAll('#productsList .selection-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Update display
    updateProductsTable();
    calculateTotal();
    updateLivePreview();
    
    showNotification('تم إضافة المنتج', 'success');
}

// Update products table display
function updateProductsTable() {
    const table = document.getElementById('productsTable');
    const tbody = document.getElementById('productsTableBody');
    const emptyMessage = document.getElementById('emptyProductsMessage');
    
    tbody.innerHTML = '';
    
    if (selectedProducts.length === 0) {
        table.style.display = 'none';
        emptyMessage.style.display = 'block';
    } else {
        table.style.display = 'table';
        emptyMessage.style.display = 'none';
        
        selectedProducts.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.price.toFixed(2)} د.ج</td>
                <td>${product.quantity}</td>
                <td>${product.total.toFixed(2)} د.ج</td>
                <td><button class="remove-btn" onclick="removeProduct(${index})">حذف</button></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Remove product from selection
function removeProduct(index) {
    selectedProducts.splice(index, 1);
    updateProductsTable();
    calculateTotal();
    showNotification('تم حذف المنتج', 'info');
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
    
    updateLivePreview();
}

// Update live preview
function updateLivePreview() {
    const previewContainer = document.getElementById('livePreviewContainer');
    if (!previewContainer) return;
    
    const clientName = selectedClient ? selectedClient.name : 'اختر زبون';
    const deliveryDate = new Date().toLocaleDateString('ar-DZ');
    
    let productsRows = '';
    selectedProducts.forEach(product => {
        productsRows += `
            <tr>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${(product.price).toFixed(2)} د.ج</td>
                <td>${(product.total).toFixed(2)} د.ج</td>
            </tr>
        `;
    });
    
    previewContainer.innerHTML = `
        <div style="
            width: 210mm;
            height: 148mm;
            padding: 15px;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #2c3e50;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            direction: rtl;
            transform: scale(0.7);
            transform-origin: top right;
        ">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #c9302c; margin: 0; font-size: 24px;">بون التسليم</h2>
                <div style="color: #666; margin-top: 5px; font-size: 12px;">Bon de Livraison</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="width: 48%;">
                    <div style="
                        border: 2px solid #2c3e50;
                        padding: 8px;
                        border-radius: 5px;
                        min-height: 40px;
                        background: #f8f9fa;
                    ">
                    </div>
                </div>
                <div style="width: 48%;">
                    <div style="
                        border: 2px solid #2c3e50;
                        padding: 8px;
                        border-radius: 5px;
                        text-align: center;
                        background: #fff3cd;
                        font-size: 14px;
                        font-weight: bold;
                    ">
                        الزبون: ${clientName}
                    </div>
                </div>
            </div>
            
            <table style="
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 12px;
            ">
                <thead>
                    <tr style="background: #2c3e50; color: white;">
                        <th style="border: 1px solid #2c3e50; padding: 8px; text-align: center;">المنتج</th>
                        <th style="border: 1px solid #2c3e50; padding: 8px; text-align: center;">الكمية</th>
                        <th style="border: 1px solid #2c3e50; padding: 8px; text-align: center;">السعر</th>
                        <th style="border: 1px solid #2c3e50; padding: 8px; text-align: center;">المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsRows}
                </tbody>
            </table>
            
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 30px;
                padding-top: 15px;
                border-top: 2px solid #2c3e50;
            ">
                <div style="font-weight: bold; font-size: 16px;">
                    المجموع الإجمالي: ${totalAmount.toFixed(2)} د.ج
                </div>
                <div style="color: #666; font-size: 12px;">
                    التاريخ: ${deliveryDate}
                </div>
            </div>
        </div>
    `;
}

// Validate current step
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            const deliveryDate = document.getElementById('deliveryDate').value;
            
            if (!selectedClient) {
                showNotification('يرجى اختيار عميل', 'error');
                return false;
            }
            
            if (!deliveryDate) {
                showNotification('يرجى تحديد تاريخ الوصل', 'error');
                return false;
            }
            
            return true;
            
        case 2:
            if (selectedProducts.length === 0) {
                showNotification('يرجى إضافة منتج واحد على الأقل', 'error');
                return false;
            }
            return true;
            
        case 3:
            return true;
            
        default:
            return false;
    }
}

// Go to specific step
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    // Show target step
    document.getElementById(`step${step}`).classList.add('active');
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        const stepNumber = index + 1;
        if (stepNumber < step) {
            stepEl.classList.remove('inactive');
            stepEl.classList.add('completed');
        } else if (stepNumber === step) {
            stepEl.classList.remove('inactive', 'completed');
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active', 'completed');
            stepEl.classList.add('inactive');
        }
    });
    
    currentStep = step;
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (step === 1) {
        prevBtn.style.display = 'none';
        nextBtn.textContent = 'التالي';
    } else if (step === 3) {
        prevBtn.style.display = 'inline-block';
        nextBtn.style.display = 'none';
        populateReviewSection();
    } else {
        prevBtn.style.display = 'inline-block';
        nextBtn.style.display = 'inline-block';
        nextBtn.textContent = 'التالي';
    }
}

// Populate review section
function populateReviewSection() {
    const reviewSection = document.getElementById('reviewSection');
    const deliveryDate = document.getElementById('deliveryDate').value;
    
    reviewSection.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;">
            <h4 style="color: #f39c12; margin-bottom: 1rem;">معلومات الوصل</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div><strong>العميل:</strong> ${selectedClient.name}</div>
                <div><strong>التاريخ:</strong> ${deliveryDate}</div>
            </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 10px;">
            <h4 style="color: #f39c12; margin-bottom: 1rem;">المنتجات</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: rgba(243, 156, 18, 0.3);">
                        <th style="padding: 8px; border: 1px solid rgba(255,255,255,0.2);">المنتج</th>
                        <th style="padding: 8px; border: 1px solid rgba(255,255,255,0.2);">السعر</th>
                        <th style="padding: 8px; border: 1px solid rgba(255,255,255,0.2);">الكمية</th>
                        <th style="padding: 8px; border: 1px solid rgba(255,255,255,0.2);">المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${selectedProducts.map(product => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid rgba(255,255,255,0.1);">${product.name}</td>
                            <td style="padding: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">${product.price.toFixed(2)} د.ج</td>
                            <td style="padding: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">${product.quantity}</td>
                            <td style="padding: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">${product.total.toFixed(2)} د.ج</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top: 1rem; text-align: center; font-size: 1.3rem; font-weight: bold; color: #f39c12;">
                المجموع الكلي: ${totalAmount.toFixed(2)} د.ج
            </div>
        </div>
    `;
}

// Handle print
async function handlePrint() {
    const deliveryDate = document.getElementById('deliveryDate').value;
    
    const deliveryNoteData = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        date: deliveryDate,
        items: selectedProducts
    };
    
    try {
        // Save delivery note to database
        const saveResult = await ipcRenderer.invoke('deliveryNotes:add', deliveryNoteData);
        
        if (saveResult.success) {
            // Print the delivery note
            const printResult = await ipcRenderer.invoke('print-note', saveResult.deliveryNote);
            
            if (printResult.success) {
                document.getElementById('successMessage').style.display = 'block';
                showNotification('تم إنشاء وطباعة وصل التسليم بنجاح', 'success');
                
                // Reset form after successful creation
                setTimeout(() => {
                    resetForm();
                }, 2000);
            } else {
                showNotification('تم حفظ الوصل ولكن فشلت الطباعة', 'warning');
            }
        } else {
            showNotification(saveResult.error, 'error');
        }
    } catch (error) {
        console.error('Error creating delivery note:', error);
        showNotification('خطأ في إنشاء وصل التسليم', 'error');
    }
}

// Handle PDF preview
async function handlePreviewPdf() {
    const deliveryNoteData = getDeliveryNoteData();
    if (!deliveryNoteData) return;
    
    try {
        // Save delivery note to database first
        const saveResult = await ipcRenderer.invoke('deliveryNotes:add', deliveryNoteData);
        
        if (saveResult.success) {
            // Preview the PDF
            const previewResult = await ipcRenderer.invoke('preview-pdf', saveResult.deliveryNote);
            
            if (previewResult.success) {
                showNotification('تم فتح معاينة PDF بنجاح', 'success');
                document.getElementById('successMessage').style.display = 'block';
            } else {
                showNotification(previewResult.error, 'error');
            }
        } else {
            showNotification(saveResult.error, 'error');
        }
    } catch (error) {
        console.error('Error previewing PDF:', error);
        showNotification('خطأ في معاينة ملف PDF', 'error');
    }
}

// Handle PDF download
async function handleDownloadPdf() {
    const deliveryNoteData = getDeliveryNoteData();
    if (!deliveryNoteData) return;
    
    try {
        // Save delivery note to database first
        const saveResult = await ipcRenderer.invoke('deliveryNotes:add', deliveryNoteData);
        
        if (saveResult.success) {
            // Download the PDF
            const downloadResult = await ipcRenderer.invoke('save-pdf', saveResult.deliveryNote);
            
            if (downloadResult.success) {
                showNotification('تم حفظ ملف PDF بنجاح', 'success');
                document.getElementById('successMessage').style.display = 'block';
            } else {
                showNotification(downloadResult.error, 'error');
            }
        } else {
            showNotification(saveResult.error, 'error');
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showNotification('خطأ في تحميل ملف PDF', 'error');
    }
}

// Handle PDF print
async function handlePrintPdf() {
    const deliveryNoteData = getDeliveryNoteData();
    if (!deliveryNoteData) return;
    
    try {
        // Save delivery note to database first
        const saveResult = await ipcRenderer.invoke('deliveryNotes:add', deliveryNoteData);
        
        if (saveResult.success) {
            // Print the PDF
            const printResult = await ipcRenderer.invoke('print-pdf', saveResult.deliveryNote);
            
            if (printResult.success) {
                showNotification('تم فتح PDF للطباعة بنجاح', 'success');
                document.getElementById('successMessage').style.display = 'block';
            } else {
                showNotification(printResult.error, 'error');
            }
        } else {
            showNotification(saveResult.error, 'error');
        }
    } catch (error) {
        console.error('Error printing PDF:', error);
        showNotification('خطأ في طباعة ملف PDF', 'error');
    }
}

// Helper function to get delivery note data
function getDeliveryNoteData() {
    const deliveryDate = document.getElementById('deliveryDate').value;
    
    if (!selectedClient || !deliveryDate || selectedProducts.length === 0) {
        showNotification('يرجى التأكد من اختيار العميل والتاريخ وإضافة المنتجات', 'error');
        return null;
    }
    
    return {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        date: deliveryDate,
        items: selectedProducts
    };
}

// Reset form to initial state
function resetForm() {
    selectedProducts = [];
    totalAmount = 0;
    // Clear selected client and product
    selectedClient = null;
    selectedProduct = null;
    
    // Clear selection from lists
    document.querySelectorAll('#clientsList .selection-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('#productsList .selection-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    document.getElementById('newClientName').value = '';
    document.getElementById('productQuantity').value = '';
    setCurrentDate();
    updateProductsTable();
    calculateTotal();
    goToStep(1);
    document.getElementById('successMessage').style.display = 'none';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#f39c12'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Make removeProduct function global
window.removeProduct = removeProduct;