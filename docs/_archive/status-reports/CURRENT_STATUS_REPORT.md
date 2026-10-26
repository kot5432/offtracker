# OffTracker 現在の状況詳細レポート

## 📊 プロジェクト概要

OffTrackerはPCの行動トラッキングと振り返り支援ツールです。現在、**Tauri 2.x (Rust)** が正式採用されています。

---

## 🏗️ アーキテクチャ状況

### 2つのバージョンが存在

#### 1. Tauri版（メイン・正式採用）
- **場所**: `desktop/src-tauri/`
- **技術**: Rust + Tauri 2.x + SQLite
- **ステータス**: 開発中
- **データベース**: SQLite（`offtracker.db`）
- **アーキテクチャ**: `HTML/JS → Tauri invoke() → Rust Command → Storage → SQLite`

#### 2. Electron版（Legacy・削除予定）
- **場所**: `desktop/_legacy_electron/`
- **技術**: Node.js + JavaScript
- **ステータス**: Phase 2-4実装完了、MVP時削除予定
- **データ保存**: JSONファイル（`activities.json`, `events.json`, `reflections.json`等）
- **用途**: Tauri版への移植参考

---

## 📈 機能領域ごとの進捗（MASTER_DEVELOPMENT_PLAN.mdより）

| 領域 | 進捗 | 補足 |
|---|---|---|
| 目的設定 | █████████░ 約90% | Session開始・目的入力・Homeフローは概ね動く |
| データ収集 | ██████░░░░ 約60% | Layer2（500msポーリング等）はコード上かなり進んでいる。実機で事実一致の検証が未完了 |
| 行動理解 | █░░░░░░░░░ 約10% | Timelineは **Event表示段階**。Activity層・意味づけ・目的との関係は未着手 |
| 振り返り | ░░░░░░░░░░ 約5% | Reflection/Resultの骨格のみ。AI仮説・Grounded Reason・Next Actionは Phase 6〜8 |

---

## ✅ 完了した実装

### Tauri版（メイン）

#### データモデルとストレージ
- ✅ SQLiteデータベースマイグレーション（`001_initial.sql`）
- ✅ データモデル（Session, Event, Result, Reflection）
- ✅ ストレージレイヤー（`storage.rs`）
- ✅ Tauriコマンド（11個実装済み）
  - Session CRUD: `start_session`, `stop_session`, `get_current_session`, `get_session`, `get_recent_sessions`
  - Activity/Event: `get_current_window`, `get_current_activity`, `get_events_for_session`
  - Result/Reflection: `save_result`, `save_reflection`

#### UI画面
- ✅ Home画面（`desktop/ui/index.html`）
- ✅ Result画面（`desktop/ui/result.html`）
- ✅ Timeline画面（`desktop/ui/timeline.html`）
- ✅ Reflection画面（`desktop/ui/reflection.html`）
- ✅ Pattern画面（`desktop/ui/pattern.html`）

### Electron版（Legacy・参考用）

#### Phase 2: Activityの目的との関係分析
- ✅ 目的分析ロジック（`purpose-analyzer.js`）
- ✅ Activity生成時の目的との関係分析
- ✅ **Timeline画面の表示改善**（purpose_relationに基づく可視化）
  - カラーコーディング（5つのカテゴリ）
  - 凡例の更新
  - サマリーに各カテゴリの時間統計
  - フィルター機能

#### Phase 3: セッション要約生成
- ✅ セッション要約生成ロジック（`session-summarizer.js`）
- ✅ Reflection画面への要約表示

#### Phase 4: Reflection画面の拡張
- ✅ 仮説生成ロジック（`hypothesis-generator.js`）
- ✅ 次回行動候補生成ロジック（`next-action-generator.js`）
- ✅ Reflection画面の大幅拡張
  - セッション要約表示
  - 仮説表示（同意/修正/否定的ができる）
  - 次回行動選択・編集
- ✅ サーバーAPIエンドポイント
  - `/api/session/analyze`
  - `/api/session/hypotheses`
  - `/api/session/next-actions`
  - `/api/reflection`（更新）

---

## ⚠️ 未完了の課題

### Phase 0: 未Accept Diffの確定
**内容**: 現在工作中のコードをリポジトリ上の正式状態にする

**未完了項目**:
- `desktop/ui/` に `fetch('/api/*')` が **15箇所** 残存
  - `home.html`: 3箇所
  - `result.html`: 3箇所
  - `timeline.html`: 4箇所
  - `reflection.html`: 4箇所
  - `pattern.html`: 1箇所

**必要な作業**:
- `fetch('/api/*')` を Tauri invoke に変更
- `cargo check` でコンパイル確認
- `cargo tauri dev` で起動確認

### Phase 1: 自動記録の実機検証
**内容**: Event収集が操作事実と一致することを確認

**検証シナリオ**:
```
Session開始
  → VS Code 5分 → Chrome 3分 → Google 2分 → YouTube 5分 → VS Code 3分
Session終了
```

**期待する結果**: events に5行正しく保存される

### Phase 2-8: データパイプラインの実装
- Phase 2: Event → Activity 中間層
- Phase 3: Activity × Purpose 関係判定
- Phase 4: 行動の意味づけ（ストーリー化）
- Phase 5: 目的とのズレ構造化整理
- Phase 6: AI 複数仮説生成
- Phase 7: ユーザー仮説判定・修正
- Phase 8: Next Actions 次の行動決定

---

## 📁 ファイル構造

```
offtracker/
├── desktop/
│   ├── src-tauri/              # Tauri版（メイン）
│   │   ├── src/
│   │   │   ├── lib.rs          # Tauriコマンド実装（11個）
│   │   │   ├── models/         # データモデル
│   │   │   ├── storage.rs      # SQLiteストレージ
│   │   │   └── window.rs       # ウィンドウ検出
│   │   ├── db/
│   │   │   └── migrations/
│   │   │       └── 001_initial.sql
│   │   └── tauri.conf.json
│   ├── ui/                     # 共通UI画面
│   │   ├── index.html          # Home画面
│   │   ├── timeline.html       # Timeline画面
│   │   ├── result.html         # Result画面
│   │   ├── reflection.html     # Reflection画面
│   │   └── pattern.html        # Pattern画面
│   ├── src/                    # Phase 2-4ロジック（Electron版用）
│   │   ├── purpose-analyzer.js
│   │   ├── session-summarizer.js
│   │   ├── hypothesis-generator.js
│   │   ├── next-action-generator.js
│   │   ├── data-manager.js
│   │   └── supabase-client.js
│   └── _legacy_electron/       # Electron版（Legacy・削除予定）
│       ├── server-improved.js  # サーバーAPI
│       ├── tracker-improved.js # トラッカー
│       ├── src/
│       │   ├── activity-generator.js
│       │   ├── data-manager.js
│       │   └── event-collector.js
│       └── *.json              # データファイル
├── docs/
│   ├── _archive/               # アーカイブされたドキュメント
│   └── ...
├── MASTER_DEVELOPMENT_PLAN.md  # マスター開発計画
├── PHASE_2_4_PLAN.md          # Phase 2-4計画
└── README.md
```

---

## 🎯 データ変換パイプライン（MASTER_DEVELOPMENT_PLAN.mdより）

```
[L1] Purpose            ユーザーが入力した目的
       ↓
[L2] Raw Event          Windows API 500ms 検知 (DB: events) ✅
       ↓  🔹【Phase 2 の核心】Event マージ・時系列クラスタリング
[L2'] Activity          「ユーザーが何をしていたか」の意味単位 (DB: activities) ❌
       ↓  🔹【Phase 3】Purpose との関係判定
[L3] Classified Act.    related / possibly_related / uncertain / possibly_unrelated / unrelated ❌
       ↓  🔹【Phase 4-5】行動の意味付け + 目的からのズレ整理
[L3'] Session Analysis  「今回の行動ストーリー」と「ズレ構造」 ❌
       ↓  🔹【Phase 6】AI 複数仮説生成
[L4] Hypotheses         なぜズレたか？ 複数仮説 + 根拠 + 確信度 ❌
       ↓  🔹【Phase 7】ユーザー判断・修正
[L4'] Grounded Reason   ユーザーが確定した「本当の理由」 + 自由補足 ❌
       ↓  🔹【Phase 8】次の一手
[L5] Next Actions       次回試す具体的なアクション（AI候補 + ユーザー編集） ❌
       ↓
[MVP完成] 1セッションの振り返りが閉じる
```

**凡例**:
- ✅ 実装済み（Tauri版）
- ❌ 未実装
- ⚠️ Electron版には実装済みだがTauri版には未実装

---

## 🔄 開発ロードマップ

```
【現在】 Tauri / SQLite / Session / Event収集（実機検証前）
              ↓
━━━━━━━━ Phase 0: 未Accept Diff整理 ⏸️ 未着手
━━━━━━━━ Phase 1: 自動記録の実機確認 ⏸️ 未着手
              ↓
         Phase 2: Event → Activity ⏸️ 未着手
              ↓
         Phase 3: Activity ↔ Purpose 関係 ⏸️ 未着手
              ↓
         Phase 4: 行動の意味づけ（ストーリー） ⏸️ 未着手
              ↓
         Phase 5: 目的とのズレ整理 ⏸️ 未着手
              ↓
         Phase 6: AI 仮説 ⏸️ 未着手
              ↓
         Phase 7: ユーザーが仮説を確認・修正 ⏸️ 未着手
              ↓
         Phase 8: Next Action ⏸️ 未着手
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

---

## 📝 直近の実行タスク（MASTER_DEVELOPMENT_PLAN.mdより）

### Phase 0（最優先・機能追加なし）
1. 未Accept Diffを一覧し、意図を確認して Accept
2. `tracker.rs` / `lib.rs` — Event確定、Tracking開始停止、Session連動
3. `home.html` / `result.html` — invoke化、Active復元、実績時間
4. 残り ui — `timeline.html`, `reflection.html`, `pattern.html` の fetch 15箇所を invoke 化
5. ローカルで `cargo check` → `cargo tauri dev`

### Phase 1（Phase 0 完了後のみ）
6. 実機シナリオ（VS Code / Chrome / Google / YouTube / VS Code）を実行し、SQLite の events を目視・クエリで検証

### Phase 2（Phase 1 成功後のみ・本格的な次開発）
7. Event → Activity: `activity.rs`, `002_activities.sql`, `analyze_activities` コマンド、Timeline を Activity ベース表示へ

---

## 🎬 MVP受入基準（Phase 9完了時）

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

## 💡 次に進めるべきこと

### 推奨アプローチ: Phase 0 から順に進める

1. **Phase 0**: 未Accept Diffを確定
   - `fetch('/api/*')` を Tauri invoke に変更（15箇所）
   - `cargo check` でコンパイル確認
   - `cargo tauri dev` で起動確認

2. **Phase 1**: 自動記録の実機検証
   - 実機シナリオを実行
   - SQLiteのeventsを確認

3. **Phase 2-8**: 各フェーズを実装
   - Electron版の実装を参考にTauri/Rustに移植

### 別のアプローチ

- まずElectron版をテストして機能確認
- 直ちにTauri版にPhase 2-4を移植
- その他

---

## 📊 Git状況

- ブランチ: `main`
- 最新コミット: `6f0346a` - Tauri版の実装とドキュメント整理を追加
- origin/mainと同期済み

---

## 🎓 まとめ

**現在の状況**:
- Tauri版の基盤（データモデル、ストレージ、UI画面）は実装済み
- Electron版にPhase 2-4の完全な実装がある（参考用）
- Phase 0（fetch→invoke化）とPhase 1（実機検証）が未完了

**次のステップ**:
- MASTER_DEVELOPMENT_PLAN.md に従って、Phase 0から順に進めることが推奨されます
- まずは `fetch('/api/*')` を Tauri invoke に変更することから始めます

**重要な点**:
- Electron版は最終的に削除予定
- Phase 2-4の実装はElectron版にあるため、Tauri版への移植の参考になります
- UIの見た目作り込みよりも、データパイプラインの完成を優先すべきです
