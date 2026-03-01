import logging
import json
import os
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


def main():
    """Start the Flask server."""
    host = config['backend']['host']
    port = config['backend']['port']
    logger.info(f"Backend server started on {host}:{port}")
    app.run(host=host, port=port, debug=False)


if __name__ == '__main__':
    main()
