use serde::{Deserialize, Serialize};

use super::{Activity, ResultRecord};

const MAX_HYPOTHESES: usize = 3;
const MAX_EVIDENCE_REFERENCES_PER_HYPOTHESIS: usize = 8;
const MAX_TITLE_CHARS: usize = 120;
const MAX_DESCRIPTION_CHARS: usize = 600;
const MAX_COVERAGE_MESSAGE_CHARS: usize = 240;
const NO_CANDIDATES_MESSAGE: &str =
    "仮説候補を表示できませんでした。記録を確認して、振り返りを続けてください。";

/// Minimal, privacy-filtered input for a hypothesis provider.
/// This module does not send data to a provider; it only defines the boundary.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HypothesisInput {
    pub purpose: String,
    pub activities: Vec<HypothesisActivityInput>,
    pub result: Option<HypothesisResultInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HypothesisActivityInput {
    pub activity_type: String,
    pub duration_seconds: i64,
    pub purpose_relation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HypothesisResultInput {
    pub result_level: String,
    pub actual_duration_minutes: i64,
}

impl HypothesisInput {
    /// Copies only the fields approved by the Phase 6 data contract.
    /// Activity order is retained; identifiers, labels, app/service names,
    /// timestamps, and free-text result details are deliberately omitted.
    pub fn from_session(
        purpose: &str,
        activities: &[Activity],
        result: Option<&ResultRecord>,
    ) -> Self {
        Self {
            purpose: purpose.to_string(),
            activities: activities
                .iter()
                .map(|activity| HypothesisActivityInput {
                    activity_type: activity.activity_type.clone(),
                    duration_seconds: activity.duration_seconds.max(0),
                    purpose_relation: activity
                        .purpose_relation
                        .clone()
                        .unwrap_or_else(|| "uncertain".to_string()),
                })
                .collect(),
            result: result.map(|result| HypothesisResultInput {
                result_level: result.result_level.clone(),
                actual_duration_minutes: result.actual_duration_minutes.max(0),
            }),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Hypothesis {
    pub title: String,
    pub description: String,
    /// References to facts in the input. The UI should render these references
    /// from local session data instead of displaying provider-authored facts.
    pub evidence: Vec<String>,
    pub confidence: Confidence,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HypothesisResponse {
    pub hypotheses: Vec<Hypothesis>,
    /// Required when fewer than three distinct, grounded candidates are available.
    pub coverage_message: Option<String>,
}

/// Sanitized presentation data. Provider output is converted to this type only
/// after validation; validation failures become a fixed no-candidates state.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum HypothesisDisplayState {
    Candidates {
        hypotheses: Vec<DisplayedHypothesis>,
        coverage_message: Option<String>,
    },
    NoCandidates {
        message: String,
    },
}

#[derive(Debug, Clone, Serialize)]
pub struct DisplayedHypothesis {
    pub title: String,
    pub description: String,
    /// Evidence is always rendered from local input facts, never provider text.
    pub evidence: Vec<String>,
    pub confidence: Confidence,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Confidence {
    Low,
    Medium,
    High,
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum HypothesisValidationError {
    #[error("at most three hypotheses may be returned")]
    TooManyHypotheses,
    #[error("each hypothesis needs a title, description, and evidence")]
    MissingContent,
    #[error("hypothesis content exceeds its allowed length")]
    ContentTooLong,
    #[error("a hypothesis may reference at most eight input facts")]
    TooManyEvidenceReferences,
    #[error("hypotheses must offer distinct explanations")]
    DuplicateTitle,
    #[error("the input does not contain enough activity evidence for hypotheses")]
    InsufficientActivityEvidence,
    #[error("a completed purpose with only related activity does not need cause hypotheses")]
    NoUnmetPurposeToExplain,
    #[error("each evidence reference must point to a fact present in the input")]
    InvalidEvidenceReference,
    #[error("an evidence reference may only appear once in a hypothesis")]
    DuplicateEvidenceReference,
    #[error("explain why fewer than three grounded hypotheses are available")]
    MissingCoverageMessage,
    #[error("a coverage message is only needed when fewer than three hypotheses are available")]
    UnexpectedCoverageMessage,
}

/// Checks whether the input has enough activity information to request
/// generated hypotheses. Call this before invoking a provider to avoid asking
/// for explanations when there is no grounded activity or unmet purpose.
pub fn validate_hypothesis_input(
    input: &HypothesisInput,
) -> Result<(), HypothesisValidationError> {
    if input.activities.is_empty()
        || input.activities.iter().all(|activity| {
            !matches!(
                activity.purpose_relation.as_str(),
                "related" | "possibly_related" | "possibly_unrelated" | "unrelated"
            )
        })
    {
        return Err(HypothesisValidationError::InsufficientActivityEvidence);
    }

    if input.result.as_ref().map(|result| result.result_level.as_str()) == Some("completed")
        && input.activities.iter().all(|activity| {
            matches!(
                activity.purpose_relation.as_str(),
                "related" | "possibly_related"
            )
        })
    {
        return Err(HypothesisValidationError::NoUnmetPurposeToExplain);
    }

    Ok(())
}

/// Checks the output contract before candidates can be shown to the user.
/// Callers should show an insufficient-evidence state rather than fabricate
/// candidates when this validation fails.
pub fn validate_hypothesis_response(
    response: &HypothesisResponse,
    input: &HypothesisInput,
) -> Result<(), HypothesisValidationError> {
    let hypotheses = &response.hypotheses;
    if hypotheses.len() > MAX_HYPOTHESES {
        return Err(HypothesisValidationError::TooManyHypotheses);
    }

    if !hypotheses.is_empty() {
        validate_hypothesis_input(input)?;
    }

    let mut titles = std::collections::HashSet::new();
    for hypothesis in hypotheses {
        if hypothesis.title.trim().is_empty()
            || hypothesis.description.trim().is_empty()
            || hypothesis.evidence.is_empty()
        {
            return Err(HypothesisValidationError::MissingContent);
        }
        if hypothesis.title.chars().count() > MAX_TITLE_CHARS
            || hypothesis.description.chars().count() > MAX_DESCRIPTION_CHARS
        {
            return Err(HypothesisValidationError::ContentTooLong);
        }
        if hypothesis.evidence.len() > MAX_EVIDENCE_REFERENCES_PER_HYPOTHESIS {
            return Err(HypothesisValidationError::TooManyEvidenceReferences);
        }
        if !titles.insert(hypothesis.title.trim().to_lowercase()) {
            return Err(HypothesisValidationError::DuplicateTitle);
        }

        let mut evidence_refs = std::collections::HashSet::new();
        for evidence in &hypothesis.evidence {
            let exists_in_input = evidence_exists(input, evidence);
            if !exists_in_input {
                return Err(HypothesisValidationError::InvalidEvidenceReference);
            }
            if !evidence_refs.insert(evidence.as_str()) {
                return Err(HypothesisValidationError::DuplicateEvidenceReference);
            }
        }
    }

    if hypotheses.len() < 3
        && response
            .coverage_message
            .as_deref()
            .map_or(true, |message| message.trim().is_empty())
    {
        return Err(HypothesisValidationError::MissingCoverageMessage);
    }
    if response
        .coverage_message
        .as_deref()
        .map_or(false, |message| message.chars().count() > MAX_COVERAGE_MESSAGE_CHARS)
    {
        return Err(HypothesisValidationError::ContentTooLong);
    }
    if hypotheses.len() >= 3 && response.coverage_message.is_some() {
        return Err(HypothesisValidationError::UnexpectedCoverageMessage);
    }

    Ok(())
}

/// Validates a parsed provider response and converts it to display data.
/// Callers should pass `None` for parse, transport, or provider failures. No
/// provider error text or invalid response content is returned to the UI.
pub fn prepare_hypothesis_display(
    response: Option<HypothesisResponse>,
    input: &HypothesisInput,
) -> HypothesisDisplayState {
    let Some(response) = response else {
        return no_candidates_state();
    };
    if validate_hypothesis_response(&response, input).is_err() || response.hypotheses.is_empty() {
        return no_candidates_state();
    }

    let count = response.hypotheses.len();
    let hypotheses = response
        .hypotheses
        .into_iter()
        .map(|hypothesis| {
            let evidence = render_hypothesis_evidence(input, &hypothesis.evidence)?;
            Ok(DisplayedHypothesis {
                title: hypothesis.title,
                description: hypothesis.description,
                evidence,
                confidence: hypothesis.confidence,
            })
        })
        .collect::<Result<Vec<_>, HypothesisValidationError>>();

    let Ok(hypotheses) = hypotheses else {
        return no_candidates_state();
    };

    HypothesisDisplayState::Candidates {
        hypotheses,
        coverage_message: (count < MAX_HYPOTHESES).then(|| {
            format!(
                "根拠を確認できる候補は{}件です。根拠のない候補は追加していません。",
                count
            )
        }),
    }
}

fn no_candidates_state() -> HypothesisDisplayState {
    HypothesisDisplayState::NoCandidates {
        message: NO_CANDIDATES_MESSAGE.to_string(),
    }
}

/// Resolves provider-supplied references into facts derived only from the
/// privacy-filtered input. The caller can display these strings instead of
/// trusting free-form evidence text from a provider.
pub fn render_hypothesis_evidence(
    input: &HypothesisInput,
    evidence: &[String],
) -> Result<Vec<String>, HypothesisValidationError> {
    if evidence.is_empty() {
        return Err(HypothesisValidationError::MissingContent);
    }

    let mut seen = std::collections::HashSet::new();
    evidence
        .iter()
        .map(|reference| {
            if !seen.insert(reference) {
                return Err(HypothesisValidationError::DuplicateEvidenceReference);
            }

            match parse_evidence_reference(reference) {
                Some(EvidenceReference::Activity(activity_index)) => {
                    let activity = input
                        .activities
                        .get(activity_index)
                        .ok_or(HypothesisValidationError::InvalidEvidenceReference)?;
                    Ok(format!(
                        "{}が{}記録され、目的との関係は「{}」です",
                        activity_type_label(&activity.activity_type),
                        format_duration(activity.duration_seconds),
                        purpose_relation_label(&activity.purpose_relation)
                    ))
                }
                Some(EvidenceReference::Result) => {
                    let result = input
                        .result
                        .as_ref()
                        .ok_or(HypothesisValidationError::InvalidEvidenceReference)?;
                    Ok(format!(
                        "結果は「{}」、実績時間は{}分です",
                        result_level_label(&result.result_level),
                        result.actual_duration_minutes.max(0)
                    ))
                }
                None => Err(HypothesisValidationError::InvalidEvidenceReference),
            }
        })
        .collect()
}

enum EvidenceReference {
    Activity(usize),
    Result,
}

fn parse_evidence_reference(reference: &str) -> Option<EvidenceReference> {
    if reference == "result" {
        return Some(EvidenceReference::Result);
    }
    reference
        .strip_prefix("activity:")
        .and_then(|index| index.parse::<usize>().ok())
        .map(EvidenceReference::Activity)
}

fn evidence_exists(input: &HypothesisInput, reference: &str) -> bool {
    match parse_evidence_reference(reference) {
        Some(EvidenceReference::Activity(index)) => index < input.activities.len(),
        Some(EvidenceReference::Result) => input.result.is_some(),
        None => false,
    }
}

fn activity_type_label(activity_type: &str) -> &'static str {
    match activity_type {
        "research" => "調査",
        "programming" => "プログラミング",
        "writing" => "文書・資料作成",
        "document_work" => "文書作成",
        "reading" => "文書の閲覧",
        "communication" => "コミュニケーション",
        "leisure" => "余暇",
        "other" => "その他の活動",
        _ => "活動",
    }
}

fn purpose_relation_label(relation: &str) -> &'static str {
    match relation {
        "related" => "目的に関連",
        "possibly_related" => "関連する可能性",
        "uncertain" => "不明",
        "possibly_unrelated" => "目的から外れた可能性",
        "unrelated" => "目的から外れた",
        _ => "不明",
    }
}

fn result_level_label(result_level: &str) -> &'static str {
    match result_level {
        "completed" => "完了",
        "mostly_completed" => "大部分を完了",
        "partially_completed" => "一部完了",
        "minimal" => "少し進行",
        "not_completed" => "未完了",
        _ => "未分類",
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

#[cfg(test)]
mod tests {
    use super::*;

    fn input(relation: &str, result_level: Option<&str>) -> HypothesisInput {
        HypothesisInput {
            purpose: "数学レポートを書く".into(),
            activities: vec![HypothesisActivityInput {
                activity_type: "research".into(),
                duration_seconds: 35,
                purpose_relation: relation.into(),
            }],
            result: result_level.map(|level| HypothesisResultInput {
                result_level: level.into(),
                actual_duration_minutes: 1,
            }),
        }
    }

    fn hypothesis(reference: &str) -> Hypothesis {
        Hypothesis {
            title: "資料を確認する時間が必要だった可能性".into(),
            description: "調査の記録はありますが、どの資料を確認したかは分かりません。".into(),
            evidence: vec![reference.into()],
            confidence: Confidence::Low,
        }
    }

    #[test]
    fn all_uncertain_activity_is_rejected() {
        assert_eq!(
            validate_hypothesis_input(&input("uncertain", Some("partially_completed"))),
            Err(HypothesisValidationError::InsufficientActivityEvidence)
        );
    }

    #[test]
    fn completed_purpose_with_only_related_activity_is_rejected() {
        assert_eq!(
            validate_hypothesis_input(&input("related", Some("completed"))),
            Err(HypothesisValidationError::NoUnmetPurposeToExplain)
        );
    }

    #[test]
    fn invalid_response_becomes_fixed_no_candidates_state() {
        let response = HypothesisResponse {
            hypotheses: vec![hypothesis("activity:99")],
            coverage_message: Some("モデルの内部エラー詳細".into()),
        };

        let display = prepare_hypothesis_display(Some(response), &input("possibly_unrelated", None));
        assert!(matches!(
            display,
            HypothesisDisplayState::NoCandidates { message }
                if message == NO_CANDIDATES_MESSAGE
        ));
    }

    #[test]
    fn display_uses_local_evidence_and_local_coverage_copy() {
        let response = HypothesisResponse {
            hypotheses: vec![hypothesis("activity:0")],
            coverage_message: Some("外部モデルからの自由記述".into()),
        };

        let display = prepare_hypothesis_display(Some(response), &input("possibly_unrelated", None));
        let HypothesisDisplayState::Candidates {
            hypotheses,
            coverage_message,
        } = display
        else {
            panic!("expected validated candidates");
        };

        assert_eq!(hypotheses[0].evidence, ["調査が35秒記録され、目的との関係は「目的から外れた可能性」です"]);
        assert_eq!(
            coverage_message.as_deref(),
            Some("根拠を確認できる候補は1件です。根拠のない候補は追加していません。")
        );
    }

    #[test]
    fn missing_response_does_not_expose_provider_errors() {
        let display = prepare_hypothesis_display(None, &input("related", Some("completed")));
        assert!(matches!(
            display,
            HypothesisDisplayState::NoCandidates { message }
                if message == NO_CANDIDATES_MESSAGE
        ));
    }

    #[test]
    fn recorded_qwen4b_failures_are_all_rejected_for_display() {
        let scenarios: serde_json::Value = serde_json::from_str(include_str!(
            "../../../../docs/mock-sessions/phase-6-hypotheses.json"
        ))
        .expect("mock scenario fixture should be valid JSON");
        let evaluations: Vec<serde_json::Value> = serde_json::from_str(include_str!(
            "../../../../docs/mock-sessions/phase-6-local-evaluation-4b.json"
        ))
        .expect("Qwen3 4B evaluation fixture should be valid JSON");

        for evaluation in evaluations {
            let scenario_id = evaluation["scenario_id"]
                .as_str()
                .expect("evaluation should identify its scenario");
            let scenario = scenarios["scenarios"]
                .as_array()
                .and_then(|items| items.iter().find(|item| item["id"] == scenario_id))
                .expect("evaluation scenario should exist in mock fixture");
            let input: HypothesisInput = serde_json::from_value(scenario["input"].clone())
                .expect("mock input should match the privacy-filtered contract");
            let response: HypothesisResponse = serde_json::from_str(
                evaluation["response"]
                    .as_str()
                    .expect("evaluation should retain the raw response"),
            )
            .expect("Qwen3 response should parse before quality validation");

            assert!(
                matches!(
                    prepare_hypothesis_display(Some(response), &input),
                    HypothesisDisplayState::NoCandidates { .. }
                ),
                "Qwen3 4B output for {scenario_id} must not reach display"
            );
        }
    }
}
