import logging
import json
import os
import time
import random
import math
from flask import Flask, jsonify, request

# Configure logging at module level
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load configuration
def load_config():
    """Load configuration from config.json."""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        # Return default config
        return {"backend": {"host": "127.0.0.1", "port": 10123}}

config = load_config()

# Create Flask application
app = Flask(__name__)


@app.before_request
def log_request():
    """Log all incoming requests with method and path."""
    logger.info(f"{request.method} {request.path}")


@app.route('/api/hello', methods=['GET'])
def hello():
    """Return a greeting message from the Python backend."""
    return jsonify({"message": "Hello from Python Backend!"})


@app.route('/api/button-click', methods=['POST'])
def button_click():
    """Handle button click events from frontend."""
    try:
        data = request.get_json()
        button_type = data.get('buttonType', 'Unknown')
        timestamp = data.get('timestamp', 'Unknown')
        
        logger.info(f"Button clicked: {button_type} at {timestamp}")
        
        return jsonify({
            "status": "success",
            "message": f"Python backend received {button_type} button click",
            "processed_at": timestamp
        })
    except Exception as e:
        logger.error(f"Error processing button click: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/files', methods=['GET'])
def list_files():
    """List files and directories at the specified path."""
    try:
        # Get path from query parameter, default to current directory
        path = request.args.get('path', '.')
        
        # Security: Prevent directory traversal attacks
        # Only allow browsing within the project directory
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        requested_path = os.path.abspath(os.path.join(project_root, path))
        
        # Ensure requested path is within project root
        if not requested_path.startswith(project_root):
            logger.warning(f"Attempted directory traversal: {path}")
            return jsonify({"status": "error", "message": "Access denied"}), 403
        
        # Check if path exists
        if not os.path.exists(requested_path):
            logger.warning(f"Path not found: {requested_path}")
            return jsonify({"status": "error", "message": "Path not found"}), 404
        
        # List directory contents
        items = []
        try:
            for entry in os.listdir(requested_path):
                entry_path = os.path.join(requested_path, entry)
                is_dir = os.path.isdir(entry_path)
                
                # Skip hidden files and common directories to ignore
                if entry.startswith('.') or entry in ['node_modules', 'venv', '__pycache__']:
                    continue
                
                items.append({
                    'name': entry,
                    'type': 'folder' if is_dir else 'file',
                    'path': os.path.relpath(entry_path, project_root)
                })
            
            # Sort: folders first, then files, alphabetically
            items.sort(key=lambda x: (x['type'] == 'file', x['name'].lower()))
            
            logger.info(f"Listed {len(items)} items in {path}")
            
            return jsonify({
                "status": "success",
                "path": os.path.relpath(requested_path, project_root),
                "items": items
            })
            
        except PermissionError:
            logger.error(f"Permission denied accessing: {requested_path}")
            return jsonify({"status": "error", "message": "Permission denied"}), 403
            
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# Time series data generation state
timeseries_start_time = time.time()


@app.route('/api/timeseries', methods=['GET'])
def get_timeseries():
    """Generate synthetic time series data for visualization."""
    try:
        # Get current time offset
        elapsed = time.time() - timeseries_start_time
        
        # Generate timestamps for the last 60 seconds
        num_points = 20
        timestamps = []
        current_time = time.time()
        
        for i in range(num_points):
            t = current_time - (num_points - i - 1) * 3
            timestamps.append(time.strftime('%H:%M:%S', time.localtime(t)))
        
        # Generate synthetic data with different patterns
        cpu_data = []
        memory_data = []
        network_data = []
        requests_data = []
        
        for i in range(num_points):
            t = elapsed + i * 3
            
            # CPU: Sine wave with noise (30-80%)
            cpu = 55 + 25 * math.sin(t / 10) + random.uniform(-5, 5)
            cpu_data.append(round(max(0, min(100, cpu)), 2))
            
            # Memory: Gradual increase with noise (200-800 MB)
            memory = 500 + 150 * math.sin(t / 15) + random.uniform(-30, 30)
            memory_data.append(round(max(0, memory), 2))
            
            # Network: Random spikes (0-1000 KB/s)
            if random.random() > 0.7:
                network = random.uniform(500, 1000)
            else:
                network = random.uniform(50, 300)
            network_data.append(round(network, 2))
            
            # Requests: Poisson-like distribution (10-100 req/s)
            requests = 50 + 30 * math.sin(t / 8) + random.uniform(-10, 10)
            requests_data.append(round(max(0, requests), 2))
        
        logger.info("Generated time series data")
        
        return jsonify({
            "status": "success",
            "timestamp": time.time(),
            "data": {
                "labels": timestamps,
                "cpu": cpu_data,
                "memory": memory_data,
                "network": network_data,
                "requests": requests_data
            }
        })
        
    except Exception as e:
        logger.error(f"Error generating time series data: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


def main():
    """Start the Flask server."""
    host = config['backend']['host']
    port = config['backend']['port']
    logger.info(f"Backend server started on {host}:{port}")
    app.run(host=host, port=port, debug=False)


if __name__ == '__main__':
    main()
