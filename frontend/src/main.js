const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Load package.json to get app name
const packageJson = require(path.join(__dirname, '..', '..', 'package.json'));
const APP_NAME = packageJson.name;

// Set application name for menu bar (must be before app.ready)
app.setName(packageJson.productName || APP_NAME);

let pythonProcess = null;
let mainWindow = null;
let config = null;

// Default configuration
const DEFAULT_CONFIG = {
  backend: {
    host: '127.0.0.1',
    port: 10123
  }
};

/**
 * Get the config directory path based on app name
 * @returns {string} Path to config directory
 */
function getConfigDir() {
  return path.join(os.homedir(), `.${APP_NAME}`);
}

/**
 * Get the config file path
 * @returns {string} Path to config.json
 */
function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`Created config directory: ${configDir}`);
  }
}

/**
 * Load configuration from ~/.{app-name}/config.json
 * Creates default config if it doesn't exist
 */
function loadConfig() {
  try {
    ensureConfigDir();
    const configPath = getConfigPath();
    
    if (!fs.existsSync(configPath)) {
      // Create default config file
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
      console.log(`Created default config file: ${configPath}`);
      config = DEFAULT_CONFIG;
    } else {
      // Load existing config
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
      console.log(`Configuration loaded from: ${configPath}`);
    }
    
    console.log(`Backend will use ${config.backend.host}:${config.backend.port}`);
  } catch (error) {
    console.error('Failed to load or create config.json, using defaults:', error);
    config = DEFAULT_CONFIG;
  }
}

/**
 * Spawns the Python backend process
 * @returns {ChildProcess} The spawned Python process
 */
function startPythonBackend() {
  console.log('Starting Python backend...');
  
  // Path to the Python server script
  const serverPath = path.join(__dirname, '..', '..', 'backend', 'src', 'server.py');
  
  // Spawn Python process
  pythonProcess = spawn('python3', [serverPath]);
  
  // Log stdout from Python process
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python Backend: ${data.toString().trim()}`);
  });
  
  // Log stderr from Python process
  // Note: Python logging writes to stderr by default, so not all stderr is errors
  pythonProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    // Check if it's actually an error or just logging output
    if (message.includes('ERROR') || message.includes('Traceback') || message.includes('Exception')) {
      console.error(`Python Backend Error: ${message}`);
    } else {
      // It's just normal logging output (INFO, WARNING, etc.)
      console.log(`Python Backend: ${message}`);
    }
  });
  
  // Handle process exit
  pythonProcess.on('exit', (code, signal) => {
    console.log(`Python backend exited with code ${code} and signal ${signal}`);
    pythonProcess = null;
  });
  
  // Handle process errors
  pythonProcess.on('error', (error) => {
    console.error('Failed to start Python backend:', error);
    dialog.showErrorBox(
      'Backend Startup Failed',
      `Failed to start Python backend: ${error.message}\n\nPlease ensure Python 3.8+ is installed and dependencies are installed via 'make install'.`
    );
    app.quit();
  });
  
  return pythonProcess;
}

/**
 * Terminates the Python backend process
 */
function stopPythonBackend() {
  if (pythonProcess) {
    console.log('Stopping Python backend...');
    pythonProcess.kill();
    pythonProcess = null;
  }
}

/**
 * Creates the main application window
 */
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    title: packageJson.productName || APP_NAME,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // Center the window on screen
  mainWindow.center();
  
  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle events

app.whenReady().then(() => {
  // Load configuration first
  loadConfig();
  
  // Start Python backend first
  startPythonBackend();
  
  // Give backend a moment to start before creating window
  setTimeout(() => {
    createWindow();
  }, 1000);
  
  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Stop Python backend when app is closing
  stopPythonBackend();
  
  // On macOS, applications typically stay active until user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quit event
app.on('will-quit', () => {
  stopPythonBackend();
});
