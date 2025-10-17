const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Keep a global reference of the window object
let mainWindow;
let currentYear = null;

// Database file paths
const DB_PATH = path.join(__dirname, 'database.json');
const YEARS_PATH = path.join(__dirname, 'years.json');

// Years management functions
async function readYearsFile() {
  try {
    const data = await fs.readFile(YEARS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading years file:', error);
    return { availableYears: [], currentYear: null };
  }
}

async function writeYearsFile(data) {
  try {
    await fs.writeFile(YEARS_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing years file:', error);
    return false;
  }
}

async function getYearDatabasePath(year) {
  const yearFolder = path.join(__dirname, 'years', year);
  await fs.mkdir(yearFolder, { recursive: true });
  return path.join(yearFolder, 'database.json');
}

// Database helper functions
async function readDatabase() {
  try {
    let dbPath = DB_PATH;
    if (currentYear) {
      dbPath = await getYearDatabasePath(currentYear);
    }
    
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    // Return default structure if file doesn't exist
    return { users: [], products: [], clients: [], deliveryNotes: [] };
  }
}

async function writeDatabase(data) {
  try {
    let dbPath = DB_PATH;
    if (currentYear) {
      dbPath = await getYearDatabasePath(currentYear);
    }
    
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// Product CRUD Functions
async function getProducts() {
  const db = await readDatabase();
  return db.products || [];
}

async function addProduct(productData) {
  try {
    const db = await readDatabase();
    
    // Generate unique ID
    const newId = db.products.length > 0 
      ? Math.max(...db.products.map(p => p.id)) + 1 
      : 1;
    
    // Create new product object
    const newProduct = {
      id: newId,
      name: productData.name,
      price: parseFloat(productData.price),
      quantity: parseInt(productData.quantity) || 0,
      category: productData.category || 'عام',
      description: productData.description || '',
      barcode: productData.barcode || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.products.push(newProduct);
    const success = await writeDatabase(db);
    
    if (success) {
      return { success: true, product: newProduct };
    } else {
      return { success: false, error: 'فشل في حفظ المنتج' };
    }
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error: 'خطأ في إضافة المنتج' };
  }
}

async function updateProduct(productId, productData) {
  try {
    const db = await readDatabase();
    const productIndex = db.products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return { success: false, error: 'المنتج غير موجود' };
    }
    
    // Update product data
    db.products[productIndex] = {
      ...db.products[productIndex],
      name: productData.name,
      price: parseFloat(productData.price),
      quantity: parseInt(productData.quantity) || 0,
      category: productData.category || 'عام',
      description: productData.description || '',
      barcode: productData.barcode || '',
      updatedAt: new Date().toISOString()
    };
    
    const success = await writeDatabase(db);
    
    if (success) {
      return { success: true, product: db.products[productIndex] };
    } else {
      return { success: false, error: 'فشل في تحديث المنتج' };
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'خطأ في تحديث المنتج' };
  }
}

async function deleteProduct(productId) {
  try {
    const db = await readDatabase();
    const productIndex = db.products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return { success: false, error: 'المنتج غير موجود' };
    }
    
    const deletedProduct = db.products.splice(productIndex, 1)[0];
    const success = await writeDatabase(db);
    
    if (success) {
      return { success: true, product: deletedProduct };
    } else {
      return { success: false, error: 'فشل في حذف المنتج' };
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'خطأ في حذف المنتج' };
  }
}

// Client CRUD Functions
async function getClients() {
  const db = await readDatabase();
  return db.clients || [];
}

async function addClient(clientData) {
  try {
    const db = await readDatabase();
    
    // Ensure clients array exists
    if (!db.clients) {
      db.clients = [];
    }
    
    // Generate unique ID
    const newId = db.clients.length > 0 
      ? Math.max(...db.clients.map(c => c.id)) + 1 
      : 1;
    
    // Create new client object
    const newClient = {
      id: newId,
      name: clientData.name,
      phone: clientData.phone || '',
      email: clientData.email || '',
      address: clientData.address || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.clients.push(newClient);
    const success = await writeDatabase(db);
    
    if (success) {
      return { success: true, client: newClient };
    } else {
      return { success: false, error: 'فشل في حفظ العميل' };
    }
  } catch (error) {
    console.error('Error adding client:', error);
    return { success: false, error: 'خطأ في إضافة العميل' };
  }
}

async function updateClient(clientId, clientData) {
  try {
    const db = await readDatabase();
    
    // Ensure clients array exists
    if (!db.clients) {
      db.clients = [];
    }
    
    const clientIndex = db.clients.findIndex(c => c.id === clientId);
    
    if (clientIndex === -1) {
      return { success: false, error: 'العميل غير موجود' };
    }
    
    // Update client data
    db.clients[clientIndex] = {
      ...db.clients[clientIndex],
      name: clientData.name,
      phone: clientData.phone || '',
      email: clientData.email || '',
      address: clientData.address || '',
      updatedAt: new Date().toISOString()
    };
    
    const success = await writeDatabase(db);
    
    if (success) {
      return { success: true, client: db.clients[clientIndex] };
    } else {
      return { success: false, error: 'فشل في تحديث العميل' };
    }
  } catch (error) {
    console.error('Error updating client:', error);
    return { success: false, error: 'خطأ في تحديث العميل' };
  }
}

async function deleteClient(clientId) {
  try {
    const db = await readDatabase();
    
    // Ensure clients array exists
    if (!db.clients) {
      db.clients = [];
    }
    
    const clientIndex = db.clients.findIndex(c => c.id === clientId);
    
    if (clientIndex === -1) {
      return { success: false, error: 'العميل غير موجود' };
    }
    
    const deletedClient = db.clients.splice(clientIndex, 1)[0];
    const success = await writeDatabase(db);
    
    if (success) {
      return { success: true, client: deletedClient };
    } else {
      return { success: false, error: 'فشل في حذف العميل' };
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    return { success: false, error: 'خطأ في حذف العميل' };
  }
}

// Delivery Notes CRUD Functions
async function getDeliveryNotes() {
  const db = await readDatabase();
  return db.deliveryNotes || [];
}

async function addDeliveryNote(noteData) {
  try {
    const db = await readDatabase();
    
    // Ensure deliveryNotes array exists
    if (!db.deliveryNotes) {
      db.deliveryNotes = [];
    }
    
    // Generate unique ID using timestamp
    const newId = `DN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate totals for each item
    const processedItems = noteData.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      total: parseFloat(item.price) * parseInt(item.quantity)
    }));
    
    // Calculate overall total
    const overallTotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    
    // Create new delivery note object
    const newDeliveryNote = {
      id: newId,
      clientId: noteData.clientId,
      clientName: noteData.clientName,
      date: noteData.date || new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      items: processedItems,
      overallTotal: overallTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.deliveryNotes.push(newDeliveryNote);
    const success = await writeDatabase(db);
    
    if (success) {
      return { success: true, deliveryNote: newDeliveryNote };
    } else {
      return { success: false, error: 'فشل في حفظ وصل التسليم' };
    }
  } catch (error) {
    console.error('Error adding delivery note:', error);
    return { success: false, error: 'خطأ في إضافة وصل التسليم' };
  }
}

// Generate Printable HTML for delivery note using the provided template
function generatePrintableHtml(noteData) {
  // Format date properly
  const formattedDate = new Date(noteData.date);
  const day = String(formattedDate.getDate()).padStart(2, '0');
  const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
  const year = formattedDate.getFullYear();
  
  // Generate table rows for items
  const itemRows = noteData.items.map(item => `
    <tr>
      <td class="col-qty">${item.quantity}</td>
      <td class="col-designation">${item.name}</td>
      <td class="col-price">${item.price.toFixed(2)} د.ج</td>
      <td class="col-total">${item.total.toFixed(2)} د.ج</td>
    </tr>
  `).join('');
  
  // Generate overall total row
  const overallTotal = noteData.overallTotal || noteData.items.reduce((sum, item) => sum + item.total, 0);
  const totalRow = `
    <tr style="background: #4A5568; color: white; font-weight: bold;">
      <td class="col-qty"></td>
      <td class="col-designation" style="text-align: right;">المجموع الإجمالي:</td>
      <td class="col-price"></td>
      <td class="col-total">${overallTotal.toFixed(2)} د.ج</td>
    </tr>
  `;
  
  // Fill empty rows to complete the table (adjust for total row - 24 instead of 25)
  const emptyRowsNeeded = Math.max(0, 24 - noteData.items.length);
  const emptyRows = Array(emptyRowsNeeded).fill('<tr><td></td><td></td><td></td><td></td></tr>').join('');
  
  const template = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bon de livraison</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      background: #f0f0f0;
      padding: 10px;
    }
    .page {
      width: 148mm;
      height: 210mm;
      background: white;
      margin: 0 auto;
      padding: 8mm 8mm 8mm 5mm;
      position: relative;
      border-top: 3px solid #4A5568;
    }
    .content-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .header {
      margin-bottom: 10px;
    }
    .title-section {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .title-fr {
      font-size: 18px;
      font-weight: bold;
      color: #4A5568;
    }
    .title-ar {
      font-size: 16px;
      font-weight: bold;
      color: #4A5568;
    }
    .doc-info {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      line-height: 1.8;
    }
    .doc-info div {
      margin-bottom: 3px;
    }
    .header-boxes {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }
    .header-box {
      flex: 1;
      border: 1px solid #4A5568;
      border-radius: 4px;
      padding: 8px;
      font-size: 10px;
      min-height: 50px;
    }
    .client-header-box {
      text-align: right;
      font-size: 14px;
      font-weight: bold;
    }
    .table-container {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      height: 100%;
    }
    thead {
      background: #4A5568;
      color: white;
    }
    thead th {
      padding: 4px 3px;
      text-align: center;
      font-weight: bold;
      border-right: 1px solid white;
      font-size: 7px;
      line-height: 1.3;
    }
    thead th:last-child {
      border-right: none;
    }
    tbody td {
      padding: 6px 3px;
      border-right: 1px solid #4A5568;
      border-bottom: 1px dotted #999;
      vertical-align: top;
      height: 18px;
    }
    tbody td:last-child {
      border-right: none;
    }
    tbody tr:last-child td {
      border-bottom: 1px solid #4A5568;
    }
    .col-qty {
      width: 12%;
      text-align: center;
    }
    .col-designation {
      width: 46%;
    }
    .col-price {
      width: 18%;
      text-align: center;
    }
    .col-total {
      width: 24%;
      text-align: center;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .page {
        width: 148mm;
        height: 210mm;
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
      @page {
        size: A5 portrait;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="content-wrapper">
      <div class="header">
        <div class="title-section">
          <span class="title-fr">Bon de livraison</span>
          <span class="title-ar">وصل تسليم</span>
        </div>
        <div class="doc-info">
          <div>Le: ${day} / ${month} / ${year}</div>
        </div>
        <div class="header-boxes">
          <div class="header-box"></div>
          <div class="header-box client-header-box">
            الزبون: ${noteData.clientName}
          </div>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="col-qty">Qté.<br>الكمية</th>
              <th class="col-designation">Produit<br>المنتج</th>
              <th class="col-price">P.Unité<br>سعر الوحدة</th>
              <th class="col-total">Total<br>المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            ${emptyRows}
            ${totalRow}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  return template;
}

async function createWindow() {
  // Initialize current year from years.json
  try {
    const yearsData = await readYearsFile();
    if (yearsData.currentYear) {
      currentYear = yearsData.currentYear;
      console.log('Initialized currentYear:', currentYear);
    }
  } catch (error) {
    console.error('Error initializing currentYear:', error);
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Optional: add an icon
    show: false // Don't show until ready
  });

  // Start with year selection page
  mainWindow.loadFile('year-selection.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// IPC handlers for navigation
ipcMain.on('navigate-to-products', () => {
  if (mainWindow) {
    mainWindow.loadFile('products.html');
  }
});

ipcMain.on('navigate-to-dashboard', () => {
  if (mainWindow) {
    mainWindow.loadFile('dashboard.html');
  }
});

ipcMain.on('navigate-to-clients', () => {
  if (mainWindow) {
    mainWindow.loadFile('clients.html');
  }
});

ipcMain.on('navigate-to-delivery-note', () => {
  if (mainWindow) {
    mainWindow.loadFile('create-delivery-note.html');
  }
});

ipcMain.on('navigate-to-client-dashboard', (event, clientId) => {
  if (mainWindow) {
    mainWindow.loadFile('client-dashboard.html').then(() => {
      // Store client ID for the dashboard to use
      mainWindow.webContents.executeJavaScript(`
        localStorage.setItem('currentClientId', '${clientId}');
      `);
    });
  }
});

// IPC handlers for product CRUD operations
ipcMain.handle('products:get', getProducts);
ipcMain.handle('products:add', (event, productData) => addProduct(productData));
ipcMain.handle('products:update', (event, productId, productData) => updateProduct(productId, productData));
ipcMain.handle('products:delete', (event, productId) => deleteProduct(productId));

// IPC handlers for client CRUD operations
ipcMain.handle('clients:get', getClients);
ipcMain.handle('clients:add', (event, clientData) => addClient(clientData));
ipcMain.handle('clients:update', (event, clientId, clientData) => updateClient(clientId, clientData));
ipcMain.handle('clients:delete', (event, clientId) => deleteClient(clientId));

// IPC handlers for delivery notes operations
ipcMain.handle('deliveryNotes:get', getDeliveryNotes);
ipcMain.handle('deliveryNotes:add', (event, noteData) => addDeliveryNote(noteData));

// IPC handlers for year management
ipcMain.handle('years:get', async () => {
  const yearsData = await readYearsFile();
  return yearsData.availableYears || [];
});

ipcMain.handle('years:create', async (event, yearValue) => {
  try {
    const yearsData = await readYearsFile();
    
    if (!yearsData.availableYears) {
      yearsData.availableYears = [];
    }
    
    if (yearsData.availableYears.includes(yearValue)) {
      return { success: false, error: 'هذه السنة الدراسية موجودة بالفعل' };
    }
    
    yearsData.availableYears.push(yearValue);
    const success = await writeYearsFile(yearsData);
    
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: 'فشل في إنشاء السنة الدراسية' };
    }
  } catch (error) {
    console.error('Error creating year:', error);
    return { success: false, error: 'خطأ في إنشاء السنة الدراسية' };
  }
});

ipcMain.handle('years:set-current', async (event, yearValue) => {
  try {
    currentYear = yearValue;
    const yearsData = await readYearsFile();
    yearsData.currentYear = yearValue;
    await writeYearsFile(yearsData);
    return { success: true };
  } catch (error) {
    console.error('Error setting current year:', error);
    return { success: false, error: 'خطأ في تحديد السنة الدراسية' };
  }
});

ipcMain.handle('years:get-current', () => {
  return currentYear;
});

// IPC handler for printing delivery notes
ipcMain.handle('print-note', async (event, noteData) => {
  try {
    // First save the delivery note to database if it has no ID
    if (!noteData.id) {
      const saveResult = await addDeliveryNote(noteData);
      if (!saveResult.success) {
        return { success: false, error: 'فشل في حفظ وصل التسليم' };
      }
      noteData = saveResult.deliveryNote;
    }
    
    const htmlContent = generatePrintableHtml(noteData);
    
    // Create a new hidden window for printing
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    // Load the HTML content
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    // Print the content
    const printed = await printWindow.webContents.print({
      silent: false, // Show print dialog
      printBackground: true,
      color: true,
      margins: {
        marginType: 'minimum'
      }
    });
    
    // Close the print window after printing
    printWindow.close();
    
    return { success: true, printed, savedNote: noteData };
  } catch (error) {
    console.error('Error printing delivery note:', error);
    return { success: false, error: 'خطأ في طباعة وصل التسليم' };
  }
});

// Helper function to generate PDF buffer
async function generatePdfBuffer(noteData) {
  try {
    const htmlContent = generatePrintableHtml(noteData);
    
    // Create a new hidden window for PDF generation
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    // Load the HTML content
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    // Generate PDF
    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      pageSize: 'A5',
      margins: {
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5
      },
      printBackground: true,
      landscape: false
    });
    
    // Close the PDF window
    pdfWindow.close();
    
    return { success: true, pdfBuffer: pdfBuffer.toString('base64') };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: 'خطأ في إنشاء ملف PDF' };
  }
}

// IPC handler for generating PDF of delivery note
ipcMain.handle('generate-pdf', async (event, noteData) => {
  return await generatePdfBuffer(noteData);
});

// IPC handler for saving PDF to file
ipcMain.handle('save-pdf', async (event, noteData) => {
  try {
    // First generate the PDF
    const pdfResult = await generatePdfBuffer(noteData);
    
    if (!pdfResult.success) {
      return pdfResult;
    }
    
    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ وصل التسليم',
      defaultPath: `وصل_تسليم_${noteData.id}.pdf`,
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      // Convert base64 back to buffer and save
      const pdfBuffer = Buffer.from(pdfResult.pdfBuffer, 'base64');
      await fs.writeFile(result.filePath, pdfBuffer);
      
      return { 
        success: true, 
        filePath: result.filePath,
        message: 'تم حفظ ملف PDF بنجاح'
      };
    } else {
      return { success: false, error: 'تم إلغاء العملية' };
    }
  } catch (error) {
    console.error('Error saving PDF:', error);
    return { success: false, error: 'خطأ في حفظ ملف PDF' };
  }
});

// IPC handler for previewing PDF in app
ipcMain.handle('preview-pdf', async (event, noteData) => {
  try {
    // First generate the PDF
    const pdfResult = await generatePdfBuffer(noteData);
    
    if (!pdfResult.success) {
      return pdfResult;
    }
    
    // Create temporary file for preview
    const tempDir = require('os').tmpdir();
    const tempFilePath = path.join(tempDir, `delivery_note_${Date.now()}.pdf`);
    
    // Convert base64 back to buffer and save temporarily
    const pdfBuffer = Buffer.from(pdfResult.pdfBuffer, 'base64');
    await fs.writeFile(tempFilePath, pdfBuffer);
    
    // Create PDF preview window
    const previewWindow = new BrowserWindow({
      width: 800,
      height: 1000,
      title: `معاينة وصل التسليم - ${noteData.id}`,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        plugins: true
      }
    });
    
    // Load the PDF file in the window
    await previewWindow.loadFile(tempFilePath);
    
    // Clean up temp file when window closes
    previewWindow.on('closed', () => {
      fs.unlink(tempFilePath).catch(err => console.error('Error deleting temp file:', err));
    });
    
    return { 
      success: true, 
      message: 'تم فتح معاينة PDF',
      tempFilePath: tempFilePath
    };
  } catch (error) {
    console.error('Error previewing PDF:', error);
    return { success: false, error: 'خطأ في معاينة ملف PDF' };
  }
});

// IPC handler for printing PDF file
ipcMain.handle('print-pdf', async (event, noteData) => {
  try {
    // First generate the PDF
    const pdfResult = await generatePdfBuffer(noteData);
    
    if (!pdfResult.success) {
      return pdfResult;
    }
    
    // Create temporary file for printing
    const tempDir = require('os').tmpdir();
    const tempFilePath = path.join(tempDir, `delivery_note_print_${Date.now()}.pdf`);
    
    // Convert base64 back to buffer and save temporarily
    const pdfBuffer = Buffer.from(pdfResult.pdfBuffer, 'base64');
    await fs.writeFile(tempFilePath, pdfBuffer);
    
    // Open PDF with default system application (which usually has print option)
    await shell.openPath(tempFilePath);
    
    // Clean up temp file after some delay
    setTimeout(() => {
      fs.unlink(tempFilePath).catch(err => console.error('Error deleting temp file:', err));
    }, 30000); // 30 seconds delay
    
    return { 
      success: true, 
      message: 'تم فتح PDF للطباعة'
    };
  } catch (error) {
    console.error('Error printing PDF:', error);
    return { success: false, error: 'خطأ في طباعة ملف PDF' };
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => createWindow());

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    console.log('Prevented new window creation for:', navigationUrl);
  });
});