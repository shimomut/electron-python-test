---
inclusion: always
---

# Project File Placement Rules

## Directory Structure

- `frontend/` - Electron frontend code (HTML, CSS, JavaScript)
  - `frontend/src/` - Frontend source files
  - `frontend/tests/` - Frontend test files
  - `frontend/public/` - Static assets
- `backend/` - Python backend code
  - `backend/src/` - Backend source files
  - `backend/tests/` - Backend test files (`test_*.py`)
- `docs/` - Project documentation
  - `docs/user/` - End-user documentation
  - `docs/dev/` - Developer documentation
- `scripts/` - Development and build scripts
- `temp/` - Temporary files during development

## Documentation Policy

**Create separate documentation for end-users and developers** when features affect both audiences:
- User-facing features → Both `docs/user/` and `docs/dev/`
- Internal changes only → `docs/dev/` only

**Naming conventions:**
- End-user: `docs/user/feature-name.md`
- Developer: `docs/dev/architecture.md`, `docs/dev/feature-implementation.md`

## Quick Reference

| File Type | Location | Naming |
|-----------|----------|--------|
| Frontend source | `frontend/src/` | `*.js`, `*.html`, `*.css` |
| Frontend tests | `frontend/tests/` | `*.test.js`, `*.spec.js` |
| Backend source | `backend/src/` | `*.py` |
| Backend tests | `backend/tests/` | `test_*.py` |
| Build scripts | `scripts/` | `build.sh`, `*.py` |
| User docs | `docs/user/` | `*.md` |
| Dev docs | `docs/dev/` | `*.md` |
| Temporary files | `temp/` | `temp_*`, `TEMP_*` |

## Key Rules

- **Temporary files** → Always use `temp/` directory during development
- **Development scripts** → Use `scripts/` for build and development utilities
- **Separate frontend from backend** → Keep Electron and Python code in separate directories
- **Documentation audience** → End-user docs must not include implementation details; developer docs must not include basic usage instructions
- **Test file naming** → Frontend: `*.test.js` or `*.spec.js`, Backend: `test_*.py`
