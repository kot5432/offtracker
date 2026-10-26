CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'programming','writing','reading','research','communication','other'
  )),
  label TEXT NOT NULL,
  applications_used TEXT NOT NULL,
  event_ids TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_session_time
  ON activities(session_id, start_time);

INSERT OR IGNORE INTO schema_versions (version) VALUES (2);
