PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_versions (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  purpose TEXT NOT NULL,
  target_time_minutes INTEGER,
  start_time TEXT NOT NULL,
  end_time TEXT,
  status TEXT NOT NULL CHECK (status IN ('active','completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  source TEXT NOT NULL CHECK (source IN ('native','browser')),
  application TEXT NOT NULL,
  application_display TEXT,
  service TEXT,
  window_title TEXT,
  process_id INTEGER,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_session_time ON events(session_id, start_time);
CREATE INDEX IF NOT EXISTS idx_events_application ON events(application);

CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  result_level TEXT NOT NULL CHECK (result_level IN (
    'completed','mostly_completed','partially_completed','minimal','not_completed'
  )),
  result_description TEXT NOT NULL,
  actual_duration_minutes INTEGER NOT NULL,
  what_wasnt_done TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_results_session_id ON results(session_id);

CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  deviation_reason TEXT NOT NULL,
  reflection_details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reflections_session_id ON reflections(session_id);

INSERT OR IGNORE INTO schema_versions (version) VALUES (1);
