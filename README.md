# Hello World Electron + Python

A minimal desktop application demonstrating integration between an Electron frontend and a Python backend. This project serves as a foundational example for building cross-platform desktop applications with a Python-powered backend.

## Features

- Desktop UI built with Electron
- Python Flask backend for server-side processing
- Automatic backend lifecycle management
- HTTP-based communication between frontend and backend
- Build automation with Makefile

## System Requirements

- **Node.js**: Version 16 or higher
- **Python**: Version 3.8 or higher
- **npm**: Comes with Node.js
- **Make**: GNU Make (usually pre-installed on macOS/Linux, available via build tools on Windows)

## Quick Start

### 1. Install Dependencies

```bash
make install
```

This will:
- Install npm dependencies for the Electron frontend
- Create a Python virtual environment
- Install Python dependencies for the Flask backend

### 2. Run the Application

```bash
make run
```

The application will:
- Start the Python backend automatically
- Open the Electron window
- Display "Hello World" messages from both frontend and backend

### 3. Run Tests

```bash
make test
```

This runs all tests for both frontend and backend components.

### 4. Clean Build Artifacts

```bash
make clean
```

Removes temporary files, build artifacts, and dependencies.

## Project Structure

```
hello-world-electron-python/
├── frontend/           # Electron frontend code
│   ├── src/           # Frontend source files
│   └── tests/         # Frontend tests
├── backend/           # Python backend code
│   ├── src/           # Backend source files
│   └── tests/         # Backend tests
├── docs/              # Documentation
│   ├── user/          # End-user documentation
│   └── dev/           # Developer documentation
├── Makefile           # Build automation
├── package.json       # npm dependencies
└── requirements.txt   # Python dependencies
```

## Documentation

- **[Getting Started Guide](docs/user/getting-started.md)** - Detailed setup and usage instructions
- **[Architecture Documentation](docs/dev/architecture.md)** - Technical architecture and design details

## Available Commands

Run `make help` to see all available commands:

- `make install` - Install all dependencies
- `make run` - Start the application
- `make test` - Run all tests
- `make clean` - Remove build artifacts and dependencies
- `make help` - Display available commands

## How It Works

1. When you run the application, Electron starts and spawns a Python backend process
2. The Python Flask server listens on port 5000
3. The Electron frontend makes an HTTP request to the backend
4. Both frontend and backend messages are displayed in the application window
5. When you close the window, the Python backend is automatically terminated

## License

MIT
