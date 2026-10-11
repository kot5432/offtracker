# Windowsアプリ取得技術検証

## 検証日
2026-09-16

## 技術スタック
- Node.js
- active-win npm package
- HTTP Server (local)
- JSON storage (development)

## 検証項目

### 1. 現在アクティブなウィンドウを取得できるか

**実装状況:** ✅ 完了

**技術:**
```javascript
const activeWin = require('active-win');
const activeWindow = await activeWin();
```

**取得データ:**
```json
{
  "timestamp": "2026-09-16T11:22:28.385Z",
  "title": "GeoPuzzle - Devin - offtrackerのローカルファイルが見当たりません。 ...",
  "owner": "Devin",
  "id": 66782
}
```

**確認事項:**
- ✅ アクティブウィンドウのタイトル取得
- ✅ アプリケーション名（owner）取得
- ✅ プロセスID取得
- ✅ タイムスタンプ記録

### 2. アプリ名を識別できるか

**実装状況:** ✅ 完了

**識別可能なアプリ:**
- VS Code
- Chrome
- Discord
- PowerPoint
- Spotify
- その他Windowsアプリケーション

**データ構造:**
```javascript
{
  owner: "Devin",  // アプリケーション名
  title: "...",   // ウィンドウタイトル
  id: 66782       // プロセスID
}
```

**確認事項:**
- ✅ アプリケーション名が正確に取得できる
- ✅ ウィンドウタイトルが取得できる
- ✅ プロセスIDが取得できる

### 3. アプリの切り替わりをイベントとして取得できるか

**実装状況:** ✅ 完了

**実装ロジック:**
```javascript
if (lastWindow.owner !== data.owner || lastWindow.title !== data.title) {
  // Window changed, save event
  const event = {
    id: uuidv4(),
    session_id: currentSession.id,
    timestamp: new Date().toISOString(),
    from_application: lastWindow.owner,
    to_application: data.owner,
    from_title: lastWindow.title,
    to_title: data.title
  };
  windowEvents.push(event);
}
```

**イベントデータ構造:**
```json
{
  "id": "uuid",
  "session_id": "session-uuid",
  "timestamp": "2026-09-16T18:35:00Z",
  "from_application": "VS Code",
  "to_application": "Chrome",
  "from_title": "OffTracker - Visual Studio Code",
  "to_title": "Google Search"
}
```

**確認事項:**
- ✅ アプリ切り替えを検知できる
- ✅ セッションIDとの紐付けができる
- ✅ 遷移元と遷移先のアプリを記録できる
- ✅ タイムスタンプを記録できる

### 4. 時系列データとして保存できるか

**実装状況:** ✅ 完了

**保存方法:**
- JSONファイル（開発中）
- SQLite（将来的）

**イベント保存:**
```javascript
function saveEvents() {
  fs.writeFileSync(eventsFile, JSON.stringify(windowEvents, null, 2));
}
```

**保存データ:**
```json
[
  {
    "id": "evt-1",
    "session_id": "session-123",
    "timestamp": "2026-09-16T18:35:00Z",
    "from_application": "VS Code",
    "to_application": "Chrome",
    "from_title": "OffTracker - Visual Studio Code",
    "to_title": "Google Search"
  }
]
```

**確認事項:**
- ✅ イベントをJSONファイルに保存できる
- ✅ タイムスタンプで時系列順に並ぶ
- ✅ セッションごとにイベントを紐付けられる

## 技術的制限

### active-winの制限
- Windowsのみ対応
- macOS/Linuxには別のライブラリが必要
- バックグラウンドで実行するプロセスが必要

### データ収集の制限
- ウィンドウタイトルには機密情報が含まれる可能性がある
- ブラウザのサービス名（Google, YouTube等）は自動検出できない
- URLや検索語句は取得できない（プライバシー保護）

### パフォーマンス
- 5秒ごとのポーリング（現在の実装）
- イベントベースの検知への改善余地あり

## 実装ファイル

### tracker.js
- 基本的なウィンドウ追跡
- 5秒ごとのポーリング
- JSONファイルへの保存

### simple-server.js
- HTTPサーバー
- セッション管理
- イベント追跡
- APIエンドポイント

## APIエンドポイント

### GET /api/window
現在のアクティブウィンドウを取得

### GET /api/data
保存されたウィンドウデータを取得

### POST /api/session/start
セッションを開始

### POST /api/session/stop
セッションを終了

### GET /api/session/current
現在のセッション情報を取得

### GET /api/session/elapsed
経過時間を取得

### POST /api/session/result
結果を保存

## 検証結論

### 技術的実現可能性
✅ **可能**

OffTrackerの技術的土台となるWindowsアプリ取得は、以下の技術で実現可能です：

1. **アクティブウィンドウ検出:** active-win npm package
2. **アプリ名識別:** owner.nameフィールド
3. **切り替えイベント検出:** 前回のウィンドウとの比較
4. **時系列データ保存:** JSONファイル（開発）、SQLite（本番）

### 次のステップ
1. 疑似データを作成
2. 疑似データでUIを検証
3. 実データをUIに統合
4. ブラウザ拡張でサービス名検出（将来的）

### 技術的改善点
1. ポーリングからイベントベースへの変更
2. JSONからSQLiteへの移行
3. ウィンドウタイトルのプライバシー保護
4. ブラウザサービス名の自動検出

## 結論

Windowsアプリ取得の技術検証は**成功**です。既存の実装で以下の機能が確認されています：

- ✅ アクティブウィンドウの取得
- ✅ アプリ名の識別
- ✅ 切り替えイベントの検出
- ✅ 時系列データの保存

これにより、OffTrackerの技術的土台が確立されました。次は疑似データを作成し、UI/UXを検証します。
