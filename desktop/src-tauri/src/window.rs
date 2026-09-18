use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId,
};
use windows::Win32::System::ProcessStatus::GetModuleBaseNameW;
use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};

/// Struct to hold window information
#[derive(Debug, Clone)]
pub struct WindowInfo {
    pub title: String,
    pub process_name: String,
    pub process_id: u32,
}

/// Get the currently active window information
pub fn get_active_window() -> Option<WindowInfo> {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0 == 0 {
            return None;
        }

        // Get window title
        let mut title_buffer = [0u16; 512];
        let length = GetWindowTextW(hwnd, &mut title_buffer);
        let title = String::from_utf16_lossy(&title_buffer[..length as usize]);

        // Get process ID
        let mut process_id: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut process_id as *mut u32));

        // Open process to get executable name
        let process_handle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, process_id);
        if process_handle.is_invalid() {
            return Some(WindowInfo {
                title,
                process_name: "Unknown".to_string(),
                process_id,
            });
        }

        // Get process name
        let mut name_buffer = [0u16; 260];
        let length = GetModuleBaseNameW(process_handle, None, &mut name_buffer);
        let process_name = String::from_utf16_lossy(&name_buffer[..length as usize]);

        Some(WindowInfo {
            title,
            process_name,
            process_id,
        })
    }
}