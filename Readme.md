# Odontological Web Application Project

La Agenda Odontológica es una aplicación web orientada a odontólogos y pacientes, cuyo objetivo es simplificar y centralizar la gestión de turnos, historiales clínicos y tratamientos odontológicos. El sistema permitirá la autogestión de citas por parte de pacientes, así como la organización y almacenamiento de información médica por parte del profesional. Incluirá recordatorios automáticos, distintos niveles de acceso para garantizar privacidad, eficiencia y usabilidad.

Visión: Construir una solución digital robusta, amigable y segura que se convierta en la herramienta central para la gestión profesional odontológica.
Objetivos:

- Facilitar la autogestión de turnos.
- Centralizar información clínica y administrativa.
- Asegurar privacidad de datos sensibles.
- Mejorar la organización del consultorio.
- Garantizar experiencia de usuario satisfactoria.
  Métricas de éxito:
- ≥ 90% satisfacción usuarios.
- ≥ 80% turnos autogestionados.
- Tiempo de carga < 1s.
- 0 fallos críticos reportados.

Público Objetivo & Necesidades:
Odontólogos: Profesionales independientes o en pequeños consultorios.
Pacientes: Usuarios que desean gestionar turnos y consultar información clínica.
Necesidades comunes:

- Gestión clara de agenda.
- Registro y seguimiento clínico.
- Envío de recordatorios.
- Interfaz simple y accesible.

Features Principales:

- Gestión de turnos.
- Registro de pacientes.
- Historial clínico por paciente.
- Banco de imágenes asociadas a pacientes/casos.
- Login con roles diferenciados: paciente, odontólogo, administrador.
- Recordatorios automáticos por WhatsApp o email.
- Visualización y descarga de fichas clínicas.

Requisitos Funcionales:

- Registro y login con email + contraseña.
- Recuperación de contraseña.
- Alta y edición de pacientes.
- Visualización de turnos y calendario.
- Registro de tratamientos.
- Subida y visualización de imágenes.
- Envío de recordatorios automáticos.
- Diferenciación de accesos por tipo de usuario.

Requisitos No Funcionales:

- Cumplimiento de la Ley 25.326.
- Interfaz responsive para todos los dispositivos.
- Compatibilidad con navegadores: Chrome, Firefox, Safari, Edge.
- Accesibilidad WCAG 2.1 AA.

Experiencia de Usuario:
Paciente:

- Registro / Login.
- Ver y gestionar turnos.
- Acceder a historial clínico y fichas.
  Odontólogo:
- Login.
- Visualizar agenda diaria/semanal.
- Registrar tratamientos.
- Subir imágenes y asociar a paciente.
- Consultar historial y fichas.

Criterios de Aceptación Generales:

- Todas las funcionalidades del MVP operativas.
- Pruebas unitarias e integración exitosas.
- Sin vulnerabilidades de seguridad críticas.
- Documentación técnica y de usuario disponible.
- Feedback positivo en prueba piloto.

Dependencias y Suposiciones:

- Se requiere conexión a internet estable.
- El sistema operará inicialmente en zona horaria Argentina.
- Notificaciones externas como Mailgun o Twilio.

Cronograma & Roadmap:

- Semana 1-2: Desarrollo inicial.
- Semana 3: Implementación de recordatorios y pruebas.
- Semana 4: Pruebas piloto con profesionales reales.
- Próximas fases: Dashboard de estadísticas, App móvil nativa, Integración con obras sociales, Reportes automáticos e IA básica.

Recursos y Presupuesto Estimado:

- 1 frontend dev
- 1 backend dev
- 1 diseñador UX/UI
- 1 QA manual
- Infraestructura cloud estimada: USD 100–150/mes
- Servicios de terceros: Twilio, Mailgun.

Riesgos y Mitigaciones:
| Riesgo | Mitigación |
| --- | --- |
| Fallos en recordatorios | Envío redundante por email + monitoreo |
| Errores humanos en carga | Validaciones robustas + edición permitida |
| Baja adopción profesional | Piloto + mejoras de UX + soporte directo |
| Latencia en móviles | Diseño mobile-first + optimización de assets |

Preguntas Abiertas:

- ¿Se ofrecerá soporte técnico desde el MVP?
- ¿Se necesita soporte multilingüe?
- ¿Cuánto tiempo se almacenarán las imágenes clínicas?

Made with Floot.

---

# Cómo levantar la aplicación localmente

## Requisitos previos

- [Node.js](https://nodejs.org/) v22+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- PostgreSQL 16

## Opción A — Script automático (recomendado)

Este script hace todo: instala dependencias, levanta PostgreSQL, crea la base de datos con sus tablas, genera `env.json`, carga usuarios de prueba y arranca el servidor.

```bash
bash setup-local.sh
```

La app queda disponible en **http://localhost:3344**.

---

## Opción B — Paso a paso manual

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp env.example.json env.json
```

Contenido de `env.json`:

```json
{
  "FLOOT_DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/odontologica",
  "JWT_SECRET": "<generá un valor con el comando de abajo>"
}
```

Para generar el `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Levantar PostgreSQL y crear la base de datos

```bash
# Iniciar PostgreSQL (Ubuntu / Codespaces)
pg_ctlcluster 16 main start

# Configurar la contraseña del usuario postgres (necesario para conexiones TCP)
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""

# Crear la base de datos
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE odontologica;"
```

Luego ejecutá el script SQL de creación de tablas incluido en `setup-local.sh` (sección `[4/5]`), o corrés directamente `bash setup-local.sh` que lo hace de forma automática.

### 4. Cargar usuarios de prueba

```bash
pnpm exec tsx scripts/seed.ts
```

El script es idempotente: si los usuarios ya existen, actualiza sus contraseñas.

### 5. Build del frontend

```bash
pnpm build
```

### 6. Iniciar el servidor

```bash
pnpm start
```

La app queda disponible en **http://localhost:3344**.

---

## Credenciales de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | admin@test.com | Test1234 |
| Dentista | prof@test.com | Test1234 |
| Paciente | paciente@test.com | Test1234 |

También se muestran en la pantalla de login de la app.

---

## GitHub Codespaces

Al abrir el repositorio en Codespaces, el entorno se configura automáticamente:

- **`postCreateCommand`**: instala dependencias, configura PostgreSQL, crea la base de datos y carga usuarios de prueba.
- **`postStartCommand`**: reinicia PostgreSQL automáticamente cada vez que el Codespace se reactiva desde suspensión.

Una vez que el Codespace termine de crear, solo necesitás:

```bash
pnpm build
pnpm start
```

El puerto 3344 se reenvía automáticamente y se abre en el navegador.

---

## Comandos útiles

| Comando | Descripción |
| --- | --- |
| `pnpm start` | Inicia el servidor |
| `pnpm build` | Compila el frontend |
| `pnpm test` | Corre todos los tests |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm lint` | Verifica el código con ESLint |
| `pnpm lint:fix` | Corrige errores de lint automáticamente |
| `pnpm exec tsx scripts/seed.ts` | Recarga usuarios de prueba |
