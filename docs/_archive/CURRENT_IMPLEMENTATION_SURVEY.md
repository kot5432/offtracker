# OffTracker 現在の実装調査報告

## 1. Home → Session → Timeline → Result → Reflection → Pattern の現在のデータフロー

### 現在のフロー
```
Home画面
  ↓ (目的入力 → 作業を開始)
Session開始 (server-improved.js: startSession)
  - Sessionオブジェクト作成（id, purpose, target_time_minutes, start_time, status: 'active'）
  - current-session.jsonに保存
  - tracker.startTracking(1000) 実行
  ↓
バックグラウンド追跡 (tracker-improved.js)
  - 1秒ごとactive-winで現在のウィンドウを取得
  - ウィンドウが変わったらfinalizeCurrentEvent()でイベント作成
  - events.jsonに保存
  ↓
Home画面 (記録中)
  - リアルタイムで現在のアプリを表示
  - [記録を見る] でTimeline画面へ
  ↓
Timeline画面
  - events.jsonからイベントを読み込み
  - Timelineに描画
  - [記録を終了] でResult画面へ
  ↓
Session終了 (server-improved.js: stopSession)
  - currentSessionにend_time, status: 'completed', actual_duration_minutesを追加
  - current-session.jsonを更新
  - tracker.stopTracking() 実行
  ↓
Result画面
  - localStorageからsessionデータを取得
  - Result入力（達成度、できたこと、できなかったこと）
  - POST /api/session/result でresults.jsonに保存
  - session_id付きで保存
  ↓
Reflection画面
  - localStorageからsessionデータを取得
  - Reflection入力（原因、自由入力）
  - POST /api/reflection でreflections.jsonに保存
  - session_id付きで保存
  ↓
Pattern画面
  - localStorageからsessionデータを取得
  - events.jsonからイベントを読み込み
  - セッションサマリーを表示
  - パターン分析（未実装）
```

## 2. session_idが各データにどのように紐付いているか

### 実装状況
- **Session**: idは生成されるが、session_idフィールドはない
- **Event**: **session_idが設定されていない**（tracker-improved.jsでsession_idを設定していない）
- **Result**: session_idは設定されている（server-improved.js: saveResult）
- **Reflection**: session_idは設定されている（server-improved.js: saveReflection）

### 問題点
- Eventにsession_idが設定されていないため、どのセッションのイベントか不明
- 現在の実装ではイベントはグローバルに保存され、セッションとの紐付けがされていない

## 3. 現在取得できるEventの情報

### 取得できる情報（tracker-improved.js）
```javascript
{
  id: uuidv4(),
  start_time: ISO timestamp,
  end_time: ISO timestamp,
  source: 'native',
  application: app name (e.g., "VS Code", "Chrome"),
  service: web service (e.g., "Google", "YouTube") or null,
  window_title: window title,
  process_id: process id,
  duration_seconds: duration
}
```

### 取得できない情報
- session_id（現在設定されていない）
- created_at（現在実装されていない）

### サービス検出（detectService）
- Chrome, Edge, Firefoxの場合のみ検出
- 検出対象: YouTube, GitHub, Google, Stack Overflow, Reddit, X, Discord

## 4. Resultで保存される情報

### 保存される情報（server-improved.js: saveResult）
```javascript
{
  id: uuidv4(),
  session_id: sessionId,
  result_level: resultLevel,
  result_description: resultDescription,
  what_wasnt_done: whatWasntDone || null,
  actual_duration_minutes: getElapsedTime().elapsed_minutes,
  created_at: new Date().toISOString()
}
```

### 問題点
- actual_duration_minutesはgetElapsedTime()から取得（常に現在経過時間）
- session終了時のactual_duration_minutesではなく、その時点での経過時間

## 5. Reflectionで保存される情報

### 保存される情報（server-improved.js: saveReflection）
```javascript
{
  id: uuidv4(),
  session_id: sessionId,
  deviation_reason: deviationReason,
  reflection_details: reflectionDetails,
  created_at: new Date().toISOString()
}
```

### 正常に保存される情報
- session_idは正しく設定されている
- deviation_reason（複数選択、カンマ区切り）
- reflection_details（自由入力）

## 6. Pattern画面で現在表示できる情報

### 現在表示できる情報
- セッションサマリー（目的、結果、原因、時間）
- 単一セッションのイベント数
- 静的なパターン表示（ハードコード）

### 表示できない情報
- 過去のセッション一覧（results.json、reflections.jsonを読み込んでいない）
- 複数セッションのパターン分析
- 実際の原因傾向分析
- 時系列でのパターン検出

## 7. 現在のデータだけでは「なぜできなかったのか」を理解するのに足りない情報

### 足りない情報

#### データ構造の問題
1. **EventとSessionの紐付けがない**
   - 現在: イベントにsession_idが設定されていない
   - 必要: 各イベントにsession_idを設定する

2. **過去のセッションがない**
   - 現在: 現在のセッション1つだけ
   - 必要: results.json、reflections.jsonから過去のセッションを読み込む

3. **パターン分析がない**
   - 現在: 静的な表示のみ
   - 必要: ル�ールベースのパターン検出

#### 内容の問題
4. **「目的 → 行動 → 結果 → 振り返り」が1つのSessionとして完結していない**
   - 現在: 4つの別々のJSONファイル
   - 必要: 1つのSessionオブジェクトにまとめる

5. **実際のアプリ遷移が見えない**
   - 現在: タイムラインは表示されるが、アプリ遷移のパターンは分析されていない
   - 必要: 「A → B → C」のような遷移パターンの検出

6. **繰り返しの検出がない**
   - 現在: 複数セッションを比較できない
   - 必要: 同じ原因の頻度を集計

7. **時系列分析がない**
   - 現在: 時系列での変化を表示していない
   - 必要: 日時別の傾向を表示

8. **検証データがない**
   - 現在: 実際に6つのパターンで使用したデータがない
   - 必要: Phase 7.5で実際に使用して検証

## 8. Phase 7.5の検証を行うために必要な変更

### 最小限の変更（コード変更あり）

#### 必須
1. **Eventにsession_idを設定する**
   - tracker-improved.jsでfinalizeCurrentEvent()の後にsession_idを設定
   - または、session開始時にsession_idを保存し、イベント作成時に読み込む

2. **過去のセッションを表示する**
   - Pattern画面でresults.json、reflections.jsonを読み込む
   - 過去のセッション一覧を表示

#### 推奨
3. **1つのSessionとして完結する**
   - セッション終了時にSessionオブジェクトにevents, result, reflectionを含めて保存
   - SQLite化前に簡易的なJSON構造で実装

4. **ルールベースのパターン検出**
   - 同じ原因の頻度を集計
   - 「難しかった」→2回、「脱線」→3回、などの表示

### 変更不要
- UIの文言改善（完了済み）
- ボタンのスタイル改善（完了済み）
- 説明文の追加（完了済み）

## まとめ

### 現在できていること
- ✅ Windows APIによるアプリ取得
- ✅ イベントベース追跡（1秒間隔）
- ✅ サービス検出（Google, YouTube, GitHub等）
- ✅ 基本的なセッションフロー（Home → 記録中 → 終了 → Result → Reflection → Pattern）
- ✅ UIとAPIの統合
- ✅ localStorageによる画面遷移
- ✅ 初心者でも使いやすい文言
- ✅ ボタンの視覚的な改善

### 不足していること
- ❌ Eventにsession_idが設定されていない
- ❌ 過去のセッション一覧がない
- ❌ パターン分析が実装されていない
- ❌ 「目的 → 行動 → 結果 → 振り返り」が1つのSessionとして完結していない
- ❌ 実際のアプリ遷移パターンが見えない
- ❌ 繰り返しの検出がない
- ❌ 時系列分析がない
- ❌ 実際に使用したデータがない

### Phase 7.5で確認すべきこと

#### 前提条件（最小限の変更が必要）
1. Eventにsession_idを設定する
2. 過去のセッション一覧を表示する

#### 検証すべきこと
1. **行動を正しく記録できたか**
   - ウィンドウ切り替えが検知されているか
   - タイムスタンプが正確か
   - アプリ名が正確か

2. **目的と行動を結びつけられたか**
   - セッションが目的と紐付いているか
   - イベントがセッションに紐付いているか（session_id設定後）

3. **結果を記録できたか**
   - 達成度を選択できたか
   - できたことを記録できたか

4. **なぜできなかったかを振り返れたか**
   - 原因を選択できたか
   - 自由入力で補足できたか

5. **Timelineを見ることで振り返りに役立ったか**
   - 行動の流れが視覚化されているか
   - どこで離脱したかが分かるか

6. **過去データから繰り返しが見えたか**
   - 複数セッションを比較できるか（session_id設定後）
   - パターンが検出できるか（ルールベース実装後）

### 優優先度の提案

#### 選択肢A: 最小限の変更をしてPhase 7.5を実施
1. Eventにsession_idを設定（1ファイル変更）
2. 過去のセッション一覧を表示（1ファイル変更）
3. Phase 7.5を実施

#### 選択肢B: 現在のままPhase 7.5を実施
- 現在の実装のまま6つのパターンで使用
- 問題点を認識しつがら検証

#### 選択肢C: Phase 8（SQLite + Session基盤）に進む
- session_idの紐付けはSQLite化と同時に解決
- 1つのSessionとして完結はSQLite化と同時に解決

### 推奨
**選択肢A**: 最小限の変更をしてPhase 7.5を実施

理由:
- Eventにsession_idを設定しないと、セッションごとの比較ができない
- 過去のセッション一覧がないと、パターン検証ができない
- 変更は最小限（tracker-improved.jsとpattern.htmlの2ファイルのみ）
- これで「なぜできなかったか」を理解するのに必要な最小限のデータ構造が整う