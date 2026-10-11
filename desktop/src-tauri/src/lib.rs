mod window;
mod storage;
mod models;

use std::sync::Arc;

use serde::Serialize;
use tauri::{Manager, State};

use crate::models::event::process_to_display;
use crate::models::*;
use crate::window::{get_active_window, WindowInfo};

struct AppState {
    storage: Arc<storage::Storage>,
}

#[derive(Serialize, Clone)]
struct CurrentActivity {
    application: String,
    application_display: Option<String>,
    window_title: String,
    start_time: Option<String>,
    duration_seconds: i64,
    process_id: u32,
}

#[derive(Serialize, Clone)]
struct SessionWithDetails {
    session: Session,
    events: Vec<Event>,
    result: Option<ResultRecord>,
    reflection: Option<Reflection>,
}

fn default_db_path<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> std::path::PathBuf {
    if let Ok(path) = app.path().app_data_dir() {
        return path.join("offtracker.db");
    }
    if let Ok(appdata) = std::env::var("APPDATA") {
        let d = std::path::PathBuf::from(appdata).join("com.offtracker.desktop");
        return d.join("offtracker.db");
    }
    std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .join(".offtracker_data")
        .join("offtracker.db")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = default_db_path(&app.handle());
            let storage = storage::Storage::new(&db_path)
                .expect("failed to initialize storage");
            storage.run_migrations().expect("migrations failed");
            let state = AppState {
                storage: Arc::new(storage),
            };
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_current_window,
            get_current_activity,
            start_session,
            stop_session,
            get_current_session,
            get_session,
            get_recent_sessions,
            get_events_for_session,
            save_result,
            save_reflection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_current_window() -> Result<WindowInfo, String> {
    get_active_window().ok_or_else(|| "Failed to get active window".to_string())
}

#[tauri::command]
fn get_current_activity(state: State<'_, AppState>) -> Result<Option<CurrentActivity>, String> {
    let win = match get_active_window() {
        Some(w) => w,
        None => return Ok(None),
    };
    let storage = state.storage.clone();
    let (start_time, duration) = if let Some(session) =
        storage.get_active_session().map_err(|e| e.to_string())?
    {
        let conn = storage
            .conn
            .lock()
            .map_err(|_| "mutex poison".to_string())?;
        let ev: Option<(String, i64)> = conn
            .query_row(
                "SELECT start_time, duration_seconds FROM events
                 WHERE session_id=?1 AND end_time IS NULL
                 ORDER BY start_time DESC LIMIT 1",
                rusqlite::params![session.id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .ok();
        drop(conn);
        ev.unwrap_or((session.start_time, 0))
    } else {
        (chrono::Utc::now().to_rfc3339(), 0)
    };
    Ok(Some(CurrentActivity {
        application_display: process_to_display(&win.process_name),
        application: win.process_name.clone(),
        window_title: win.title.clone(),
        start_time: Some(start_time),
        duration_seconds: duration,
        process_id: win.process_id,
    }))
}

#[tauri::command]
fn start_session(
    purpose: String,
    target_time_minutes: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Session, String> {
    if purpose.trim().is_empty() {
        return Err("purpose cannot be empty".to_string());
    }
    let storage = state.storage.clone();
    if let Some(active) = storage.get_active_session().map_err(|e| e.to_string())? {
        let _ = storage.finalize_all_open_events_for_session(&active.id);
        let _ = storage.complete_session(&active.id);
    }
    storage
        .create_session(&purpose, target_time_minutes)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn stop_session(session_id: String, state: State<'_, AppState>) -> Result<Session, String> {
    let storage = state.storage.clone();
    storage
        .finalize_all_open_events_for_session(&session_id)
        .map_err(|e| e.to_string())?;
    storage
        .complete_session(&session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_current_session(state: State<'_, AppState>) -> Result<Option<Session>, String> {
    state
        .storage
        .get_active_session()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<Option<SessionWithDetails>, String> {
    let storage = state.storage.clone();
    let Some(session) = storage
        .get_session(&session_id)
        .map_err(|e| e.to_string())?
    else {
        return Ok(None);
    };
    let events = storage
        .get_events_for_session(&session_id)
        .map_err(|e| e.to_string())?;
    let result = storage
        .get_result_for_session(&session_id)
        .map_err(|e| e.to_string())?;
    let reflection = storage
        .get_reflection_for_session(&session_id)
        .map_err(|e| e.to_string())?;
    Ok(Some(SessionWithDetails {
        session,
        events,
        result,
        reflection,
    }))
}

#[tauri::command]
fn get_recent_sessions(
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<RecentSession>, String> {
    state
        .storage
        .get_recent_sessions(limit.unwrap_or(10))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_events_for_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Event>, String> {
    state
        .storage
        .get_events_for_session(&session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_result(
    session_id: String,
    result_level: String,
    result_description: String,
    actual_duration_minutes: i64,
    what_wasnt_done: Option<String>,
    state: State<'_, AppState>,
) -> Result<ResultRecord, String> {
    state
        .storage
        .upsert_result(UpsertResultInput {
            session_id,
            result_level,
            result_description,
            actual_duration_minutes,
            what_wasnt_done,
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_reflection(
    session_id: String,
    deviation_reason: String,
    reflection_details: Option<String>,
    state: State<'_, AppState>,
) -> Result<Reflection, String> {
    state
        .storage
        .upsert_reflection(UpsertReflectionInput {
            session_id,
            deviation_reason,
            reflection_details,
        })
        .map_err(|e| e.to_string())
}
