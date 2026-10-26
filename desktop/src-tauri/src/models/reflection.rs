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
    pub purpose_category_override: Option<String>,
    pub next_experiment: Option<String>,
    pub experiment_reflection: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpsertReflectionInput {
    pub session_id: String,
    pub deviation_reason: String,
    pub reflection_details: Option<String>,
    pub purpose_category_override: Option<String>,
    pub next_experiment: Option<String>,
    pub experiment_reflection: Option<String>,
}

impl Storage {
    pub fn upsert_reflection(&self, input: UpsertReflectionInput) -> StorageResult<Reflection> {
        if let Some(category) = input.purpose_category_override.as_deref() {
            if !matches!(
                category,
                "leisure" | "learning" | "task" | "admin" | "other" | "unknown"
            ) {
                return Err(StorageError::Message("invalid purpose category override".into()));
            }
        }
        if let Some(outcome) = input.experiment_reflection.as_deref() {
            if !matches!(outcome, "noticed_change" | "no_clear_change" | "not_sure") {
                return Err(StorageError::Message("invalid experiment reflection".into()));
            }
        }
        if self.get_session(&input.session_id)?.is_none() {
            return Err(StorageError::Message(format!(
                "session not found: {}",
                input.session_id
            )));
        }
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        let session_id = input.session_id.clone();
        self.exec_tx(|conn| {
            conn.execute(
                "INSERT INTO reflections
                 (id, session_id, deviation_reason, reflection_details,
                  purpose_category_override, next_experiment, experiment_reflection, created_at)
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8)
                 ON CONFLICT(session_id) DO UPDATE SET
                   deviation_reason=excluded.deviation_reason,
                   reflection_details=excluded.reflection_details,
                   purpose_category_override=excluded.purpose_category_override,
                   next_experiment=COALESCE(excluded.next_experiment, reflections.next_experiment),
                   experiment_reflection=COALESCE(excluded.experiment_reflection, reflections.experiment_reflection)",
                params![
                    id,
                    session_id,
                    input.deviation_reason,
                    input.reflection_details,
                    input.purpose_category_override,
                    input.next_experiment,
                    input.experiment_reflection,
                    now,
                ],
            )?;
            Ok(())
        })?;
        self.get_reflection_for_session(&input.session_id)?
            .ok_or_else(|| StorageError::Message("reflection not found after save".into()))
    }

    pub fn get_reflection_for_session(
        &self,
        session_id: &str,
    ) -> StorageResult<Option<Reflection>> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let mut stmt = conn.prepare(
            "SELECT id, session_id, deviation_reason, reflection_details,
                    purpose_category_override, next_experiment, experiment_reflection, created_at
             FROM reflections WHERE session_id=?1",
        )?;
        let mut rows = stmt.query(params![session_id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Reflection {
                id: row.get(0)?,
                session_id: row.get(1)?,
                deviation_reason: row.get(2)?,
                reflection_details: row.get(3)?,
                purpose_category_override: row.get(4)?,
                next_experiment: row.get(5)?,
                experiment_reflection: row.get(6)?,
                created_at: row.get(7)?,
            }))
        } else {
            Ok(None)
        }
    }
}
