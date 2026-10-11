# Phase 1: EventとActivityの分離 - 実装計画

## Phase 1の目標
- EventとActivityを分離
- PC固有の処理と分析ロジックを分離
- Raw Eventを保存する仕組みを導入
- 現在動いている機能を壊さない

## 現状の問題点
1. EventとActivityの概念が混在している
2. Raw Event（ポーリングごとのデータ）が保存されていない
3. PC固有の処理と分析ロジックが分離されていない
4. 再分析が不可能

## 実装方針
- 最小限の変更で進める
- 既存機能を壊さない
- 後方互換性を維持
- UIは最小限の変更

## 実装ステップ

### ステップ1: データ構造の定義

#### Raw Eventのデータ構造
```json
{
  "id": "uuid",
  "timestamp": "2026-09-21T18:09:42.585Z",
  "source": "native",
  "application": "Microsoft Edge",
  "service": null,
  "window_title": "...",
  "process_id": 395632,
  "session_id": "0fd8762b-bdea-4429-b7e1-831693cc040a"
}
```

#### Activityのデータ構造
```json
{
  "id": "uuid",
  "type": "work",
  "start_time": "2026-09-21T18:09:42.585Z",
  "end_time": "2026-09-21T18:09:46.624Z",
  "duration_seconds": 4,
  "application": "Microsoft Edge",
  "service": null,
  "window_title": "...",
  "session_id": "0fd8762b-bdea-4429-b7e1-831693cc040a",
  "source_events": ["uuid1", "uuid2"],
  "confidence": 0.82
}
```

### ステップ2: ファイル構成の変更

#### 新しいファイル構成
```
desktop/
├── src/
│   ├── event-collector.js       # Raw Event収集ロジック
│   ├── activity-generator.js    # Activity生成ロジック
│   └── data-manager.js          # データ管理ロジック
├── raw-events.json              # Raw Event保存先（新規）
├── activities.json              # Activity保存先（新規）
├── events.json                  # 既存ファイル（移行用）
├── tracker-improved.js          # 既存ファイル（変更）
└── server-improved.js           # 既存ファイル（変更）
```

### ステップ3: 実装詳細

#### 3.1 src/event-collector.js（新規）
- Raw Eventの収集ロジック
- プラットフォーム抽象化
- `active-win`のラッパー

```javascript
class EventCollector {
  async collectWindowInfo() {
    const activeWindow = await activeWin();
    return {
      timestamp: new Date().toISOString(),
      application: activeWindow.owner.name,
      window_title: activeWindow.title,
      process_id: activeWindow.owner.processId
    };
  }
}
```

#### 3.2 src/activity-generator.js（新規）
- Raw EventからActivityを生成
- 連続イベントのマージ
- 基本的な分類

```javascript
class ActivityGenerator {
  generateActivities(rawEvents) {
    // 連続イベントのマージ
    // 基本的な分類
    // Activity生成
  }
}
```

#### 3.3 src/data-manager.js（新規）
- データ管理ロジック
- Raw Event保存
- Activity保存
- セッション管理

```javascript
class DataManager {
  saveRawEvent(rawEvent) {
    // raw-events.jsonに保存
  }
  
  saveActivity(activity) {
    // activities.jsonに保存
  }
}
```

#### 3.4 tracker-improved.js（変更）
- EventCollectorを使用
- Raw Eventを保存
- Activity生成のトリガー

```javascript
const EventCollector = require('./src/event-collector');
const ActivityGenerator = require('./src/activity-generator');
const DataManager = require('./src/data-manager');

// 既存のロジックを新しい構造に変更
```

#### 3.5 server-improved.js（変更）
- 新しいAPIエンドポイントの追加
- 既存APIの互換性維持

```javascript
// 新しいAPI
app.post('/api/raw-event', saveRawEvent);
app.post('/api/activity', saveActivity);

// 既存API（互換性維持）
app.get('/api/events', getActivities); // 実際はActivityを返す
```

### ステップ4: 移行計画

#### 4.1 既存データの移行
- 既存のevents.jsonをactivities.jsonに変換
- 変換スクリプトを作成

```javascript
// migration.js
const fs = require('fs');
const events = JSON.parse(fs.readFileSync('events.json', 'utf8'));
const activities = events.map(event => ({
  id: event.id,
  type: 'unknown',
  start_time: event.start_time,
  end_time: event.end_time,
  duration_seconds: event.duration_seconds,
  application: event.application,
  service: event.service,
  window_title: event.window_title,
  session_id: event.session_id,
  source_events: [],
  confidence: 0.5
}));
fs.writeFileSync('activities.json', JSON.stringify(activities, null, 2));
```

#### 4.2 UIの変更
- ui/timeline.htmlをActivity表示に変更
- 最小限の変更で互換性維持

### ステップ5: テスト計画

#### 5.1 単体テスト
- EventCollectorのテスト
- ActivityGeneratorのテスト
- DataManagerのテスト

#### 5.2 統合テスト
- セッション開始から終了までのフロー
- Timelineの表示
- Result/Reflectionの保存

#### 5.3 互換性テスト
- 既存セッションが正しく表示されるか
- 既存データが正しく移行されるか

### ステップ6: 成功基準
- 既存のセッション管理が動作する
- TimelineがActivityを正しく表示する
- Result/Reflectionが正しく保存される
- Raw Eventが保存されるようになる
- データ収集層と分析層が分離される
- 後方互換性が維持される

## 実装順序
1. src/event-collector.jsの実装
2. src/activity-generator.jsの実装
3. src/data-manager.jsの実装
4. tracker-improved.jsの変更
5. server-improved.jsの変更
6. 移行スクリプトの実装
7. ui/timeline.htmlの変更
8. テスト
9. 既存データの移行
10. 統合テスト

## 変更しないファイル
- ui/result.html
- ui/reflection.html
- ui/pattern.html
- results.json
- reflections.json

## リスク管理
- 既存機能を壊さないように慎重に進める
- 変更前にバックアップを作成
- 各ステップでテストを行う
- 問題が発生した場合は即座にロールバック

## 次のステップ
この実装計画に基づいて、ステップ1から順番に実装を開始します。