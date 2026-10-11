# OffTracker MASTER_DEVELOPMENT_PLAN

> 本ファイルが唯一無二の開発計画原票。過去のPLAN/PHASEファイルは docs/_archive/ を参照。
> 更新: 2026-10-02 (v3 - 現在地・Phase順序・Timeline位置づけ・Phase0/1手順を明文化)

---

## 0. 現在地（機能領域ごとの進捗）

| 領域 | 進捗 | 補足 |
|---|---|---|
| 目的設定 | █████████░ 約90% | Session開始・目的入力・Homeフローは概ね動く |
| データ収集 | ██████░░░░ 約60% | Layer2（500msポーリング等）はコード上かなり進んでいる。実機で事実一致の検証が未完了 |
| 行動理解 | █░░░░░░░░░ 約10% | Timelineは **Event表示段階**。Activity層・意味づけ・目的との関係は未着手 |
| 振り返り | ░░░░░░░░░░ 約5% | Reflection/Resultの骨格のみ。AI仮説・Grounded Reason・Next Actionは Phase 6〜8 |

**現在の段階**: 第1段階（基盤の安定化）の途中

## 開発方針（4段階）

OffTrackerの開発を、次の4段階に分けます。

| 段階 | 目的 | 完了条件 |
|---|---|---|
| 第1段階：基盤の安定化 | Tauri版を正常に動かす | 画面・DB・セッション管理が連動する |
| 第2段階：行動の理解 | EventをActivityに変換する | PC操作の羅列から、意味のある行動単位を作れる |
| 第3段階：振り返りの実現 | 目的とのズレや原因の仮説を分析する | ユーザーが自分の行動を理解できる |
| 第4段階：継続的な改善 | 次の行動と過去の記録を結び付ける | 対策を試し、その結果を振り返れる |

**現在は第1段階の途中です。** ここを飛ばしてAIの実装を進めると、データ収集や保存に問題があった場合に、分析結果まで正しくなくなる可能性があります。

---

## 1. 事前決定事項

### 1-1. フレームワーク決定: **Tauri 2.x (Rust)** 正式採用
- Electron系20ファイルは `desktop/_legacy_electron/` に隔離済み、MVP時削除予定
- アーキテクチャ原則: `HTML/JS → Tauri invoke() → Rust Command → Storage → SQLite` の単一経路。旧 `fetch('/api/*')` は禁止。
- **Phase 0〜1 で整理必須**: `desktop/ui/` に `fetch('/api/...')` が **15箇所** 残存（legacy除く）。  
  `home.html`(3), `result.html`(3), `timeline.html`(4), `reflection.html`(4), `pattern.html`(1)。  
  未Accept Diff確定とあわせ invoke 一本化する。

### 1-2. プロダクト哲学（絶対ルール - 全コード・UIが従う）
1. ❌ 自己否定誘導禁止: UI/AIテキストに「無駄/ダメ/失敗/集中力がない」表現一切禁止
2. ❌ 断定禁止: ルールもAIも「〜です」禁止。「〜が観測されました」「〜の可能性があります」
3. ❌ 一律善悪判断禁止: YouTube=悪 / VS Code=善 という固定分類禁止。文脈（目的との関係）で判断
4. ❌ 生産性スコア / ゲーミフィケーション / ランキング 一切禁止
5. ✅ 心の状態・理由は自己申告: 自動取得できるもの（アプリ切替/時間）と自己申告を厳格分離
6. ✅ プライバシー最優先: キーロガー/スクショ/検索語/クリップボード/URLパラメータ一切取得禁止
7. ✅ **AIは「仮説候補列挙者」の地位**: ユーザーが最終判断。複数仮説 + 根拠 + 確信度（低/中/高）形式

### 1-3. データ変換パイプライン（核心 - 従来の4層を更新）
```
[L1] Purpose            ユーザーが入力した目的
       ↓
[L2] Raw Event          Windows API 500ms 検知 (DB: events)
       ↓  🔹【Phase 2 の核心】Event マージ・時系列クラスタリング
[L2'] Activity          「ユーザーが何をしていたか」の意味単位 (DB: activities *新規追加*)
       ↓  🔹【Phase 3】Purpose との関係判定
[L3] Classified Act.    related / possibly_related / uncertain / possibly_unrelated / unrelated
       ↓  🔹【Phase 4-5】行動の意味付け + 目的からのズレ整理
[L3'] Session Analysis  「今回の行動ストーリー」と「ズレ構造」
       ↓  🔹【Phase 6】AI 複数仮説生成
[L4] Hypotheses         なぜズレたか？ 複数仮説 + 根拠 + 確信度
       ↓  🔹【Phase 7】ユーザー判断・修正
[L4'] Grounded Reason   ユーザーが確定した「本当の理由」 + 自由補足
       ↓  🔹【Phase 8】次の一手
[L5] Next Actions       次回試す具体的なアクション（AI候補 + ユーザー編集）
       ↓
[MVP完成] 1セッションの振り返りが閉じる
```

### 1-4. 今やらないことリスト（後回し確定）
| # | 項目 | 理由 | 再開予定 |
|---|---|---|---|
| ❌1 | ブラウザ拡張(extension/) との連携 | MVPから外してよい（Phase 6扱い） | V2以降 |
| ❌2 | 高度なPattern分析（過去集計ランキング） | 1セッション分析が未完成では意味が薄い | Phase 10以降 |
| ❌3 | AIによる過去3か月長期パーソナル分析 | データも目的もまだない | Phase 13以降 |
| ❌4 | UIの見た目作り込み / アニメーション | パイプライン完成が先 | MVP完成後 |
| ❌5 | 自動DBバックアップ (.bak) / integrity_check 常時実行 | 必要だが核心ではない | Phase 9以降 |
| ❌6 | モバイルアプリ / 現実世界活動トラッキング | PC完了後 | 将来フェーズ |

---

## 2. 開発フェーズ設計（Phase 0〜9: まず1セッションMVP完成 → Phase 10〜: 過去比較）

### 🔹 基本方針
- **まず1セッションを最後まで通す**。Patternは1セッション完成後。
- **AI Phase 6まで一切使わない**。Phase 6以降も「仮説候補」「Next Action候補」にとどめ、断定禁止。
- UI/見た目は最後。**Event → Activity → Purpose関係 → Analysis → Hypothesis → Reflection → Next Action** のデータと処理の流れを先に完成させる。
- TimelineのDB取得・脱線検知・サマリー・色分けなどの作り込みは、**Activity層以降**（Phase 2〜4）とセットで進める。Event羅列UIの polish だけを先行しない。

### Phase 0｜未Accept Diffを全部確定（機能開発ではない）

現在工作中のコードをリポジトリ上の正式状態にする。**新機能追加はしない。**

| 手順 | 内容 |
|---|---|
| 1 | Diffを確認（特に `tracker.rs`, `lib.rs`, `home.html`, `result.html` ほか ui） |
| 2 | コードの意図を確認 |
| 3 | Accept（確定） |
| 4 | `cargo check` |
| 5 | `cargo tauri dev` で起動確認 |

**確認観点（Phase 0 受入）**
- Eventの確定（終了時刻・duration・短時間マージ）
- Tracking 開始 / 停止と Session の連動
- Active session の復元（再起動・Home再表示）
- Result の実績時間計算
- 残存 `fetch('/api/*')` の invoke 化（上記10箇所）

### Phase 1｜自動記録を「実際に使える状態」にする

Layer 2 は実装済み寄り（500msポーリング、ウィンドウ変化、Event終了、短時間Eventマージ、OffTracker自身除外、スリープ復帰対策等）。**ここで大量の新機能は作らない。実機で壊れていないか証明する。**

**検証シナリオ（例）**

```
Session開始
  → VS Code 5分 → Chrome 3分 → Google 2分 → YouTube 5分 → VS Code 3分
Session終了
```

**期待する events（5行・順序保持）**

```
VS Code → Chrome → Google → YouTube → VS Code
```

ここが壊れると Phase 2 以降の分析はすべて無意味になる。

| Phase | 名称 | 目的 | 主な成果物 | 成功基準 |
|---|---|---|---|---|
| **Phase 0** | 未Accept Diff確定・ビルド | 現行コードを正式化・起動まで | tracker, lib, ui invoke化 | 上記 Phase 0 手順・受入観点をすべて満たす |
| **Phase 1** | 自動記録 実機検証 | Event収集が操作事実と一致 | 上記シナリオの人手実行 | events に5行正しく保存。マージ/スリープ/自ウィンドウ除外 OK |
| **Phase 2** | **Event→Activity 中間層** 🔹核心1 | 検知結果 → 「ユーザーが何をしていたか」へ変換（OffTrackerの核心の一つ） | activity.rs / classify_events_to_activities() / 002_activities.sql | 連続Eventが時系列で「プログラミング→調査→閲覧→…」Activityに集約。Timelineは **Activity表示** に切替 |
| **Phase 3** | Activity × Purpose 関係判定 | 文脈込みの善悪ではない関係性スコア付け | purpose_relate.rs 新規 / 5段階(related〜unrelated) | 目的「数学レポート」→ Word=related, Google=possibly_related, YouTube=uncertain |
| **Phase 4** | 行動の意味づけ(ストーリー化) | Raw羅列ではなく流れで「今回何をしていたか」を伝える（実機テストで「行動を把握できなかった」問題への対応） | analyze_session_story() / Timeline上部「今回の行動」欄 | 「最初にレポート作成→…→再開」など、ユーザーが「あ、こういう流れだった」と言える文章 |
| **Phase 5** | 目的とのズレ構造化整理 | 断定せず事実としてのズレ構造抽出 | deviation_analysis() / 5区分表示UI | 目的沿った/可能性あり/不明/外れた可能性 の4区分時間集計 |
| **Phase 6** | **AI 複数仮説生成** 🔹核心2 | 「なぜズレたか」の仮説を複数（断定しない） | ai_hypothesis.rs。**入力は Raw Event ではなく** 目的 + Activity + 目的との関係 + 結果 | 仮説+根拠+確信度が3件以上。UIは「可能性」として表示 |
| **Phase 7** | ユーザー 仮説判定・修正 | AIは候補、ユーザーが最終判断 | reflection.html仮説評価UI（当てはまる/少し違う/違う+自由入力） | grounded_reason + 自由補足 が reflections に保存 |
| **Phase 8** | Next Actions 次の行動決定 | 次回試す具体的アクション | AI候補3件提示 + ユーザー編集 / 003_next_actions.sql | 「10分調べて分からなければ質問文作る」等が next_actions に保存 |
| **Phase 9** | 1セッションMVP完成 | 目的設定→自動記録→振り返り→次行動 まで1周 | 全画面結合テスト・致命的バグ修正 | 1回のリアルセッションが無事最後まで完了する |
|---|---|---|---|---|
| **Phase 10** | 過去セッション 一覧比較 | 前回↔今回比較 | pattern.html 前回比較UI / get_sessions_for_compare() | 2回分の結果・理由・Next Actionsが並んで表示 |
| **Phase 11** | 原因→対策→結果 追跡 | 因果線を可視化（「YouTube何分」ランキングより OffTracker らしい） | JOINクエリ / 改善可否判定UI | 例: 原因「調査長引き」→ 対策「10分区切り」→ 次回「改善」が追える |
| **Phase 12** | Pattern分析 アプリ/曜日/時間 | 脱線の構造分析 | pattern_aggregate() / 3種グラフ | 脱線アプリTOP / 曜日別 / 理由頻出度（UI骨格はあるが中身未実装） |
| **Phase 13** | AI長期分析 仮説 | 5回以上から傾向仮説（断定禁止） | ai_long_term_pattern.rs | 「月曜午後は脱線多い傾向」仮説 + 確信度 表示 |

### 開発ロードマップ（一覧）

```
【現在】 Tauri / SQLite / Session / Event収集（実機検証前）
              ↓
━━━━━━━━ Phase 0: 未Accept Diff整理
━━━━━━━━ Phase 1: 自動記録の実機確認
              ↓
         Phase 2: Event → Activity
              ↓
         Phase 3: Activity ↔ Purpose 関係
              ↓
         Phase 4: 行動の意味づけ（ストーリー）
              ↓
         Phase 5: 目的とのズレ整理
              ↓
         Phase 6: AI 仮説（Raw Event は渡さない）
              ↓
         Phase 7: ユーザーが仮説を確認・修正
              ↓
         Phase 8: Next Action
━━━━━━━━ 【MVP = Phase 9】 1セッション振り返り一周
              ↓
         Phase 10: 過去セッション比較
              ↓
         Phase 11: 原因→対策→結果
              ↓
         Phase 12: Pattern分析
              ↓
         Phase 13: AI 長期分析
━━━━━━━━ 【将来】 PC → スマホ → 現実世界の活動
```

### Cursor への次指示（この順序を守る）

1. **今すぐ**: Phase 0（Diff確定・invoke整理・`cargo check` / `cargo tauri dev`・上記4観点の確認）
2. **続けて**: Phase 1（実機シナリオで events が正しいか）
3. **その後に初めて**: 「現在の Event データを Activity に変換する設計と実装を始める」（Phase 2）

**やらない**: 「Timelineを完成させて」だけをゴールにした UI 作り込み。

---

## 3. データモデル（2026-10-02更新: Activity / Next Actions / Reflections拡張）

### 2-1. SQLite スキーマ
```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS schema_versions (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- L1 Purpose: セッション基本情報
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  purpose TEXT NOT NULL,
  target_time_minutes INTEGER,
  start_time TEXT NOT NULL,
  end_time TEXT,
  status TEXT NOT NULL CHECK (status IN ('active','completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_start ON sessions(start_time);

-- L2 Event: Windows APIで500ms毎に検出される粒度 (現行保存済み)
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  source TEXT NOT NULL CHECK (source IN ('native','browser')),
  application TEXT NOT NULL,
  application_display TEXT,
  service TEXT,
  window_title TEXT,
  process_id INTEGER,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_start_time ON events(start_time);

-- L2' Activity: Phase 2で新規追加 意味単位 (migration 002_activities.sql)
-- CREATE TABLE activities (...)
--   id TEXT PK, session_id, start_time, end_time,
--   duration_seconds,
--   activity_type TEXT CHECK (activity_type IN (
--     'programming','writing','reading','research','video','communication','idle','other'
--   )),
--   label TEXT,  -- 人間向けラベル 「プログラミング」「検索調査」等
--   applications_used TEXT, -- JSON: 含まれるapplication配列
--   event_ids TEXT,         -- JSON: 元となるevent id配列
--   FOREIGN KEY (session_id) ...

-- 結果入力（5段階達成度）
CREATE TABLE results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  result_level TEXT NOT NULL CHECK (result_level IN (
    'completed','mostly_completed','partially_completed','minimal','not_completed'
  )),
  result_description TEXT NOT NULL,
  actual_duration_minutes INTEGER NOT NULL,
  what_wasnt_done TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- L4 Reflection + Grounded Reason (Phase 7で拡張予定 / カラムは既存で足りるか要検討)
CREATE TABLE reflections (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  deviation_reason TEXT NOT NULL,                -- カンマ区切り reason ID
  reflection_details TEXT,                       -- 自由記述
  -- Phase 7追加:
  -- grounded_hypothesis_id TEXT,   -- ユーザーが「一番当てはまる」とした仮説ID
  -- hypothesis_evaluations TEXT,   -- JSON 各仮説の適合度(0/1/2)
  -- user_grounded_reason TEXT,     -- ユーザーが書いた本当の理由
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- L5 Next Actions (Phase 8追加: migration 003_next_actions.sql)
-- CREATE TABLE next_actions (...)
--   id TEXT PK, session_id, action_text, source_type ('ai_suggested'/'user_written'),
--   selected BOOLEAN, order_num INTEGER, created_at
```

---

## 4. Tauri コマンド (現行11個 + Phase 2以降拡張予定)
現行実装済み（`desktop/src-tauri/src/lib.rs`）
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

今後追加するコマンド（Phase順）：
- Phase 2: `analyze_activities(session_id) -> Vec<Activity>`
- Phase 3: `classify_activity_purpose(session_id) -> Vec<ClassifiedActivity>`
- Phase 4: `analyze_session_story(session_id) -> SessionStory`
- Phase 5: `analyze_deviation(session_id) -> DeviationSummary`
- Phase 6: `generate_hypotheses(session_id, opts) -> Vec<Hypothesis>`
- Phase 7: `save_grounded_reflection(session_id, evaluations, user_text)`
- Phase 8: `generate_next_actions(session_id) -> Vec<Action>` / `save_next_actions(...)`
- Phase 10〜: `get_sessions_for_compare(ids), aggregate_patterns(filters)`

---

## 5. リスクと対策（v2更新）
| リスク | 対策 |
|---|---|
| Event収集ロジックのバグ → 全分析が無意味 | Phase 1で人手によるシナリオ検証を絶対に行う |
| AIが断定的な表現を出す | プロンプトで厳格制御、UI側でも全て「可能性」表示に上書き、仮説は3種以上出す |
| Activity分類の精度不足 | ルールベース → ユーザー編集可能とし、学習データ化 |
| Rustコンパイル時間・Sandbox権限問題 | ユーザーローカル環境で cargo check 実施、Trae Sandbox でコード構文チェックは最低限 |
| データベースファイル破損 | Phase 9以降でintegrity_check + バックアップ定期実行 |

---

## 6. MVP受入基準 (1セッション完成 = Phase 9)
ユーザーが一回、リアルに作業して以下全部が不自由なく出来ること：
1. 目的入力 → 開始 → 作業する → 停止 が問題なく動く
2. 目的達成度5段階 + できたこと/できなかったこと が保存できる
3. Timeline画面で Activity単位にまとまった行動が表示され、生のEvent羅列ではないこと
4. 目的との関係が 5段階評価で表示される（YouTube=悪 の固定表示になっていない）
5. 「今回の行動」の文章で流れが理解できる
6. AIから3件以上の「なぜズレたか」仮説 + 根拠 + 確信度 が表示される
7. 仮説を「当てはまる/少し違う/違う」評価 + 自由修正 して保存できる
8. 次回の具体的アクション候補3件 + ユーザー編集 で保存できる
9. 次回セッション開始時、前回のNext Actions がHome画面に表示される
10. 全てのUIテキストに自己否定・断定がない（人間の目で目視）
11. 3時間の長時間セッションで、Eventの欠落や重複がない
12. スリープ→復帰してもアプリが落ちず、データがおかしくない

---

## 7. 直近の実行タスク

### Phase 0（最優先・機能追加なし）

**Step 0-1：現在の変更内容を確認する**
まず、現在の変更内容を調べます。
確認対象は次のとおりです。
- `desktop/src-tauri/src/lib.rs`：Tauriコマンドと記録処理の連携
- `desktop/ui/index.html`：Home画面
- `desktop/ui/result.html`：Result画面
- `desktop/ui/timeline.html`：Timeline画面
- `desktop/ui/reflection.html`：Reflection画面
- `desktop/ui/pattern.html`：Pattern画面

特に、未AcceptのDiffが現在も残っているかを確認します。
未Acceptの変更をすべて無条件にAcceptするのではなく、変更内容を確認してから確定してください。
また、作業前に現在の変更をGitで保存しておくと、問題が起きた際に戻しやすくなります。

**Step 0-2：`fetch('/api/...')` を整理する**
5つのHTMLファイルに合計15箇所のAPI呼び出しが残っています。
Tauri版では、原則として次の経路に統一します。
```
HTML / JavaScript
        ↓
Tauri invoke()
        ↓
Rust Command
        ↓
Storage
        ↓
SQLite
```
ただし、単純に文字列を置換するだけでは不十分です。
例えば、JavaScript側の呼び出しを`invoke("get_session")`に変更する場合、Rust側のコマンド名、引数、戻り値の形式も一致している必要があります。

**完了条件**
- 15箇所の呼び出しを調査・整理した
- 必要なTauriコマンドが存在する
- JavaScriptとRustの引数・戻り値が一致している
- 不要になった旧APIへの依存が残っていない
- 各画面でデータの取得・保存が動作する

**Step 0-3：ビルドと起動を確認する**
変更後は、まずプロジェクトのRust側でコンパイルを確認します。
```bash
cd desktop/src-tauri
cargo check
```
その後、プロジェクトの設定に従ってTauriアプリを起動します。
```bash
cargo tauri dev
```
コマンドが成功しただけでは完了ではありません。HomeからSessionを開始し、終了し、Resultを保存するところまで確認します。

1. 未Accept Diffを一覧し、意図を確認して Accept
2. `lib.rs` — Event確定、Tracking開始停止、Session連動
3. `home.html` / `result.html` — invoke化、Active復元、実績時間
4. 残り ui — `timeline.html`, `reflection.html`, `pattern.html` の fetch 15箇所を invoke 化
5. ローカルで `cargo check` → `cargo tauri dev`

### Phase 1（Phase 0 完了後のみ）
6. 実機シナリオ（VS Code / Chrome / Google / YouTube / VS Code）を実行し、SQLite の events を目視・クエリで検証

### Phase 2（Phase 1 成功後のみ・本格的な次開発）
7. Event → Activity: `activity.rs`, `002_activities.sql`, `analyze_activities` コマンド、Timeline を Activity ベース表示へ
