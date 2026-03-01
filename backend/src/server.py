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
timeseries_history = {
    'timestamps': [],
    'cpu': [],
    'memory': [],
    'network': [],
    'requests': [],
    'disk_io': [],
    'response_time': [],
    'error_rate': [],
    'active_users': []
}
MAX_HISTORY_POINTS = 60  # Keep last 60 data points (5 minutes at 5-second intervals)


@app.route('/api/timeseries', methods=['GET'])
def get_timeseries():
    """Generate synthetic time series data for visualization."""
    try:
        global timeseries_history
        
        # Get current time
        current_time = time.time()
        elapsed = current_time - timeseries_start_time
        
        # Generate new timestamp
        timestamp = time.strftime('%H:%M:%S', time.localtime(current_time))
        
        # Generate new data point with different patterns
        # CPU: Sine wave with noise (30-80%)
        cpu = 55 + 25 * math.sin(elapsed / 10) + random.uniform(-5, 5)
        cpu = round(max(0, min(100, cpu)), 2)
        
        # Memory: Gradual increase with noise (200-800 MB)
        memory = 500 + 150 * math.sin(elapsed / 15) + random.uniform(-30, 30)
        memory = round(max(0, memory), 2)
        
        # Network: Random spikes (0-1000 KB/s)
        if random.random() > 0.7:
            network = random.uniform(500, 1000)
        else:
            network = random.uniform(50, 300)
        network = round(network, 2)
        
        # Requests: Poisson-like distribution (10-100 req/s)
        requests = 50 + 30 * math.sin(elapsed / 8) + random.uniform(-10, 10)
        requests = round(max(0, requests), 2)
        
        # Disk I/O: Bursty pattern (0-500 MB/s)
        if random.random() > 0.8:
            disk_io = random.uniform(300, 500)
        else:
            disk_io = 100 + 50 * math.sin(elapsed / 12) + random.uniform(-20, 20)
        disk_io = round(max(0, disk_io), 2)
        
        # Response Time: Inverse correlation with load (50-500 ms)
        response_time = 200 + 150 * math.sin(elapsed / 7) + random.uniform(-30, 30)
        response_time = round(max(50, response_time), 2)
        
        # Error Rate: Occasional spikes (0-5%)
        if random.random() > 0.9:
            error_rate = random.uniform(2, 5)
        else:
            error_rate = 0.5 + 0.3 * math.sin(elapsed / 20) + random.uniform(-0.2, 0.2)
        error_rate = round(max(0, min(5, error_rate)), 2)
        
        # Active Users: Gradual changes (100-1000 users)
        active_users = 500 + 300 * math.sin(elapsed / 25) + random.uniform(-50, 50)
        active_users = round(max(0, active_users))
        
        # Add new data point to history
        timeseries_history['timestamps'].append(timestamp)
        timeseries_history['cpu'].append(cpu)
        timeseries_history['memory'].append(memory)
        timeseries_history['network'].append(network)
        timeseries_history['requests'].append(requests)
        timeseries_history['disk_io'].append(disk_io)
        timeseries_history['response_time'].append(response_time)
        timeseries_history['error_rate'].append(error_rate)
        timeseries_history['active_users'].append(active_users)
        
        # Trim history to max points
        if len(timeseries_history['timestamps']) > MAX_HISTORY_POINTS:
            for key in timeseries_history:
                timeseries_history[key] = timeseries_history[key][-MAX_HISTORY_POINTS:]
        
        logger.info(f"Generated time series data point (total: {len(timeseries_history['timestamps'])} points)")
        
        return jsonify({
            "status": "success",
            "timestamp": current_time,
            "data": timeseries_history
        })
        
    except Exception as e:
        logger.error(f"Error generating time series data: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# Log generation state
log_counter = 0
log_messages = [
    "Starting application server",
    "Database connection established",
    "Loading configuration from config.json",
    "Initializing worker threads",
    "API endpoint registered: /api/hello",
    "API endpoint registered: /api/timeseries",
    "Cache warmed up successfully",
    "Health check passed",
    "Processing incoming request",
    "Query executed successfully",
    "Response sent to client",
    "Background job started",
    "Background job completed",
    "Cleaning up temporary files",
    "Memory usage: 45%",
    "CPU usage: 32%",
    "Active connections: 127",
    "Request queue size: 5",
    "Cache hit ratio: 89%",
    "Database query took 23ms"
]

log_warnings = [
    "High memory usage detected",
    "Slow query detected: 450ms",
    "Connection pool nearly exhausted",
    "Retry attempt 2 of 3",
    "Deprecated API usage detected"
]

log_errors = [
    "Failed to connect to external service",
    "Database connection timeout",
    "Invalid request payload",
    "Authentication failed for user",
    "Rate limit exceeded"
]


@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Generate synthetic log entries."""
    try:
        global log_counter
        
        # Generate 3-5 log entries per request
        num_logs = random.randint(3, 5)
        logs = []
        
        for _ in range(num_logs):
            log_counter += 1
            timestamp = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
            
            # Determine log level (80% info, 15% warn, 5% error)
            rand = random.random()
            if rand < 0.05:
                level = 'ERROR'
                message = random.choice(log_errors)
            elif rand < 0.20:
                level = 'WARN'
                message = random.choice(log_warnings)
            else:
                level = 'INFO'
                message = random.choice(log_messages)
            
            logs.append({
                'id': log_counter,
                'timestamp': timestamp,
                'level': level,
                'message': message
            })
        
        logger.info(f"Generated {num_logs} log entries")
        
        return jsonify({
            "status": "success",
            "logs": logs
        })
        
    except Exception as e:
        logger.error(f"Error generating logs: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


def main():
    """Start the Flask server."""
    host = config['backend']['host']
    port = config['backend']['port']
    logger.info(f"Backend server started on {host}:{port}")
    app.run(host=host, port=port, debug=False)


if __name__ == '__main__':
    main()
