BEGIN IMMEDIATE;

ALTER TABLE reflections ADD COLUMN experiment_reflection TEXT CHECK (
  experiment_reflection IS NULL OR experiment_reflection IN ('noticed_change','no_clear_change','not_sure')
);

INSERT OR IGNORE INTO schema_versions (version) VALUES (8);

COMMIT;
