# YouTubeがEdgeとして記録される問題調査

## 問題
YouTubeを見ているのにEdgeとして記録されている

## 原因分析

### detectService()の仕様
- Chrome, Edge, Firefoxの場合のみサービスを検出
- window_titleにyoutube.comが含まれる場合YouTubeを返す

### 可能な原因

### 原因1: YouTubeがEdgeブラウザ内で動いている
- YouTubeをEdgeで見ている場合
- application: Edge
- service: YouTube（正しく検出されるはず）

### 原因2: window_titleにyoutube.comが含まれていない
- YouTubeのwindow_titleが別の形式になっている
- detectService()が正しく検出できない

### 原因3: active-winが正しく情報を取得できていない
- YouTubeのwindow_titleが正しく取得できていない

## 現在の実装

### detectService()
```javascript
function detectService(windowTitle, application) {
  if (application !== 'Chrome' && application !== 'Edge' && application !== 'Firefox') {
    return null;
  }

  const title = windowTitle.toLowerCase();

  if (title.includes('youtube.com')) return 'YouTube';
  // ...
  return null;
}
```

### 問題点
- window_titleの形式が分からない
- YouTubeが正しく検出できているか不明

## 調査方法

### Step 1: YouTubeのwindow_titleを確認
- YouTubeを開いてwindow-title.jsonを確認
- youtube.comが含まれているか確認

### Step 2: serviceが正しく設定されているか確認
- events.jsonでserviceフィールドを確認
- serviceがYouTubeになっているか確認

### Step 3: detectService()の改善
- window_titleの形式に対応する
- より柔軟な検出ロジック

## 調査項目

1. YouTubeをEdgeで開いた時のwindow_titleはどうなっているか
2. serviceフィールドがYouTubeになっているか、nullになっているか
3. detectService()のロジックが正しく動作しているか

## 次のステップ

1. YouTubeを開いてwindow-title.jsonを確認
2. events.jsonでserviceフィールドを確認
3. 必要に応じてdetectService()を改善