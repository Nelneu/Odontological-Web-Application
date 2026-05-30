#!/bin/bash
# =============================================================================
# setup-db.sh
# Configura PostgreSQL para la aplicación Odontológica.
# Idempotente: puede ejecutarse múltiples veces sin efectos secundarios.
#
# Lo que hace:
#   1. Detecta la versión de PostgreSQL instalada
#   2. Inicia el cluster si está caído
#   3. Establece la contraseña del usuario postgres (para auth TCP)
#   4. Crea la base de datos 'odontologica' si no existe
#   5. Crea todas las tablas si no existen (idempotente via IF NOT EXISTS)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Configurando base de datos ==="

# ── 1. Detectar versión de PostgreSQL ────────────────────────────────────────
PG_VERSION=$(pg_lsclusters -h 2>/dev/null | awk 'NR==1{print $1}')

if [ -z "$PG_VERSION" ]; then
  echo "ERROR: No se encontró ningún cluster de PostgreSQL."
  echo "  Instalar con: sudo apt-get install postgresql"
  exit 1
fi

echo "PostgreSQL $PG_VERSION detectado."

# ── 2. Iniciar PostgreSQL si está caído ──────────────────────────────────────
if ! pg_lsclusters | grep -q "online"; then
  echo "Iniciando PostgreSQL $PG_VERSION..."
  pg_ctlcluster "$PG_VERSION" main start
  sleep 2
else
  echo "PostgreSQL está corriendo."
fi

# ── 3. Establecer contraseña del usuario postgres via peer auth ──────────────
# En Codespaces/Ubuntu, el usuario postgres del SO usa peer auth →
# podemos conectarnos sin contraseña y luego fijarla para TCP.
echo "Configurando contraseña del usuario postgres..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null \
  || echo "  (No se pudo via sudo, intentando conexión directa...)" \
  && psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null \
  || echo "  (Contraseña ya puede estar configurada, continuando...)"

# ── 4. Crear base de datos si no existe ─────────────────────────────────────
echo "Creando base de datos 'odontologica' si no existe..."
sudo -u postgres psql -c "CREATE DATABASE odontologica;" 2>/dev/null \
  || echo "  La base de datos ya existe."

# ── 5. Crear tablas ──────────────────────────────────────────────────────────
echo "Creando tablas (IF NOT EXISTS)..."
sudo -u postgres psql -d odontologica -f "$SCRIPT_DIR/create-tables.sql"

echo "=== Setup de base de datos completado ==="
