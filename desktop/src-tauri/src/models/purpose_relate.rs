use rusqlite::params;

use crate::storage::{Storage, StorageError, StorageResult};

use super::Activity;

/// Classify only evidence that can be inferred from the stated goal and activity
/// category. A service or application name by itself is not evidence of distraction.
pub fn classify_activity_purpose(activity: &Activity, purpose: &str) -> String {
    let purpose = normalize(purpose);

    // A service explicitly named in the goal is useful evidence. Application names
    // alone are deliberately ignored: using an editor does not prove the activity
    // advanced the goal, and unrelated work can happen in the same application.
    if activity.services_used.iter().any(|service| {
        let service = normalize(service);
        !service.is_empty() && purpose.contains(&service)
    }) {
        return "related".into();
    }

    match activity.activity_type.as_str() {
        "programming" if contains_any(&purpose, &[
            "プログラミング", "開発", "実装", "コーディング", "コード", "ソフトウェア", "アプリ",
        ]) => "related".into(),
        "writing" if contains_any(&purpose, &[
            "レポート", "論文", "作文", "執筆", "文章", "書類", "資料", "文書", "応募",
        ]) => "related".into(),
        "reading" if contains_any(&purpose, &[
            "勉強", "学習", "学ぶ", "読む", "読書", "教科書", "論文", "レポート", "調査", "研究",
        ]) => "possibly_related".into(),
        "research" => classify_web_activity(activity, &purpose),
        "communication" if contains_any(&purpose, &[
            "連絡", "打ち合わせ", "打合せ", "会議", "相談", "チーム", "共同", "コミュニケーション",
        ]) => "possibly_related".into(),
        "programming" | "writing" | "reading" | "communication" => {
            classify_mismatch(activity, &purpose)
        }
        _ => "uncertain".into(),
    }
}

fn classify_web_activity(activity: &Activity, purpose: &str) -> String {
    if activity
        .services_used
        .iter()
        .any(|service| service.eq_ignore_ascii_case("YouTube"))
    {
        return "uncertain".into();
    }

    let goal_suggests_research = contains_any(purpose, &[
        "調査", "研究", "勉強", "学習", "学ぶ", "課題", "レポート", "論文", "数学", "開発", "実装",
        "プログラミング", "作成", "準備", "改善", "調べ", "理解", "テスト",
    ]);
    if goal_suggests_research {
        "possibly_related".into()
    } else {
        classify_mismatch(activity, purpose)
    }
}

fn classify_mismatch(activity: &Activity, purpose: &str) -> String {
    let purpose_suggests_creation = contains_any(purpose, &[
        "作る", "作成", "書く", "執筆", "レポート", "論文", "実装", "開発", "コーディング",
        "プログラミング", "準備", "完成",
    ]);
    let activity_is_creation = matches!(activity.activity_type.as_str(), "programming" | "writing");

    // A mismatch between broad activity categories is only weak counter-evidence.
    // Missing context is not enough to conclude an activity was unrelated.
    if purpose_suggests_creation && !activity_is_creation {
        "possibly_unrelated".into()
    } else {
        "uncertain".into()
    }
}

fn normalize(text: &str) -> String {
    text.trim().to_lowercase()
}

fn contains_any(text: &str, keywords: &[&str]) -> bool {
    keywords.iter().any(|keyword| text.contains(keyword))
}

impl Storage {
    /// Rebuild activities and classify their relationship to the saved session purpose.
    pub fn classify_activity_purpose(&self, session_id: &str) -> StorageResult<Vec<Activity>> {
        let session = self
            .get_session(session_id)?
            .ok_or_else(|| StorageError::Message("session not found".into()))?;
        let mut activities = self.analyze_activities(session_id)?;
        for activity in &mut activities {
            activity.purpose_relation = Some(classify_activity_purpose(activity, &session.purpose));
        }
        self.exec_tx(|conn| {
            for activity in &activities {
                conn.execute(
                    "UPDATE activities SET purpose_relation=?2 WHERE id=?1",
                    params![activity.id, activity.purpose_relation],
                )?;
            }
            Ok(())
        })?;
        Ok(activities)
    }
}
