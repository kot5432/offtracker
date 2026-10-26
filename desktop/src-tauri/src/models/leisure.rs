use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::storage::{Storage, StorageError, StorageResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeisureItem {
    pub item_type: String,
    pub item_name: String,
    pub auto_suggested: bool,
    pub registered: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeisureRelationRule {
    pub item_type: String,
    pub item_name: String,
    pub purpose_category: String,
    pub relation: String,
}

impl Storage {
    pub fn get_leisure_relation_rules(&self, purpose_category: &str) -> StorageResult<Vec<LeisureRelationRule>> {
        if !matches!(purpose_category, "leisure" | "learning" | "task" | "admin" | "other" | "unknown") {
            return Err(StorageError::Message("invalid purpose category".into()));
        }
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let mut stmt = conn.prepare("SELECT item_type,item_name,purpose_category,relation FROM leisure_relation_rules WHERE purpose_category=?1 ORDER BY item_type,item_name")?;
        let rows = stmt.query_map(params![purpose_category], |row| Ok(LeisureRelationRule {
            item_type: row.get(0)?, item_name: row.get(1)?, purpose_category: row.get(2)?, relation: row.get(3)?,
        }))?;
        rows.collect::<Result<Vec<_>, _>>().map_err(StorageError::from)
    }

    pub fn save_leisure_relation_rule(&self, rule: LeisureRelationRule) -> StorageResult<()> {
        if !matches!(rule.item_type.as_str(), "application" | "service")
            || rule.item_name.trim().is_empty()
            || !matches!(rule.purpose_category.as_str(), "leisure" | "learning" | "task" | "admin" | "other" | "unknown")
            || !matches!(rule.relation.as_str(), "related" | "unrelated" | "uncertain") {
            return Err(StorageError::Message("invalid leisure relation rule".into()));
        }
        if !self.get_leisure_items()?.iter().any(|item| item.item_type == rule.item_type && item.item_name == rule.item_name) {
            return Err(StorageError::Message("item is not registered as used for leisure".into()));
        }
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        conn.execute(
            "INSERT INTO leisure_relation_rules (item_type,item_name,purpose_category,relation,updated_at)
             VALUES (?1,?2,?3,?4,CURRENT_TIMESTAMP)
             ON CONFLICT(item_type,item_name,purpose_category) DO UPDATE SET relation=excluded.relation,updated_at=CURRENT_TIMESTAMP",
            params![rule.item_type,rule.item_name,rule.purpose_category,rule.relation],
        )?;
        Ok(())
    }

    pub fn get_observed_leisure_items(&self) -> StorageResult<Vec<LeisureItem>> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let mut stmt = conn.prepare(
            "SELECT item_type, item_name,
               EXISTS(SELECT 1 FROM events e JOIN sessions s ON s.id=e.session_id
                 LEFT JOIN reflections r ON r.session_id=s.id
                 WHERE COALESCE(r.purpose_category_override,s.purpose_category)='leisure'
                   AND ((items.item_type='application' AND COALESCE(NULLIF(e.application_display,''),e.application)=items.item_name)
                     OR (items.item_type='service' AND e.service=items.item_name)))
                 AND NOT EXISTS(SELECT 1 FROM leisure_item_exclusions x WHERE x.item_type=items.item_type AND x.item_name=items.item_name) AS auto_suggested,
               EXISTS(SELECT 1 FROM leisure_items l WHERE l.item_type=items.item_type AND l.item_name=items.item_name) AS registered
             FROM (
               SELECT 'application' AS item_type,
                      COALESCE(NULLIF(application_display, ''), application) AS item_name
                 FROM events
               UNION
               SELECT 'service' AS item_type, service AS item_name
                 FROM events WHERE service IS NOT NULL AND trim(service) <> ''
             ) items ORDER BY item_type, item_name",
        )?;
        let rows = stmt.query_map([], |row| Ok(LeisureItem {
            item_type: row.get(0)?,
            item_name: row.get(1)?,
            auto_suggested: row.get(2)?,
            registered: row.get(3)?,
        }))?;
        rows.collect::<Result<Vec<_>, _>>().map_err(StorageError::from)
    }

    pub fn get_leisure_items(&self) -> StorageResult<Vec<LeisureItem>> {
        Ok(self.get_observed_leisure_items()?.into_iter()
            .filter(|item| item.auto_suggested || item.registered)
            .collect())
    }

    pub fn set_leisure_item(&self, item: LeisureItem, enabled: bool) -> StorageResult<Vec<LeisureItem>> {
        if !matches!(item.item_type.as_str(), "application" | "service") || item.item_name.trim().is_empty() {
            return Err(StorageError::Message("invalid leisure item".into()));
        }
        if !self.get_observed_leisure_items()?.iter().any(|seen| seen.item_type == item.item_type && seen.item_name == item.item_name) {
            return Err(StorageError::Message("item has not been observed on this PC".into()));
        }
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        if enabled {
            conn.execute("INSERT OR IGNORE INTO leisure_items (item_type, item_name) VALUES (?1, ?2)", params![item.item_type, item.item_name])?;
            conn.execute("DELETE FROM leisure_item_exclusions WHERE item_type=?1 AND item_name=?2", params![item.item_type, item.item_name])?;
        } else {
            conn.execute("DELETE FROM leisure_items WHERE item_type=?1 AND item_name=?2", params![item.item_type, item.item_name])?;
            conn.execute("INSERT OR IGNORE INTO leisure_item_exclusions (item_type,item_name) VALUES (?1,?2)", params![item.item_type,item.item_name])?;
        }
        drop(conn);
        self.get_leisure_items()
    }
}
