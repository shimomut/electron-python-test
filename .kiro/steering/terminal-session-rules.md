---
inclusion: always
---

# Terminal Session Rules

## Python Virtual Environment Management

**For Kiro/AI Assistants:**
- **DO NOT activate venv if the terminal is already using it** - check environment context or assume venv is active in ongoing sessions
- Only include activation when starting a fresh terminal session or when explicitly needed
- **Run activation as a separate command**, not chained with `&&`:
  ```bash
  source venv/bin/activate
  python script.py
  ```

Activate the virtual environment before running any Python backend scripts or tests in the project.

## Git Command Standards

**Always disable git pager when running git commands** to prevent interactive pager sessions:

```bash
# ✅ Correct
git --no-pager diff
git --no-pager log
git --no-pager show
git --no-pager branch -a

# ❌ Avoid (opens pager)
git diff
git log
```

Commands that should always use `--no-pager`: `diff`, `log`, `show`, `branch`, `tag`, `blame`, `grep`

Commands that don't need it: `status`, `add`, `commit`, `push`, `pull`

## Electron Application Execution Rules

**NEVER run Electron applications directly in automated sessions** - they launch GUI windows and block execution indefinitely.

### Development Server Guidelines

**Electron development mode:**
- ❌ **DO NOT execute** `npm start`, `npm run dev`, or `electron .` - These launch GUI applications
- ✅ **Only inspect code** to verify implementation
- If user explicitly requests running the app, warn them it will block and suggest they run it manually

**Python backend servers:**
- ❌ **DO NOT execute** long-running servers without timeout
- ✅ **Safe to test** - Quick validation scripts that exit automatically
- For servers, suggest manual execution: `python backend/server.py`

### Identifying Blocking Programs

Programs that will block execution:
- Electron main process (`electron .`, `npm start`)
- Python servers with event loops (`Flask.run()`, `FastAPI`, etc.)
- Scripts with `while True` without timeout
- Scripts that call `.run()`, `.mainloop()`, or similar blocking methods
- Any GUI/window-based application

### Safe Alternatives

Instead of running interactive programs:
1. **Read the source code** to understand implementation
2. **Run unit tests** to verify functionality: `npm test`, `pytest`
3. **Build the application** to check for errors: `npm run build`
4. **Suggest manual execution** if user wants to see the program in action

### Example Patterns

```bash
# ❌ WRONG - Will block indefinitely
npm start
electron .
python backend/server.py

# ✅ CORRECT - Inspect code instead
cat main.js
cat backend/server.py

# ✅ CORRECT - Run tests
npm test
pytest backend/tests/

# ✅ CORRECT - Build without running
npm run build
```

### Recovery from Stuck Processes

**If Kiro gets stuck on a blocking process:**

1. **User must intervene** - Kiro cannot forcibly cancel stuck foreground processes
2. **Cancel the agent execution** in the Kiro UI
3. **Kill the process manually** if needed: `ps aux | grep electron` or `ps aux | grep python` then `kill <PID>`
4. **Prevention is key** - Follow the rules above to avoid blocking in the first place

**For Kiro/AI Assistants:**
- If you realize you've started a blocking process, immediately acknowledge the error
- Explain to the user that they need to cancel the execution
- Learn from the mistake and avoid similar patterns in future interactions
