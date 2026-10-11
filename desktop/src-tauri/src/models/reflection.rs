use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::storage::{Storage, StorageError, StorageResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reflection {
    pub id: String,
    pub session_id: String,
    pub deviation_reason: String,
    pub reflection_details: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpsertReflectionInput {
    pub session_id: String,
    pub deviation_reason: String,
    pub reflection_details: Option<String>,
}

impl Storage {
    pub fn upsert_reflection(&self, input: UpsertReflectionInput) -> StorageResult<Reflection> {
        if input.deviation_reason.trim().is_empty() {
            return Err(StorageError::Message(
                "deviation_reason cannot be empty".into(),
            ));
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
            conn.execute(
                "DELETE FROM reflections WHERE session_id=?1",
                params![input.session_id],
            )?;
            conn.execute(
                "INSERT INTO reflections
                 (id, session_id, deviation_reason, reflection_details, created_at)
                 VALUES (?1,?2,?3,?4,?5)",
                params![
                    id,
                    input.session_id,
                    input.deviation_reason,
                    input.reflection_details,
                    now,
                ],
            )?;
            Ok(())
        })?;
        Ok(Reflection {
            id,
            session_id: input.session_id,
            deviation_reason: input.deviation_reason,
            reflection_details: input.reflection_details,
            created_at: now,
        })
    }

    pub fn get_reflection_for_session(
        &self,
        session_id: &str,
    ) -> StorageResult<Option<Reflection>> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let mut stmt = conn.prepare(
            "SELECT id, session_id, deviation_reason, reflection_details, created_at
             FROM reflections WHERE session_id=?1",
        )?;
        let mut rows = stmt.query(params![session_id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Reflection {
                id: row.get(0)?,
                session_id: row.get(1)?,
                deviation_reason: row.get(2)?,
                reflection_details: row.get(3)?,
                created_at: row.get(4)?,
            }))
        } else {
            Ok(None)
        }
    }
}
