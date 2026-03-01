# Design Document: Hello World Electron + Python

## Overview

This design document specifies the technical architecture for a minimal "Hello World" application that demonstrates integration between an Electron frontend and a Python backend. The application serves as a foundational example showing the basic communication pattern between desktop UI (Electron) and server-side processing (Python).

### Key Design Goals

1. **Simplicity**: Minimal implementation demonstrating core integration patterns
2. **Clarity**: Clear separation between frontend and backend concerns
3. **Automation**: Streamlined development workflow through Makefile commands
4. **Reliability**: Proper lifecycle management and error handling

### Technology Stack

- **Frontend**: Electron (Node.js-based desktop framework)
- **Backend**: Python 3.8+ with Flask web framework
- **Communication**: HTTP REST API
- **Build Automation**: GNU Make

## Architecture

### System Architecture

The application follows a client-server architecture with process lifecycle management:

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Process Lifecycle Manager                         │ │
│  │  - Spawns Python backend on startup                │ │
│  │  - Terminates Python backend on shutdown           │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Window Manager                                    │ │
│  │  - Creates BrowserWindow (800x600)                 │ │
│  │  - Centers window on screen                        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ IPC
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Electron Renderer Process                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  UI Layer (HTML/CSS/JS)                            │ │
│  │  - Displays "Hello World" message                  │ │
│  │  - Shows backend response                          │ │
│  │  - Handles error states                            │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  HTTP Client                                       │ │
│  │  - Fetches data from Python backend                │ │
│  │  - Handles connection errors                       │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP (localhost:5000)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Python Backend Process                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Flask Web Server                                  │ │
│  │  - Listens on port 5000                            │ │
│  │  - Handles HTTP requests                           │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  API Endpoints                                     │ │
│  │  - GET /api/hello → Returns greeting JSON          │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Logging System                                    │ │
│  │  - Logs requests and errors                        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Process Lifecycle

1. **Startup Sequence**:
   - User executes `make run` or `npm start`
   - Electron main process starts
   - Main process spawns Python backend subprocess
   - Backend starts Flask server on port 5000
   - Backend logs startup confirmation
   - Main process creates BrowserWindow
   - Renderer loads HTML and makes HTTP request to backend
   - UI displays combined frontend + backend messages

2. **Shutdown Sequence**:
   - User closes application window
   - Electron main process receives 'window-all-closed' event
   - Main process terminates Python backend subprocess
   - Main process exits

### Communication Flow

```
Renderer Process          Main Process          Python Backend
      │                        │                       │
      │  window.onload         │                       │
      ├───────────────────────►│                       │
      │                        │                       │
      │  fetch('/api/hello')   │                       │
      ├────────────────────────┼──────────────────────►│
      │                        │                       │
      │                        │   GET /api/hello      │
      │                        │                       │
      │                        │   {"message": "..."}  │
      │◄───────────────────────┼───────────────────────┤
      │                        │                       │
      │  Display message       │                       │
      │                        │                       │
```

## Components and Interfaces

### Frontend Components

#### 1. Main Process (main.js)

**Responsibilities**:
- Application lifecycle management
- Python backend process spawning and termination
- Window creation and configuration

**Key Functions**:

```javascript
// Spawns Python backend process
function startPythonBackend()
  Input: None
  Output: ChildProcess
  Side Effects: Spawns subprocess, sets up logging
  Error Handling: Logs errors, shows dialog on failure

// Creates and configures main window
function createWindow()
  Input: None
  Output: BrowserWindow
  Side Effects: Creates window, loads HTML
  Configuration: 800x600, centered, title set

// Terminates Python backend
function stopPythonBackend()
  Input: ChildProcess
  Output: None
  Side Effects: Kills subprocess
```

#### 2. Renderer Process (renderer.js)

**Responsibilities**:
- HTTP communication with Python backend
- UI updates based on backend responses
- Error display and handling

**Key Functions**:

```javascript
// Fetches greeting from backend
async function fetchBackendMessage()
  Input: None
  Output: Promise<string>
  HTTP: GET http://localhost:5000/api/hello
  Error Handling: Catches network errors, returns error message

// Updates DOM with message
function displayMessage(message)
  Input: string
  Output: None
  Side Effects: Updates DOM element
```

#### 3. UI Layer (index.html)

**Structure**:
- Window title: "Hello World App"
- Static message: "Hello World from Electron + Python!"
- Dynamic message area for backend response
- Error message area (hidden by default)

### Backend Components

#### 1. Flask Application (server.py)

**Responsibilities**:
- HTTP server initialization
- Request routing
- Response formatting
- Logging

**Key Functions**:

```python
# Initializes Flask app and configures logging
def create_app()
  Input: None
  Output: Flask
  Side Effects: Configures logging, registers routes

# Handles /api/hello endpoint
def hello()
  Input: None (HTTP GET)
  Output: JSON {"message": str}
  Logging: Logs request
  
# Starts server
def main()
  Input: None
  Output: None
  Side Effects: Starts Flask on port 5000, logs startup
```

### Build Automation (Makefile)

**Targets**:

```makefile
install:
  - Installs npm dependencies (package.json)
  - Creates Python virtual environment
  - Installs Python dependencies (requirements.txt)

run:
  - Starts Electron application
  - Backend spawned automatically by Electron

test:
  - Runs frontend tests (npm test)
  - Activates venv and runs backend tests (pytest)

clean:
  - Removes node_modules/
  - Removes Python __pycache__/
  - Removes venv/
  - Removes temp/ directory

help:
  - Displays available targets with descriptions
```

## Data Models

### HTTP API Contract

#### GET /api/hello

**Request**:
```
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

### Configuration Data

#### Backend Configuration
```python
{
  "host": "127.0.0.1",
  "port": 5000,
  "debug": False
}
```

#### Frontend Configuration
```javascript
{
  "window": {
    "width": 800,
    "height": 600,
    "title": "Hello World App"
  },
  "backend": {
    "url": "http://localhost:5000"
  }
}
```

### Process State

#### Backend Process State
```javascript
{
  "process": ChildProcess | null,
  "status": "starting" | "running" | "stopped" | "error",
  "pid": number | null
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

For this Hello World application, most requirements are specific examples that demonstrate the integration pattern. However, several universal properties ensure consistent behavior across the system.

### Property 1: Makefile Command Visibility

For any Makefile target, when executed, the commands being run should be displayed to the user.

**Validates: Requirements 4.6**

### Property 2: Request Logging Completeness

For any HTTP request received by the Python backend, the request method and path should be logged.

**Validates: Requirements 6.3**

### Property 3: Backend Error Logging Level

For any error that occurs in the Python backend, the error should be logged at ERROR level using the logging module.

**Validates: Requirements 6.4**

### Property 4: Frontend Error Logging Method

For any error that occurs in the Electron frontend, the error should be logged using console.error() rather than console.log() or other methods.

**Validates: Requirements 6.5**

### Property 5: Frontend Info Logging Method

For any informational message logged in the Electron frontend, the message should be logged using console.log() rather than console.error() or other methods.

**Validates: Requirements 6.6**

## Error Handling

### Frontend Error Scenarios

1. **Backend Connection Failure**
   - Cause: Python backend not started or not reachable
   - Detection: HTTP request timeout or connection refused
   - Handling: Display "Backend connection failed" message in UI
   - Logging: console.error() with error details

2. **Backend Startup Failure**
   - Cause: Python process fails to spawn (missing dependencies, port conflict)
   - Detection: Process exit code or stderr output
   - Handling: Show error dialog, exit application gracefully
   - Logging: console.error() with process error details

3. **Invalid Backend Response**
   - Cause: Backend returns malformed JSON or unexpected structure
   - Detection: JSON parse error or missing "message" field
   - Handling: Display generic error message
   - Logging: console.error() with response details

### Backend Error Scenarios

1. **Port Already in Use**
   - Cause: Another process listening on port 5000
   - Detection: Flask startup exception
   - Handling: Log error and exit with non-zero code
   - Logging: logger.error() with port conflict details

2. **Request Processing Error**
   - Cause: Unexpected exception in endpoint handler
   - Detection: Exception caught by Flask error handler
   - Handling: Return 500 status with error JSON
   - Logging: logger.error() with exception traceback

### Error Recovery

- **No Automatic Retry**: Application does not retry failed backend connections automatically
- **User Action Required**: User must restart application to recover from startup failures
- **Graceful Degradation**: Frontend displays error state rather than crashing

## Testing Strategy

### Dual Testing Approach

This application requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across all inputs

### Unit Testing

Unit tests focus on specific examples and integration scenarios:

**Frontend Unit Tests** (Jest/Mocha):
- Window creation with correct title and dimensions
- Window centering calculation
- Backend message display after successful fetch
- Error message display on connection failure
- Process spawning and termination
- Specific UI states and DOM content

**Backend Unit Tests** (pytest):
- /api/hello endpoint returns correct JSON structure
- Specific log messages appear on startup
- Port 5000 binding
- Specific error responses

**Integration Tests**:
- Full startup sequence (Electron → Python → HTTP request)
- Shutdown sequence (window close → process termination)
- End-to-end message flow

**Makefile Tests**:
- Each target (install, run, test, clean, help) exists
- Clean target removes expected directories
- Help target produces output

### Property-Based Testing

Property tests verify universal behaviors using randomization. Each test should run a minimum of 100 iterations.

**Property Test Library**: 
- Frontend: fast-check (JavaScript)
- Backend: Hypothesis (Python)

**Property Test Specifications**:

1. **Makefile Command Visibility** (Property 1)
   - Tag: **Feature: hello-world-electron-python, Property 1: For any Makefile target, when executed, the commands being run should be displayed to the user**
   - Test: Parse Makefile, verify all targets do not use @ prefix (which suppresses echo)
   - Iterations: 100 (test with different Makefile parsing approaches)

2. **Request Logging Completeness** (Property 2)
   - Tag: **Feature: hello-world-electron-python, Property 2: For any HTTP request received by the Python backend, the request method and path should be logged**
   - Test: Generate random HTTP requests (various methods, paths), verify logs contain method and path
   - Iterations: 100

3. **Backend Error Logging Level** (Property 3)
   - Tag: **Feature: hello-world-electron-python, Property 3: For any error that occurs in the Python backend, the error should be logged at ERROR level**
   - Test: Generate random error conditions, verify all use logger.error()
   - Iterations: 100

4. **Frontend Error Logging Method** (Property 4)
   - Tag: **Feature: hello-world-electron-python, Property 4: For any error that occurs in the Electron frontend, the error should be logged using console.error()**
   - Test: Trigger various error conditions, verify console.error() is called
   - Iterations: 100

5. **Frontend Info Logging Method** (Property 5)
   - Tag: **Feature: hello-world-electron-python, Property 5: For any informational message logged in the Electron frontend, the message should be logged using console.log()**
   - Test: Trigger various info logging scenarios, verify console.log() is called
   - Iterations: 100

### Testing Balance

- Unit tests handle the majority of requirements (32 specific examples)
- Property tests ensure consistent behavior patterns (5 universal properties)
- Integration tests verify component interactions
- Together, they provide comprehensive coverage without redundant testing

### Test Execution

All tests can be run via Makefile:
```bash
make test
```

This executes:
1. Frontend tests: `npm test` (Jest/Mocha)
2. Backend tests: `source venv/bin/activate && pytest backend/tests/`

### Continuous Validation

- Run tests before committing changes
- Property tests catch edge cases through randomization
- Unit tests catch regressions in specific behaviors
- Integration tests catch communication breakdowns

