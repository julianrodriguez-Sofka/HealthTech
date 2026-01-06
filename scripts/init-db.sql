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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_events_patient_id ON triage_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_events_priority ON triage_events(priority_level);

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

-- Datos de prueba (opcional, comentar en producción)
-- INSERT INTO patients (name, age, gender) VALUES
-- ('Juan Pérez', 45, 'M'),
-- ('María García', 32, 'F');

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Database initialized successfully';
END $$;
