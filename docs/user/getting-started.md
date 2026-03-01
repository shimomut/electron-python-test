# Getting Started with Hello World Electron + Python

Welcome! This guide will help you set up and run the Hello World Electron + Python application.

## What is This Application?

This is a simple desktop application that demonstrates how Electron (for the user interface) and Python (for backend processing) work together. When you run it, you'll see a window displaying messages from both the Electron frontend and the Python backend.

## System Requirements

Before you begin, make sure your system has:

- **Node.js 16 or higher** - JavaScript runtime for Electron
- **Python 3.8 or higher** - Python interpreter for the backend

### Checking Your Versions

Open a terminal and run these commands to verify:

```bash
node --version    # Should show v16.0.0 or higher
python3 --version # Should show Python 3.8.0 or higher
```

If you don't have these installed, download them from:
- Node.js: https://nodejs.org/
- Python: https://www.python.org/downloads/

## Installation

1. **Navigate to the project directory** in your terminal

2. **Install all dependencies** with a single command:

```bash
make install
```

This command will:
- Install Node.js packages (Electron and testing tools)
- Create a Python virtual environment
- Install Python packages (Flask and testing tools)

The installation may take a few minutes depending on your internet connection.

## Running the Application

Once installation is complete, start the application:

```bash
make run
```

## What to Expect

When the application starts, you should see:

1. **A desktop window** opens automatically
   - Window title: "Hello World App"
   - Window size: 800x600 pixels
   - Window position: Centered on your screen

2. **Inside the window**, you'll see:
   - A white card with rounded corners
   - The message: "Hello World from Electron + Python!"
   - Below that: "Hello from Python Backend!" (in blue text)

3. **Behind the scenes**:
   - The Python backend server starts automatically on port 5000
   - The Electron frontend connects to the backend
   - The backend sends a greeting message to the frontend
   - The frontend displays the message in the window

## Expected Behavior

### Normal Operation

- The window should appear within a few seconds
- Both messages should display immediately
- The window can be moved, resized, minimized, and closed like any desktop application

### If Something Goes Wrong

If you see an error message "Backend connection failed" in red text:
- The Python backend may not have started properly
- Try closing the application and running `make run` again
- Check that port 5000 is not being used by another application

## Closing the Application

Simply close the window by:
- Clicking the X button (Windows/Linux)
- Clicking the red close button (macOS)
- Pressing Alt+F4 (Windows/Linux) or Cmd+Q (macOS)

When you close the window, the Python backend automatically shuts down.

## Troubleshooting

### "Command not found: make"

If you see this error, you need to install Make:
- **macOS**: Install Xcode Command Line Tools with `xcode-select --install`
- **Linux**: Install with `sudo apt-get install build-essential` (Ubuntu/Debian) or equivalent
- **Windows**: Install Make through WSL, Cygwin, or use Git Bash

### "npm: command not found"

Node.js is not installed or not in your PATH. Install Node.js from https://nodejs.org/

### "python3: command not found"

Python is not installed or not in your PATH. Install Python from https://www.python.org/downloads/

### Port 5000 Already in Use

If another application is using port 5000:
1. Find and stop the other application
2. Or modify `backend/src/server.py` to use a different port (requires code changes)

## Next Steps

Now that you have the application running:
- Explore the code in `frontend/src/` and `backend/src/`
- Run the tests with `make test`
- Read the developer documentation in `docs/dev/` for more details

## Additional Commands

- `make test` - Run all tests (frontend and backend)
- `make clean` - Remove all installed dependencies and temporary files
- `make help` - Display available commands

## Getting Help

If you encounter issues not covered in this guide, check:
- The project README.md file
- Developer documentation in `docs/dev/`
- System logs in your terminal output
