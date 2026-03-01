// Renderer process for Demo Explorer application
// Handles demo navigation, HTTP communication with Python backend, and UI updates

// Load configuration
const fs = require('fs');
const path = require('path');

let config = null;
try {
    const configPath = path.join(__dirname, '..', '..', 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
} catch (error) {
    console.error('Failed to load config.json, using defaults:', error);
    config = {
        backend: {
            host: '127.0.0.1',
            port: 10123
        }
    };
}

const backendUrl = `http://${config.backend.host}:${config.backend.port}`;

/**
 * Fetches greeting message from Python backend
 * @returns {Promise<string>} The message from backend or error message
 */
async function fetchBackendMessage() {
    try {
        console.log(`Fetching message from backend at ${backendUrl}...`);
        const response = await fetch(`${backendUrl}/api/hello`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Backend response received:', data);
        return data.message;
    } catch (error) {
        console.error('Failed to fetch backend message:', error);
        return 'Backend connection failed';
    }
}

/**
 * Updates DOM with the provided message
 * @param {string} message - The message to display
 */
function displayMessage(message) {
    const backendMessageElement = document.getElementById('backend-message');
    const errorMessageElement = document.getElementById('error-message');
    
    if (message === 'Backend connection failed') {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
        backendMessageElement.style.display = 'none';
    } else {
        backendMessageElement.textContent = message;
        backendMessageElement.style.display = 'block';
        errorMessageElement.style.display = 'none';
    }
}

/**
 * Switches to the specified demo
 * @param {string} demoId - The ID of the demo to display
 */
function switchDemo(demoId) {
    // Hide all demo contents
    const allDemos = document.querySelectorAll('.demo-content');
    allDemos.forEach(demo => demo.classList.remove('active'));
    
    // Remove active class from all demo items
    const allItems = document.querySelectorAll('.demo-item');
    allItems.forEach(item => item.classList.remove('active'));
    
    // Show selected demo
    const selectedDemo = document.getElementById(`${demoId}-demo`);
    if (selectedDemo) {
        selectedDemo.classList.add('active');
    }
    
    // Add active class to selected item
    const selectedItem = document.querySelector(`[data-demo="${demoId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    console.log(`Switched to demo: ${demoId}`);
}

/**
 * Handles button click events in the buttons demo
 * @param {string} buttonType - The type of button clicked
 */
async function handleButtonClick(buttonType) {
    const output = document.getElementById('button-output');
    const timestamp = new Date().toLocaleTimeString();
    
    output.textContent = `Sending ${buttonType} button click to backend...`;
    console.log(`Button clicked: ${buttonType}`);
    
    try {
        const response = await fetch(`${backendUrl}/api/button-click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                buttonType: buttonType,
                timestamp: timestamp
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        output.textContent = `${data.message} at ${timestamp}`;
        console.log('Backend response:', data);
        
    } catch (error) {
        console.error('Failed to send button click to backend:', error);
        output.textContent = `Error: Failed to communicate with backend`;
    }
}

// Make handleButtonClick available globally for onclick handlers
window.handleButtonClick = handleButtonClick;

// File browser state
let currentPath = [];
let fileCache = {};

/**
 * Fetches files from Python backend for the given path
 * @param {string} path - The path to fetch files from
 * @returns {Promise<Array>} Array of file/folder objects
 */
async function fetchFiles(path = '.') {
    try {
        console.log(`Fetching files from backend for path: ${path}`);
        const response = await fetch(`${backendUrl}/api/files?path=${encodeURIComponent(path)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Backend file response:', data);
        
        if (data.status === 'success') {
            return data.items;
        } else {
            throw new Error(data.message || 'Failed to fetch files');
        }
    } catch (error) {
        console.error('Failed to fetch files from backend:', error);
        return [];
    }
}

/**
 * Renders a column of files/folders
 * @param {Array} items - Array of file/folder objects
 * @param {number} columnIndex - Index of the column
 */
function renderColumn(items, columnIndex) {
    const column = document.createElement('div');
    column.className = 'file-column';
    column.dataset.columnIndex = columnIndex;
    
    if (items.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'file-item';
        emptyMessage.style.color = '#999';
        emptyMessage.style.fontStyle = 'italic';
        emptyMessage.textContent = 'Empty folder';
        column.appendChild(emptyMessage);
        return column;
    }
    
    items.forEach((item) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        if (item.type === 'folder') {
            fileItem.classList.add('has-children');
        }
        
        const icon = document.createElement('span');
        icon.className = `file-icon ${item.type}`;
        
        const name = document.createElement('span');
        name.className = 'file-name';
        name.textContent = item.name;
        
        fileItem.appendChild(icon);
        fileItem.appendChild(name);
        
        fileItem.addEventListener('click', () => {
            handleFileClick(item, columnIndex, fileItem);
        });
        
        column.appendChild(fileItem);
    });
    
    return column;
}

/**
 * Handles file/folder click events
 * @param {Object} item - The clicked item
 * @param {number} columnIndex - Index of the column containing the item
 * @param {HTMLElement} element - The clicked DOM element
 */
async function handleFileClick(item, columnIndex, element) {
    // Remove selection from all items in this column
    const column = element.parentElement;
    column.querySelectorAll('.file-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Select clicked item
    element.classList.add('selected');
    
    // Update path
    currentPath = currentPath.slice(0, columnIndex);
    currentPath.push(item.name);
    
    // Remove columns after this one
    const columnsContainer = document.getElementById('file-columns');
    const allColumns = columnsContainer.querySelectorAll('.file-column');
    allColumns.forEach((col, idx) => {
        if (idx > columnIndex) {
            col.remove();
        }
    });
    
    // If item is a folder, fetch its contents and add a new column
    if (item.type === 'folder') {
        const folderPath = item.path;
        const children = await fetchFiles(folderPath);
        
        const newColumn = renderColumn(children, columnIndex + 1);
        columnsContainer.appendChild(newColumn);
    }
    
    // Update footer path
    updatePathDisplay();
    
    console.log(`Selected: ${item.name} (${item.type})`);
}

/**
 * Updates the path display in the footer
 */
function updatePathDisplay() {
    const pathElement = document.getElementById('file-path');
    if (currentPath.length === 0) {
        pathElement.textContent = 'Project Root';
    } else {
        pathElement.textContent = 'Project Root / ' + currentPath.join(' / ');
    }
}

/**
 * Initializes the file browser with root items
 */
async function initFileBrowser() {
    const columnsContainer = document.getElementById('file-columns');
    columnsContainer.innerHTML = '<div style="padding: 20px; color: #999;">Loading files...</div>';
    currentPath = [];
    fileCache = {};
    
    const rootItems = await fetchFiles('.');
    
    columnsContainer.innerHTML = '';
    const rootColumn = renderColumn(rootItems, 0);
    columnsContainer.appendChild(rootColumn);
    
    updatePathDisplay();
    console.log('File browser initialized with real files from backend');
}

// Initialize demo navigation
window.addEventListener('load', async () => {
    console.log('Window loaded, initializing demos...');
    
    // Set up demo navigation
    const demoItems = document.querySelectorAll('.demo-item');
    demoItems.forEach(item => {
        item.addEventListener('click', () => {
            const demoId = item.getAttribute('data-demo');
            switchDemo(demoId);
            
            // Initialize file browser when switching to it
            if (demoId === 'file-browser') {
                initFileBrowser();
            }
        });
    });
    
    // Fetch backend message for hello-world demo
    const message = await fetchBackendMessage();
    displayMessage(message);
});
