// Renderer process for Hello World Electron + Python application
// Handles HTTP communication with Python backend and UI updates

/**
 * Fetches greeting message from Python backend
 * @returns {Promise<string>} The message from backend or error message
 */
async function fetchBackendMessage() {
    try {
        console.log('Fetching message from backend...');
        const response = await fetch('http://localhost:5000/api/hello');
        
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
        // Display error message
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
        backendMessageElement.style.display = 'none';
    } else {
        // Display backend message
        backendMessageElement.textContent = message;
        backendMessageElement.style.display = 'block';
        errorMessageElement.style.display = 'none';
    }
}

// Fetch and display backend message when window loads
window.addEventListener('load', async () => {
    console.log('Window loaded, fetching backend message...');
    const message = await fetchBackendMessage();
    displayMessage(message);
});
