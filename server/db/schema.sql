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
  created_by           TEXT,
  created_date         TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

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

-- Indexes for common filter/sort operations
CREATE INDEX IF NOT EXISTS idx_courses_status       ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_date         ON courses(date);
CREATE INDEX IF NOT EXISTS idx_courses_created_by   ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_bookings_user_email  ON bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_course_id   ON bookings(course_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings(status);
