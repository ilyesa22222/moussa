const { ipcRenderer } = require('electron');

let products = [];
let editingProductId = null;

// Load products when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add product form
    const addForm = document.getElementById('productForm');
    addForm.addEventListener('submit', handleAddProduct);

    // Fix number input issues
    const priceInput = document.getElementById('productPrice');
    priceInput.addEventListener('input', (e) => {
        // Allow numbers, decimal point, and backspace
        let value = e.target.value;
        // Remove any non-numeric characters except decimal point
        value = value.replace(/[^\d.]/g, '');
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        e.target.value = value;
    });

    // Navigation
    document.getElementById('backToDashboardBtn').addEventListener('click', () => {
        ipcRenderer.send('navigate-to-dashboard');
    });

    document.getElementById('dashboardLink').addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.send('navigate-to-dashboard');
    });
}

// Load and display products
async function loadProducts() {
    try {
        products = await ipcRenderer.invoke('products:get');
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('خطأ في تحميل المنتجات', 'error');
    }
}

// Display products in table
function displayProducts() {
    const tbody = document.getElementById('productsTableBody');

    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">لا توجد منتجات</td></tr>';
    } else {
        products.forEach(product => {
            const row = createProductRow(product);
            tbody.appendChild(row);
        });
    }
}

// Create product row
function createProductRow(product) {
    const row = document.createElement('tr');
    row.setAttribute('data-product-id', product.id);

    if (editingProductId === product.id) {
        row.innerHTML = `
            <td>
                <input type="text" id="editName${product.id}" value="${product.name}" class="edit-input">
            </td>
            <td>
                <input type="text" id="editPrice${product.id}" value="${product.price}" class="edit-input" inputmode="decimal">
            </td>
            <td>
                <button class="btn btn-save" onclick="saveProduct(${product.id})">حفظ</button>
                <button class="btn btn-cancel" onclick="cancelEdit()">إلغاء</button>
            </td>
        `;
    } else {
        row.innerHTML = `
            <td class="product-name">${product.name}</td>
            <td class="product-price">${product.price.toFixed(2)} د.ج</td>
            <td>
                <button class="btn btn-edit" onclick="editProduct(${product.id})">تعديل</button>
                <button class="btn btn-delete" onclick="deleteProduct(${product.id})">حذف</button>
            </td>
        `;
    }

    return row;
}

// Handle add product form submission
async function handleAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value.trim();
    const priceText = document.getElementById('productPrice').value.trim();
    const price = parseFloat(priceText.replace(/[^\d.]/g, ''));

    if (!name) {
        showNotification('يرجى إدخال اسم المنتج', 'error');
        return;
    }
    
    if (!priceText || isNaN(price) || price < 0) {
        showNotification('يرجى إدخال سعر صحيح', 'error');
        return;
    }

    try {
        const result = await ipcRenderer.invoke('products:add', { name, price });
        
        if (result.success) {
            showNotification('تم إضافة المنتج بنجاح', 'success');
            document.getElementById('productForm').reset();
            await loadProducts();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('خطأ في إضافة المنتج', 'error');
    }
}

// Edit product
function editProduct(productId) {
    editingProductId = productId;
    displayProducts();
    
    // Focus on name input and add price input validation
    setTimeout(() => {
        document.getElementById(`editName${productId}`).focus();
        
        // Add input validation for price editing
        const editPriceInput = document.getElementById(`editPrice${productId}`);
        editPriceInput.addEventListener('input', (e) => {
            let value = e.target.value;
            // Remove any non-numeric characters except decimal point
            value = value.replace(/[^\d.]/g, '');
            // Ensure only one decimal point
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            e.target.value = value;
        });
    }, 100);
}

// Save edited product
async function saveProduct(productId) {
    const name = document.getElementById(`editName${productId}`).value.trim();
    const priceText = document.getElementById(`editPrice${productId}`).value.trim();
    const price = parseFloat(priceText.replace(/[^\d.]/g, ''));

    if (!name) {
        showNotification('يرجى إدخال اسم المنتج', 'error');
        return;
    }
    
    if (!priceText || isNaN(price) || price < 0) {
        showNotification('يرجى إدخال سعر صحيح', 'error');
        return;
    }

    try {
        const result = await ipcRenderer.invoke('products:update', productId, { name, price });
        
        if (result.success) {
            showNotification('تم تحديث المنتج بنجاح', 'success');
            editingProductId = null;
            await loadProducts();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('خطأ في تحديث المنتج', 'error');
    }
}

// Cancel edit
function cancelEdit() {
    editingProductId = null;
    displayProducts();
}

// Delete product
async function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!confirm(`هل أنت متأكد أنك تريد حذف المنتج "${product.name}"؟`)) {
        return;
    }

    try {
        const result = await ipcRenderer.invoke('products:delete', productId);
        
        if (result.success) {
            showNotification('تم حذف المنتج بنجاح', 'success');
            await loadProducts();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('خطأ في حذف المنتج', 'error');
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
window.editProduct = editProduct;
window.saveProduct = saveProduct;
window.cancelEdit = cancelEdit;
window.deleteProduct = deleteProduct;