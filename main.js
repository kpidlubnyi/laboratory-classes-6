const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const serverUrl = 'http://localhost:3000';

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setMenuBarVisibility(false);

  const checkServerAndLoadPage = () => {
    http.get(serverUrl, (response) => {
      if (response.statusCode === 200) {
        mainWindow.loadURL(serverUrl);
      } else {
        setTimeout(checkServerAndLoadPage, 300);
      }
    }).on('error', (err) => {
      setTimeout(checkServerAndLoadPage, 300);
    });
  };

  startServer();
  checkServerAndLoadPage();

  mainWindow.on('closed', () => {
    mainWindow = null;
    
    if (serverProcess) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
      } else {
        serverProcess.kill('SIGINT');
      }
    }
  });
}

function startServer() {
  serverProcess = spawn('npm', ['start'], {
    cwd: process.cwd(),
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server stdout: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
    } else {
      serverProcess.kill('SIGINT');
    }
  }
});

ipcMain.on('app-logout', () => {
  console.log('Otrzymano żądanie wylogowania, zamykanie aplikacji...');
  app.quit();
});
