use chrono::{DateTime, Utc};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::storage::{Storage, StorageError, StorageResult};

use super::Event;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub session_id: String,
    pub start_time: String,
    pub end_time: String,
    pub duration_seconds: i64,
    pub activity_type: String,
    pub label: String,
    pub applications_used: Vec<String>,
    pub services_used: Vec<String>,
    pub event_ids: Vec<String>,
    pub purpose_relation: Option<String>,
}

struct ActivityGroup {
    activity_type: String,
    label: String,
    start_time: DateTime<Utc>,
    end_time: DateTime<Utc>,
    duration_seconds: i64,
    applications_used: Vec<String>,
    services_used: Vec<String>,
    event_ids: Vec<String>,
}

impl ActivityGroup {
    fn from_event(event: &Event) -> StorageResult<Self> {
        let start_time = parse_time(&event.start_time)?;
        let end_time = event
            .end_time
            .as_deref()
            .map(parse_time)
            .transpose()?
            .unwrap_or_else(|| start_time + chrono::Duration::seconds(event.duration_seconds.max(0)));
        let (activity_type, label) = classify_application(event);
        Ok(Self {
            activity_type,
            label,
            start_time,
            end_time,
            duration_seconds: event.duration_seconds.max(0),
            applications_used: vec![display_application(event)],
            services_used: event.service.iter().cloned().collect(),
            event_ids: vec![event.id.clone()],
        })
    }

    fn can_append(&self, event: &Event, start_time: DateTime<Utc>) -> bool {
        let (activity_type, label) = classify_application(event);
        let gap = (start_time - self.end_time).num_seconds();
        self.activity_type == activity_type && self.label == label && (0..=120).contains(&gap)
    }

    fn append(&mut self, event: &Event) -> StorageResult<()> {
        let start_time = parse_time(&event.start_time)?;
        let end_time = event
            .end_time
            .as_deref()
            .map(parse_time)
            .transpose()?
            .unwrap_or_else(|| start_time + chrono::Duration::seconds(event.duration_seconds.max(0)));
        if end_time > self.end_time {
            self.end_time = end_time;
        }
        self.duration_seconds += event.duration_seconds.max(0);
        let application = display_application(event);
        if !self.applications_used.contains(&application) {
            self.applications_used.push(application);
        }
        if let Some(service) = &event.service {
            if !self.services_used.contains(service) {
                self.services_used.push(service.clone());
            }
        }
        self.event_ids.push(event.id.clone());
        Ok(())
    }

    fn finish(self, session_id: &str) -> Activity {
        Activity {
            id: Uuid::new_v4().to_string(),
            session_id: session_id.to_string(),
            start_time: self.start_time.to_rfc3339(),
            end_time: self.end_time.to_rfc3339(),
            duration_seconds: self.duration_seconds,
            activity_type: self.activity_type,
            label: self.label,
            applications_used: self.applications_used,
            services_used: self.services_used,
            event_ids: self.event_ids,
            purpose_relation: None,
        }
    }
}

impl Storage {
    /// Rebuild the session's activities from raw events. Repeated calls are idempotent.
    pub fn analyze_activities(&self, session_id: &str) -> StorageResult<Vec<Activity>> {
        let events = self.get_events_for_session(session_id)?;
        let mut groups: Vec<ActivityGroup> = Vec::new();

        for event in &events {
            let event_start = parse_time(&event.start_time)?;
            if let Some(previous) = groups.last_mut() {
                if previous.can_append(event, event_start) {
                    previous.append(event)?;
                    continue;
                }
            }
            groups.push(ActivityGroup::from_event(event)?);
        }

        let activities: Vec<Activity> = groups
            .into_iter()
            .map(|group| group.finish(session_id))
            .collect();
        let persisted: Vec<(String, String, String)> = activities
            .iter()
            .map(|activity| {
                Ok((
                    serde_json::to_string(&activity.applications_used)
                        .map_err(|error| StorageError::Message(error.to_string()))?,
                    serde_json::to_string(&activity.event_ids)
                        .map_err(|error| StorageError::Message(error.to_string()))?,
                    serde_json::to_string(&activity.services_used)
                        .map_err(|error| StorageError::Message(error.to_string()))?,
                ))
            })
            .collect::<StorageResult<_>>()?;
        self.exec_tx(|conn| {
            conn.execute("DELETE FROM activities WHERE session_id=?1", params![session_id])?;
            for (activity, (applications, event_ids, services)) in
                activities.iter().zip(persisted.iter())
            {
                conn.execute(
                "INSERT INTO activities
                 (id, session_id, start_time, end_time, duration_seconds, activity_type,
                  label, applications_used, event_ids, services_used, purpose_relation)
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
                params![
                    activity.id,
                    activity.session_id,
                    activity.start_time,
                    activity.end_time,
                    activity.duration_seconds,
                    activity.activity_type,
                    activity.label,
                    applications,
                    event_ids,
                    services,
                    activity.purpose_relation,
                ],
                )?;
            }
            Ok(())
        })?;
        Ok(activities)
    }
}

fn parse_time(value: &str) -> StorageResult<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(value)
        .map(|time| time.with_timezone(&Utc))
        .map_err(|error| StorageError::Message(format!("invalid event time: {error}")))
}

fn display_application(event: &Event) -> String {
    event
        .application_display
        .clone()
        .unwrap_or_else(|| event.application.clone())
}

fn classify_application(event: &Event) -> (String, String) {
    classify_application_fields(
        &event.application,
        event.application_display.as_deref(),
        event.service.as_deref(),
    )
}

pub fn label_for_application(
    application: &str,
    application_display: Option<&str>,
    service: Option<&str>,
) -> String {
    classify_application_fields(application, application_display, service).1
}

fn classify_application_fields(
    application: &str,
    application_display: Option<&str>,
    service: Option<&str>,
) -> (String, String) {
    let display = application_display.unwrap_or(application);
    let app = display.to_lowercase();
    let process = application.to_lowercase();
    if ["vs code", "visual studio", "intellij", "pycharm", "goland", "rustrover", "sublime text"]
        .iter()
        .any(|name| app.contains(name))
        || ["code.exe", "devenv.exe", "idea", "pycharm", "goland", "rustrover", "sublime_text.exe"]
            .iter()
            .any(|name| process.contains(name))
    {
        return ("programming".into(), "プログラミング".into());
    }
    if ["word", "excel", "powerpoint", "onenote"]
        .iter()
        .any(|name| app.contains(name))
    {
        return ("writing".into(), "文書・資料作成".into());
    }
    if ["pdf", "adobe reader", "sumatra"]
        .iter()
        .any(|name| app.contains(name))
    {
        return ("reading".into(), "文書の閲覧".into());
    }
    if ["google chrome", "microsoft edge", "firefox", "chrome", "msedge"]
        .iter()
        .any(|name| app.contains(name) || process.contains(name))
    {
        let label = service.unwrap_or("Web閲覧").to_string();
        return ("research".into(), label);
    }
    if ["discord", "slack", "teams", "zoom"]
        .iter()
        .any(|name| app.contains(name) || process.contains(name))
    {
        return ("communication".into(), "コミュニケーション".into());
    }
    ("other".into(), format!("{}の利用", display))
}
