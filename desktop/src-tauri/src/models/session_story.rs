use serde::Serialize;

use super::Activity;

#[derive(Debug, Clone, Serialize)]
pub struct SessionStory {
    pub summary: String,
    pub activities: Vec<Activity>,
    pub activity_count: usize,
    pub short_switch_count: usize,
    pub total_duration_seconds: i64,
}

/// Build a short, factual description from the already classified activity sequence.
/// This intentionally does not infer motivation, attention, or whether the session succeeded.
pub fn analyze_session_story(activities: &[Activity]) -> SessionStory {
    let total_duration_seconds = activities
        .iter()
        .map(|activity| activity.duration_seconds.max(0))
        .sum();
    let short_switch_count = activities
        .iter()
        .filter(|activity| activity.duration_seconds < 5)
        .count();

    let sequence = activities
        .iter()
        .filter(|activity| activity.duration_seconds >= 5)
        .fold(Vec::<(&str, i64)>::new(), |mut items, activity| {
            if let Some((label, duration)) = items.last_mut() {
                if *label == activity.label {
                    *duration += activity.duration_seconds.max(0);
                    return items;
                }
            }
            items.push((&activity.label, activity.duration_seconds.max(0)));
            items
        });

    let summary = if activities.is_empty() {
        "このセッションには、まだ行動が記録されていません。".to_string()
    } else if sequence.is_empty() {
        format!(
            "5秒未満の短い切替が{}回記録されました。長く続いた行動はありませんでした。",
            short_switch_count
        )
    } else {
        let items: Vec<String> = sequence
            .iter()
            .map(|(label, duration)| format!("{}（{}）", label, format_duration(*duration)))
            .collect();
        let flow = match items.as_slice() {
            [only] => format!("{}が記録されました", only),
            [first, last] => format!("{}の後に{}が記録されました", first, last),
            many => {
                let first = &many[0];
                let last = many.last().expect("non-empty activity flow");
                let middle = &many[1..many.len() - 1];
                format!(
                    "{}から始まり、その後{}を経て、最後に{}が記録されました",
                    first,
                    middle.join("、"),
                    last
                )
            }
        };
        if short_switch_count == 1 {
            format!(
                "このセッションでは、{}。5秒未満の短い切替が1回ありました。",
                flow
            )
        } else if short_switch_count > 1 {
            format!(
                "このセッションでは、{}。5秒未満の短い切替が{}回ありました。",
                flow, short_switch_count
            )
        } else {
            format!("このセッションでは、{}。", flow)
        }
    };

    SessionStory {
        summary,
        activities: activities.to_vec(),
        activity_count: activities.len(),
        short_switch_count,
        total_duration_seconds,
    }
}

fn format_duration(duration_seconds: i64) -> String {
    let duration_seconds = duration_seconds.max(0);
    let minutes = duration_seconds / 60;
    let seconds = duration_seconds % 60;
    match (minutes, seconds) {
        (0, seconds) => format!("{}秒", seconds),
        (minutes, 0) => format!("{}分", minutes),
        (minutes, seconds) => format!("{}分{}秒", minutes, seconds),
    }
}
