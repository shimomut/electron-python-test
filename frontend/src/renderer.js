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

// Explorer pane resize functionality
let isResizing = false;
let startX = 0;
let startWidth = 0;

/**
 * Initializes the explorer pane resize functionality
 */
function initExplorerResize() {
    const resizeHandle = document.getElementById('resize-handle');
    const explorerPane = document.getElementById('explorer-pane');
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = explorerPane.offsetWidth;
        resizeHandle.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const delta = e.clientX - startX;
        const newWidth = startWidth + delta;
        
        // Enforce min and max width
        const minWidth = 150;
        const maxWidth = 500;
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        
        explorerPane.style.width = `${constrainedWidth}px`;
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizeHandle.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
    
    console.log('Explorer pane resize initialized');
}

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

// Charts demo state
let charts = {};
let chartUpdateInterval = null;

/**
 * Creates a Chart.js line chart
 * @param {string} canvasId - ID of the canvas element
 * @param {string} label - Label for the dataset
 * @param {string} borderColor - Color of the line
 * @param {string} backgroundColor - Background color
 * @returns {Chart} Chart.js instance
 */
function createChart(canvasId, label, borderColor, backgroundColor) {
    const ctx = document.getElementById(canvasId);
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Fetches time series data from Python backend
 * @returns {Promise<Object>} Time series data
 */
async function fetchTimeSeriesData() {
    try {
        const response = await fetch(`${backendUrl}/api/timeseries`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            return data.data;
        } else {
            throw new Error(data.message || 'Failed to fetch time series data');
        }
    } catch (error) {
        console.error('Failed to fetch time series data:', error);
        return null;
    }
}

/**
 * Updates all charts with new data
 * @param {Object} data - Time series data from backend
 */
function updateCharts(data) {
    if (!data) return;
    
    const labels = data.timestamps || data.labels;
    
    // Update CPU chart
    charts.cpu.data.labels = labels;
    charts.cpu.data.datasets[0].data = data.cpu;
    charts.cpu.update();
    
    // Update Memory chart
    charts.memory.data.labels = labels;
    charts.memory.data.datasets[0].data = data.memory;
    charts.memory.update();
    
    // Update Network chart
    charts.network.data.labels = labels;
    charts.network.data.datasets[0].data = data.network;
    charts.network.update();
    
    // Update Requests chart
    charts.requests.data.labels = labels;
    charts.requests.data.datasets[0].data = data.requests;
    charts.requests.update();
    
    // Update Disk I/O chart
    charts.disk.data.labels = labels;
    charts.disk.data.datasets[0].data = data.disk_io;
    charts.disk.update();
    
    // Update Response Time chart
    charts.response.data.labels = labels;
    charts.response.data.datasets[0].data = data.response_time;
    charts.response.update();
    
    // Update Error Rate chart
    charts.error.data.labels = labels;
    charts.error.data.datasets[0].data = data.error_rate;
    charts.error.update();
    
    // Update Active Users chart
    charts.users.data.labels = labels;
    charts.users.data.datasets[0].data = data.active_users;
    charts.users.update();
    
    // Update status
    const statusElement = document.getElementById('update-status');
    const now = new Date();
    statusElement.textContent = `Last updated: ${now.toLocaleTimeString()} (updates every 5 seconds)`;
}

/**
 * Initializes the charts demo
 */
async function initCharts() {
    console.log('Initializing charts demo...');
    
    // Create charts
    charts.cpu = createChart('cpu-chart', 'CPU Usage', 'rgb(54, 162, 235)', 'rgba(54, 162, 235, 0.1)');
    charts.memory = createChart('memory-chart', 'Memory Usage', 'rgb(255, 99, 132)', 'rgba(255, 99, 132, 0.1)');
    charts.network = createChart('network-chart', 'Network Traffic', 'rgb(75, 192, 192)', 'rgba(75, 192, 192, 0.1)');
    charts.requests = createChart('requests-chart', 'Request Rate', 'rgb(255, 159, 64)', 'rgba(255, 159, 64, 0.1)');
    charts.disk = createChart('disk-chart', 'Disk I/O', 'rgb(153, 102, 255)', 'rgba(153, 102, 255, 0.1)');
    charts.response = createChart('response-chart', 'Response Time', 'rgb(255, 205, 86)', 'rgba(255, 205, 86, 0.1)');
    charts.error = createChart('error-chart', 'Error Rate', 'rgb(255, 99, 71)', 'rgba(255, 99, 71, 0.1)');
    charts.users = createChart('users-chart', 'Active Users', 'rgb(34, 139, 34)', 'rgba(34, 139, 34, 0.1)');
    
    // Fetch initial data
    const data = await fetchTimeSeriesData();
    updateCharts(data);
    
    // Set up periodic updates
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
    }
    
    chartUpdateInterval = setInterval(async () => {
        const data = await fetchTimeSeriesData();
        updateCharts(data);
    }, 5000);
    
    console.log('Charts initialized with 5-second update interval');
}

/**
 * Cleans up charts demo
 */
function cleanupCharts() {
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
        chartUpdateInterval = null;
    }
    
    // Destroy chart instances
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    charts = {};
    
    console.log('Charts cleaned up');
}

// Logs demo state
let logsUpdateInterval = null;
let logsPaused = false;
let maxLogEntries = 500;

// 3D graphics state
let graphics3d = null;

/**
 * Initializes the 3D graphics demo
 */
function initGraphics3D() {
    console.log('Initializing 3D graphics demo...');
    
    if (graphics3d) {
        graphics3d.dispose();
    }
    
    // Graphics3D is loaded from graphics3d.js module and attached to window
    if (typeof window.Graphics3D !== 'undefined') {
        graphics3d = new window.Graphics3D('graphics-container');
        graphics3d.init();
        console.log('3D graphics initialized');
    } else {
        console.error('Graphics3D class not found - module may not have loaded yet');
    }
}

/**
 * Cleans up 3D graphics demo
 */
function cleanupGraphics3D() {
    if (graphics3d) {
        graphics3d.dispose();
        graphics3d = null;
        console.log('3D graphics cleaned up');
    }
}

/**
 * Fetches log entries from Python backend
 * @returns {Promise<Array>} Array of log entries
 */
async function fetchLogs() {
    try {
        const response = await fetch(`${backendUrl}/api/logs`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            return data.logs;
        } else {
            throw new Error(data.message || 'Failed to fetch logs');
        }
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        return [];
    }
}

/**
 * Appends log entries to the log container
 * @param {Array} logs - Array of log entries
 */
function appendLogs(logs) {
    const container = document.getElementById('logs-container');
    
    logs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = log.timestamp;
        
        const level = document.createElement('span');
        level.className = `log-level-${log.level.toLowerCase()}`;
        level.textContent = `[${log.level}]`;
        
        const message = document.createElement('span');
        message.className = 'log-message';
        message.textContent = log.message;
        
        entry.appendChild(timestamp);
        entry.appendChild(level);
        entry.appendChild(document.createTextNode(' '));
        entry.appendChild(message);
        
        container.appendChild(entry);
    });
    
    // Trim old entries if exceeding max
    while (container.children.length > maxLogEntries) {
        container.removeChild(container.firstChild);
    }
    
    // Auto-scroll to bottom if not paused
    if (!logsPaused) {
        container.scrollTop = container.scrollHeight;
    }
}

/**
 * Clears all log entries
 */
function clearLogs() {
    const container = document.getElementById('logs-container');
    container.innerHTML = '';
    console.log('Logs cleared');
}

/**
 * Toggles log streaming pause state
 */
function toggleLogsPause() {
    logsPaused = !logsPaused;
    const button = document.getElementById('pause-logs-btn');
    const statusText = document.getElementById('logs-status-text');
    
    if (logsPaused) {
        button.textContent = 'Resume';
        statusText.textContent = 'Paused';
    } else {
        button.textContent = 'Pause';
        statusText.textContent = 'Streaming...';
        // Auto-scroll to bottom when resuming
        const container = document.getElementById('logs-container');
        container.scrollTop = container.scrollHeight;
    }
    
    console.log(`Logs ${logsPaused ? 'paused' : 'resumed'}`);
}

/**
 * Initializes the logs demo
 */
async function initLogs() {
    console.log('Initializing logs demo...');
    
    // Don't clear existing logs - preserve them
    logsPaused = false;
    
    // Update button states
    const pauseButton = document.getElementById('pause-logs-btn');
    const statusText = document.getElementById('logs-status-text');
    pauseButton.textContent = 'Pause';
    statusText.textContent = 'Streaming...';
    
    // Set up button handlers (only if not already set)
    const clearButton = document.getElementById('clear-logs-btn');
    if (!clearButton.onclick) {
        clearButton.onclick = clearLogs;
    }
    if (!pauseButton.onclick) {
        pauseButton.onclick = toggleLogsPause;
    }
    
    // Fetch initial logs only if container is empty
    const container = document.getElementById('logs-container');
    if (container.children.length === 0) {
        const logs = await fetchLogs();
        appendLogs(logs);
    }
    
    // Set up periodic updates
    if (logsUpdateInterval) {
        clearInterval(logsUpdateInterval);
    }
    
    logsUpdateInterval = setInterval(async () => {
        if (!logsPaused) {
            const logs = await fetchLogs();
            appendLogs(logs);
        }
    }, 2000);
    
    console.log('Logs initialized with 2-second update interval (preserving existing logs)');
}

/**
 * Cleans up logs demo
 */
function cleanupLogs() {
    if (logsUpdateInterval) {
        clearInterval(logsUpdateInterval);
        logsUpdateInterval = null;
    }
    
    // Don't reset logsPaused - preserve pause state
    // Don't clear logs - preserve them
    
    console.log('Logs paused (logs preserved)');
}

// Initialize demo navigation
window.addEventListener('load', async () => {
    console.log('Window loaded, initializing demos...');
    
    // Initialize explorer pane resize
    initExplorerResize();
    
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
            
            // Initialize charts when switching to it
            if (demoId === 'charts') {
                initCharts();
            } else {
                // Clean up charts when switching away
                cleanupCharts();
            }
            
            // Initialize logs when switching to it
            if (demoId === 'logs') {
                initLogs();
            } else {
                // Clean up logs when switching away
                cleanupLogs();
            }
            
            // Initialize 3D graphics when switching to it
            if (demoId === 'graphics3d') {
                initGraphics3D();
            } else {
                // Clean up 3D graphics when switching away
                cleanupGraphics3D();
            }
        });
    });
    
    // Fetch backend message for hello-world demo
    const message = await fetchBackendMessage();
    displayMessage(message);
});
