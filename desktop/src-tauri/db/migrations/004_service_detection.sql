BEGIN IMMEDIATE;

-- Version 3 accepted brand prefixes, which could occur in unrelated page titles.
-- Old source titles were intentionally erased, so discard unverifiable YouTube labels.
UPDATE events SET service=NULL WHERE service='YouTube';
DELETE FROM activities;

INSERT OR IGNORE INTO schema_versions (version) VALUES (4);

COMMIT;
