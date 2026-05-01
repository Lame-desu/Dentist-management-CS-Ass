-- ═══════════════════════════════════════════════════════════════════
-- DAMS — Dentist Appointments & Management System
-- Migration 001: Initial Schema
-- ═══════════════════════════════════════════════════════════════════

-- ─── Trigger Function: auto-update updated_at ────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── 1. Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  full_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(100) UNIQUE NOT NULL,
  phone_number    VARCHAR(20),
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('patient','dentist','receptionist','admin')),
  profile_photo   VARCHAR(500),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ─── 2. Patients ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth   DATE,
  gender          VARCHAR(10) CHECK (gender IN ('male','female','other')),
  address         TEXT,
  emergency_contact VARCHAR(100),
  blood_group     VARCHAR(5),
  allergies       TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ─── 3. Dentists ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dentists (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization  VARCHAR(100),
  license_number  VARCHAR(50) UNIQUE,
  years_of_experience INTEGER DEFAULT 0,
  bio             TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ─── 4. Dentist Availability ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS dentist_availability (
  id              SERIAL PRIMARY KEY,
  dentist_id      INTEGER NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_available    BOOLEAN DEFAULT true,
  UNIQUE(dentist_id, day_of_week)
);


-- ─── 5. Receptionists ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receptionists (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift           VARCHAR(20) CHECK (shift IN ('morning','afternoon','full_day')),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ─── 6. Appointments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              SERIAL PRIMARY KEY,
  patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id      INTEGER NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  reviewed_by     INTEGER REFERENCES receptionists(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','reviewed','forwarded','approved','completed','rejected','cancelled','rescheduled')),
  is_emergency    BOOLEAN DEFAULT false,
  reason          TEXT,
  rejection_reason TEXT,
  notes           TEXT,
  created_by_role VARCHAR(20) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ─── 7. Dental Records ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dental_records (
  id              SERIAL PRIMARY KEY,
  appointment_id  INTEGER UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id      INTEGER NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  diagnosis       TEXT NOT NULL,
  treatment       TEXT NOT NULL,
  notes           TEXT,
  visit_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ─── 8. Prescriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id              SERIAL PRIMARY KEY,
  dental_record_id INTEGER NOT NULL REFERENCES dental_records(id) ON DELETE CASCADE,
  medicine_name   VARCHAR(200) NOT NULL,
  dosage          VARCHAR(100) NOT NULL,
  duration        VARCHAR(100),
  remarks         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ─── 9. Notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  message         TEXT NOT NULL,
  type            VARCHAR(50) DEFAULT 'general',
  is_read         BOOLEAN DEFAULT false,
  related_appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ─── 10. Queue Entries ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queue_entries (
  id              SERIAL PRIMARY KEY,
  appointment_id  INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id      INTEGER NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  queue_number    INTEGER NOT NULL,
  status          VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting','in_progress','completed','cancelled')),
  check_in_time   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  called_time     TIMESTAMP,
  completed_time  TIMESTAMP,
  queue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(queue_date, queue_number)
);


-- ─── 11. Clinic Configuration ───────────────────────────────────
CREATE TABLE IF NOT EXISTS clinic_configuration (
  id              SERIAL PRIMARY KEY,
  config_key      VARCHAR(100) UNIQUE NOT NULL,
  config_value    TEXT NOT NULL,
  description     TEXT,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id      ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_id      ON appointments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status          ON appointments(status);

-- Dental Records
CREATE INDEX IF NOT EXISTS idx_dental_records_patient_id    ON dental_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_dental_records_dentist_id    ON dental_records(dentist_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id        ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read        ON notifications(is_read);

-- Queue Entries
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_date     ON queue_entries(queue_date);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status         ON queue_entries(status);


-- ═══════════════════════════════════════════════════════════════════
-- DEFAULT CLINIC CONFIGURATION
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO clinic_configuration (config_key, config_value, description) VALUES
  ('working_days',                          '1,2,3,4,5', 'Working days (0=Sun … 6=Sat)'),
  ('opening_time',                          '08:00',      'Clinic opening time'),
  ('closing_time',                          '17:00',      'Clinic closing time'),
  ('appointment_duration_minutes',          '30',         'Default appointment slot duration in minutes'),
  ('max_appointments_per_day_per_dentist',  '16',         'Maximum appointments a dentist can have per day')
ON CONFLICT (config_key) DO NOTHING;
