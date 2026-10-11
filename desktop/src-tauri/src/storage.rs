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
