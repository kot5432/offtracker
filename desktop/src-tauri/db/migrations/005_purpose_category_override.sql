BEGIN IMMEDIATE;

ALTER TABLE reflections ADD COLUMN purpose_category_override TEXT;

INSERT OR IGNORE INTO schema_versions (version) VALUES (5);

COMMIT;
