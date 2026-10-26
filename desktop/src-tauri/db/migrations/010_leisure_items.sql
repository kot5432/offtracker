BEGIN IMMEDIATE;

CREATE TABLE IF NOT EXISTS leisure_items (
  item_type TEXT NOT NULL CHECK (item_type IN ('application','service')),
  item_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_type, item_name)
);

INSERT OR IGNORE INTO schema_versions (version) VALUES (10);

COMMIT;
