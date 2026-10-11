# YouTube検出修正と他サービスの対処計画

## YouTube検出修正

### 問題
YouTubeのwindow_titleが`"YouTube - (481) 【必見】\"これ\"をすると周りから嫌われてしまうらしい… - YouTube"`となっているが、`detectService()`は`youtube.com`を探しているため検出されない。

### 修正方法
`detectService()`で`youtube.com`だけでなく`YouTube`も探すように修正。

### 修正コード
```javascript
if (title.includes('youtube.com') || title.includes('YouTube')) return 'YouTube';
```

### 変更ファイル
- `desktop/tracker-improved.js`

## 他のサービスの対処方法

### 問題の種類
1. **window_titleにドメインが含まれない**: YouTubeのようにブランド名のみ
2. **アプリ名がブラウザ名と異なる**: GitHub Desktopなど
3. **window_titleの形式が異なる**: 連携アプリなど

### 対処方法

### 方法1: ブランド名とドメインの両方を検出
現在の実装を拡張して、ブランド名とドメインの両方を検出。

```javascript
function detectService(windowTitle, application) {
  if (application !== 'Chrome' && application !== 'Edge' && application !== 'Firefox') {
    return null;
  }

  const title = windowTitle.toLowerCase();

  // YouTube
  if (title.includes('youtube.com') || title.includes('youtube')) return 'YouTube';
  
  // GitHub
  if (title.includes('github.com') || title.includes('github')) return 'GitHub';
  
  // Google
  if (title.includes('google.com') || title.includes('google search') || title.includes('google')) return 'Google';
  
  // Stack Overflow
  if (title.includes('stackoverflow.com') || title.includes('stackoverflow')) return 'Stack Overflow';
  
  // Reddit
  if (title.includes('reddit.com') || title.includes('reddit')) return 'Reddit';
  
  // X (Twitter)
  if (title.includes('twitter.com') || title.includes('x.com') || title.includes('twitter') || title.includes('x ')) return 'X';
  
  // Discord
  if (title.includes('discord.com') || title.includes('discord')) return 'Discord';

  return null;
}
```

### 方法2: 設定ファイルで検出ルールを管理
より柔軟な対応のため、検出ルールを設定ファイルで管理。

```javascript
const serviceRules = [
  { name: 'YouTube', patterns: ['youtube.com', 'youtube'] },
  { name: 'GitHub', patterns: ['github.com', 'github'] },
  { name: 'Google', patterns: ['google.com', 'google search', 'google'] },
  // ...
];

function detectService(windowTitle, application) {
  if (application !== 'Chrome' && application !== 'Edge' && application !== 'Firefox') {
    return null;
  }

  const title = windowTitle.toLowerCase();

  for (const rule of serviceRules) {
    for (const pattern of rule.patterns) {
      if (title.includes(pattern)) {
        return rule.name;
      }
    }
  }

  return null;
}
```

### 方法3: 機械学習による検出（将来的）
より高度な検出には機械学習を検討。

## 推奨

### 現時点: 方法1（ブランド名とドメインの両方を検出）
- シンプルで実装しやすい
- 現在の問題を解決できる
- 他のサービスにも対応できる

### 将来的: 方法2（設定ファイルで管理）
- ユーザーがカスタマイズできる
- 検出ルールの追加が容易

## 実装計画

### Step 1: YouTube検出修正
- `detectService()`で`YouTube`も検出するように修正

### Step 2: 他のサービスの検出改善
- すべてのサービスでブランド名とドメインの両方を検出するように修正

### Step 3: テスト
- 各サービスで正しく検出されるか確認

### Step 4: ユーザーによる検証
- 実際に使用して検出が正しいか確認