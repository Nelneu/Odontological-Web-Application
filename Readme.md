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

# Instructions

For security reasons, the `env.json` file is not pre-populated — you will need to generate or retrieve the values yourself.

For **JWT secrets**, generate a value with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then paste the generated value into the appropriate field.

For the **Floot Database**, request a `pg_dump` from support, upload it to your own PostgreSQL database, and then fill in the connection string value.

**Note:** Floot OAuth will not work in self-hosted environments.

For other external services, retrieve your API keys and fill in the corresponding values.

Once everything is configured, you can build and start the service with:

```
npm install -g pnpm
pnpm install
pnpm vite build
pnpm tsx server.ts
```
