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

// Initialize demo navigation
window.addEventListener('load', async () => {
    console.log('Window loaded, initializing demos...');
    
    // Set up demo navigation
    const demoItems = document.querySelectorAll('.demo-item');
    demoItems.forEach(item => {
        item.addEventListener('click', () => {
            const demoId = item.getAttribute('data-demo');
            switchDemo(demoId);
        });
    });
    
    // Fetch backend message for hello-world demo
    const message = await fetchBackendMessage();
    displayMessage(message);
});
