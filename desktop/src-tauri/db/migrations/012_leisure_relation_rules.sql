BEGIN IMMEDIATE;

CREATE TABLE IF NOT EXISTS leisure_relation_rules (
  item_type TEXT NOT NULL CHECK (item_type IN ('application','service')),
  item_name TEXT NOT NULL,
  purpose_category TEXT NOT NULL CHECK (purpose_category IN ('leisure','learning','task','admin','other','unknown')),
  relation TEXT NOT NULL CHECK (relation IN ('related','unrelated','uncertain')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_type,item_name,purpose_category)
);

INSERT OR IGNORE INTO schema_versions (version) VALUES (12);
COMMIT;
