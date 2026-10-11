# Timeline改善の再考

## ユーザーフィードバック

### 問題点
1. **記録された行動が見にくい**
   - 縦長に並んでいる
   - 何を示したいのかがわからない

2. **色分けがわからない**
   - 何をもとに色分けされているのか不明
   - 赤と青の意味が分からない

3. **ヒントは良い**
   - ヒントは役に立つ

## Timelineの目的

### ユーザーに何を示したいのか
- 自分がどのような行動をしていたかを一目で理解する
- 目的とのズレを視覚的に理解する
- 集中が途切れたポイントを特定する
- 時間の使い方を把握する

### ユーザーに何を還元したいのか
- 「自分がどのような行動をしていたか」を把握できる
- 「目的とのズレ」を認識できる
- 「次回の行動」を考えるきっかけになる

## 改善案

### 方案1: 時間軸を横向きにする
- 横向きのタイムラインにする
- 時間の流れが見やすくなる
- 各イベントの相対的な位置が分かりやすくなる

### 方案2: 色分けの凡例を追加
- 色分けの意味を明示する
- 「緑: 目的に関連」「赤: 脱線」「青: その他」などの凡例を追加
- ユーザーが色の意味を理解できる

### 方案3: グラフ形式にする
- 円グラフで時間配分を表示
- 棒グラフで各アプリの使用時間を表示
- 一目で時間の使い方が分かる

### 方案4: サマリーを強化
- 目的関連時間 vs 脱線時間を表示
- 集中時間を表示
- 集中割合を表示

### 方案5: インタラクティブなタイムライン
- ホバーで詳細を表示
- クリックで拡大表示
- 詳細情報を表示

## 推奨する改善

### Phase 1: 基本的な改善
1. **色分けの凡例を追加**: 色の意味を明示
2. **サマリーを強化**: 目的関連時間 vs 脱線時間を表示

### Phase 2: 視覚的改善
1. **円グラフを追加**: 時間配分を視覚化
2. **横向きタイムライン**: 時間の流れを見やすく

### Phase 3: インタラクティブ改善
1. **ホバーで詳細を表示**: 詳細情報を表示
2. **クリックで拡大表示**: 拡大表示

## 具体的な実装

### Step 1: 色分けの凡例を追加
```html
<div class="legend">
  <div class="legend-item">
    <div class="legend-color on-track"></div>
    <span>目的に関連</span>
  </div>
  <div class="legend-item">
    <div class="legend-color deviation"></div>
    <span>脱線</span>
  </div>
  <div class="legend-item">
    <div class="legend-color browser"></div>
    <span>調査</span>
  </div>
</div>
```

### Step 2: サマリーを強化
```html
<div class="summary">
  <div class="summary-item">
    <div class="summary-label">目的関連時間</div>
    <div class="summary-value" id="onTrackDuration">0分</div>
  </div>
  <div class="summary-item">
    <div class="summary-label">脱線時間</div>
    <div class="summary-value" id="deviationDuration">0分</div>
  </div>
  <div class="summary-item">
    <div class="summary-label">集中割合</div>
    <div class="summary-value" id="focusRatio">0%</div>
  </div>
</div>
```

### Step 3: 円グラフを追加
- Chart.jsを使用して円グラフを表示
- 各アプリの時間配分を表示

## 検証計画

1. 色分けの凡例を追加して検証
2. サマリーを強化して検証
3. 円グラフを追加して検証
4. ユーザーフィードバックを収集