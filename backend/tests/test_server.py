"""Unit tests for the Python backend server."""

import pytest
import logging
from unittest.mock import patch, MagicMock
from backend.src.server import app, main


@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_hello_endpoint_returns_correct_json(client):
    """Test that /api/hello endpoint returns correct JSON structure."""
    response = client.get('/api/hello')
    
    assert response.status_code == 200
    assert response.content_type == 'application/json'
    
    data = response.get_json()
    assert 'message' in data
    assert data['message'] == 'Hello from Python Backend!'


def test_hello_endpoint_method(client):
    """Test that /api/hello only accepts GET requests."""
    response = client.get('/api/hello')
    assert response.status_code == 200
    
    # POST should return 405 Method Not Allowed
    response = client.post('/api/hello')
    assert response.status_code == 405


def test_request_logging(client, caplog):
    """Test that requests are logged with method and path."""
    with caplog.at_level(logging.INFO):
        client.get('/api/hello')
    
    # Check that the request was logged
    assert any('GET' in record.message and '/api/hello' in record.message 
               for record in caplog.records)


def test_startup_logging_message():
    """Test that startup logging message appears."""
    with patch('backend.src.server.app.run') as mock_run:
        with patch('backend.src.server.logger') as mock_logger:
            main()
            
            # Verify startup message was logged
            mock_logger.info.assert_called_with("Backend server started on port 5000")
            
            # Verify Flask app.run was called with correct parameters
            mock_run.assert_called_once_with(host='127.0.0.1', port=5000, debug=False)


def test_port_5000_binding():
    """Test that server is configured to bind to port 5000."""
    with patch('backend.src.server.app.run') as mock_run:
        with patch('backend.src.server.logger'):
            main()
            
            # Verify the server is configured for port 5000
            call_kwargs = mock_run.call_args[1]
            assert call_kwargs['port'] == 5000
            assert call_kwargs['host'] == '127.0.0.1'


def test_error_response_returns_500():
    """Test that errors in endpoint handlers return 500 status."""
    # Flask in testing mode doesn't automatically convert exceptions to 500 responses
    # We need to verify that the app would handle errors properly in production
    # by checking that Flask's error handling is configured
    
    # Verify that Flask has default error handlers
    assert app.error_handler_spec is not None or hasattr(app, 'handle_exception')
    
    # Test with a simulated error by patching the endpoint to raise an exception
    # and catching it to verify Flask would return 500
    original_hello = app.view_functions['hello']
    
    def error_hello():
        raise Exception("Test error")
    
    # Temporarily replace the view function
    app.view_functions['hello'] = error_hello
    
    try:
        with app.test_client() as client:
            # In testing mode, Flask propagates exceptions by default
            # We need to disable this to test error handling
            app.config['TESTING'] = False
            response = client.get('/api/hello')
            
            # Flask's default error handler returns 500 for unhandled exceptions
            assert response.status_code == 500
    finally:
        # Restore original function
        app.view_functions['hello'] = original_hello
        app.config['TESTING'] = True


def test_nonexistent_endpoint_returns_404(client):
    """Test that nonexistent endpoints return 404."""
    response = client.get('/api/nonexistent')
    assert response.status_code == 404


def test_json_response_structure(client):
    """Test that the response has the expected JSON structure."""
    response = client.get('/api/hello')
    data = response.get_json()
    
    # Verify it's a dictionary with exactly one key
    assert isinstance(data, dict)
    assert len(data) == 1
    assert 'message' in data
    assert isinstance(data['message'], str)
