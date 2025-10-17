# 🏗️ Windows Build Instructions

## 📋 Prerequisites
- **Node.js** (version 16 or higher): https://nodejs.org/
- **Windows 10/11** (64-bit recommended)
- **Internet connection** (for downloading dependencies)

## 🚀 Building Options

### Option 1: GitHub Actions (Recommended)
1. Push your code to GitHub repository
2. GitHub will automatically build installers for Windows, macOS, and Linux
3. Download from the "Actions" tab or releases

### Option 2: Build on Windows Computer

#### Method A: Batch File (Easy)
1. Copy the entire project folder to Windows computer
2. **Right-click** on `build-windows.bat`
3. Select **"Run as administrator"**
4. Wait for build to complete
5. Installer will be in `dist/` folder

#### Method B: PowerShell (Recommended)
1. Copy the entire project folder to Windows computer
2. **Right-click** on `build-windows.ps1`
3. Select **"Run with PowerShell"**
4. If prompted, allow script execution
5. Wait for build to complete

#### Method C: Manual Commands
Open Command Prompt or PowerShell in project folder:
```bash
npm install
npm install --save-dev electron-builder
npm run build:win
```

## 📁 Output Files
After successful build, you'll find:
- `dist/Moussa Inventory System Setup 1.0.0.exe` - Windows installer
- `dist/win-unpacked/` - Unpacked application files

## 🛠️ Troubleshooting

### "Node.js not found"
- Download and install Node.js from https://nodejs.org/
- Restart Command Prompt/PowerShell

### "Permission denied"
- Run as Administrator
- Check Windows Defender/Antivirus settings

### "Build failed"
- Make sure you have internet connection
- Try deleting `node_modules` folder and run again
- Check if all files are present in project folder

### "PowerShell execution policy"
Run this command in PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📞 Support
If you encounter issues:
1. Check the error message in console
2. Make sure Node.js is properly installed
3. Try building with administrator privileges
4. Contact support with the error details

## ⚡ Quick Build (if dependencies already installed)
Double-click `quick-build.bat` for fast rebuilds.