#!/usr/bin/env bash
set -e

# CollabConnect runner: starts backend and frontend

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/databases"
BACKEND_DIR="$ROOT_DIR/Backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

source "$VENV_DIR/bin/activate"

echo "==> Starting Flask backend on http://127.0.0.1:5000"
pushd "$BACKEND_DIR" >/dev/null
"$VENV_DIR/bin/python" app.py &
BACKEND_PID=$!
popd >/dev/null

cleanup() {
  echo "\n==> Stopping backend (PID $BACKEND_PID)"
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT

echo "==> Starting React frontend on http://localhost:3000"
pushd "$FRONTEND_DIR" >/dev/null
npm start
popd >/dev/null
