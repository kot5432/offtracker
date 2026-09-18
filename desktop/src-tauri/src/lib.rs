mod window;

use window::get_active_window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        get_current_window
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn get_current_window() -> Result<String, String> {
    match get_active_window() {
        Some(window_info) => Ok(format!("{} ({})", window_info.title, window_info.process_name)),
        None => Err("Failed to get active window".to_string()),
    }
}
