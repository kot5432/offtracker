# GitHub コミット計画

## 概要
Phase 2-4の実装（Electron legacy版）をGitHubにコミットします。これにより実装を履歴に残し、Tauri版への移植の参考にします。

## 現在の変更状況

### 変更ファイル
1. `desktop/ui/timeline.html` - Timeline表示改善（purpose_relationに基づく可視化）
2. `desktop/_legacy_electron/server-improved.js` - サーバーAPIエンドポイント追加
3. `desktop/_legacy_electron/sessions.json` - セッション履歴ファイル（新規）

### その他の変更
- 多数のファイルが削除・変更されているが、Phase 2-4に関連するのは上記3ファイル

## コミット計画

### コミット1: Phase 2-4 Timeline表示改善
**ファイル**: `desktop/ui/timeline.html`

**変更内容**:
- purpose_relationに基づくカラーコーディング（5つのカテゴリ）
- 凡例の更新（related/possibly_related/uncertain/possibly_unrelated/unrelated）
- サマリーに各カテゴリの時間統計を追加
- purpose_relationに基づくフィルター機能
- determineBarClass関数を更新してpurpose_relationを優先的に使用
- 後方互換性維持（legacy events対応）

**コミットメッセージ**:
```
Phase 2-4: Timeline画面の表示改善を実装

Activityのpurpose_relationフィールドに基づいて、目的との関係を視覚的に表示する機能を追加

変更内容:
- purpose_relationに基づくカラーコーディング（related/possibly_related/uncertain/possibly_unrelated/unrelated）
- 凡例を5つのカテゴリに更新
- サマリーに各カテゴリの時間統計を追加
- purpose_relationに基づくフィルター機能を追加
- determineBarClass関数を更新してpurpose_relationを優先的に使用
- 後方互換性を維持（legacy events対応）

Note: これはdesktop/_legacy_electron/（Electron版）の実装です。
Tauri版への移行はMASTER_DEVELOPMENT_PLAN.mdに従って進行します。

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
```

### コミット2: Phase 2-4 サーバーAPI実装
**ファイル**:
- `desktop/_legacy_electron/server-improved.js`
- `desktop/_legacy_electron/sessions.json`

**変更内容**:
- /api/session/analyze - セッション分析API
- /api/session/hypotheses - 仮説生成API
- /api/session/next-actions - 次回行動候補API
- /api/reflection - 振り返り保存API（更新）
- loadSessionById()ヘルパー関数追加
- stopSession()を更新してsessions.jsonに履歴を保存
- sessions.jsonファイル作成

**コミットメッセージ**:
```
Phase 2-4: サーバーAPIエンドポイントを実装

Reflection画面で必要なサーバーAPIエンドポイントを追加

変更内容:
- /api/session/analyze - セッション分析API
- /api/session/hypotheses - 仮説生成API
- /api/session/next-actions - 次回行動候補API
- /api/reflection - 振り返り保存API（更新）
- loadSessionById()ヘルパー関数追加
- stopSession()を更新してsessions.jsonに履歴を保存
- sessions.jsonファイル作成

Note: これはdesktop/_legacy_electron/（Electron版）の実装です。
Tauri版への移行はMASTER_DEVELOPMENT_PLAN.mdに従って進行します。

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
```

## 実行手順

1. `git add desktop/ui/timeline.html`
2. `git commit -m "..."` （上記コミットメッセージ）
3. `git add desktop/_legacy_electron/server-improved.js desktop/_legacy_electron/sessions.json`
4. `git commit -m "..."` （上記コミットメッセージ）
5. `git status` で確認

## 注意点

- これらのコミットはElectron legacy版の実装です
- Tauri版への移植は別途行う必要があります
- MASTER_DEVELOPMENT_PLAN.md に従って、Tauri版の Phase 0 から開発を進めることが推奨されます
