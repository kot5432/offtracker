use rusqlite::{params, Connection};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("rusqlite error: {0}")]
    Rusqlite(#[from] rusqlite::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Message(String),
}

impl From<StorageError> for String {
    fn from(e: StorageError) -> String {
        e.to_string()
    }
}

pub type StorageResult<T> = Result<T, StorageError>;

pub struct Storage {
    pub conn: Mutex<Connection>,
    pub db_path: PathBuf,
}

impl Storage {
    pub fn new(db_path: &Path) -> StorageResult<Self> {
        if let Some(parent) = db_path.parent() {
            if !parent.exists() {
                std::fs::create_dir_all(parent)?;
            }
        }
        let conn = Connection::open(db_path)?;
        conn.execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;",
        )?;
        Ok(Self {
            conn: Mutex::new(conn),
            db_path: db_path.to_path_buf(),
        })
    }

    pub fn run_migrations(&self) -> StorageResult<()> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        conn.execute_batch(include_str!("../db/migrations/001_initial.sql"))?;
        let activity_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=2)",
            [],
            |row| row.get(0),
        )?;
        if !activity_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/002_activities.sql"))?;
        }
        let privacy_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=3)",
            [],
            |row| row.get(0),
        )?;
        if !privacy_migration_applied {
            conn.execute_batch("PRAGMA secure_delete=ON;")?;
            conn.execute_batch(include_str!("../db/migrations/003_service_names.sql"))?;
            conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE); VACUUM;")?;
        }
        let service_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=4)",
            [],
            |row| row.get(0),
        )?;
        if !service_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/004_service_detection.sql"))?;
        }
        let purpose_category_override_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=5)",
            [],
            |row| row.get(0),
        )?;
        if !purpose_category_override_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/005_purpose_category_override.sql"))?;
        }
        let next_experiment_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=6)",
            [],
            |row| row.get(0),
        )?;
        if !next_experiment_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/006_next_experiment.sql"))?;
        }
        let session_experiment_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=7)",
            [],
            |row| row.get(0),
        )?;
        if !session_experiment_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/007_session_experiment.sql"))?;
        }
        let experiment_reflection_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=8)",
            [],
            |row| row.get(0),
        )?;
        if !experiment_reflection_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/008_experiment_reflection.sql"))?;
        }
        let activity_feedback_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=9)",
            [],
            |row| row.get(0),
        )?;
        if !activity_feedback_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/009_activity_feedback.sql"))?;
        }
        let leisure_items_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=10)",
            [],
            |row| row.get(0),
        )?;
        if !leisure_items_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/010_leisure_items.sql"))?;
        }
        let purpose_category_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=11)",
            [],
            |row| row.get(0),
        )?;
        if !purpose_category_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/011_purpose_category.sql"))?;
        }
        let leisure_relation_rules_migration_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=12)",
            [],
            |row| row.get(0),
        )?;
        if !leisure_relation_rules_migration_applied {
            conn.execute_batch(include_str!("../db/migrations/012_leisure_relation_rules.sql"))?;
        }
        Ok(())
    }

    pub fn integrity_check(&self) -> StorageResult<bool> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let result: String = conn.query_row("PRAGMA integrity_check", [], |row| row.get(0))?;
        Ok(result.eq_ignore_ascii_case("ok"))
    }

    pub fn exec_tx<F, R>(&self, f: F) -> StorageResult<R>
    where
        F: FnOnce(&Connection) -> rusqlite::Result<R>,
    {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        conn.execute("BEGIN IMMEDIATE", params![])?;
        match f(&conn) {
            Ok(r) => {
                conn.execute("COMMIT", params![])?;
                Ok(r)
            }
            Err(e) => {
                let _ = conn.execute("ROLLBACK", params![]);
                Err(StorageError::Rusqlite(e))
            }
        }
    }
}
