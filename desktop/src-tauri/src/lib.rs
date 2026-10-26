mod window;
mod storage;
mod models;
mod tracker;

use std::sync::Arc;

use serde::Serialize;
use tauri::{Manager, State};

use crate::models::activity::label_for_application;
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
    label: String,
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
    activity_feedback: Vec<ActivityFeedback>,
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
            let storage = Arc::new(storage);
            let tracker_storage = Arc::clone(&storage);
            std::thread::spawn(move || tracker::run(tracker_storage));
            let state = AppState {
                storage,
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
            get_observed_leisure_items,
            get_leisure_items,
            set_leisure_item,
            get_leisure_relation_rules,
            save_leisure_relation_rule,
            get_latest_next_experiment,
            get_events_for_session,
            analyze_activities,
            classify_activity_purpose,
            analyze_session_story,
            save_result,
            save_activity_feedback,
            save_reflection,
            get_session_elapsed,
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
    let window = match get_active_window().filter(|window| {
        !window.process_name.to_lowercase().contains("offtracker")
    }) {
        Some(window) => window,
        None => return Ok(None),
    };
    let Some(session) = state
        .storage
        .get_active_session()
        .map_err(|error| error.to_string())?
    else {
        return Ok(None);
    };
    let conn = state
        .storage
        .conn
        .lock()
        .map_err(|_| "mutex poison".to_string())?;
    let event: Option<(String, Option<String>)> = conn
        .query_row(
            "SELECT start_time, service FROM events
             WHERE session_id=?1 AND process_id=?2 AND end_time IS NULL
             ORDER BY start_time DESC LIMIT 1",
            rusqlite::params![session.id, window.process_id as i64],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .ok();
    drop(conn);
    let Some((start_time, service)) = event else {
        return Ok(None);
    };
    let duration = chrono::DateTime::parse_from_rfc3339(&start_time)
        .map(|start| (chrono::Utc::now() - start.with_timezone(&chrono::Utc)).num_seconds().max(0))
        .unwrap_or(0);
    let application_display = process_to_display(&window.process_name);
    let label = label_for_application(
        &window.process_name,
        application_display.as_deref(),
        service.as_deref(),
    );
    Ok(Some(CurrentActivity {
        application_display,
        application: window.process_name.clone(),
        label,
        start_time: Some(start_time),
        duration_seconds: duration,
        process_id: window.process_id,
    }))
}

#[tauri::command]
fn start_session(
    purpose: String,
    purpose_category: String,
    target_time_minutes: Option<i64>,
    experiment_source_session_id: Option<String>,
    experiment_proposal: Option<String>,
    experiment_text: Option<String>,
    experiment_choice: Option<String>,
    state: State<'_, AppState>,
) -> Result<Session, String> {
    if purpose.trim().is_empty() {
        return Err("purpose cannot be empty".to_string());
    }
    if !matches!(purpose_category.as_str(), "leisure" | "learning" | "task" | "admin" | "other" | "unknown") {
        return Err("invalid purpose category".to_string());
    }
    if let Some(choice) = experiment_choice.as_deref() {
        if !matches!(choice, "adopted" | "edited" | "skipped") {
            return Err("invalid experiment choice".to_string());
        }
        if experiment_source_session_id.is_none() {
            return Err("experiment source is required".to_string());
        }
    }
    if experiment_choice.as_deref() == Some("edited")
        && experiment_text.as_deref().unwrap_or_default().trim().is_empty()
    {
        return Err("edited experiment cannot be empty".to_string());
    }
    let storage = state.storage.clone();
    if let Some(active) = storage.get_active_session().map_err(|e| e.to_string())? {
        let _ = storage.finalize_all_open_events_for_session(&active.id);
        let _ = storage.complete_session(&active.id);
    }
    storage
        .create_session(
            &purpose,
            &purpose_category,
            target_time_minutes,
            experiment_source_session_id.as_deref(),
            experiment_proposal.as_deref(),
            experiment_text.as_deref(),
            experiment_choice.as_deref(),
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_latest_next_experiment(state: State<'_, AppState>) -> Result<Option<NextExperiment>, String> {
    state
        .storage
        .get_latest_next_experiment()
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
    let activity_feedback = storage
        .get_activity_feedback(&session_id)
        .map_err(|e| e.to_string())?;
    Ok(Some(SessionWithDetails {
        session,
        events,
        result,
        reflection,
        activity_feedback,
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
fn get_observed_leisure_items(state: State<'_, AppState>) -> Result<Vec<LeisureItem>, String> {
    state.storage.get_observed_leisure_items().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_leisure_items(state: State<'_, AppState>) -> Result<Vec<LeisureItem>, String> {
    state.storage.get_leisure_items().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_leisure_item(item_type: String, item_name: String, enabled: bool, state: State<'_, AppState>) -> Result<Vec<LeisureItem>, String> {
    state.storage.set_leisure_item(LeisureItem { item_type, item_name, auto_suggested: false, registered: false }, enabled).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_leisure_relation_rules(purpose_category: String, state: State<'_, AppState>) -> Result<Vec<LeisureRelationRule>, String> {
    state.storage.get_leisure_relation_rules(&purpose_category).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_leisure_relation_rule(item_type: String, item_name: String, purpose_category: String, relation: String, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.save_leisure_relation_rule(LeisureRelationRule { item_type, item_name, purpose_category, relation }).map_err(|e| e.to_string())
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
fn analyze_activities(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Activity>, String> {
    state
        .storage
        .analyze_activities(&session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn classify_activity_purpose(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Activity>, String> {
    state
        .storage
        .classify_activity_purpose(&session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn analyze_session_story(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<SessionStory, String> {
    let activities = state
        .storage
        .classify_activity_purpose(&session_id)
        .map_err(|error| error.to_string())?;
    Ok(models::session_story::analyze_session_story(&activities))
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
fn save_activity_feedback(
    session_id: String,
    items: Vec<ActivityFeedback>,
    state: State<'_, AppState>,
) -> Result<Vec<ActivityFeedback>, String> {
    state.storage
        .replace_activity_feedback(&session_id, items)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_reflection(
    session_id: String,
    deviation_reason: String,
    reflection_details: Option<String>,
    purpose_category_override: Option<String>,
    next_experiment: Option<String>,
    experiment_reflection: Option<String>,
    state: State<'_, AppState>,
) -> Result<Reflection, String> {
    state
        .storage
        .upsert_reflection(UpsertReflectionInput {
            session_id,
            deviation_reason,
            reflection_details,
            purpose_category_override,
            next_experiment,
            experiment_reflection,
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_session_elapsed(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<i64, String> {
    let storage = state.storage.clone();
    let session = storage
        .get_session(&session_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Session not found".to_string())?;

    let start_time = chrono::DateTime::parse_from_rfc3339(&session.start_time)
        .map_err(|e| format!("Invalid start_time: {}", e))?
        .with_timezone(&chrono::Utc);

    let end_time = if let Some(end) = &session.end_time {
        chrono::DateTime::parse_from_rfc3339(end)
            .map_err(|e| format!("Invalid end_time: {}", e))?
            .with_timezone(&chrono::Utc)
    } else {
        chrono::Utc::now()
    };

    let elapsed = (end_time - start_time).num_seconds();
    Ok(elapsed)
}
