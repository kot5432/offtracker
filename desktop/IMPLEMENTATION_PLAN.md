# OffTracker 実装計画 - 製品再設計版

## 現在の状況

### ✅ 完了
- HTTPサーバーによるWindows APIアクセス（active-win）
- 基本的なウィンドウ追跡機能
- シンプルなWeb UI
- JSONデータ保存

### 🔄 実装中
- 目的設定UIのHTML作成（完了）
- セッション管理機能（未実装）
- 結果記録機能（未実装）

### ❌ 未実装
- セッション管理ロジック
- 統一Timeline表示
- 振り返り機能
- SQLiteデータベース統合

## 実装計画

### Phase 3: 目的設定UIの実装（現在進行中）

**ファイル変更:**
- `desktop-test.html` - ✅ UI作成完了
- `renderer-simple.js` - 目的設定ロジック追加
- `simple-server.js` - セッション管理API追加

**追加機能:**
1. 目的入力フォームの制御
2. セッション開始機能
3. 目的データの保存と読み込み

### Phase 4: セッション管理機能

**必要なAPI:**
- `POST /api/session/start` - セッション開始
- `POST /api/session/stop` - セッション終了
- `GET /api/session/current` - 現在のセッション情報
- `GET /api/session/elapsed` - 経過時間

**データ構造:**
```json
{
  "id": "session-123",
  "purpose": "Webアプリのログイン機能を実装する",
  "target_time_minutes": 180,
  "start_time": "2026-09-18T18:00:00Z",
  "status": "active"
}
```

### Phase 5: 統一Timelineの実装

**必要な機能:**
1. アプリ切り替えイベントの検出
2. イベントの順序保存
3. ガントチャート形式の表示
4. 時間軸の可視化

**Timeline表示:**
```
18:00  VS Code ─────────────── 35分
       │
18:35  Google ── 4分
       │
18:39  YouTube ─────────────── 22分
       │
19:01  Discord ── 8分
       │
19:09  VS Code ─────────────── 45分
```

### Phase 6: 結果記録機能

**必要なAPI:**
- `POST /api/session/result` - 結果保存
- `GET /api/session/history` - 過去のセッション一覧

**データ構造:**
```json
{
  "session_id": "session-123",
  "result_level": "partially_completed",
  "result_description": "ログイン画面のUIを完成させた",
  "actual_duration_minutes": 114
}
```

## 実装順序

### 即時実行（次のステップ）
1. `renderer-simple.js` に目的設定ロジック追加
2. `simple-server.js` にセッション管理API追加
3. セッション開始/終了機能の実装
4. 経過時間のリアルタイム表示

### 短期目標（今日中）
1. 目的設定UIの完全実装
2. セッション管理機能の実装
3. 結果記録機能の実装
4. 基本的な動作確認

### 中期目標（今週）
1. SQLiteデータベース統合
2. イベント検出の改善
3. Timeline表示の実装
4. データ永続化

## 技術的変更点

### データ保存の改善
- 現在: JSONファイル（window-data.json）
- 改善: SQLiteデータベース（sessions, events, results）

### APIの拡張
- 現在: `/api/window`, `/api/data`
- 追加: `/api/session/*`, `/api/events/*`, `/api/results/*`

### UIの改善
- 現在: シンプルなテストUI
- 改善: 目的設定、セッション管理、結果記録の統合UI

## 成功基準

### Phase 3-6完了時
- ✅ 目的を設定してセッションを開始できる
- ✅ 経過時間がリアルタイムで表示される
- ✅ セッションを終了して結果を記録できる
- ✅ 基本的なウィンドウ追跡が機能する

### 最終目標
- ✅ 目的 → 行動 → 結果のループが完成
- ✅ データが永続的に保存される
- ✅ Timelineで行動の流れが可視化される