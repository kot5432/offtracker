use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::storage::{Storage, StorageError, StorageResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub purpose: String,
    pub target_time_minutes: Option<i64>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentSession {
    pub id: String,
    pub purpose: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub status: String,
    pub actual_duration_minutes: Option<i64>,
    pub result_level: Option<String>,
}

impl Storage {
    pub fn create_session(
        &self,
        purpose: &str,
        target_time_minutes: Option<i64>,
    ) -> StorageResult<Session> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        let session = Session {
            id: id.clone(),
            purpose: purpose.to_string(),
            target_time_minutes,
            start_time: now.clone(),
            end_time: None,
            status: "active".into(),
            created_at: now,
        };
        self.exec_tx(|conn| {
            conn.execute(
                "INSERT INTO sessions (id, purpose, target_time_minutes, start_time, end_time, status, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    session.id,
                    session.purpose,
                    session.target_time_minutes,
                    session.start_time,
                    session.end_time,
                    session.status,
                    session.created_at,
                ],
            )?;
            Ok(())
        })?;
        Ok(session)
    }

    pub fn get_session(&self, id: &str) -> StorageResult<Option<Session>> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let mut stmt = conn.prepare(
            "SELECT id, purpose, target_time_minutes, start_time, end_time, status, created_at
             FROM sessions WHERE id = ?1",
        )?;
        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Session {
                id: row.get(0)?,
                purpose: row.get(1)?,
                target_time_minutes: row.get(2)?,
                start_time: row.get(3)?,
                end_time: row.get(4)?,
                status: row.get(5)?,
                created_at: row.get(6)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn get_active_session(&self) -> StorageResult<Option<Session>> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let mut stmt = conn.prepare(
            "SELECT id, purpose, target_time_minutes, start_time, end_time, status, created_at
             FROM sessions WHERE status = 'active' ORDER BY start_time DESC LIMIT 1",
        )?;
        let mut rows = stmt.query(params![])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Session {
                id: row.get(0)?,
                purpose: row.get(1)?,
                target_time_minutes: row.get(2)?,
                start_time: row.get(3)?,
                end_time: row.get(4)?,
                status: row.get(5)?,
                created_at: row.get(6)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn complete_session(&self, id: &str) -> StorageResult<Session> {
        let end_time = Utc::now().to_rfc3339();
        self.exec_tx(|conn| {
            conn.execute(
                "UPDATE sessions SET status='completed', end_time=?2 WHERE id=?1",
                params![id, end_time],
            )?;
            Ok(())
        })?;
        self.get_session(id)?
            .ok_or_else(|| StorageError::Message("session not found after update".into()))
    }

    pub fn get_recent_sessions(&self, limit: i64) -> StorageResult<Vec<RecentSession>> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let mut stmt = conn.prepare(
            "SELECT s.id, s.purpose, s.start_time, s.end_time, s.status,
                    (CAST(strftime('%s', COALESCE(s.end_time, datetime('now'))) AS INTEGER) -
                     CAST(strftime('%s', s.start_time) AS INTEGER)) / 60 AS actual_duration_minutes,
                    r.result_level
             FROM sessions s
             LEFT JOIN results r ON r.session_id = s.id
             ORDER BY s.start_time DESC
             LIMIT ?1",
        )?;
        let rows = stmt.query_map(params![limit], |row| {
            Ok(RecentSession {
                id: row.get(0)?,
                purpose: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                status: row.get(4)?,
                actual_duration_minutes: row.get(5)?,
                result_level: row.get(6)?,
            })
        })?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r?);
        }
        Ok(out)
    }
}
