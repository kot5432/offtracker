# Timeline判定ロジック改善プラン

## 問題

### 現在の実装
- 硬コーディング: 特定のアプリ名で判定している
- 目的に応じて判定が変わらない
- ユーザーが設定できない

### ユーザーフィードバック
- 目的に関連と調査でどう分けているのか不明
- 脱線についてもどれが脱線でどれが目的に関連しているのかがわかりにくい
- アイドルもどのように認識しているのか不明
- 集中割合もどのように判定しているのか不明

## 改善案

### 目的キーワードに基づく判定

#### 目的キーワードマップ
```javascript
const purposeKeywords = {
  'プログラミング': {
    onTrack: ['VS Code', 'GitHub', 'Stack Overflow', 'Git'],
    deviation: ['YouTube', 'X', 'Reddit', 'Discord'],
    research: ['Google', 'Google Search']
  },
  '勉強': {
    onTrack: ['PDF Viewer', 'Word', 'Excel', 'PowerPoint'],
    deviation: ['YouTube', 'X', 'Reddit', 'Discord'],
    research: ['Google', 'Google Scholar']
  },
  '調査': {
    onTrack: ['Google', 'Google Scholar', 'Stack Overflow'],
    deviation: ['YouTube', 'X', 'Reddit', 'Discord'],
    research: ['Google', 'Google Scholar']
  },
  '開発': {
    onTrack: ['VS Code', 'GitHub', 'Git'],
    deviation: ['YouTube', 'X', 'Reddit', 'Discord'],
    research: ['Google', 'Stack Overflow']
  }
};
```

#### 判定ロジック
1. 目的からキーワードを抽出
2. アプリが目的キーワードに含まれるか判定
3. 脱線キーワードに含まれるか判定
4. 調査キーワードに含まれるか判定

#### デフォルト判定
- 目的キーワードに含まれない場合:
  - YouTube, X, Reddit, Discord → 脱線
  - Google, Stack Overflow → 調査
  - その他 → 目的に関連

## 実装ステップ

### Step 1: 目的キーワードマップを定義
- timeline.htmlに目的キーワードマップを追加
- 一般的な目的のキーワードを定義

### Step 2: 目的からキーワードを抽出
- 目的文字列からキーワードを抽出
- 一致する目的キーワードマップを選択

### Step 3: 判定ロジックを実装
- determineBarClass()を改善
- 目的キーワードに基づいて判定

### Step 4: 凡例を更新
- 「目的に関連」「脱線」「調査」の説明を追加
- 判定基準を明示

### Step 5: テスト
- 疑似データで検証
- 各目的で正しく判定されているか確認

## 変更ファイル
- desktop/ui/timeline.html

## テスト方法
1. Timeline画面を開く
2. 疑似データをロード
3. 各セッションで正しく判定されているか確認
4. 凡例が理解できるか確認