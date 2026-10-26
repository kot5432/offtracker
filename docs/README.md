# OffTracker ドキュメント案内

現行の仕様・判断・作業計画を探すための入口です。古い計画や調査記録は削除せず、[`_archive/`](./_archive/) に保管しています。

## 現行の参照先

| 知りたいこと | 文書 | 役割 |
|---|---|---|
| なぜ作るか・利用者に届ける価値 | [PRODUCT.md](./PRODUCT.md) | 製品の目的と基本方針 |
| MVPに含める範囲 | [MVP_DEFINITION.md](./MVP_DEFINITION.md) | MVPの価値・受け入れ条件 |
| 現在の進捗と次の作業 | [../MASTER_DEVELOPMENT_PLAN.md](../MASTER_DEVELOPMENT_PLAN.md) | 唯一の現行開発計画 |
| データモデルの概要 | [DATA_MODEL.md](./DATA_MODEL.md) | データ構造の説明。実装の正本はRustモデルとSQLiteマイグレーション |
| AIに関する原則 | [AI_RULES.md](./AI_RULES.md) | 仮説表示・根拠・不確実性の扱い |
| 発表・画面レビュー | [MENTORING_DEMO_AND_REVIEW.md](./MENTORING_DEMO_AND_REVIEW.md) | デモ方針とレビュー方法 |
| 振り返り画面への意見・変更記録 | [REFLECTION_REVIEW_LOG.md](./REFLECTION_REVIEW_LOG.md) | 利用者レビューの記録 |
| 仮説品質の設計・評価 | [PHASE_6_HYPOTHESIS_DESIGN.md](./PHASE_6_HYPOTHESIS_DESIGN.md), [PHASE_6_QUALITY_GATE.md](./PHASE_6_QUALITY_GATE.md), [PHASE_6_PROVIDER_EVALUATION.md](./PHASE_6_PROVIDER_EVALUATION.md), [PHASE_6_LOCAL_MODEL_EVALUATION.md](./PHASE_6_LOCAL_MODEL_EVALUATION.md) | AI仮説の実装前評価資料 |
| 目的文AI分類・サーバーAPI | [PURPOSE_CLASSIFICATION_API_PLAN.md](./PURPOSE_CLASSIFICATION_API_PLAN.md), [分類ルーブリックv2の評価ケース](./mock-sessions/purpose-classification-rubric-v2-cases.json), [旧初期ケース](./mock-sessions/purpose-classification-cases.json), [旧境界チャレンジ](./mock-sessions/purpose-classification-challenge-cases.json), [旧確認用](./mock-sessions/purpose-classification-holdout-cases.json) | 分類方針、API案、合成評価のケースと結果 |

## 主なフォルダー

- `mock-sessions/`: 分析や品質評価に使う架空データ
- `ui-mockups/`: 画面構成の初期案
- `_archive/`: 過去の計画・報告・旧仕様。現行の指示としては使わない

## 実装の正本

- TauriコマンドとRustの構造: `desktop/src-tauri/src/`
- SQLiteスキーマと変更履歴: `desktop/src-tauri/db/migrations/`
- 実際に配信される画面: `desktop/ui/`
- 架空データの画面案: `desktop/ui/review/`

Rustのコード配置は `mod` 宣言とファイル・フォルダーの階層が対応する現在のCargoパッケージ構成を維持します。新しいCargo workspaceへの分割は、複数の独立パッケージが必要になった段階で検討します。
