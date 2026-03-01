# Architecture Documentation

## System Overview

This application demonstrates a minimal integration between an Electron desktop frontend and a Python Flask backend. The architecture follows a client-server pattern with process lifecycle management, where the Electron main process spawns and manages the Python backend as a subprocess.

### Technology Stack

- **Frontend**: Electron 28.0.0 (Chromium-based desktop framework)
- **Backend**: Python 3.8+ with Flask web framework
- **Communication**: HTTP REST API over localhost
- **Build Automation**: GNU Make
- **Testing**: Jest (frontend), pytest (backend)

### Key Design Principles

1. **Process Isolation**: Frontend and backend run as separate processes
2. **Lifecycle Management**: Electron controls backend startup and shutdown
3. **Clear Separation**: Frontend (UI) and backend (logic) concerns are separated
4. **Error Resilience**: Proper error handling at all communication boundaries

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                Electron Main Process                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Process Lifecycle Manager                         │ │
│  │  - Spawns Python backend on startup                │ │
│  │  - Terminates Python backend on shutdown           │ │
│  │  - Monitors subprocess health                      │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Window Manager                                    │ │
│  │  - Creates BrowserWindow (800x600)                 │ │
│  │  - Centers window on screen                        │ │
│  │  - Manages window lifecycle                        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ IPC (Internal)
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Electron Renderer Process                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  UI Layer (HTML/CSS/JS)                            │ │
│  │  - Displays static "Hello World" message           │ │
│  │  - Shows dynamic backend response                  │ │
│  │  - Handles error states                            │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  HTTP Client (Fetch API)                           │ │
│  │  - Fetches data from Python backend                │ │
│  │  - Handles connection errors                       │ │
│  │  - Updates UI based on responses                   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP (localhost:5000)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Python Backend Process                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Flask Web Server                                  │ │
│  │  - Listens on 127.0.0.1:5000                       │ │
│  │  - Handles HTTP requests                           │ │
│  │  - Single-threaded, debug=False                    │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  API Endpoints                                     │ │
│  │  - GET /api/hello → {"message": "..."}             │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Logging System (Python logging module)           │ │
│  │  - Logs all requests (method + path)              │ │
│  │  - Logs startup confirmation                       │ │
│  │  - Logs errors at ERROR level                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
hello-world-electron-python/
├── frontend/                 # Electron frontend code
│   ├── src/
│   │   ├── main.js          # Main process (Node.js)
│   │   ├── renderer.js      # Renderer process (browser context)
│   │   └── index.html       # UI markup
│   └── tests/               # Frontend tests (Jest)
│
├── backend/                  # Python backend code
│   ├── src/
│   │   └── server.py        # Flask application
│   └── tests/               # Backend tests (pytest)
│       └── test_server.py
│
├── docs/                     # Documentation
│   ├── user/                # End-user documentation
│   │   └── getting-started.md
│   └── dev/                 # Developer documentation
│       └── architecture.md  # This file
│
├── temp/                     # Temporary files (gitignored)
├── venv/                     # Python virtual environment (gitignored)
├── node_modules/             # npm dependencies (gitignored)
│
├── Makefile                  # Build automation
├── package.json              # npm configuration
├── requirements.txt          # Python dependencies
├── README.md                 # Project overview
└── .gitignore               # Git ignore rules
```

### File Organization Principles

- **Frontend source**: All Electron code in `frontend/src/`
- **Backend source**: All Python code in `backend/src/`
- **Tests co-located**: Tests in parallel `tests/` directories
- **Documentation separation**: User docs vs developer docs
- **Temporary files**: Always use `temp/` directory during development

## Component Details

### Frontend Components

#### Main Process (`frontend/src/main.js`)

The main process is the entry point for the Electron application and runs in a Node.js environment.

**Responsibilities**:
- Application lifecycle management
- Python backend subprocess spawning and termination
- Window creation and configuration
- Error handling for backend startup failures

**Key Functions**:

```javascript
startPythonBackend()
  // Spawns Python backend as subprocess
  // Returns: ChildProcess
  // Side effects: Sets up stdout/stderr logging, error handlers
  // Error handling: Shows dialog and quits app on failure

createWindow()
  // Creates main application window
  // Configuration: 800x600, centered, title set
  // Loads index.html into window

stopPythonBackend()
  // Terminates Python subprocess
  // Called on app quit and window close events
```

**Process Lifecycle**:
1. `app.whenReady()` → Start Python backend
2. Wait 1 second for backend to initialize
3. Create window and load UI
4. On `window-all-closed` → Stop backend and quit
5. On `will-quit` → Ensure backend is stopped

#### Renderer Process (`frontend/src/renderer.js`)

The renderer process runs in a browser context and handles UI interactions.

**Responsibilities**:
- HTTP communication with Python backend
- DOM manipulation and UI updates
- Error display and handling

**Key Functions**:

```javascript
async fetchBackendMessage()
  // Fetches greeting from backend
  // HTTP: GET http://localhost:5000/api/hello
  // Returns: Promise<string> (message or error)
  // Error handling: Catches network errors, returns "Backend connection failed"

displayMessage(message)
  // Updates DOM with message or error
  // Shows/hides appropriate DOM elements
  // Handles both success and error states
```

**Communication Flow**:
1. Window loads → `window.addEventListener('load')`
2. Call `fetchBackendMessage()`
3. Fetch API makes HTTP GET request
4. Parse JSON response
5. Call `displayMessage()` with result
6. Update DOM elements

#### UI Layer (`frontend/src/index.html`)

Simple HTML structure with embedded CSS.

**Structure**:
- Static heading: "Hello World from Electron + Python!"
- Dynamic `#backend-message` div for backend response
- Dynamic `#error-message` div for errors (hidden by default)
- Inline styles for centered layout

### Backend Components

#### Flask Application (`backend/src/server.py`)

Single-file Flask application with logging configuration.

**Responsibilities**:
- HTTP server initialization and configuration
- Request routing and handling
- Response formatting (JSON)
- Request and error logging

**Key Components**:

```python
# Module-level logging configuration
logging.basicConfig(level=logging.INFO, format='...')
logger = logging.getLogger(__name__)

# Flask app instance
app = Flask(__name__)

@app.before_request
def log_request()
  # Logs all incoming requests with method and path
  # Example: "GET /api/hello"

@app.route('/api/hello', methods=['GET'])
def hello()
  # Returns: {"message": "Hello from Python Backend!"}

def main()
  # Starts Flask server on 127.0.0.1:5000
  # Logs: "Backend server started on port 5000"
```

**Server Configuration**:
- Host: `127.0.0.1` (localhost only, not exposed to network)
- Port: `5000`
- Debug: `False` (production mode)
- Single-threaded (default Flask behavior)

### Build Automation (`Makefile`)

The Makefile provides convenient commands for common development tasks.

**Available Targets**:

```makefile
make help     # Display available commands (default target)
make install  # Install all dependencies (npm + Python venv)
make run      # Start the Electron application
make test     # Run all tests (frontend + backend)
make clean    # Remove dependencies and temporary files
```

**Target Details**:

- **install**: Installs npm packages, creates Python venv, installs Python packages
- **run**: Executes `npm start` which launches Electron
- **test**: Runs `npm test` (Jest) and `pytest backend/tests/`
- **clean**: Removes `node_modules/`, `venv/`, `__pycache__/`, `temp/`
- **help**: Displays usage information

**Important**: All commands are visible (no `@` prefix) per requirement 4.6.

## Communication Protocol

### HTTP API Contract

#### GET /api/hello

**Request**:
```http
GET /api/hello HTTP/1.1
Host: localhost:5000
```

**Success Response** (200 OK):
```json
{
  "message": "Hello from Python Backend!"
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "error": "Error description"
}
```

### Process Communication

**Electron → Python**:
- Electron spawns Python as subprocess using `child_process.spawn()`
- Python stdout/stderr piped to Electron console
- No direct IPC between processes (HTTP only)

**Frontend → Backend**:
- HTTP requests using Fetch API
- JSON responses
- Error handling for network failures

## Error Handling Patterns

### Frontend Error Handling

#### Backend Connection Failure

```javascript
// Pattern: Try-catch with fetch
try {
  const response = await fetch('http://localhost:5000/api/hello');
  // Handle response
} catch (error) {
  console.error('Failed to fetch backend message:', error);
  return 'Backend connection failed';
}
```

**Causes**:
- Python backend not started
- Backend crashed
- Port 5000 not reachable
- Network timeout

**Handling**:
- Display "Backend connection failed" in UI
- Log error with `console.error()`
- No automatic retry

#### Backend Startup Failure

```javascript
// Pattern: Process error event handler
pythonProcess.on('error', (error) => {
  console.error('Failed to start Python backend:', error);
  dialog.showErrorBox('Backend Startup Failed', message);
  app.quit();
});
```

**Causes**:
- Python not installed
- Missing dependencies
- Port 5000 already in use
- File permissions

**Handling**:
- Show error dialog to user
- Log error with `console.error()`
- Quit application gracefully

### Backend Error Handling

#### Request Processing Errors

```python
# Pattern: Flask error handlers (implicit)
# Flask automatically catches exceptions and returns 500
# Errors logged via logging module
```

**Causes**:
- Unexpected exceptions in endpoint handlers
- Invalid request data
- Internal server errors

**Handling**:
- Log error with `logger.error()`
- Return 500 status code
- Include error details in response

#### Port Conflict

```python
# Pattern: Flask startup exception
try:
    app.run(host='127.0.0.1', port=5000)
except Exception as e:
    logger.error(f"Failed to start server: {e}")
    sys.exit(1)
```

**Causes**:
- Another process using port 5000
- Insufficient permissions

**Handling**:
- Log error with `logger.error()`
- Exit with non-zero code
- Electron detects exit and shows error

### Logging Standards

#### Frontend Logging

```javascript
// Informational messages
console.log('Window loaded, fetching backend message...');

// Error messages
console.error('Failed to fetch backend message:', error);
```

**Rules**:
- Use `console.log()` for informational messages
- Use `console.error()` for errors
- Never use `console.log()` for errors (violates requirement 6.5)

#### Backend Logging

```python
# Module-level logger
logger = logging.getLogger(__name__)

# Informational messages
logger.info("Backend server started on port 5000")
logger.info(f"{request.method} {request.path}")

# Error messages
logger.error(f"Processing failed: {e}")
```

**Rules**:
- Use Python's `logging` module (never `print()`)
- Use `logger.info()` for normal operations
- Use `logger.error()` for errors (requirement 6.4)
- Log all requests with method and path (requirement 6.3)

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd hello-world-electron-python

# 2. Install dependencies
make install

# 3. Verify installation
make test
```

### Running the Application

```bash
# Start application (spawns backend automatically)
make run

# Application will:
# 1. Start Python backend on port 5000
# 2. Wait 1 second for backend initialization
# 3. Open Electron window
# 4. Fetch and display backend message
```

### Development Cycle

```bash
# 1. Make code changes
vim frontend/src/renderer.js

# 2. Run tests
make test

# 3. Test manually
make run

# 4. Clean and rebuild if needed
make clean
make install
```

### Testing Strategy

#### Unit Tests

**Frontend** (Jest):
- Window creation and configuration
- Backend message display
- Error message display
- Mock fetch API to avoid real HTTP requests

**Backend** (pytest):
- `/api/hello` endpoint returns correct JSON
- Startup logging message appears
- Request logging includes method and path
- Error responses return 500 status

**Running Tests**:
```bash
# All tests
make test

# Frontend only
npm test

# Backend only
source venv/bin/activate
pytest backend/tests/
```

#### Integration Testing

**Manual Integration Test**:
1. Run `make run`
2. Verify window opens with title "Hello World App"
3. Verify static message displays
4. Verify backend message displays after ~1 second
5. Close window
6. Verify Python process terminates

**Automated Integration Tests**:
- Full startup sequence (Electron → Python → HTTP → UI)
- Shutdown sequence (window close → process termination)
- End-to-end message flow

### Debugging

#### Frontend Debugging

```bash
# Open DevTools in Electron
# Add to main.js:
mainWindow.webContents.openDevTools();

# View console logs
# Check Network tab for HTTP requests
# Inspect DOM elements
```

#### Backend Debugging

```bash
# Run backend standalone for testing
source venv/bin/activate
python3 backend/src/server.py

# Test endpoint manually
curl http://localhost:5000/api/hello

# View logs in terminal
# Check for startup message and request logs
```

#### Common Issues

**Issue**: "Backend connection failed" in UI
- **Cause**: Python backend not started or crashed
- **Debug**: Check Electron console for Python process errors
- **Fix**: Ensure Python 3.8+ installed, dependencies installed

**Issue**: Port 5000 already in use
- **Cause**: Another process using port 5000
- **Debug**: `lsof -i :5000` or `netstat -an | grep 5000`
- **Fix**: Kill conflicting process or change port

**Issue**: Window doesn't open
- **Cause**: Electron startup failure
- **Debug**: Check terminal for error messages
- **Fix**: Ensure Node.js 16+ installed, run `make install`

## Makefile Targets Reference

### make install

Installs all project dependencies.

**Steps**:
1. Runs `npm install` to install Electron and Jest
2. Creates Python virtual environment with `python3 -m venv venv`
3. Installs Python packages with `./venv/bin/pip install -r requirements.txt`

**When to use**:
- Initial project setup
- After pulling new dependencies
- After `make clean`

**Requirements**: Node.js 16+, Python 3.8+

### make run

Starts the Electron application.

**Steps**:
1. Executes `npm start`
2. Electron starts and spawns Python backend
3. Window opens after 1-second delay

**When to use**:
- Testing the application
- Demonstrating functionality
- Manual integration testing

**Note**: This is a blocking command (GUI application). Close window to exit.

### make test

Runs all tests for frontend and backend.

**Steps**:
1. Runs `npm test` (Jest frontend tests)
2. Activates venv and runs `pytest backend/tests/`

**When to use**:
- Before committing changes
- After implementing new features
- Continuous integration

**Requirements**: Dependencies installed via `make install`

### make clean

Removes all dependencies and temporary files.

**Steps**:
1. Removes `node_modules/` directory
2. Removes `venv/` directory
3. Removes all `__pycache__/` directories
4. Removes `temp/` directory

**When to use**:
- Cleaning up disk space
- Resolving dependency conflicts
- Starting fresh after major changes

**Note**: Run `make install` after cleaning to restore dependencies.

### make help

Displays available Makefile targets with descriptions.

**When to use**:
- Learning available commands
- Quick reference
- Onboarding new developers

## Extension Points

### Adding New API Endpoints

1. Add route to `backend/src/server.py`:
```python
@app.route('/api/newendpoint', methods=['GET'])
def new_endpoint():
    logger.info("New endpoint called")
    return jsonify({"data": "value"})
```

2. Add frontend function in `frontend/src/renderer.js`:
```javascript
async function fetchNewData() {
    const response = await fetch('http://localhost:5000/api/newendpoint');
    return await response.json();
}
```

3. Add tests for both frontend and backend

### Adding Frontend Features

1. Update `frontend/src/index.html` with new UI elements
2. Add JavaScript logic in `frontend/src/renderer.js`
3. Follow logging standards (`console.log()` for info, `console.error()` for errors)
4. Add Jest tests in `frontend/tests/`

### Adding Backend Features

1. Add Python code to `backend/src/server.py`
2. Use `logger.info()` and `logger.error()` for logging
3. Add pytest tests in `backend/tests/`
4. Update `requirements.txt` if new dependencies needed

## Security Considerations

### Current Security Posture

- **Backend**: Listens only on `127.0.0.1` (localhost), not exposed to network
- **No Authentication**: No auth required (acceptable for local-only demo)
- **No Input Validation**: Minimal validation (acceptable for demo)
- **Node Integration**: Enabled in renderer (required for simple demo)

### Production Recommendations

If extending this application for production use:

1. **Disable Node Integration**: Use `contextIsolation: true` and preload scripts
2. **Add Authentication**: Implement token-based auth for API
3. **Input Validation**: Validate all user inputs and API parameters
4. **HTTPS**: Use HTTPS even for localhost communication
5. **CSP**: Implement Content Security Policy headers
6. **Dependency Auditing**: Regularly run `npm audit` and `pip-audit`

## Performance Considerations

### Current Performance Characteristics

- **Startup Time**: ~1-2 seconds (includes Python backend initialization)
- **HTTP Latency**: <10ms for localhost requests
- **Memory Usage**: ~100MB (Electron) + ~50MB (Python)
- **CPU Usage**: Minimal when idle

### Optimization Opportunities

1. **Reduce Startup Delay**: Currently hardcoded 1-second wait; could poll backend health
2. **Connection Pooling**: Reuse HTTP connections for multiple requests
3. **Caching**: Cache backend responses if data is static
4. **Lazy Loading**: Load UI components on demand

## Troubleshooting Guide

### Application Won't Start

**Symptoms**: `make run` fails or window doesn't open

**Checks**:
1. Verify Node.js version: `node --version` (should be 16+)
2. Verify Python version: `python3 --version` (should be 3.8+)
3. Verify dependencies installed: `ls node_modules/ venv/`
4. Check for error messages in terminal

**Solutions**:
- Run `make install` to install dependencies
- Check system requirements in `docs/user/getting-started.md`

### Backend Connection Failed

**Symptoms**: UI shows "Backend connection failed"

**Checks**:
1. Check Electron console for Python process errors
2. Verify port 5000 is not in use: `lsof -i :5000`
3. Check Python dependencies: `source venv/bin/activate && pip list`

**Solutions**:
- Restart application
- Kill process on port 5000
- Reinstall Python dependencies: `make clean && make install`

### Tests Failing

**Symptoms**: `make test` reports failures

**Checks**:
1. Check which tests are failing (frontend or backend)
2. Read test error messages carefully
3. Verify code changes didn't break existing functionality

**Solutions**:
- Run tests individually: `npm test` or `pytest backend/tests/`
- Review recent code changes
- Check test files for outdated expectations

## Additional Resources

- **User Documentation**: `docs/user/getting-started.md`
- **Project README**: `README.md`
- **Flask Documentation**: https://flask.palletsprojects.com/
- **Electron Documentation**: https://www.electronjs.org/docs/latest/
- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **pytest Documentation**: https://docs.pytest.org/

## Maintenance Notes

### Dependency Updates

**npm packages**:
```bash
npm outdated          # Check for updates
npm update            # Update minor versions
npm install <pkg>@latest  # Update major versions
```

**Python packages**:
```bash
source venv/bin/activate
pip list --outdated   # Check for updates
pip install --upgrade <package>  # Update packages
pip freeze > requirements.txt  # Update requirements.txt
```

### Code Quality

**Linting**:
- Frontend: Consider adding ESLint
- Backend: Consider adding pylint or flake8

**Formatting**:
- Frontend: Consider adding Prettier
- Backend: Consider adding Black

### Version Control

**Gitignored Items**:
- `node_modules/` - npm dependencies
- `venv/` - Python virtual environment
- `__pycache__/` - Python bytecode
- `temp/` - Temporary files

**Committed Items**:
- Source code (`frontend/src/`, `backend/src/`)
- Tests (`frontend/tests/`, `backend/tests/`)
- Documentation (`docs/`)
- Configuration (`package.json`, `requirements.txt`, `Makefile`)
