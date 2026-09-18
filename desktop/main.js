const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const activeWin = require('active-win');
const fs = require('fs');

let mainWindow;
let trackingInterval;
const dataFile = path.join(__dirname, 'window-data.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the test UI for now
  mainWindow.loadFile(path.join(__dirname, 'desktop-test.html'));

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

async function trackActiveWindow() {
  try {
    const activeWindow = await activeWin();
    const data = {
      timestamp: new Date().toISOString(),
      title: activeWindow.title,
      owner: activeWindow.owner.name,
      id: activeWindow.id
    };

    console.log('Active Window:', data);

    // Save to JSON file
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    // Send to renderer process
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-update', data);
    }

    return data;
  } catch (error) {
    console.error('Error tracking active window:', error);
    return null;
  }
}

// IPC handlers
ipcMain.handle('get-active-window', async () => {
  return await trackActiveWindow();
});

ipcMain.handle('start-tracking', async () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }
  trackingInterval = setInterval(trackActiveWindow, 5000);
  return { success: true, message: 'Tracking started' };
});

ipcMain.handle('stop-tracking', async () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  return { success: true, message: 'Tracking stopped' };
});

ipcMain.handle('get-tracking-data', async () => {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error reading tracking data:', error);
    return null;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});