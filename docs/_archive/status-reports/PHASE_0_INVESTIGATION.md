# Phase 0: 現状調査報告

## 1. Gitの作業ツリー
- 現在の変更: MASTER_DEVELOPMENT_PLAN.md のみ（コミット済み）
- 状態: クリーン

## 2. Tauriコマンドの登録状況

### 現在実装済み（11個）
```rust
// Session CRUD
start_session(purpose, target_time_minutes?)      -> Session
stop_session(session_id)                            -> Session
get_current_session()                               -> Option<Session>
get_session(session_id)                             -> SessionWithDetails
get_recent_sessions(limit=10)                       -> Vec<RecentSession>

// Activity / Event
get_current_window()                                -> WindowInfo
get_current_activity()                              -> Option<CurrentActivity>
get_events_for_session(session_id)                  -> Vec<Event>

// Result / Reflection
save_result(session_id, result_level, result_description, actual_duration_minutes, what_wasnt_done?)
save_reflection(session_id, deviation_reason, reflection_details?)
```

## 3. fetch('/api/...') の残存状況

### 合計15箇所

| ファイル | 呼び出し回数 | APIエンドポイント |
|---|---|---|
| home.html | 3 | /api/session/start, /api/session/stop, /api/window |
| result.html | 3 | /api/session/elapsed, /api/session/current, /api/session/result |
| timeline.html | 4 | /api/session/current, /api/session/events, /api/events, mockデータ |
| reflection.html | 4 | /api/session/analyze, /api/session/hypotheses, /api/session/next-actions, /api/reflection |
| pattern.html | 1 | /api/events |

## 4. 問題分析

### 問題1: Electron版のサーバーAPIに依存
- すべてのfetch呼び出しはElectron版のサーバーAPI（`desktop/_legacy_electron/server-improved.js`）を想定
- Tauri版にはサーバーがないため、これらの呼び出しは失敗する

### 問題2: Phase 2-4のAPIエンドポイントがTauri版に存在しない
- reflection.htmlが呼び出すAPI:
  - `/api/session/analyze` - セ�ション分析API
  - `/api/session/hypotheses` - 仮説生成API
  - `/api/session/next-actions` - 次回行動候補API
- これらはPhase 2-4の機能であり、Tauri版には未実装

### 問題3: 不足しているTauriコマンド
- `get_window()` - home.htmlで呼び出し中
- `get_session_elapsed()` - result.htmlで呼び出し中

## 5. 変更計画

### 変更が必要なファイルと内容

#### A. Tauriコマンドの追加
**ファイル**: `desktop/src-tauri/src/lib.rs`

**追加が必要なコマンド**:
1. `get_window()` - 現在のウィンドウ情報を取得（home.html用）
2. `get_session_elapsed(session_id)` - セッションの経過時間を取得（result.html用）

#### B. UIファイルのinvoke化

**home.html**:
- `/api/session/start` → `invoke('start_session', { purpose, target_time_minutes })`
- `/api/session/stop` → `invoke('stop_session', { session_id })`
- `/api/window` → `invoke('get_window')`

**result.html**:
- `/api/session/elapsed` → `invoke('get_session_elapsed', { session_id })`
- `/api/session/current` → `invoke('get_current_session')`
- `/api/session/result` → `invoke('save_result', { session_id, result_level, result_description, actual_duration_minutes, what_wasnt_done })`

**timeline.html**:
- `/api/session/current` → `invoke('get_current_session')`
- `/api/session/events` → `invoke('get_events_for_session', { session_id })`
- `/api/events` → 削除または `invoke('get_events_for_session', { session_id })` に変更
- mockデータ読み込み → 削除（Phase 0ではテストデータ不要）

**reflection.html**:
- Phase 2-4のAPI呼び出しは一時的にコメントアウトまたはエラ処理
- `/api/reflection` → `invoke('save_reflection', { session_id, deviation_reason, reflection_details })`

**pattern.html**:
- `/api/events` → `invoke('get_events_for_session', { session_id })` またはコメントアウト

### 優先順序

#### 優先1: Tauriコマンドの追加
1. `get_window()` コマンドを追加
2. `get_session_elapsed()` コマンドを追加
3. `cargo check` でコンパイル確認

#### 優先2: 基本画面のinvoke化
1. home.htmlの3箇所をinvoke化
2. result.htmlの3箇所をinvoke化
3. `cargo tauri dev` で起動確認
4. Session開始・停止・Result保存の動作確認

#### 優先3: timeline.htmlのinvoke化
1. Session関連の呼び出しをinvoke化
2. `/api/events` を削除またはsession_id付きに変更
3. mockデータ読み込みを削除
4. Timeline表示の動作確認

#### 優先4: reflection.html/pattern.htmlの処理
1. Phase 2-4のAPI呼び出しを一時的にコメントアウト
2. 既存のReflection保存機能のみinvoke化
3. エラ処理を追加

## 6. 完了条件

- ✅ Tauriコマンド（11個）が正常に動作
- ✅ 追加コマンド（2個）が実装され動作する
- ✅ home.htmlとresult.htmlがTauriコマンドで動作する
- ✅ Session開始・停止・Result保存のフローが動作する
- ⏸️ timeline.htmlのinvoke化（Phase 0後半）
- ⏸️ reflection.html/pattern.htmlの処理（Phase 0後半）

## 7. 注意点

- Phase 2-4の機能（session/analyze, session/hypotheses, session/next-actions）は一時的に無効化
- これらはPhase 2以降で実装する
- Electron版のコードをTauri版にコピーしない
- データモデルやAPIの設計はTauri版に合わせる
