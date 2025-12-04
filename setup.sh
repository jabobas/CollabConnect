#!/usr/bin/env bash
set -e

# CollabConnect setup: installs deps and initializes DB using pre-provisioned MySQL user from Backend/config.ini

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/databases"
BACKEND_DIR="$ROOT_DIR/Backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# MySQL credentials are NOT set here; they must exist in Backend/config.ini

echo "==> Python venv: $VENV_DIR"
if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"
python --version

echo "==> Installing backend Python dependencies"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

echo "==> Installing frontend dependencies"
pushd "$FRONTEND_DIR" >/dev/null
npm install
popd >/dev/null

echo "==> Skipping MySQL user/privilege management (using Backend/config.ini)"
echo "    Ensure the DB user has privileges on the target schema and function creation is allowed."

echo "==> Initializing database schema, procedures, seed data (without starting server)"
pushd "$BACKEND_DIR" >/dev/null
"$VENV_DIR/bin/python" - <<'PY'
import sys, os
sys.path.insert(0, os.getcwd())
from db_init import check_db
ok = check_db()
raise SystemExit(0 if ok else 1)
PY
popd >/dev/null

echo "==> Setup complete. Next step: run.sh"
echo "Run: ./run.sh"
