const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let hostsService;
let hostsServiceReady = false;

const hostsFilePath = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32\\drivers\\etc\\hosts');

function createWindow() {
  const isPackaged = app.isPackaged;
  
  const preloadPath = isPackaged 
    ? path.join(process.resourcesPath, 'electron', 'preload.js')
    : path.join(__dirname, 'preload.js');
  
  const indexPath = isPackaged
    ? path.join(process.resourcesPath, 'dist', 'index.html')
    : path.join(__dirname, '../dist/index.html');
  
  const iconPath = isPackaged
    ? path.join(process.resourcesPath, 'public', 'icon.ico')
    : path.join(__dirname, '../public/icon.ico');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Hosts文件管理器',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: preloadPath
    },
    backgroundColor: '#f5f7fa',
    show: false
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${indexPath}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function checkAdminRights() {
  try {
    console.log('[Main] Checking admin rights, hosts file path:', hostsFilePath);
    console.log('[Main] File exists:', fs.existsSync(hostsFilePath));
    
    const content = fs.readFileSync(hostsFilePath, 'utf8');
    console.log('[Main] File read successfully, content length:', content.length);
    
    fs.writeFileSync(hostsFilePath, content, 'utf8');
    console.log('[Main] File write test passed');
    
    return true;
  } catch (error) {
    console.error('[Main] Admin rights check failed:', error.message);
    console.error('[Main] Error stack:', error.stack);
    return false;
  }
}

async function requestAdminRights() {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: '需要管理员权限',
    message: 'Hosts文件需要管理员权限才能修改',
    detail: '程序将以管理员权限重新启动。点击"确定"继续。',
    buttons: ['确定', '取消'],
    defaultId: 0,
    cancelId: 1
  });

  if (response === 0) {
    const exePath = process.execPath;
    const args = process.argv.slice(1);
    
    try {
      const { execSync } = require('child_process');
      const psScript = `Start-Process -FilePath "${exePath}" -ArgumentList "${args.join('" "')}" -Verb RunAs`;
      execSync(`powershell -Command "${psScript}"`, {
        stdio: 'ignore',
        windowsHide: true
      });
      app.quit();
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

async function initHostsService() {
  const isPackaged = app.isPackaged;
  console.log('[Main] initHostsService - isPackaged:', isPackaged);
  
  let hostsServicePath;
  if (isPackaged) {
    hostsServicePath = path.join(process.resourcesPath, 'electron', 'hostsService.js');
  } else {
    hostsServicePath = path.join(__dirname, 'hostsService.js');
  }
  
  console.log('[Main] hostsServicePath:', hostsServicePath);
  console.log('[Main] File exists:', fs.existsSync(hostsServicePath));
  
  const {HostsService} = require(hostsServicePath);
  
  hostsService = new HostsService(hostsFilePath);
  
  try {
    const initResult = await hostsService.initialize();
    if (!initResult.success) {
      await dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: '初始化错误',
        message: initResult.error,
        detail: initResult.details
      });
      return false;
    }
    return true;
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: '初始化错误',
      message: error.message
    });
    return false;
  }
}

app.whenReady().then(async () => {
  console.log('[Main] App ready, checking admin rights...');
  
  const hasAdmin = await checkAdminRights();
  console.log('[Main] Admin rights check result:', hasAdmin);
  
  if (!hasAdmin) {
    console.log('[Main] No admin rights, requesting elevation...');
    await requestAdminRights();
    app.quit();
    return;
  }
  
  console.log('[Main] Admin rights confirmed, initializing hosts service...');
  const initialized = await initHostsService();
  console.log('[Main] Hosts service initialization result:', initialized);
  
  if (!initialized) {
    console.log('[Main] Hosts service initialization failed, quitting...');
    app.quit();
    return;
  }
  
  hostsServiceReady = true;
  console.log('[Main] Hosts service ready, creating window...');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('is-service-ready', async () => {
  return hostsServiceReady;
});

ipcMain.handle('get-hosts', async () => {
  try {
    if (!hostsServiceReady) {
      return { success: false, error: 'Hosts服务尚未初始化完成' };
    }
    const result = await hostsService.getHosts();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-host', async (event, host) => {
  try {
    const result = await hostsService.addHost(host);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-host', async (event, oldHost, newHost) => {
  try {
    const result = await hostsService.updateHost(oldHost, newHost);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-host', async (event, host) => {
  try {
    const result = await hostsService.deleteHost(host);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-hosts', async (event, hosts) => {
  try {
    const result = await hostsService.deleteHosts(hosts);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-backup', async () => {
  try {
    const result = await hostsService.createBackup();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-backup', async (event, backupPath) => {
  try {
    const result = await hostsService.restoreBackup(backupPath);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-backups', async () => {
  try {
    const result = await hostsService.getBackups();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('undo', async () => {
  try {
    const result = await hostsService.undo();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('redo', async () => {
  try {
    const result = await hostsService.redo();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('can-undo', async () => {
  return hostsService.canUndo();
});

ipcMain.handle('can-redo', async () => {
  return hostsService.canRedo();
});

ipcMain.handle('open-hosts-file', async () => {
  try {
    await shell.openPath(hostsFilePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('validate-ip', async (event, ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$|^fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+$|^::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])$|^([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])$/;
  
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return { valid: false, message: 'IP地址格式不正确' };
  }
  
  const parts = ip.split('.');
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) {
      return { valid: false, message: 'IP地址范围应该在0-255之间' };
    }
  }
  
  return { valid: true };
});

ipcMain.handle('validate-domain', async (event, domain) => {
  const domainRegex = /^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+$/;
  const localhostRegex = /^(localhost|localhost\.localdomain)$/i;
  
  if (!domainRegex.test(domain) && !localhostRegex.test(domain)) {
    return { valid: false, message: '域名格式不正确' };
  }
  
  if (domain.length > 255) {
    return { valid: false, message: '域名长度不能超过255个字符' };
  }
  
  return { valid: true };
});

ipcMain.handle('confirm-dialog', async (event, options) => {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: options.type || 'warning',
    title: options.title || '确认',
    message: options.message,
    detail: options.detail || '',
    buttons: options.buttons || ['确定', '取消'],
    defaultId: options.defaultIndex || 0,
    cancelId: options.cancelIndex || 1
  });
  
  return response;
});

ipcMain.handle('show-message', async (event, options) => {
  await dialog.showMessageBox(mainWindow, {
    type: options.type || 'info',
    title: options.title || '消息',
    message: options.message,
    detail: options.detail || ''
  });
});
