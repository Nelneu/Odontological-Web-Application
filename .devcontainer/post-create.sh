#!/bin/bash
set -e

echo "=== Codespaces Setup ==="

echo "[1/6] Installing pnpm..."
npm install -g pnpm

echo "[2/6] Installing PostgreSQL..."
apt-get update -qq
apt-get install -y -qq postgresql postgresql-client > /dev/null 2>&1
service postgresql start

echo "[3/6] Configuring PostgreSQL..."
runuser -l postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" 2>/dev/null || true

echo "[4/6] Setting up database..."
runuser -l postgres -c "psql -c \"CREATE DATABASE odontologica;\"" 2>/dev/null || echo "  Database already exists."

runuser -l postgres -c "psql -d odontologica" << 'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM ('ausente','cancelada','completada','confirmada','programada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin','dentist','patient','user');
  END IF;
END$$;
CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, display_name VARCHAR(255) NOT NULL, avatar_url TEXT, role user_role NOT NULL DEFAULT 'user', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS user_passwords (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS patients (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, phone VARCHAR(50), address TEXT, birth_date TIMESTAMP, allergies TEXT, medical_history TEXT, emergency_contact_name VARCHAR(255), emergency_contact_phone VARCHAR(50), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS appointments (id SERIAL PRIMARY KEY, patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL, dentist_id INTEGER REFERENCES users(id) ON DELETE SET NULL, appointment_date TIMESTAMP NOT NULL, duration_minutes INTEGER DEFAULT 30, status appointment_status DEFAULT 'programada', reason TEXT, notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS treatments (id SERIAL PRIMARY KEY, patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL, dentist_id INTEGER REFERENCES users(id) ON DELETE SET NULL, appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL, treatment_type VARCHAR(255) NOT NULL, tooth_number VARCHAR(10), description TEXT, notes TEXT, cost NUMERIC(10,2), status VARCHAR(50) DEFAULT 'pendiente', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS clinical_images (id SERIAL PRIMARY KEY, patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL, treatment_id INTEGER REFERENCES treatments(id) ON DELETE SET NULL, uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL, file_name VARCHAR(255) NOT NULL, file_url TEXT NOT NULL, image_type VARCHAR(50), description TEXT, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(255) PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TIMESTAMP NOT NULL, last_accessed TIMESTAMP DEFAULT NOW(), created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS login_attempts (id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL, success BOOLEAN DEFAULT false, attempted_at TIMESTAMP DEFAULT NOW());
SQL

echo "[5/6] Generating env.json..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
printf '{\n  "FLOOT_DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/odontologica",\n  "JWT_SECRET": "%s"\n}\n' "$JWT_SECRET" > /workspaces/Odontological-Web-Application/env.json

echo "[6/7] Installing dependencies and building..."
pnpm install
pnpm build

echo "[7/7] Seeding test users..."
pnpm exec tsx scripts/seed.ts

echo "=== Setup complete! ==="
