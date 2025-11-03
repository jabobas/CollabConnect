#!/bin/bash

set -e  # Exit on error

DB_NAME="${DB_NAME:-collabconnect}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "CollabConnect Database Initialization"
echo "========================================="
echo "Database: $DB_NAME"
echo "Script Directory: $SCRIPT_DIR"
echo ""

# Step 1: Start PostgreSQL server
echo "[1/4] Starting PostgreSQL server..."
sudo systemctl start postgresql
sudo systemctl status postgresql --no-pager | head -5
echo "✓ PostgreSQL started"
echo ""

# Step 2: Drop existing database (if exists)
echo "[2/4] Dropping existing database (if exists)..."
psql -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1
echo "✓ Database dropped"
echo ""

# Step 3: Initialize database
echo "[3/4] Initializing database..."
PAGER='' psql -v DB_NAME="$DB_NAME" -d postgres -f "$SCRIPT_DIR/init_db.sql"
echo "✓ Database initialized"
echo ""

# Step 4: Verify and print results
echo "[4/4] Verification Summary"
echo "========================================="
echo ""

echo "📊 Tables:"
psql -d "$DB_NAME" -c "\dt" 2>&1

echo ""
echo "🔍 Person table structure:"
psql -d "$DB_NAME" -c "\d person" 2>&1

echo ""
echo "🔍 Institution table structure:"
psql -d "$DB_NAME" -c "\d institution" 2>&1

echo ""
echo "🔍 Works_in relation structure:"
psql -d "$DB_NAME" -c "\d works_in" 2>&1

echo ""
echo "🔍 Person_expertise table structure:"
psql -d "$DB_NAME" -c "\d person_expertise" 2>&1

echo ""
echo "📝 Custom types:"
psql -d "$DB_NAME" -c "\dT+ institution_address_type" 2>&1

echo ""
echo "========================================="
echo "✅ Database initialization complete!"
echo "Connect with: psql -d $DB_NAME"
echo "========================================="
