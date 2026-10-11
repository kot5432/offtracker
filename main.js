const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });

let mainWindow;
let serverProcess;

function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting server...');
    serverProcess = spawn('node', ['desktop/_legacy_electron/server-improved.js'], {
      cwd: app.getAppPath(),
      shell: true
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server stdout: ${data}`);
      if (data.toString().includes('Server running at')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server stderr: ${data}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Resolve after a timeout if server doesn't respond
    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the index.html of the app.
  mainWindow.loadURL('http://localhost:3000/home.html');

  // Open the DevTools automatically in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  await startServer();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
