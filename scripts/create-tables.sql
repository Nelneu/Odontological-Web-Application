-- =============================================================================
-- create-tables.sql
-- Crea todas las tablas de la aplicación Odontológica.
-- Idempotente: usa IF NOT EXISTS en todo.
-- =============================================================================

-- ── Tipos ENUM ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'dentist', 'patient', 'user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'programada', 'confirmada', 'completada', 'cancelada', 'ausente'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  role         user_role NOT NULL DEFAULT 'user',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ── user_passwords ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_passwords (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP DEFAULT NOW(),
  expires_at    TIMESTAMP NOT NULL
);

-- ── login_attempts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
  id           SERIAL PRIMARY KEY,
  email        TEXT NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW(),
  success      BOOLEAN DEFAULT false
);

-- ── patients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id                      SERIAL PRIMARY KEY,
  user_id                 INTEGER REFERENCES users(id) ON DELETE SET NULL,
  phone                   TEXT,
  address                 TEXT,
  birth_date              TIMESTAMP,
  medical_history         TEXT,
  allergies               TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

-- ── appointments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               SERIAL PRIMARY KEY,
  patient_id       INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  dentist_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  appointment_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status           appointment_status DEFAULT 'programada',
  reason           TEXT,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- ── treatments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treatments (
  id             SERIAL PRIMARY KEY,
  patient_id     INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  dentist_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  treatment_type TEXT NOT NULL,
  description    TEXT,
  tooth_number   TEXT,
  status         TEXT DEFAULT 'pending',
  cost           NUMERIC,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- ── clinical_images ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinical_images (
  id           SERIAL PRIMARY KEY,
  patient_id   INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  treatment_id INTEGER REFERENCES treatments(id) ON DELETE SET NULL,
  file_name    TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  image_type   TEXT,
  description  TEXT,
  uploaded_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);
