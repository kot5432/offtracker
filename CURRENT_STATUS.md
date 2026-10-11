# OffTracker 現在の状況まとめ

## プロジェクト概要
OffTrackerはPCの行動トラッキングと振り返り支援ツール。

## アーキテクチャの状況

### 2つのバージョンが存在
1. **Tauri版（メイン）** - `desktop/src-tauri/`
   - Rustベース
   - MASTER_DEVELOPMENT_PLAN.md で正式採用決定
   - 現在の開発の中心

2. **Electron版（Legacy）** - `desktop/_legacy_electron/`
   - Node.js/JavaScriptベース
   - `desktop/_legacy_electron/` に隔離済み
   - MVP時削除予定
   - Phase 2-4の実装がここにある

## Phase 2-4の実装状況

### ✅ 完了した実装（Electron legacy版）

#### Phase 2: Activityの目的との関係分析
- ✅ `desktop/src/purpose-analyzer.js` - 目的分析ロジック
- ✅ `desktop/_legacy_electron/src/activity-generator.js` - 目的分析統合
- ✅ `desktop/_legacy_electron/tracker-improved.js` - setPurpose()関数
- ✅ `desktop/_legacy_electron/server-improved.js` - セッション開始時にsetPurpose()呼び出し
- ✅ **Timeline画面の表示改善**（本日実装完了）
  - purpose_relationに基づくカラーコーディング
  - 凡例の更新（5つのカテゴリ）
  - サマリーに各カテゴリの時間統計
  - フィルター機能

#### Phase 3: セッション要約生成
- ✅ `desktop/src/session-summarizer.js` - セッション要約生成ロジック
- ✅ `desktop/ui/reflection.html` - 要約表示セクション

#### Phase 4: Reflection画面の拡張
- ✅ `desktop/src/hypothesis-generator.js` - 仮説生成ロジック
- ✅ `desktop/src/next-action-generator.js` - 次回行動候補生成ロジック
- ✅ `desktop/ui/reflection.html` - 大幅拡張（仮説、原因、次回行動）
- ✅ **サーバーAPIエンドポイント**（本日実装完了）
  - `/api/session/analyze` - セッション分析API
  - `/api/session/hypotheses` - 仮説生成API
  - `/api/session/next-actions` - 次回行動候補API
  - `/api/reflection` - 振り返り保存API（更新）

### ❌ 未実装（Tauri版）
Phase 2-4の機能はTauri版にはまだ実装されていません。

## Gitの状況

### ブランチ状態
- 現在のブランチ: `main`
- origin/mainより2コミット先行
- 未コミットの変更多数

### 変更ファイル
**変更中（未コミット）**:
- `desktop/ui/timeline.html` - Timeline表示改善
- `desktop/_legacy_electron/` 以下のファイル多数
- `desktop/src-tauri/` 以下のファイル多数
- その他削除されたファイル多数

**新規ファイル（未トラック）**:
- `desktop/_legacy_electron/` ディレクトリ全体
- `desktop/src/` ディレクトリ（Phase 2-4のロジック）
- `IMPLEMENTATION_PLAN.md`
- `MASTER_DEVELOPMENT_PLAN.md`
- `PHASE_2_4_PLAN.md`
- その他

## MASTER_DEVELOPMENT_PLAN.md による推奨フェーズ

### Phase 0: 未Accept Diffを全部確定
- 現行コードを正式化
- `fetch('/api/*')` を Tauri invoke に変更
- `cargo check` と `cargo tauri dev` で起動確認

### Phase 1: 自動記録の実機検証
- Event収集が操作事実と一致することを確認
- 検証シナリオ: VS Code → Chrome → Google → YouTube → VS Code

### Phase 2: Event → Activity 中間層
- 検知結果を「ユーザーが何をしていたか」へ変換
- TimelineをActivity表示に切り替え

### Phase 3-8: その後のフェーズ
- Activity × Purpose 関係判定
- 行動の意味づけ（ストーリー化）
- 目的とのズレ構造化整理
- AI 複数仮説生成
- ユーザー仮説判定・修正
- Next Actions 次の行動決定

## 次のステップの選択肢

### 選択肢1: GitHubにコミット
Electron legacy版の Phase 2-4 実装をコミットとして確定させる

**メリット**:
- 実装を履歴に残せる
- 参考として残せる

**デメリット**:
- 最終的には削除予定のコード
- Tauri版とは別の実装

### 選択肢2: Tauri版のPhase 0から開始
MASTER_DEVELOPMENT_PLAN.md に従ってTauri版を開発

**メリット**:
- 正式なアーキテクチャに従う
- 長期的に正しい方向

**デメリット**:
- Electron版の実装が無駄になる可能性
- Phase 0からやり直し

### 選択肢3: Tauri版にPhase 2-4を直接移植
Electron版の実装を参考にTauri/Rustに移植

**メリット**:
- 実装の再利用
- 早期にPhase 2-4が完成

**デメリット**:
- Phase 0-1が未完了のリスク
- 基礎が固まっていない可能性

## 推奨アプローチ

### アプローチA: 基礎重視（推奨）
1. Electron legacy版をコミット（参考として残す）
2. Tauri版の Phase 0 → Phase 1 を完了
3. 基礎が固まったら Phase 2-4 を Tauri版に移植

### アプローチB: 早期実装
1. Electron legacy版をコミット
2. 直ちに Tauri版に Phase 2-4 を移植
3. 後で Phase 0-1 を回収

## ユーザーへの質問

どのアプローチで進めますか？それとも別のアプローチをご希望ですか？
