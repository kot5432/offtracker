use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::storage::{Storage, StorageError, StorageResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResultRecord {
    pub id: String,
    pub session_id: String,
    pub result_level: String,
    pub result_description: String,
    pub actual_duration_minutes: i64,
    pub what_wasnt_done: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpsertResultInput {
    pub session_id: String,
    pub result_level: String,
    pub result_description: String,
    pub actual_duration_minutes: i64,
    pub what_wasnt_done: Option<String>,
}

const VALID_LEVELS: &[&str] = &[
    "completed",
    "mostly_completed",
    "partially_completed",
    "minimal",
    "not_completed",
];

impl Storage {
    pub fn upsert_result(&self, input: UpsertResultInput) -> StorageResult<ResultRecord> {
        if !VALID_LEVELS.contains(&input.result_level.as_str()) {
            return Err(StorageError::Message(format!(
                "invalid result_level: {}",
                input.result_level
            )));
        }
        if self.get_session(&input.session_id)?.is_none() {
            return Err(StorageError::Message(format!(
                "session not found: {}",
                input.session_id
            )));
        }
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        self.exec_tx(|conn| {
            // Delete if exists (idempotent upsert)
            conn.execute(
                "DELETE FROM results WHERE session_id=?1",
                params![input.session_id],
            )?;
            conn.execute(
                "INSERT INTO results
                 (id, session_id, result_level, result_description,
                  actual_duration_minutes, what_wasnt_done, created_at)
                 VALUES (?1,?2,?3,?4,?5,?6,?7)",
                params![
                    id,
                    input.session_id,
                    input.result_level,
                    input.result_description,
                    input.actual_duration_minutes,
                    input.what_wasnt_done,
                    now,
                ],
            )?;
            Ok(())
        })?;
        Ok(ResultRecord {
            id,
            session_id: input.session_id,
            result_level: input.result_level,
            result_description: input.result_description,
            actual_duration_minutes: input.actual_duration_minutes,
            what_wasnt_done: input.what_wasnt_done,
            created_at: now,
        })
    }

    pub fn get_result_for_session(&self, session_id: &str) -> StorageResult<Option<ResultRecord>> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let mut stmt = conn.prepare(
            "SELECT id, session_id, result_level, result_description,
                    actual_duration_minutes, what_wasnt_done, created_at
             FROM results WHERE session_id=?1",
        )?;
        let mut rows = stmt.query(params![session_id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(ResultRecord {
                id: row.get(0)?,
                session_id: row.get(1)?,
                result_level: row.get(2)?,
                result_description: row.get(3)?,
                actual_duration_minutes: row.get(4)?,
                what_wasnt_done: row.get(5)?,
                created_at: row.get(6)?,
            }))
        } else {
            Ok(None)
        }
    }
}
