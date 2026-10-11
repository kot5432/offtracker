# イベント記録の問題調査結果と修正プラン

## 調査結果

### 問題特定
**主要な問題**: server-improved.jsのstartSession()でtracker.startTracking()を呼んでいるが、async関数をawaitしていない

### コード確認結果
1. ✅ server-improved.jsのstartSession()でtracker.startTracking()を呼んでいる
2. ✅ tracker-improved.jsのstartTracking()がasyncで実装されている
3. ✅ trackActiveWindow()がasyncで実装されている
4. ✅ stopSession()でtracker.stopTracking()を呼んでいる

### サーバーログ確認結果
- ❌ 「Starting window tracking...」がない
- ❌ 「Active Window:」がない
- ❌ 「Window changed:」がない
- ❌ 「Event saved:」がない

### 結論
tracker.startTracking()が正常に呼ばれていないため、追跡が開始されていない

## 修正プラン

### 修正点
server-improved.jsのstartSession()をasyncにして、tracker.startTracking()をawaitする

### 修正前
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
  tracker.setSessionId(session.id);

  // Start tracking
  if (!isTracking) {
    tracker.startTracking(1000); // 1 second interval
    isTracking = true;
  }

  return session;
}
```

### 修正後
```javascript
async function startSession(purpose, targetTimeMinutes) {
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
  tracker.setSessionId(session.id);

  // Start tracking
  if (!isTracking) {
    await tracker.startTracking(1000); // 1 second interval
    isTracking = true;
  }

  return session;
}
```

### 修正が必要なファイル
- server-improved.js

### 修正が必要な箇所
- startSession()関数をasyncにする
- tracker.startTracking()をawaitする

## テスト計画

### テスト手順
1. サーバーを再起動
2. Home画面を開く
3. セッションを開始
4. サーバーログに「Starting window tracking...」があるか確認
5. サーバーログに「Active Window:」があるか確認
6. ウィンドウを切り替える
7. サーバーログに「Window changed:」があるか確認
8. セッションを終了
9. サーバーログに「Event saved:」があるか確認
10. events.jsonが作成されているか確認
11. 各eventにsession_idが設定されているか確認

## 期待結果
- サーバーログに「Starting window tracking...」が表示される
- サーバーログに「Active Window:」が表示される
- サーバーログに「Window changed:」が表示される
- サーバーログに「Event saved:」が表示される
- events.jsonが作成される
- 各eventにsession_idが設定されている