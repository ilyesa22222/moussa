# 📦 Moussa Inventory System
### نظام إدارة المخزون والعملاء

A professional desktop inventory and client management system built with Electron, featuring year-based data isolation and A5 delivery note printing.

## ✨ Features

### 🏢 **Business Management**
- **Year-Based System**: Separate databases per academic/business year (2024/2025 format)
- **Client Management**: Add, edit, delete, and track client information
- **Product Inventory**: Complete product catalog with pricing and quantities
- **Professional UI**: Clean white and dark blue theme throughout

### 📋 **Delivery Notes**
- **A5 Format**: Professional delivery notes optimized for A5 paper
- **Bilingual**: French/Arabic headers and content
- **Smart Continuation**: Load products from previous delivery notes to save time
- **Edit Functionality**: Modify quantities, add/remove products after loading
- **Auto-Calculate**: Overall totals with professional formatting
- **Print & Save**: Direct printing with automatic saving and dashboard return

### 🎯 **Smart Features**
- **Continue Previous Orders**: When creating delivery notes, option to load previous order data
- **Editable Product Lists**: Full edit capabilities in selected products section
- **Client Dashboard**: View delivery note history per client
- **Year Selection**: Easy switching between business years
- **Professional Printing**: Enhanced print functionality with PDF generation

## 🖥️ **Screenshots**

*Dashboard with year selection and professional styling*

*Delivery note creation with smart product loading*

*A5 formatted delivery notes ready for printing*

## 🚀 **Installation**

### Windows
Download the latest installer from [Releases](https://github.com/ilyesa22222/moussa/releases):
- `Moussa Inventory System Setup 1.0.0.exe`

### macOS
- `Moussa Inventory System-1.0.0.dmg`

### Linux
- `Moussa Inventory System-1.0.0.AppImage`

## 💻 **Development**

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Setup
```bash
git clone https://github.com/ilyesa22222/moussa.git
cd moussa
npm install
npm start
```

### Building
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build
```

## 🏗️ **Architecture**

### Data Structure
```
years/
├── 2024-2025/
│   └── database.json
├── 2025-2026/
│   └── database.json
└── years.json (configuration)
```

### Key Components
- **Year Management**: Isolated databases per year
- **Client System**: Complete client relationship management
- **Product Catalog**: Inventory with pricing and stock tracking
- **Delivery Notes**: Professional A5 formatted documents
- **Print System**: Enhanced PDF generation and printing

## 🎨 **Design System**

### Colors
- **Primary**: Dark Blue (#2c3e50)
- **Background**: White (#ffffff)
- **Professional**: Consistent theme across all pages

### Typography
- **Arabic**: Proper RTL support
- **French**: Clean, professional fonts
- **Bilingual**: Seamless French/Arabic integration

## 📱 **Platform Support**

- **Windows**: 7, 8, 10, 11 (x64)
- **macOS**: 10.14 or later
- **Linux**: Ubuntu 18.04+, Fedora 29+, Debian 10+

## 🔄 **Auto-Updates**

Built-in update system checks for new releases automatically.

## 📄 **License**

ISC License - See [LICENSE](LICENSE) file for details.

## 👥 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 **Support**

For support and questions:
- Create an issue on GitHub
- Check the [Build Instructions](BUILD-INSTRUCTIONS.md)
- Review the documentation

## 🏆 **Acknowledgments**

Built with love for efficient business management.

---

**Moussa Business Solutions** - Professional Inventory Management System