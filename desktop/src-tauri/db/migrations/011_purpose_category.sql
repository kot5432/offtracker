BEGIN IMMEDIATE;

ALTER TABLE sessions ADD COLUMN purpose_category TEXT NOT NULL DEFAULT 'unknown'
  CHECK (purpose_category IN ('leisure','learning','task','admin','other','unknown'));

-- Existing sessions get only an initial local guess. The user can correct the
-- category in the saved reflection; no external service is involved.
UPDATE sessions SET purpose_category='leisure'
 WHERE purpose LIKE '%娯楽%' OR purpose LIKE '%楽し%' OR purpose LIKE '%息抜%' OR purpose LIKE '%休憩%' OR purpose LIKE '%リラックス%' OR purpose LIKE '%気分転換%';
UPDATE sessions SET purpose_category='learning'
 WHERE purpose_category='unknown' AND (purpose LIKE '%勉強%' OR purpose LIKE '%学習%' OR purpose LIKE '%学ぶ%' OR purpose LIKE '%理解%' OR purpose LIKE '%練習%' OR purpose LIKE '%暗記%' OR purpose LIKE '%教科書%' OR purpose LIKE '%復習%');
UPDATE sessions SET purpose_category='task'
 WHERE purpose_category='unknown' AND (purpose LIKE '%課題%' OR purpose LIKE '%レポート%' OR purpose LIKE '%論文%' OR purpose LIKE '%提出%' OR purpose LIKE '%作成%' OR purpose LIKE '%執筆%' OR purpose LIKE '%書く%' OR purpose LIKE '%開発%' OR purpose LIKE '%実装%' OR purpose LIKE '%制作%');
UPDATE sessions SET purpose_category='admin'
 WHERE purpose_category='unknown' AND (purpose LIKE '%メール%' OR purpose LIKE '%返信%' OR purpose LIKE '%連絡%' OR purpose LIKE '%会議%' OR purpose LIKE '%打ち合わせ%' OR purpose LIKE '%予約%' OR purpose LIKE '%申請%' OR purpose LIKE '%手続き%');

CREATE TABLE IF NOT EXISTS leisure_item_exclusions (
  item_type TEXT NOT NULL CHECK (item_type IN ('application','service')),
  item_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_type,item_name)
);

INSERT OR IGNORE INTO schema_versions (version) VALUES (11);
COMMIT;
