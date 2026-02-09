-- Seed data for Odontological Web Application
-- Passwords are all "password123" hashed with bcrypt (10 rounds)
-- Hash: $2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO

BEGIN;

-- ============================================
-- USERS
-- ============================================

-- Admin user
INSERT INTO users (email, display_name, role) VALUES
  ('admin@clinica.com', 'Administrador', 'admin');

-- Dentists
INSERT INTO users (email, display_name, role) VALUES
  ('dra.garcia@clinica.com', 'Dra. María García', 'dentist'),
  ('dr.lopez@clinica.com', 'Dr. Carlos López', 'dentist'),
  ('dra.martinez@clinica.com', 'Dra. Ana Martínez', 'dentist');

-- Patients
INSERT INTO users (email, display_name, role) VALUES
  ('juan.perez@email.com', 'Juan Pérez', 'patient'),
  ('laura.gomez@email.com', 'Laura Gómez', 'patient'),
  ('pedro.sanchez@email.com', 'Pedro Sánchez', 'patient'),
  ('maria.rodriguez@email.com', 'María Rodríguez', 'patient'),
  ('carlos.fernandez@email.com', 'Carlos Fernández', 'patient');

-- ============================================
-- PASSWORDS (all "password123")
-- ============================================
INSERT INTO user_passwords (user_id, password_hash) VALUES
  (1, '$2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO'),
  (2, '$2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO'),
  (3, '$2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO'),
  (4, '$2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO'),
  (5, '$2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO'),
  (6, '$2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO'),
  (7, '$2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO'),
  (8, '$2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO'),
  (9, '$2b$10$IVpSUdvWjajPhWmwins2/ucn2Jba7zSpdpNvSAmG5IqhK6i74yHdO');

-- ============================================
-- PATIENTS (profiles linked to patient users)
-- ============================================
INSERT INTO patients (user_id, phone, birth_date, address, emergency_contact_name, emergency_contact_phone, medical_history, allergies) VALUES
  (5, '+54 11 5555-0001', '1985-03-15', 'Av. Corrientes 1234, CABA', 'Ana Pérez', '+54 11 5555-1001', 'Sin antecedentes relevantes', NULL),
  (6, '+54 11 5555-0002', '1990-07-22', 'Av. Santa Fe 4567, CABA', 'Roberto Gómez', '+54 11 5555-1002', 'Diabetes tipo 2', 'Penicilina'),
  (7, '+54 11 5555-0003', '1978-11-08', 'Calle Florida 890, CABA', 'Carmen Sánchez', '+54 11 5555-1003', 'Hipertensión controlada', NULL),
  (8, '+54 11 5555-0004', '1995-01-30', 'Av. Rivadavia 2345, CABA', 'José Rodríguez', '+54 11 5555-1004', NULL, 'Látex'),
  (9, '+54 11 5555-0005', '1982-09-12', 'Calle Lavalle 678, CABA', 'Marta Fernández', '+54 11 5555-1005', 'Marcapasos', 'Ibuprofeno, Aspirina');

-- ============================================
-- APPOINTMENTS
-- ============================================
INSERT INTO appointments (patient_id, dentist_id, appointment_date, duration_minutes, reason, notes, status) VALUES
  -- Past appointments (completed)
  (1, 2, NOW() - INTERVAL '7 days',  30, 'Limpieza dental', 'Paciente en buen estado general', 'completada'),
  (2, 3, NOW() - INTERVAL '5 days',  45, 'Tratamiento de conducto', 'Pieza 36, primera sesión', 'completada'),
  (3, 2, NOW() - INTERVAL '3 days',  30, 'Control periódico', 'Se detectó caries en pieza 14', 'completada'),
  -- Today's appointments
  (4, 2, NOW() + INTERVAL '1 hour',  30, 'Extracción de muela de juicio', NULL, 'confirmada'),
  (5, 3, NOW() + INTERVAL '2 hours', 60, 'Ortodoncia - control mensual', NULL, 'programada'),
  (1, 4, NOW() + INTERVAL '3 hours', 30, 'Blanqueamiento dental', NULL, 'confirmada'),
  -- Future appointments
  (2, 2, NOW() + INTERVAL '2 days',  45, 'Tratamiento de conducto - segunda sesión', 'Continuación pieza 36', 'programada'),
  (3, 4, NOW() + INTERVAL '3 days',  30, 'Empaste dental', 'Pieza 14', 'programada'),
  (4, 3, NOW() + INTERVAL '5 days',  30, 'Control post-extracción', NULL, 'programada'),
  -- Cancelled
  (5, 2, NOW() - INTERVAL '1 day',   30, 'Control periódico', 'Paciente canceló por enfermedad', 'cancelada');

-- ============================================
-- TREATMENTS
-- ============================================
INSERT INTO treatments (patient_id, dentist_id, appointment_id, treatment_type, description, tooth_number, cost, notes, status) VALUES
  (1, 2, 1, 'Limpieza dental', 'Limpieza profunda con ultrasonido', NULL, 8500.00, 'Sin complicaciones', 'completado'),
  (2, 3, 2, 'Endodoncia', 'Tratamiento de conducto - primera sesión', '36', 25000.00, 'Se requiere segunda sesión', 'en_progreso'),
  (3, 2, 3, 'Diagnóstico', 'Detección de caries', '14', 3000.00, 'Programar empaste', 'completado'),
  (1, 2, NULL, 'Radiografía panorámica', 'Radiografía de control anual', NULL, 5000.00, NULL, 'completado'),
  (5, 3, NULL, 'Ortodoncia', 'Colocación de brackets metálicos', NULL, 120000.00, 'Plan de 18 meses', 'en_progreso');

-- ============================================
-- CLINICAL IMAGES
-- ============================================
INSERT INTO clinical_images (patient_id, treatment_id, uploaded_by, file_name, file_url, image_type, description) VALUES
  (1, 4, 2, 'panoramica_perez_2025.jpg', '/uploads/panoramica_perez_2025.jpg', 'xray', 'Radiografía panorámica anual'),
  (2, 2, 3, 'conducto_gomez_36.jpg', '/uploads/conducto_gomez_36.jpg', 'xray', 'Radiografía periapical pieza 36'),
  (3, 3, 2, 'caries_sanchez_14.jpg', '/uploads/caries_sanchez_14.jpg', 'photo', 'Fotografía intraoral - caries pieza 14');

COMMIT;
