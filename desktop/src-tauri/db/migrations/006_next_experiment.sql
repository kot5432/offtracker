BEGIN IMMEDIATE;

ALTER TABLE reflections ADD COLUMN next_experiment TEXT;

INSERT OR IGNORE INTO schema_versions (version) VALUES (6);

COMMIT;
