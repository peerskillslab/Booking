CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin','tutor','student')),
  studienjahr INTEGER DEFAULT 1 CHECK (studienjahr BETWEEN 1 AND 6),
  created_date TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE IF NOT EXISTS courses (
  id                   TEXT PRIMARY KEY,
  title                TEXT NOT NULL,
  description          TEXT,
  short_description    TEXT,
  category             TEXT NOT NULL,
  instructor           TEXT,
  date                 TEXT NOT NULL,
  time                 TEXT,
  duration_minutes     INTEGER,
  max_participants     INTEGER NOT NULL,
  current_participants INTEGER NOT NULL DEFAULT 0,
  location             TEXT,
  image_url            TEXT,
  level                TEXT CHECK (level IN ('Anfänger','Fortgeschritten','Experte','Alle Level')),
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','completed','draft')),
  extra_dates          TEXT,
  kurs_nr              INTEGER,
  created_by           TEXT,
  created_date         TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS kurs_nr INTEGER;

CREATE TABLE IF NOT EXISTS bookings (
  id           TEXT PRIMARY KEY,
  course_id    TEXT NOT NULL,
  course_title TEXT NOT NULL,
  user_email   TEXT NOT NULL,
  user_name    TEXT,
  status       TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','pending')),
  notes        TEXT,
  price_paid   DOUBLE PRECISION DEFAULT 0,
  created_by   TEXT,
  created_date TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS course_templates (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT,
  short_description TEXT,
  category          TEXT NOT NULL,
  duration_minutes  INTEGER,
  max_participants  INTEGER,
  location          TEXT,
  image_url         TEXT,
  level             TEXT CHECK (level IN ('Anfänger','Fortgeschritten','Experte','Alle Level')),
  session_count     INTEGER DEFAULT 1,
  created_by        TEXT,
  created_date      TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE IF NOT EXISTS monthly_stat_snapshots (
  id                 TEXT PRIMARY KEY,
  month_label        TEXT NOT NULL,
  total_courses      INTEGER,
  total_participants INTEGER,
  total_bookings     INTEGER,
  tutor_data         TEXT,
  course_data        TEXT,
  reset_date         TEXT,
  created_date       TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE IF NOT EXISTS course_feedbacks (
  id                TEXT PRIMARY KEY,
  course_id         TEXT NOT NULL,
  course_title      TEXT NOT NULL,
  instructor        TEXT NOT NULL,
  user_email        TEXT NOT NULL,
  q1_good           TEXT,
  q2_improve        TEXT,
  q3_helpful        INTEGER CHECK (q3_helpful BETWEEN 1 AND 5),
  q4_recommend      TEXT CHECK (q4_recommend IN ('Ja','Eher ja','Eher nein','Nein')),
  created_date      TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);

-- Indexes for common filter/sort operations
CREATE INDEX IF NOT EXISTS idx_courses_status       ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_date         ON courses(date);
CREATE INDEX IF NOT EXISTS idx_courses_created_by   ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_bookings_user_email  ON bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_course_id   ON bookings(course_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_course_id  ON course_feedbacks(course_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_instructor ON course_feedbacks(instructor);
