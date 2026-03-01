# Makefile for Hello World Electron + Python Application
# Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6

.PHONY: help install run test clean

# Default target - show help
help:
	echo "Available targets:"
	echo "  make install  - Install all dependencies (npm + Python)"
	echo "  make run      - Start the Electron application"
	echo "  make test     - Run all tests (frontend + backend)"
	echo "  make clean    - Remove temporary files and dependencies"
	echo "  make help     - Display this help message"

# Install all dependencies
install:
	echo "Installing npm dependencies..."
	npm install
	echo "Creating Python virtual environment..."
	python3 -m venv venv
	echo "Installing Python dependencies..."
	./venv/bin/pip install -r requirements.txt
	echo "Installation complete!"

# Start the Electron application
run:
	echo "Starting Electron application..."
	npm start

# Run all tests
test:
	echo "Running frontend tests..."
	npm test
	echo "Running backend tests..."
	. venv/bin/activate && pytest backend/tests/

# Clean temporary files and dependencies
clean:
	echo "Cleaning temporary files and dependencies..."
	rm -rf node_modules/
	rm -rf venv/
	find . -type d -name "__pycache__" -exec rm -rf {} +
	rm -rf temp/
	echo "Clean complete!"
