#!/bin/bash
# Setup script for Odontological Web Application
# This script sets up PostgreSQL, builds the frontend, and starts the server.

set -e

echo "=== Odontological Web Application - Local Setup ==="

# 1. Check dependencies
echo "[1/5] Checking dependencies..."
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required. Install with: npm install -g pnpm"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "PostgreSQL is required. Install postgresql first."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required."; exit 1; }
echo "  All dependencies found."

# 2. Install npm packages
echo "[2/5] Installing npm packages..."
pnpm install

# 3. Start PostgreSQL if not running
echo "[3/5] Checking PostgreSQL..."
if pg_isready -q 2>/dev/null; then
  echo "  PostgreSQL is already running."
else
  echo "  Starting PostgreSQL..."
  pg_ctlcluster 16 main start 2>/dev/null || echo "  Could not auto-start PostgreSQL. Please start it manually."
fi

# 4. Create database if it doesn't exist
echo "[4/5] Setting up database..."
DB_EXISTS=$(psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='odontologica'" 2>/dev/null || echo "0")
if [ "$DB_EXISTS" = "1" ]; then
  echo "  Database 'odontologica' already exists."
else
  echo "  Creating database 'odontologica'..."
  psql -U postgres -c "CREATE DATABASE odontologica;" 2>/dev/null

  echo "  Creating tables..."
  psql -U postgres -d odontologica <<'SQL'
CREATE TYPE appointment_status AS ENUM ('ausente', 'cancelada', 'completada', 'confirmada', 'programada');
CREATE TYPE user_role AS ENUM ('admin', 'dentist', 'patient', 'user');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_passwords (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  phone VARCHAR(50),
  address TEXT,
  birth_date TIMESTAMP,
  allergies TEXT,
  medical_history TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  dentist_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  appointment_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status appointment_status DEFAULT 'programada',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE treatments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  dentist_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  treatment_type VARCHAR(255) NOT NULL,
  tooth_number VARCHAR(10),
  description TEXT,
  notes TEXT,
  cost NUMERIC(10,2),
  status VARCHAR(50) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clinical_images (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  treatment_id INTEGER REFERENCES treatments(id) ON DELETE SET NULL,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  image_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  last_accessed TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP DEFAULT NOW()
);
SQL
  echo "  Database setup complete."
fi

# 5. Build frontend and start server
echo "[5/5] Building frontend..."
pnpm build

echo ""
echo "=== Setup complete! ==="
echo "Starting server on http://localhost:3344"
echo "Press Ctrl+C to stop."
echo ""
pnpm start
