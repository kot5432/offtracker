use std::{sync::Arc, thread, time::Duration};

use chrono::{DateTime, Utc};

use crate::{
    models::event::extract_service_name,
    storage::Storage,
    window::get_active_window,
};

struct TrackedEvent {
    session_id: String,
    event_id: String,
    process_id: u32,
    process_name: String,
    window_title: String,
}

/// Poll the active window while a session is running and persist window changes.
pub fn run(storage: Arc<Storage>) {
    let mut tracked: Option<TrackedEvent> = None;
    let mut previous_poll_at: Option<DateTime<Utc>> = None;

    loop {
        let now = Utc::now();
        let now_iso = now.to_rfc3339();

        // A long gap between polls usually means the computer was asleep or suspended.
        // End the previous event at its last observed time so sleep is not counted as work.
        if let Some(previous_poll) = previous_poll_at {
            if (now - previous_poll).num_milliseconds() > 1500 {
                finalize_tracked_event(&storage, tracked.take(), &previous_poll.to_rfc3339());
            }
        }

        let session = match storage.get_active_session() {
            Ok(session) => session,
            Err(error) => {
                eprintln!("Failed to read active session: {error}");
                None
            }
        };
        let window = get_active_window().filter(|window| {
            !window.process_name.to_lowercase().contains("offtracker")
        });

        let same_activity = match (&tracked, &session, &window) {
            (Some(previous), Some(session), Some(window)) => {
                previous.session_id == session.id
                    && previous.process_id == window.process_id
                    && previous.process_name == window.process_name
                    && previous.window_title == window.title
            }
            _ => false,
        };

        if !same_activity {
            finalize_tracked_event(&storage, tracked.take(), &now_iso);

            if let (Some(session), Some(window)) = (session, window) {
                let service =
                    extract_service_name(&window.process_name, &window.title).map(str::to_string);
                match storage.create_event_from_window(
                    &session.id,
                    &window,
                    Some(&now_iso),
                    service,
                ) {
                    Ok(event) => {
                        tracked = Some(TrackedEvent {
                            session_id: session.id,
                            event_id: event.id,
                            process_id: window.process_id,
                            process_name: window.process_name,
                            window_title: window.title,
                        });
                    }
                    Err(error) => eprintln!("Failed to record active window: {error}"),
                }
            }
        }

        previous_poll_at = Some(now);
        thread::sleep(Duration::from_millis(500));
    }
}

fn finalize_tracked_event(storage: &Storage, tracked: Option<TrackedEvent>, end_time: &str) {
    if let Some(event) = tracked {
        if let Err(error) = storage.finalize_event(&event.event_id, end_time) {
            eprintln!("Failed to finalize tracked event: {error}");
        }
    }
}
