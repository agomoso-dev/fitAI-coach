-- Base de datos para aplicación de entrenamiento inspirada en principios RTS/RPE
-- Stack recomendado: Django + Django REST Framework + React/Vite
-- Motor: PostgreSQL
-- Nota: adapta nombres si usas SQLite durante desarrollo.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- ENUMS
-- =========================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sex_type AS ENUM ('male', 'female', 'other', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('planned', 'in_progress', 'completed', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE progression_rule_type AS ENUM (
        'rpe_based',
        'fatigue_based',
        'bodyweight_based',
        'e1rm_based',
        'ai_assisted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =========================
-- USUARIOS Y ROLES
-- =========================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(120),
    last_name VARCHAR(120),
    role user_role NOT NULL DEFAULT 'athlete',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athlete_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    birth_date DATE,
    sex sex_type DEFAULT 'unknown',
    height_cm NUMERIC(5,2),
    training_experience_months INTEGER DEFAULT 0,
    goal TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    speciality VARCHAR(180),
    biography TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- DATOS CORPORALES Y READINESS
-- =========================

CREATE TABLE IF NOT EXISTS bodyweight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    bodyweight_kg NUMERIC(6,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, log_date)
);

CREATE TABLE IF NOT EXISTS readiness_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    sleep_hours NUMERIC(4,2),
    sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 10),
    stress_level SMALLINT CHECK (stress_level BETWEEN 1 AND 10),
    soreness_level SMALLINT CHECK (soreness_level BETWEEN 1 AND 10),
    motivation_level SMALLINT CHECK (motivation_level BETWEEN 1 AND 10),
    readiness_score NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, log_date)
);

-- =========================
-- EJERCICIOS
-- =========================

CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    category VARCHAR(120), -- fuerza, hipertrofia, accesorio, cardio, movilidad
    main_muscle_group VARCHAR(120),
    equipment VARCHAR(120),
    is_bodyweight BOOLEAN NOT NULL DEFAULT FALSE,
    is_competition_lift BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    video_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- PLANES Y BLOQUES DE ENTRENAMIENTO
-- =========================

CREATE TABLE IF NOT EXISTS training_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(180) NOT NULL,
    objective VARCHAR(180), -- fuerza, hipertrofia, peaking, mantenimiento, recomposición
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_weeks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES training_blocks(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    target_fatigue_percent NUMERIC(5,2) DEFAULT 5.00,
    deload BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    UNIQUE (block_id, week_number)
);

CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID REFERENCES training_weeks(id) ON DELETE SET NULL,
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    title VARCHAR(180) NOT NULL,
    status session_status NOT NULL DEFAULT 'planned',
    perceived_session_rpe NUMERIC(3,1) CHECK (perceived_session_rpe BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planned_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    order_index INTEGER NOT NULL DEFAULT 0,
    target_sets INTEGER,
    target_reps INTEGER,
    target_rpe NUMERIC(3,1) CHECK (target_rpe BETWEEN 1 AND 10),
    target_rir NUMERIC(3,1),
    target_load_kg NUMERIC(7,2),
    target_percent_1rm NUMERIC(5,2),
    target_fatigue_percent NUMERIC(5,2),
    rest_seconds INTEGER,
    notes TEXT
);

-- =========================
-- REGISTRO REAL DE SERIES
-- =========================

CREATE TABLE IF NOT EXISTS performed_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planned_exercise_id UUID REFERENCES planned_exercises(id) ON DELETE SET NULL,
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    set_number INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    load_kg NUMERIC(7,2) NOT NULL DEFAULT 0,
    rpe NUMERIC(3,1) CHECK (rpe BETWEEN 1 AND 10),
    rir NUMERIC(3,1),
    velocity_mps NUMERIC(5,3),
    tempo VARCHAR(40),
    is_top_set BOOLEAN NOT NULL DEFAULT FALSE,
    is_backoff_set BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_1rm_kg NUMERIC(7,2),
    fatigue_percent NUMERIC(5,2),
    notes TEXT,
    performed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- TABLA RPE / PORCENTAJE ESTIMADO 1RM
-- Puedes rellenarla con una tabla propia o ajustarla por atleta.
-- =========================

CREATE TABLE IF NOT EXISTS rpe_percentage_chart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reps INTEGER NOT NULL,
    rpe NUMERIC(3,1) NOT NULL,
    percent_1rm NUMERIC(6,3) NOT NULL,
    source VARCHAR(120) DEFAULT 'custom',
    UNIQUE (reps, rpe, source)
);

CREATE TABLE IF NOT EXISTS athlete_rpe_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    reps INTEGER NOT NULL,
    rpe NUMERIC(3,1) NOT NULL,
    percent_1rm NUMERIC(6,3) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, exercise_id, reps, rpe)
);

-- =========================
-- CALCULADORAS: PROGRESIÓN, FATIGA Y PESO CORPORAL
-- =========================

CREATE TABLE IF NOT EXISTS progression_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    rule_type progression_rule_type NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    min_readiness_score NUMERIC(5,2),
    max_fatigue_percent NUMERIC(5,2),
    load_increment_kg NUMERIC(6,2) DEFAULT 2.50,
    load_decrement_kg NUMERIC(6,2) DEFAULT 2.50,
    bodyweight_multiplier NUMERIC(6,3), -- por ejemplo: sentadilla objetivo = 1.5 x peso corporal
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progression_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES progression_rules(id) ON DELETE SET NULL,
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_load_kg NUMERIC(7,2),
    current_reps INTEGER,
    current_rpe NUMERIC(3,1),
    current_e1rm_kg NUMERIC(7,2),
    bodyweight_kg NUMERIC(6,2),
    fatigue_percent NUMERIC(5,2),
    readiness_score NUMERIC(5,2),
    recommended_load_kg NUMERIC(7,2),
    recommended_reps INTEGER,
    recommended_rpe NUMERIC(3,1),
    recommendation_reason TEXT,
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fatigue_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    initial_load_kg NUMERIC(7,2),
    initial_reps INTEGER,
    initial_rpe NUMERIC(3,1),
    initial_e1rm_kg NUMERIC(7,2),
    final_load_kg NUMERIC(7,2),
    final_reps INTEGER,
    final_rpe NUMERIC(3,1),
    final_e1rm_kg NUMERIC(7,2),
    fatigue_percent NUMERIC(5,2),
    velocity_loss_percent NUMERIC(5,2),
    recommendation TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bodyweight_progression_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    target_multiplier NUMERIC(6,3) NOT NULL, -- ejemplo 1.50 x peso corporal
    target_reps INTEGER DEFAULT 1,
    target_rpe NUMERIC(3,1) DEFAULT 9.0,
    current_best_load_kg NUMERIC(7,2),
    current_bodyweight_kg NUMERIC(6,2),
    target_load_kg NUMERIC(7,2),
    achieved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- DIETAS Y NUTRICIÓN
-- =========================

CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(180) NOT NULL,
    calories_per_100g NUMERIC(7,2),
    protein_per_100g NUMERIC(7,2),
    carbs_per_100g NUMERIC(7,2),
    fat_per_100g NUMERIC(7,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diet_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(180) NOT NULL,
    objective VARCHAR(120), -- volumen, definición, mantenimiento, rendimiento
    target_calories NUMERIC(8,2),
    target_protein_g NUMERIC(8,2),
    target_carbs_g NUMERIC(8,2),
    target_fat_g NUMERIC(8,2),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    order_index INTEGER DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS meal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
    quantity_g NUMERIC(8,2) NOT NULL
);

-- =========================
-- IA: RECOMENDACIONES, AUTOMATIZACIÓN Y AUDITORÍA
-- =========================

CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    related_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    related_exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    recommendation_type VARCHAR(120) NOT NULL, -- progression, fatigue, diet, deload, technique
    prompt_context JSONB DEFAULT '{}'::jsonb,
    recommendation TEXT NOT NULL,
    confidence_score NUMERIC(5,2),
    accepted_by_coach BOOLEAN,
    accepted_by_athlete BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(180) NOT NULL,
    job_type VARCHAR(120) NOT NULL, -- weekly_progression, fatigue_review, diet_adjustment
    schedule_cron VARCHAR(120),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES automation_jobs(id) ON DELETE CASCADE,
    status VARCHAR(80) NOT NULL, -- success, failed, skipped
    output JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- ÍNDICES
-- =========================

CREATE INDEX IF NOT EXISTS idx_bodyweight_logs_athlete_date ON bodyweight_logs(athlete_id, log_date);
CREATE INDEX IF NOT EXISTS idx_readiness_logs_athlete_date ON readiness_logs(athlete_id, log_date);
CREATE INDEX IF NOT EXISTS idx_sessions_athlete_date ON training_sessions(athlete_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sets_athlete_exercise ON performed_sets(athlete_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_progression_calculations_athlete_exercise ON progression_calculations(athlete_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_fatigue_calculations_athlete_date ON fatigue_calculations(athlete_id, calculation_date);

-- =========================
-- DATOS INICIALES BÁSICOS
-- =========================

INSERT INTO exercises (name, slug, category, main_muscle_group, equipment, is_bodyweight, is_competition_lift)
VALUES
('Sentadilla', 'sentadilla', 'fuerza', 'pierna', 'barra', FALSE, TRUE),
('Press banca', 'press-banca', 'fuerza', 'pecho', 'barra', FALSE, TRUE),
('Peso muerto', 'peso-muerto', 'fuerza', 'cadena posterior', 'barra', FALSE, TRUE),
('Dominadas', 'dominadas', 'fuerza', 'espalda', 'peso corporal', TRUE, FALSE),
('Fondos', 'fondos', 'fuerza', 'tríceps/pecho', 'peso corporal', TRUE, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- Ejemplo simple de tabla RPE base. Puedes ampliarla después.
INSERT INTO rpe_percentage_chart (reps, rpe, percent_1rm, source)
VALUES
(1, 10.0, 100.000, 'base'),
(1, 9.5, 97.800, 'base'),
(1, 9.0, 95.500, 'base'),
(1, 8.5, 93.900, 'base'),
(1, 8.0, 92.200, 'base'),
(2, 10.0, 95.500, 'base'),
(2, 9.5, 93.900, 'base'),
(2, 9.0, 92.200, 'base'),
(2, 8.5, 90.700, 'base'),
(2, 8.0, 89.200, 'base'),
(3, 10.0, 92.200, 'base'),
(3, 9.5, 90.700, 'base'),
(3, 9.0, 89.200, 'base'),
(3, 8.5, 87.800, 'base'),
(3, 8.0, 86.300, 'base'),
(5, 10.0, 86.300, 'base'),
(5, 9.5, 84.900, 'base'),
(5, 9.0, 83.700, 'base'),
(5, 8.5, 82.400, 'base'),
(5, 8.0, 81.100, 'base')
ON CONFLICT (reps, rpe, source) DO NOTHING;

