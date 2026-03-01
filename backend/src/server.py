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


def main():
    """Start the Flask server."""
    host = config['backend']['host']
    port = config['backend']['port']
    logger.info(f"Backend server started on {host}:{port}")
    app.run(host=host, port=port, debug=False)


if __name__ == '__main__':
    main()
