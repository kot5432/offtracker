BEGIN IMMEDIATE;

ALTER TABLE activities ADD COLUMN services_used TEXT NOT NULL DEFAULT '[]';
ALTER TABLE activities ADD COLUMN purpose_relation TEXT CHECK (
  purpose_relation IS NULL OR purpose_relation IN (
    'related','possibly_related','uncertain','possibly_unrelated','unrelated'
  )
);

-- Keep only a small allowlisted service name; never retain browser page titles.
UPDATE events
SET service = COALESCE(service, CASE
  WHEN lower(application) IN ('chrome.exe','msedge.exe','firefox.exe') THEN CASE
    WHEN lower(trim(COALESCE(window_title, '')))='youtube'
      OR lower(window_title) LIKE '% - youtube' OR lower(window_title) LIKE 'youtube - %' THEN 'YouTube'
    WHEN lower(trim(COALESCE(window_title, '')))='google'
      OR lower(window_title) LIKE '% - google' OR lower(window_title) LIKE '% - google search'
      OR lower(window_title) LIKE '% - google 検索'
      OR lower(window_title) LIKE 'google - %' OR lower(window_title) LIKE 'google search - %'
      OR lower(window_title) LIKE 'google 検索 - %' THEN 'Google'
    WHEN lower(window_title) LIKE '% - stack overflow' OR lower(window_title) LIKE 'stack overflow - %' THEN 'Stack Overflow'
    WHEN lower(window_title) LIKE '% - github' OR lower(window_title) LIKE 'github - %' THEN 'GitHub'
    WHEN lower(window_title) LIKE '% - reddit' OR lower(window_title) LIKE 'reddit - %' THEN 'Reddit'
    WHEN lower(window_title) LIKE '% - wikipedia' OR lower(window_title) LIKE 'wikipedia - %' THEN 'Wikipedia'
    WHEN lower(window_title) LIKE '% - twitch' OR lower(window_title) LIKE 'twitch - %' THEN 'Twitch'
    WHEN lower(window_title) LIKE '% - netflix' OR lower(window_title) LIKE 'netflix - %' THEN 'Netflix'
    WHEN lower(window_title) LIKE '% - discord' OR lower(window_title) LIKE 'discord - %' THEN 'Discord'
    WHEN lower(window_title) LIKE '% - linkedin' OR lower(window_title) LIKE 'linkedin - %' THEN 'LinkedIn'
    WHEN lower(window_title) LIKE '% - instagram' OR lower(window_title) LIKE 'instagram - %' THEN 'Instagram'
    WHEN lower(window_title) LIKE '% - facebook' OR lower(window_title) LIKE 'facebook - %' THEN 'Facebook'
    WHEN lower(window_title) LIKE '% - tiktok' OR lower(window_title) LIKE 'tiktok - %' THEN 'TikTok'
    WHEN lower(window_title) LIKE '% - x.com' OR lower(window_title) LIKE 'x.com - %' THEN 'X'
    ELSE NULL
  END
  ELSE NULL
END), window_title=NULL;

INSERT OR IGNORE INTO schema_versions (version) VALUES (3);

COMMIT;
