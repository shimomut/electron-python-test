---
inclusion: always
---

# Coding Standards

## General Principles

- Write clean, readable, and maintainable code
- Follow language-specific conventions (PEP 8 for Python, Airbnb/Standard for JavaScript)
- Keep functions small and focused on a single responsibility
- Use meaningful variable and function names

## Python Backend Standards

### Import Best Practices

**Before adding any import statement**, check if the module is already imported at the module level to avoid redundant imports.

### Logging Standards

**Use Python's built-in logging module** for all backend logging:

```python
import logging

# At module level
logger = logging.getLogger(__name__)

class MyComponent:
    def process_data(self, data):
        logger.info(f"Processing data: {data}")
        try:
            result = self.transform(data)
            logger.info("Processing completed successfully")
            return result
        except Exception as e:
            logger.error(f"Processing failed: {e}")
            raise
```

### Log Level Guidelines

- **ERROR**: Operation failures, critical issues, exceptions
- **WARNING**: Potential issues, degraded functionality
- **INFO**: Normal operation, important events
- **DEBUG**: Detailed diagnostic information

### Exception Handling

- **Catch specific exception types** when possible rather than bare `except:` clauses
- When catching all exceptions is necessary, use `except Exception as e:` and **always log an error message** with context
- **Use logger.error() in exception handlers** to ensure errors are properly logged

Example:
```python
try:
    risky_operation()
except FileNotFoundError as e:
    logger.error(f"File not found: {e}")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
```

### File Permissions

**Python files should NOT have executable permissions.** Always run Python scripts by explicitly invoking the Python interpreter:

```bash
# ✅ Correct
python3 script.py

# ❌ Avoid
chmod +x script.py
./script.py
```

## JavaScript/Electron Frontend Standards

### Console Logging

Use appropriate console methods for different message types:

```javascript
// For errors
console.error('Failed to load data:', error);

// For warnings
console.warn('Deprecated API usage detected');

// For general information
console.log('Application started');

// For debugging (remove before production)
console.debug('Variable state:', variable);
```

### Error Handling

Always handle errors in async operations:

```javascript
// ✅ Correct
async function loadData() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error('Failed to load data:', error);
    throw error;
  }
}

// ❌ Avoid unhandled promises
async function loadData() {
  const data = await fetchData(); // No error handling
  return data;
}
```

### IPC Communication

When communicating between Electron processes, always validate data:

```javascript
// Main process
ipcMain.handle('process-data', async (event, data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format');
  }
  return await processData(data);
});

// Renderer process
const result = await ipcRenderer.invoke('process-data', data);
```

## Code Review Checklist

- [ ] No hardcoded credentials or sensitive data
- [ ] Proper error handling and logging
- [ ] Input validation for all external data
- [ ] No console.log in production frontend code (use proper logging)
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed
