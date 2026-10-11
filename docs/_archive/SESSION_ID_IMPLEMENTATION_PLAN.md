# Eventにsession_idを追加する計画（修正版）

## 概要
OffTrackerで各Eventを現在のSessionに正しく紐付けるために、Eventにsession_idを追加する。

## 現在のデータフロー調査結果

### Session IDの生成場所
- **ファイル**: `server-improved.js`
- **関数**: `startSession(purpose, targetTimeMinutes)`
- **行**: 20
- **コード**: `id: uuidv4()`
- **保存**: `current-session.json`に保存

### Eventの生成場所
- **ファイル**: `tracker-improved.js`
- **関数**: `finalizeCurrentEvent()`
- **行**: 65
- **コード**: `const event = windowToEventData(lastWindow, 'native')`
- **保存**: `events.json`に保存

### stopTracking()の最後のEvent確定処理
- **ファイル**: `tracker-improved.js`
- **関数**: `stopTracking()`
- **行**: 162
- **コード**: `const event = finalizeCurrentEvent();`
- **確認**: stopTracking()内で最後のEventをfinalizeしている

### 現在の問題
- tracker-improved.jsはsession_idを知らない
- server-improved.jsからtracker-improved.jsにsession_idを渡していない
- finalizeCurrentEvent()で作成されたeventにsession_idがない

## 実装方法

### 方案A: Trackerにsession_idを渡す
1. **tracker-improved.js**にsession_idを保存する変数を追加
2. **server-improved.js**のstartSession()でtrackerにsession_idを渡す
3. **finalizeCurrentEvent()**でsession_idをeventに追加

**変更が必要なファイル**:
- `tracker-improved.js`: session_id変数、setSessionId()関数、finalizeCurrentEvent()修正
- `server-improved.js`: startSession()でtracker.setSessionId()を呼ぶ

**既存機能への影響**:
- 低。既存の追跡機能は変更なし
- session_idが設定されていない場合の後方互換性が必要

### 推奨: 方案A
- シンプルで直接的
- ファイルI/Oが増えない
- tracker-improved.jsとserver-improved.jsの依存関係が明確

## 実装ステップ

### Step 1: tracker-improved.jsにsession_id変数を追加
```javascript
// Tracking state
let lastWindow = null;
let currentEventStart = null;
let pollingInterval = null;
let currentSessionId = null; // 追加
```

### Step 2: setSessionId()関数を追加
```javascript
function setSessionId(sessionId) {
  currentSessionId = sessionId;
  console.log('Session ID set:', sessionId);
}
```

### Step 3: finalizeCurrentEvent()を修正
```javascript
function finalizeCurrentEvent() {
  if (!lastWindow || !currentEventStart) {
    return null;
  }

  const endTime = new Date();
  const startTime = new Date(currentEventStart);
  const durationSeconds = Math.floor((endTime - startTime) / 1000);

  // Only save if duration is meaningful (> 1 second)
  if (durationSeconds < 1) {
    return null;
  }

  const event = windowToEventData(lastWindow, 'native');
  event.start_time = currentEventStart;
  event.end_time = endTime.toISOString();
  event.duration_seconds = durationSeconds;
  event.session_id = currentSessionId; // 追加

  console.log('Event finalized:', {
    application: event.application,
    service: event.service,
    duration: durationSeconds,
    session_id: event.session_id
  });

  return event;
}
```

### Step 4: exportにsetSessionIdを追加
```javascript
module.exports = {
  trackActiveWindow,
  startTracking,
  stopTracking,
  getCurrentWindow,
  getAllEvents,
  setSessionId // 追加
};
```

### Step 5: server-improved.jsのstartSession()を修正
```javascript
function startSession(purpose, targetTimeMinutes) {
  const session = {
    id: uuidv4(),
    purpose: purpose,
    target_time_minutes: targetTimeMinutes,
    start_time: new Date().toISOString(),
    status: 'active'
  };
  currentSession = session;

  // Save session
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
  console.log('Session started:', session);

  // Set session ID in tracker BEFORE starting tracking
  tracker.setSessionId(session.id); // 追加

  // Start tracking
  if (!isTracking) {
    tracker.startTracking(1000); // 1 second interval
    isTracking = true;
  }

  return session;
}
```

### Step 6: server-improved.jsのstopSession()を修正（順番を修正）
```javascript
function stopSession() {
  if (!currentSession) return null;

  currentSession.end_time = new Date().toISOString();
  currentSession.status = 'completed';

  // Calculate actual duration
  const startTime = new Date(currentSession.start_time);
  const endTime = new Date(currentSession.end_time);
  const actualDurationMinutes = Math.floor((endTime - startTime) / 60000);
  currentSession.actual_duration_minutes = actualDurationMinutes;

  // Save session
  fs.writeFileSync(sessionFile, JSON.stringify(currentSession, null, 2));
  console.log('Session stopped:', currentSession);

  const session = currentSession;
  currentSession = null;

  // Stop tracking FIRST to finalize last event with session_id
  if (isTracking) {
    tracker.stopTracking(); // This will finalize the last event with current session_id
    isTracking = false;
  }

  // THEN clear session ID in tracker
  tracker.setSessionId(null); // 追加

  return session;
}
```

## 重要な修正点

### 1. session_id = nullのEventを作らない
- 新しく作るEventについては、アクティブなSessionがない状態で記録しない
- ライフサイクルを明確にする：
  ```
  Session開始
    ↓
  currentSessionId = session.id
    ↓
  Event記録
    ↓
  session_idを付与
    ↓
  Session終了
    ↓
  currentSessionId = null
  ```

### 2. stopSession()の順番を修正
- stopTracking()を先に呼ぶ（最後のEventを確定）
- 現在のsession_idで最後のEventを確定する
- その後にcurrentSessionIdをnullにする
- ライフサイクル：
  ```
  Session終了要求
    ↓
  tracker.stopTracking()
    ↓
  最後のEventを確定（session_id付き）
    ↓
  currentSessionIdをnullにする
    ↓
  Sessionをcompletedにする
  ```

## テスト方法

### Unit Test
1. tracker-improved.jsでsetSessionId()を呼ぶ
2. finalizeCurrentEvent()でeventにsession_idが設定されているか確認
3. events.jsonにsession_idが保存されているか確認

### Integration Test
1. Home画面でセッションを開始
2. ウィンドウを切り替える
3. セッションを終了
4. events.jsonを確認
5. 各eventにsession_idが設定されているか確認
6. 最後のeventにもsession_idが設定されているか確認

### 後方互換性確認
1. session_idがない既存のevents.jsonを読み込む
2. Timeline画面でエラーにならないか確認

## Phase 7.5への適用

### 修正後のPhase 7.5ロードマップ

#### ① Eventにsession_idを追加（このプラン）
- tracker-improved.jsにsession_id変数を追加
- server-improved.jsでsession_idを渡す
- finalizeCurrentEvent()でsession_idをeventに追加
- ライフサイクルを明確にする
- stopSession()の順番を修正

#### ② テスト
- Unit Test
- Integration Test
- 後方互換性確認

#### ③ 実際に1セッション使用
- 目的：プログラミングを30分する
- 実際にVS Code、Google、YouTube等を使用
- 終了 → Result → Reflection

#### ④ Timeline / Result / Reflectionを見る
- Timelineを見る
- events.jsonを確認
- session_idが正しく設定されているか確認

#### ⑤ 「なぜできなかったか」を理解できるか検証
- Timelineを見て「なぜYouTubeを見たのか」理解できるか
- Reflectionとの組み合わせで理解できるか

#### ⑥ 6パターンで検証
- 6つのパターンで実際に使用
- 評価項目で記録

#### ⑦ 足りない情報を整理
- 1セッションで検証した結果を整理
- 足りない情報を特定

#### ⑧ 複数セッションで継続利用
- 2〜6セッション程度で使用
- 同じ原因が繰り返されるか確認

#### ⑨ 履歴・パターン分析の必要性を判断
- 過去のセッションを見る価値があるか確認
- Pattern画面の必要性を検証

#### ⑩ DATA_MODEL確定
- 検証結果に基づいてDATA_MODELを確定

#### ⑪ SQLite
- JSONからSQLiteに移行

#### ⑫ 履歴・パターン分析
- 過去セッション一覧を表示
- パターン分析を実装

#### ⑬ AI分析
- AIによる整理・分析支援

## 実装しないこと

- 過去セッション一覧（Phase 7.5前半では不要）
- ルールベースのパターン検出（Phase 7.5で必要性を検証）
- アプリ遷移パターン分析（Phase 7.5で必要性を検証）
- 時系列分析（Phase 7.5で必要性を検証）
- Pattern画面の完成（現時点では不要）

## リスク

### 技術的リスク
- session_idがnullの場合の処理が必要
- 既存のevents.jsonとの互換性

### 検証リスク
- session_idを追加しても「なぜできなかったか」を理解できるか不明
- 1セッションで検証が不十分な可能性

## 結論

ユーザーの意見は正しい。
- ✅ Eventにsession_idを追加することは必須
- ✅ session_id = nullのEventを作らない
- ✅ stopSession()の順番を修正
- ✅ 過去セッション一覧はまだ実装不要
- ✅ ルールベースのパターン検出はまだ実装不要
- ✅ Pattern画面の完成は現時点では不要

推奨のロードマップは合理的。
- まず1セッションで基本的な検証
- その後6パターンで検証
- 必要なら履歴・パターン分析を実装

## 次の具体的な作業

1. tracker-improved.js / server-improved.jsを再確認
2. stopTracking()と最後のEvent確定処理を確認
3. 上記計画との差分を報告
4. 問題なければ実装
5. テスト
6. 変更ファイルとテスト結果を報告