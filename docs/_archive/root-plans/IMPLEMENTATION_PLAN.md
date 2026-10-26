# Phase 2-4 残り: Timeline画面の表示改善

## 概要

Phase 2-4の実装はほぼ完了しましたが、Phase 2の「Timeline画面の表示改善」が未完了です。Activityの`purpose_relation`フィールドを使って、目的との関係を視覚的に理解できるようにTimelineを改善します。

## 現状

**完了済み:**
- ✅ Phase 2: Activityの目的との関係分析（ロジック実装）
- ✅ Phase 3: セッション要約生成
- ✅ Phase 4: Reflection画面の拡張とサーバーAPI

**未完了:**
- ⏸️ Phase 2: Timeline画面の表示改善
  - 目的との関係を可視化
  - Activityをカテゴリ別に表示

## 課題

現在のtimeline.htmlは以下の問題があります:
1. Activityの`purpose_relation`フィールドを使用していない
2. 目的との関係（related, possibly_related, uncertain, possibly_unrelated, unrelated）が視覚的に表示されていない
3. Activityをカテゴリ別に表示する機能がない

## 実装計画

### 1. Activityデータの読み込みを確認
**ファイル:** `desktop/ui/timeline.html`

現在は`/api/session/events`エンドポイントを呼び出していますが、これはlegacy eventsを返す可能性があります。Activityデータを確実に取得するために、`/api/activities`または`/api/session/events`がActivityデータを返すことを確認します。

### 2. purpose_relationに基づくカラーコーディングの追加
**ファイル:** `desktop/ui/timeline.html`

Activityの`purpose_relation`フィールドに基づいて、以下のカラーコーディングを追加:
- `related`: 緑（目的に関連）
- `possibly_related`: 黄緑（関連する可能性）
- `uncertain`: グレー（不明）
- `possibly_unrelated`: オレンジ（関連しない可能性）
- `unrelated`: 赤（関連しない）

### 3. 凡例（Legend）の更新
**ファイル:** `desktop/ui/timeline.html`

現在の凡例は以下のカテゴリ:
- 目的に関連（on-track）
- 脱線（deviation）
- 調査（browser）
- アイドル（idle）

これを以下に更新:
- 目的に関連（related）
- 関連する可能性（possibly_related）
- 不明（uncertain）
- 関連しない可能性（possibly_unrelated）
- 関連しない（unrelated）

### 4. サマリーの更新
**ファイル:** `desktop/ui/timeline.html`

現在は「作業時間」のみ表示しています。以下の統計を追加:
- 目的に関連した時間
- 関連する可能性がある時間
- 不明な時間
- 関連しない可能性がある時間
- 関連しない時間

### 5. フィルター機能の追加
**ファイル:** `desktop/ui/timeline.html`

purpose_relationに基づくフィルターを追加:
- 目的に関連したActivityのみ表示
- 関連しないActivityのみ表示
- すべて表示

## 実装手順

### Step 1: determineBarClass関数の更新
`determineBarClass()`関数を更新して、Activityの`purpose_relation`フィールドを優先的に使用するようにします。

### Step 2: 凡例の更新
凡例を5つのカテゴリ（related, possibly_related, uncertain, possibly_unrelated, unrelated）に更新します。

### Step 3: サマリーの更新
`updateSummary()`関数を更新して、purpose_relationごとの時間を計算して表示します。

### Step 4: フィルターの追加
purpose_relationに基づくフィルターチェックボックスを追加します。

### Step 5: レンダリングロジックの更新
`renderTimeline()`関数を更新して、フィルターを適用するようにします。

## ファイル変更リスト

### 修正
- `desktop/ui/timeline.html` - Timeline画面の表示改善

## 検証

実装後、以下を確認:
1. セッションを開始してActivityを記録
2. Timeline画面でActivityが表示される
3. Activityの色がpurpose_relationに基づいて正しく表示される
4. 凡例が正しく表示される
5. サマリーに各カテゴリの時間が表示される
6. フィルターが正しく動作する

## リスクと考慮事項

- 既存のlegacy eventsとの互換性を維持する必要がある
- Activityデータが確実に取得できることを確認する必要がある
- UIの複雑化を避けるため、フィルターはシンプルに保つ
