#!/usr/bin/env bash
set -e

# CollabConnect setup: installs deps and initializes DB using pre-provisioned MySQL user from Backend/config.ini

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/databases"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Detect Python command (works cross-platform including Git Bash on Windows)
detect_python() {
  # Try standard commands first
  if command -v python3 &> /dev/null && python3 --version &> /dev/null; then
    echo "python3"
  elif command -v python &> /dev/null && python --version &> /dev/null; then
    echo "python"
  elif command -v py &> /dev/null && py --version &> /dev/null; then
    echo "py"
  # For Git Bash on Windows, try common Python installation paths
  elif [[ -f "/c/Python313/python.exe" ]]; then
    echo "/c/Python313/python.exe"
  elif [[ -f "/c/Python312/python.exe" ]]; then
    echo "/c/Python312/python.exe"
  elif [[ -f "/c/Python311/python.exe" ]]; then
    echo "/c/Python311/python.exe"
  else
    echo ""
  fi
}

PYTHON_CMD=$(detect_python)
if [[ -z "$PYTHON_CMD" ]]; then
  echo "ERROR: Python not found. Please ensure Python is installed."
  echo "For Git Bash on Windows, try adding Python to PATH or restart your terminal:"
  echo "  export PATH=\"/c/Python313:\$PATH\"  # Adjust version as needed"
  exit 1
fi

echo "==> Using Python: $PYTHON_CMD"

# MySQL credentials are NOT set here; they must exist in Backend/config.ini

echo "==> Python venv: $VENV_DIR"
if [[ ! -d "$VENV_DIR" ]]; then
  "$PYTHON_CMD" -m venv "$VENV_DIR"
fi

# Activate venv (different paths for Windows vs Unix)
if [[ -f "$VENV_DIR/Scripts/activate" ]]; then
  source "$VENV_DIR/Scripts/activate"  # Windows (Git Bash)
else
  source "$VENV_DIR/bin/activate"      # Linux/Mac
fi
"$PYTHON_CMD" --version

echo "==> Installing backend Python dependencies"
python -m pip install --upgrade pip || echo "Note: pip upgrade had issues, continuing..."
python -m pip install -r "$BACKEND_DIR/requirements.txt"

echo "==> Installing frontend dependencies"
pushd "$FRONTEND_DIR" >/dev/null
npm install
popd >/dev/null

echo "==> Skipping MySQL user/privilege management (using Backend/config.ini)"
echo "    Ensure the DB user has privileges on the target schema and function creation is allowed."

echo "==> Initializing database schema, procedures, seed data (without starting server)"
pushd "$BACKEND_DIR" >/dev/null

# Use correct python path for OS
if [[ -f "$VENV_DIR/Scripts/python.exe" ]]; then
  PYTHON_BIN="$VENV_DIR/Scripts/python.exe"  # Windows
else
  PYTHON_BIN="$VENV_DIR/bin/python"          # Linux/Mac
fi

"$PYTHON_BIN" - <<'PY'
import sys, os
sys.path.insert(0, os.getcwd())
from db_init import check_db
ok = check_db()
raise SystemExit(0 if ok else 1)
PY
popd >/dev/null

echo "==> Setup complete. Next step: run.sh"
echo "Run: ./run.sh"
