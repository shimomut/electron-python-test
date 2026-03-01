import logging
from flask import Flask, jsonify, request

# Configure logging at module level
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
    logger.info("Backend server started on port 5000")
    app.run(host='127.0.0.1', port=5000, debug=False)


if __name__ == '__main__':
    main()
