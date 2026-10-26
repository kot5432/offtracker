BEGIN IMMEDIATE;

ALTER TABLE sessions ADD COLUMN experiment_source_session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN experiment_proposal TEXT;
ALTER TABLE sessions ADD COLUMN experiment_text TEXT;
ALTER TABLE sessions ADD COLUMN experiment_choice TEXT CHECK (experiment_choice IS NULL OR experiment_choice IN ('adopted','edited','skipped'));

CREATE INDEX IF NOT EXISTS idx_sessions_experiment_source ON sessions(experiment_source_session_id);

INSERT OR IGNORE INTO schema_versions (version) VALUES (7);

COMMIT;
