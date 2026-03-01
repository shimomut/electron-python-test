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
function handleButtonClick(buttonType) {
    const output = document.getElementById('button-output');
    const timestamp = new Date().toLocaleTimeString();
    output.textContent = `${buttonType} button clicked at ${timestamp}`;
    console.log(`Button clicked: ${buttonType}`);
}

// Make handleButtonClick available globally for onclick handlers
window.handleButtonClick = handleButtonClick;

// File browser data structure
const fileSystem = {
    name: 'Root',
    type: 'folder',
    children: [
        {
            name: 'Documents',
            type: 'folder',
            children: [
                {
                    name: 'Work',
                    type: 'folder',
                    children: [
                        { name: 'report.pdf', type: 'file' },
                        { name: 'presentation.pptx', type: 'file' },
                        { name: 'budget.xlsx', type: 'file' }
                    ]
                },
                {
                    name: 'Personal',
                    type: 'folder',
                    children: [
                        { name: 'resume.pdf', type: 'file' },
                        { name: 'cover-letter.docx', type: 'file' }
                    ]
                },
                { name: 'notes.txt', type: 'file' },
                { name: 'todo.md', type: 'file' }
            ]
        },
        {
            name: 'Pictures',
            type: 'folder',
            children: [
                {
                    name: 'Vacation',
                    type: 'folder',
                    children: [
                        { name: 'beach.jpg', type: 'file' },
                        { name: 'sunset.jpg', type: 'file' },
                        { name: 'mountains.jpg', type: 'file' }
                    ]
                },
                {
                    name: 'Family',
                    type: 'folder',
                    children: [
                        { name: 'reunion.jpg', type: 'file' },
                        { name: 'birthday.jpg', type: 'file' }
                    ]
                },
                { name: 'profile.png', type: 'file' }
            ]
        },
        {
            name: 'Projects',
            type: 'folder',
            children: [
                {
                    name: 'WebApp',
                    type: 'folder',
                    children: [
                        { name: 'index.html', type: 'file' },
                        { name: 'styles.css', type: 'file' },
                        { name: 'app.js', type: 'file' }
                    ]
                },
                {
                    name: 'MobileApp',
                    type: 'folder',
                    children: [
                        { name: 'main.dart', type: 'file' },
                        { name: 'config.yaml', type: 'file' }
                    ]
                }
            ]
        },
        {
            name: 'Downloads',
            type: 'folder',
            children: [
                { name: 'installer.dmg', type: 'file' },
                { name: 'document.pdf', type: 'file' },
                { name: 'archive.zip', type: 'file' }
            ]
        }
    ]
};

let currentPath = [];

/**
 * Renders a column of files/folders
 * @param {Array} items - Array of file/folder objects
 * @param {number} columnIndex - Index of the column
 */
function renderColumn(items, columnIndex) {
    const column = document.createElement('div');
    column.className = 'file-column';
    column.dataset.columnIndex = columnIndex;
    
    items.forEach((item, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        if (item.children) {
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
function handleFileClick(item, columnIndex, element) {
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
    
    // If item has children, add a new column
    if (item.children && item.children.length > 0) {
        const newColumn = renderColumn(item.children, columnIndex + 1);
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
        pathElement.textContent = 'Root';
    } else {
        pathElement.textContent = 'Root / ' + currentPath.join(' / ');
    }
}

/**
 * Initializes the file browser with root items
 */
function initFileBrowser() {
    const columnsContainer = document.getElementById('file-columns');
    columnsContainer.innerHTML = '';
    currentPath = [];
    
    const rootColumn = renderColumn(fileSystem.children, 0);
    columnsContainer.appendChild(rootColumn);
    
    updatePathDisplay();
    console.log('File browser initialized');
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
