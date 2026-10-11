use chrono::{DateTime, Duration, NaiveDateTime, Utc};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::storage::{Storage, StorageError, StorageResult};
use crate::window::WindowInfo;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub session_id: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub source: String,
    pub application: String,
    pub application_display: Option<String>,
    pub service: Option<String>,
    pub window_title: Option<String>,
    pub process_id: Option<i64>,
    pub duration_seconds: i64,
    pub created_at: String,
}

fn process_to_display(process_name: &str) -> Option<String> {
    let p = process_name.to_lowercase();
    Some(match p.as_str() {
        "code.exe" | "code-insiders.exe" | "codium.exe" => "VS Code",
        "devenv.exe" => "Visual Studio",
        "idea64.exe" | "idea.exe" => "IntelliJ IDEA",
        "pycharm64.exe" | "pycharm.exe" => "PyCharm",
        "goland64.exe" | "goland.exe" => "GoLand",
        "chrome.exe" => "Google Chrome",
        "msedge.exe" => "Microsoft Edge",
        "firefox.exe" => "Firefox",
        "discord.exe" => "Discord",
        "slack.exe" => "Slack",
        "spotify.exe" => "Spotify",
        "notion.exe" => "Notion",
        "figma.exe" => "Figma",
        "excel.exe" => "Excel",
        "winword.exe" => "Word",
        "powerpnt.exe" => "PowerPoint",
        "onenote.exe" => "OneNote",
        "obs64.exe" | "obs32.exe" => "OBS Studio",
        "teams.exe" | "ms-teams.exe" => "Microsoft Teams",
        "zoom.exe" => "Zoom",
        "explorer.exe" => "Explorer",
        "notepad.exe" => "Notepad",
        "terminal.exe" | "windowsterminal.exe" | "wt.exe" => "Terminal",
        "cmd.exe" => "Command Prompt",
        "powershell.exe" | "pwsh.exe" => "PowerShell",
        "rustrover.exe" => "RustRover",
        "sublime_text.exe" => "Sublime Text",
        _ => return None,
    })
}

impl Storage {
    pub fn create_event_from_window(
        &self,
        session_id: &str,
        window: &WindowInfo,
        start_time_iso: Option<&str>,
    ) -> StorageResult<Event> {
        let id = Uuid::new_v4().to_string();
        let start_time = start_time_iso
            .map(|s| s.to_string())
            .unwrap_or_else(|| Utc::now().to_rfc3339());
        let now_iso = Utc::now().to_rfc3339();
        let application = if window.process_name.is_empty() {
            "Unknown".into()
        } else {
            window.process_name.clone()
        };
        let title_opt = if window.title.is_empty() {
            None
        } else {
            Some(window.title.clone())
        };
        let display = process_to_display(&application);
        let event = Event {
            id: id.clone(),
            session_id: session_id.to_string(),
            start_time: start_time.clone(),
            end_time: None,
            source: "native".into(),
            application,
            application_display: display,
            service: None,
            window_title: title_opt,
            process_id: Some(window.process_id as i64),
            duration_seconds: 0,
            created_at: now_iso,
        };
        self.exec_tx(|conn| {
            conn.execute(
                "INSERT INTO events
                 (id, session_id, start_time, end_time, source, application, application_display,
                  service, window_title, process_id, duration_seconds, created_at)
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
                params![
                    event.id,
                    event.session_id,
                    event.start_time,
                    event.end_time,
                    event.source,
                    event.application,
                    event.application_display,
                    event.service,
                    event.window_title,
                    event.process_id,
                    event.duration_seconds,
                    event.created_at,
                ],
            )?;
            Ok(())
        })?;
        Ok(event)
    }

    pub fn finalize_event(&self, event_id: &str, end_time_iso: &str) -> StorageResult<i64> {
        let parsed_end = DateTime::parse_from_rfc3339(end_time_iso)
            .map_err(|_| StorageError::Message("invalid end_time iso".into()))?
            .with_timezone(&Utc);
        let (session_id, start_time_str) = {
            let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
            let (sid, st): (String, String) = conn.query_row(
                "SELECT session_id, start_time FROM events WHERE id=?1",
                params![event_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )?;
            (sid, st)
        };
        let start_parsed = DateTime::parse_from_rfc3339(&start_time_str)
            .map_err(|_| StorageError::Message("invalid start_time iso".into()))?
            .with_timezone(&Utc);
        let duration = (parsed_end - start_parsed).num_seconds().max(0);
        self.exec_tx(|conn| {
            conn.execute(
                "UPDATE events SET end_time=?2, duration_seconds=?3 WHERE id=?1",
                params![event_id, end_time_iso, duration],
            )?;
            Ok(())
        })?;
        // Finalizeしたイベントが短い(180秒未満)場合は、マージを試みる
        self.try_merge_short_event(event_id, &session_id, duration)?;
        Ok(duration)
    }

    fn try_merge_short_event(
        &self,
        event_id: &str,
        session_id: &str,
        duration_secs: i64,
    ) -> StorageResult<()> {
        if duration_secs >= 180 {
            return Ok(());
        }
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        // 直前の同じapplicationのイベントを取得
        let current: (String, Option<String>, String, String) = conn.query_row(
            "SELECT application, application_display, start_time, id FROM events WHERE id=?1",
            params![event_id],
            |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
            },
        )?;
        let mut stmt = conn.prepare(
            "SELECT id, start_time, end_time, duration_seconds, window_title, service
             FROM events
             WHERE session_id=?1 AND id != ?4 AND application=?2 AND start_time <= ?3
                   AND end_time IS NOT NULL
             ORDER BY start_time DESC
             LIMIT 1",
        )?;
        let prev = stmt.query_row(
            params![session_id, current.0, current.2, event_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, Option<String>>(4)?,
                    row.get::<_, Option<String>>(5)?,
                ))
            },
        ).ok();
        drop(stmt);
        if let Some((prev_id, prev_start, prev_end, prev_dur, prev_title, prev_svc)) = prev {
            if prev_end.as_deref().is_none() {
                return Ok(());
            }
            // prev と current の間の時間差が180秒以下ならマージ
            let prev_end_dt = DateTime::parse_from_rfc3339(prev_end.as_deref().unwrap())
                .map(|d| d.with_timezone(&Utc).naive_utc())
                .ok();
            let curr_start_dt = DateTime::parse_from_rfc3339(&current.2)
                .map(|d| d.with_timezone(&Utc).naive_utc())
                .ok();
            if let (Some(pe), Some(cs)) = (prev_end_dt, curr_start_dt) {
                let gap = (cs - pe).num_seconds().abs();
                if gap <= 180 {
                    // current を prev にマージ（prevを延長してcurrentを削除）
                    let merged_duration = prev_dur + duration_secs + gap.max(0);
                    let new_end = prev_end.clone();
                    drop(conn);
                    self.exec_tx(|conn| {
                        conn.execute(
                            "UPDATE events SET duration_seconds=?2 WHERE id=?1",
                            params![prev_id, merged_duration],
                        )?;
                        conn.execute("DELETE FROM events WHERE id=?1", params![event_id])?;
                        Ok(())
                    })?;
                }
            }
        }
        Ok(())
    }

    pub fn finalize_all_open_events_for_session(&self, session_id: &str) -> StorageResult<()> {
        let ids: Vec<String> = {
            let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
            let mut stmt = conn.prepare(
                "SELECT id, start_time FROM events WHERE session_id=?1 AND end_time IS NULL",
            )?;
            let rows = stmt.query_map(params![session_id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })?;
            let mut out = Vec::new();
            for r in rows {
                let (id, _start) = r?;
                out.push(id);
            }
            out
        };
        let end = Utc::now().to_rfc3339();
        for id in ids {
            let _ = self.finalize_event(&id, &end);
        }
        Ok(())
    }

    pub fn get_events_for_session(&self, session_id: &str) -> StorageResult<Vec<Event>> {
        let conn = self.conn.lock().map_err(|_| StorageError::Message("mutex poison".into()))?;
        let mut stmt = conn.prepare(
            "SELECT id, session_id, start_time, end_time, source, application,
                    application_display, service, window_title, process_id,
                    duration_seconds, created_at
             FROM events WHERE session_id=?1 ORDER BY start_time ASC",
        )?;
        let rows = stmt.query_map(params![session_id], |row| {
            Ok(Event {
                id: row.get(0)?,
                session_id: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                source: row.get(4)?,
                application: row.get(5)?,
                application_display: row.get(6)?,
                service: row.get(7)?,
                window_title: row.get(8)?,
                process_id: row.get(9)?,
                duration_seconds: row.get(10)?,
                created_at: row.get(11)?,
            })
        })?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r?);
        }
        Ok(out)
    }
}
