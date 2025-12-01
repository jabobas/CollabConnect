#!/usr/bin/env bash
set -e

# CollabConnect setup: installs deps, configures MySQL, initializes DB

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/databases"
BACKEND_DIR="$ROOT_DIR/Backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Config defaults from Backend/config.ini
DB_NAME="collab_connect_db"
DB_USER="collab_user"
DB_PASS="collab_pass_2024"
DB_HOST="127.0.0.1"
DB_PORT="3306"

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

echo "==> Configuring MySQL database and user"
mysql -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || true
mysql -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" "$DB_NAME" 2>/dev/null || {
  echo "-- Creating user and granting privileges (requires sudo)"
  sudo mysql <<SQL
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL
}

echo "==> Allow function creation without SUPER (requires sudo)"
sudo mysql -e "SET GLOBAL log_bin_trust_function_creators = 1;" || true

echo "==> Initializing database schema, procedures, seed data"
pushd "$BACKEND_DIR" >/dev/null
"$VENV_DIR/bin/python" db_init.py
popd >/dev/null

echo "==> Setup complete. Next step: run.sh"
echo "Run: ./run.sh"
