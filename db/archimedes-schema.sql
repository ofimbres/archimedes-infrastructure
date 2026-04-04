-- PostgreSQL schema for Archimedes (education platform).
-- Apply after RDS exists: psql ... -f db/archimedes-schema.sql
-- Target: PostgreSQL 15+ (gen_random_uuid() is built-in).

-- =============================================================================
-- 1. SCHOOLS
-- =============================================================================

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_schools_code ON schools (code);
CREATE INDEX idx_schools_name ON schools (name);

-- =============================================================================
-- 2. STUDENTS
-- =============================================================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE students
    ADD COLUMN full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

CREATE INDEX idx_students_school ON students (school_id);
CREATE UNIQUE INDEX idx_students_email ON students (email);
CREATE INDEX idx_students_active ON students (school_id, is_active);

-- =============================================================================
-- 3. TEACHERS
-- =============================================================================

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    max_classes INTEGER DEFAULT 6,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teachers
    ADD COLUMN full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

CREATE INDEX idx_teachers_school ON teachers (school_id);
CREATE UNIQUE INDEX idx_teachers_email ON teachers (email);
CREATE UNIQUE INDEX idx_teachers_username ON teachers (username);
CREATE INDEX idx_teachers_active ON teachers (school_id, is_active);

-- =============================================================================
-- 4. COURSES (school must match teacher’s school — enforced by trigger, not CHECK)
-- =============================================================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers (id) ON DELETE CASCADE,
    course_name VARCHAR(100) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    join_code VARCHAR(10) UNIQUE NOT NULL,
    academic_year VARCHAR(10) NOT NULL DEFAULT '2024-25',
    semester VARCHAR(20) NOT NULL DEFAULT 'Fall',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION courses_teacher_school_match_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM teachers t
        WHERE t.id = NEW.teacher_id
          AND t.school_id = NEW.school_id
    ) THEN
        RAISE EXCEPTION 'courses.school_id must match teachers.school_id for teacher_id %', NEW.teacher_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER courses_teacher_school_match_trg
    BEFORE INSERT OR UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION courses_teacher_school_match_fn();

CREATE INDEX idx_courses_school ON courses (school_id);
CREATE INDEX idx_courses_teacher ON courses (teacher_id);
CREATE INDEX idx_courses_active ON courses (school_id, is_active);
CREATE INDEX idx_courses_year ON courses (school_id, academic_year);
CREATE UNIQUE INDEX idx_courses_join_code ON courses (join_code);

-- =============================================================================
-- 5. ENROLLMENTS
-- =============================================================================

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    enrollment_status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments (student_id);
CREATE INDEX idx_enrollments_course ON enrollments (course_id);
CREATE INDEX idx_enrollments_status ON enrollments (enrollment_status);
CREATE INDEX idx_enrollments_active ON enrollments (course_id, enrollment_status)
    WHERE enrollment_status = 'active';

-- =============================================================================
-- 6. TOPICS
-- =============================================================================

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) UNIQUE NOT NULL,
    display_order INTEGER
);

CREATE INDEX idx_topics_name ON topics (name);

-- =============================================================================
-- 7. SUBTOPICS
-- =============================================================================

CREATE TABLE subtopics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    display_order INTEGER,
    UNIQUE (topic_id, name)
);

CREATE INDEX idx_subtopics_topic ON subtopics (topic_id);
CREATE INDEX idx_subtopics_name ON subtopics (name);

-- =============================================================================
-- 8. ACTIVITIES
-- =============================================================================

CREATE TABLE activities (
    activity_id VARCHAR(20) PRIMARY KEY,
    subtopic_id UUID NOT NULL REFERENCES subtopics (id) ON DELETE RESTRICT,
    description VARCHAR(500),
    activity_type VARCHAR(50) NOT NULL DEFAULT 'miniquiz',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_subtopic ON activities (subtopic_id);
CREATE INDEX idx_activities_type ON activities (activity_type);

-- =============================================================================
-- 9. ASSIGNMENTS
-- =============================================================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    activity_id VARCHAR(20) NOT NULL REFERENCES activities (activity_id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES teachers (id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ,
    title_override VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (course_id, activity_id)
);

CREATE INDEX idx_assignments_course ON assignments (course_id);
CREATE INDEX idx_assignments_assigned_by ON assignments (assigned_by);

-- =============================================================================
-- 10. ASSIGNMENT COMPLETIONS
-- =============================================================================

CREATE TABLE assignment_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments (id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    score NUMERIC(5, 2),
    UNIQUE (student_id, assignment_id)
);

CREATE INDEX idx_assignment_completions_assignment ON assignment_completions (assignment_id);
CREATE INDEX idx_assignment_completions_student ON assignment_completions (student_id);
