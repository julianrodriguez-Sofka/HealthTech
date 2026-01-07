-- ====================================================================
-- Database Initialization Script - HealthTech Triage System
-- ====================================================================
-- Este script crea las tablas iniciales necesarias para el sistema.
-- Se ejecuta automáticamente cuando PostgreSQL inicia por primera vez.
-- ====================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(50),
    symptoms TEXT[],
    vitals JSONB,
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    manual_priority INTEGER CHECK (manual_priority BETWEEN 1 AND 5),
    status VARCHAR(50) DEFAULT 'waiting',
    assigned_doctor_id UUID,
    assigned_doctor_name VARCHAR(255),
    assigned_nurse_id UUID,
    arrival_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    treatment_start_time TIMESTAMP,
    discharge_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de médicos (extiende users)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    current_patient_load INTEGER DEFAULT 0,
    max_patient_load INTEGER DEFAULT 10 CHECK (max_patient_load > 0 AND max_patient_load <= 50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de enfermeros (extiende users)
CREATE TABLE IF NOT EXISTS nurses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area VARCHAR(100) NOT NULL,
    shift VARCHAR(20) CHECK (shift IN ('morning', 'afternoon', 'night')),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de comentarios de pacientes
CREATE TABLE IF NOT EXISTS patient_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('observation', 'diagnosis', 'treatment', 'status_change', 'transfer', 'discharge')),
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de signos vitales
CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    heart_rate INTEGER,
    blood_pressure VARCHAR(20),
    temperature DECIMAL(4, 2),
    oxygen_saturation INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de eventos de triaje
CREATE TABLE IF NOT EXISTS triage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    priority_level INTEGER NOT NULL CHECK (priority_level BETWEEN 1 AND 5),
    reason TEXT,
    assigned_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_priority ON patients(priority);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_assigned_doctor ON patients(assigned_doctor_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_events_patient_id ON triage_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_events_priority ON triage_events(priority_level);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available);
CREATE INDEX IF NOT EXISTS idx_nurses_user_id ON nurses(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_comments_patient ON patient_comments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_comments_author ON patient_comments(author_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurses_updated_at BEFORE UPDATE ON nurses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de prueba (opcional, comentar en producción)
-- Admin user
INSERT INTO users (id, email, name, role, status) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@healthtech.com', 'Admin System', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Sample doctor
INSERT INTO users (id, email, name, role, status) VALUES
('00000000-0000-0000-0000-000000000002', 'doctor@healthtech.com', 'Dr. Juan Pérez', 'doctor', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctors (user_id, specialty, license_number, is_available, current_patient_load, max_patient_load) VALUES
('00000000-0000-0000-0000-000000000002', 'emergency_medicine', 'MED-12345', true, 0, 10)
ON CONFLICT (user_id) DO NOTHING;

-- Sample nurse
INSERT INTO users (id, email, name, role, status) VALUES
('00000000-0000-0000-0000-000000000003', 'nurse@healthtech.com', 'Enfermera María García', 'nurse', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO nurses (user_id, area, shift, license_number) VALUES
('00000000-0000-0000-0000-000000000003', 'triage', 'morning', 'NUR-67890')
ON CONFLICT (user_id) DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Database initialized successfully';
END $$;
