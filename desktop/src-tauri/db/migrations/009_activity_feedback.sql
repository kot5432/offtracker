BEGIN IMMEDIATE;

CREATE TABLE IF NOT EXISTS activity_feedback (
  session_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  label TEXT NOT NULL,
  relation TEXT NOT NULL CHECK (relation IN ('related','unrelated','uncertain')),
  details TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, activity_type, label),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_feedback_session ON activity_feedback(session_id);

INSERT OR IGNORE INTO schema_versions (version) VALUES (9);

COMMIT;
