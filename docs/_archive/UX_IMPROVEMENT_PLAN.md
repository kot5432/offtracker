# UX改善実装計画（初心者向け）

## 概要
ペルソナ「田中太郎（30歳、ソフトウェアエンジニア）」と「初心者ユーザー」に基づき、Phase 7.5コア体験検証の前に初心者でも使いやすいUX改善を実装する。

## 初心者にとっての課題

### 現在の問題点
1. **何をすべきかが明確でない**: 各画面で「今何をすべきか」が分かりにくい
2. **次に何が起きるかが予測できない**: ボタンを押した後の遷移が分からない
3. **情報が多すぎる**: 必要ない情報が表示されている
4. **ボタンの文言が抽象的**: 「作業を開始」よりも「記録を開始」の方が分かりやすい

## 改善の原則

### 1. シンプルで明確なフロー
- 各画面で「今何をすべきか」を明確に表示
- 次に何が起きるかをボタンの文言で示す
- 必要な情報だけを表示

### 2. 初心者に優しい案内
- 初回使用時に簡潔な説明を表示
- プログレスバーで進捗を表示
- 戻れることを明確にする

### 3. 視覚的なヒント
- 色で状態を示す（緑: 前進、赤: 停止、青: ナビゲーション）
- アイコンで機能を示す
- レイアウトで情報の優先順位を示す

## 実装の優先順序

### 優先度1: 初心者でも使いやすい最小限の改善

#### 1. Home画面（Idle状態）
**ファイル**: `desktop/ui/home.html`

**変更点**:
- 目的入力エリアを大きく
- ボタンの文言を具体的に
- 簡潔な説明を追加

**具体的な変更**:
```html
<div class="section">
  <h2 class="section-title">今日の目的を決めましょう</h2>
  <p class="section-description">何をしたいか入力してください</p>

  <div class="form-group">
    <label for="purpose">目的</label>
    <textarea id="purpose" placeholder="例: ログイン機能を実装する" rows="3"></textarea>
    <div id="purposeError" class="error"></div>
  </div>

  <div class="form-group">
    <label>目標時間（オプション）</label>
    <p class="form-hint">空欄でOKです</p>
    <div class="time-inputs">
      <input type="number" id="targetHours" min="0" max="23" value="1">
      <span>時間</span>
      <input type="number" id="targetMinutes" min="0" max="59" value="00">
      <span>分</span>
    </div>
  </div>

  <button id="startBtn" class="btn btn-primary btn-large">
    記録を開始 → 次はPCで作業
  </button>
</div>
```

**文言の改善**:
- 「作業を開始」→「記録を開始 → 次はPCで作業」
- 「目標時間（オプション）」+「空欄でOKです」のヒント

#### 2. Home画面（Active状態）
**ファイル**: `desktop/ui/home.html`

**変更点**:
- 「何をすべきか」を明確に表示
- ボタンの文言を具体的に
- プログレス表示

**具体的な変更**:
```html
<div class="section">
  <h2 class="section-title">記録中</h2>
  <p class="section-description">PCで作業してください。終わったら「記録を終了」を押してください</p>

  <div class="form-group">
    <label>目的</label>
    <p id="currentPurpose"></p>
  </div>

  <div class="form-group">
    <label>目標時間</label>
    <p id="currentTargetTime"></p>
  </div>

  <div class="form-group">
    <label>開始時刻</label>
    <p id="currentStartTime"></p>
  </div>

  <div class="current-activity">
    <h3>現在の状態</h3>
    <p>PC使用中: <span id="currentApp">VS Code</span></p>
    <p>経過時間: <span id="elapsedTime">0</span>分</p>
  </div>

  <div class="actions">
    <button id="viewTimelineBtn" class="btn btn-secondary">
      記録を見る
    </button>
    <button id="stopBtn" class="btn btn-danger btn-large">
      記録を終了 → 結果を入力
    </button>
  </div>
</div>
```

**文言の改善**:
- 「セッション中」→「記録中」
- 「セッション中」→「PC使用中」
- 「作業を終了」→「記録を終了 → 結果を入力」

#### 3. Timeline画面
**ファイル**: `desktop/ui/timeline.html`

**変更点**:
- 「何をすべきか」を明確に表示
- ボタンの文言を具体的に
- プログレス表示

**具体的な変更**:
```html
<div class="section">
  <h2 class="section-title">記録された行動</h2>
  <p class="section-description">PCでどのようなアプリを使ったか表示されています</p>

  <!-- Timeline表示 -->

  <div class="actions">
    <button id="stopBtn" class="btn btn-danger btn-large">
      記録を終了 → 結果を入力
    </button>
    <button id="backBtn" class="btn btn-secondary">
      Homeに戻る
    </button>
  </div>
</div>
```

**文言の改善**:
- 「今日の行動」→「記録された行動」
- 説明文を追加

#### 4. Result画面
**ファイル**: `desktop/ui/result.html`

**変更点**:
- 「何をすべきか」を明確に表示
- ボタンの文言を具体的に
- 入力項目をシンプルに

**具体的な変更**:
```html
<div class="section">
  <h2 class="section-title">結果を入力しましょう</h2>
  <p class="section-description">実際に何ができたか入力してください</p>

  <div class="purpose-display">
    <p><strong>目的</strong></p>
    <p id="purposeText"></p>
  </div>

  <div class="time-comparison-bar">
    <!-- 時間比較の視覚化 -->
  </div>

  <div class="form-group">
    <label>達成度を選択してください</label>
    <div class="radio-group">
      <!-- ラジオボタン -->
    </div>
  </div>

  <div class="form-group">
    <label for="whatWasDone">できたことは何ですか？</label>
    <textarea id="whatWasDone" placeholder="例: ログイン画面のUIを完成させた" rows="3"></textarea>
  </div>

  <div class="form-group">
    <label for="whatWasntDone">できなかったことは何ですか？（空欄OK）</label>
    <textarea id="whatWasntDone" placeholder="例: 認証処理の実装" rows="2"></textarea>
  </div>

  <div class="actions">
    <button id="reflectBtn" class="btn btn-primary btn-large">
      次へ → 振り返りを入力
    </button>
    <button id="backBtn" class="btn btn-secondary">
      Timelineに戻る
    </button>
  </div>
</div>
```

**文言の改善**:
- 「今日の結果」→「結果を入力しましょう」
- 「できたこと」→「できたことは何ですか？」
- 「できなかったこと」→「できなかったことは何ですか？（空欄OK）」
- 「振り返る」→「次へ → 振り返りを入力」

#### 5. Reflection画面
**ファイル**: `desktop/ui/reflection.html`

**変更点**:
- 「何をすべきか」を明確に表示
- ボタンの文言を具体的に
- チェックボックスをシンプルに

**具体的な変更**:
```html
<div class="section">
  <h2 class="section-title">振り返りましょう</h2>
  <p class="section-description">なぜ予定通りできなかったか考えてみましょう</p>

  <div class="purpose-display">
    <p><strong>目的</strong></p>
    <p id="purposeText"></p>
  </div>

  <div class="form-group">
    <label>なぜできなかったと思いますか？（複数選択可）</label>
    <div class="checkbox-group">
      <label class="checkbox-option">
        <input type="checkbox" name="deviationReason" value="作業が難しかった">
        作業が難しかった
      </label>
      <!-- 他のチェックボックス -->
    </div>
  </div>

  <div class="form-group">
    <label for="reflectionDetails">その他、気がついたことは？（空欄OK）</label>
    <textarea id="reflectionDetails" placeholder="例: 途中でYouTubeを見てしまった" rows="3"></textarea>
  </div>

  <div class="actions">
    <button id="completeBtn" class="btn btn-primary btn-large">
      完了 → パターンを見る
    </button>
    <button id="backBtn" class="btn btn-secondary">
      前に戻る
    </button>
  </div>
</div>
```

**文言の改善**:
- 「振り返ってみよう」→「振り返りましょう」
- 「自由に書く」→「その他、気がついたことは？（空欄OK）」
- 「完了」→「完了 → パターンを見る」

#### 6. Pattern画面
**ファイル**: `desktop/ui/pattern.html`

**変更点**:
- 「何をすべきか」を明確に表示
- ボタンの文言を具体的に
- サマリーをシンプルに

**具体的な変更**:
```html
<div class="section">
  <h2 class="section-title">記録完了</h2>
  <p class="section-description">今回の記録を確認できます</p>

  <div class="session-summary">
    <h3>今回の記録</h3>
    <p><strong>目的:</strong> <span id="sessionPurpose"></span></p>
    <p><strong>結果:</strong> <span id="sessionResult"></span></p>
    <p><strong>原因:</strong> <span id="sessionReason"></span></p>
    <p><strong>時間:</strong> <span id="sessionDuration"></span></p>
  </div>

  <div class="section">
    <h3>過去の記録</h3>
    <p>これまでの記録を比較できます</p>
    <!-- 過去のセッション一覧 -->
  </div>

  <div class="actions">
    <button id="newSessionBtn" class="btn btn-primary btn-large">
      新しい記録を開始
    </button>
    <button id="backBtn" class="btn btn-secondary">
      前に戻る
    </button>
  </div>
</div>
```

**文言の改善**:
- 「これまでの作業を振り返る」→「記録完了」
- 「新しいセッションを開始」→「新しい記録を開始」

## 共通スタイルの追加

### CSSの追加
**ファイル**: すべてのUIファイル

**変更点**:
```css
.section-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.form-hint {
  color: #999;
  font-size: 12px;
  margin-top: 5px;
}

.btn-large {
  padding: 16px 32px;
  font-size: 18px;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  display: block;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.time-comparison-bar {
  margin: 20px 0;
}

.time-bar-container {
  margin-bottom: 10px;
}

.time-bar-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.time-bar {
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: white;
  font-weight: 500;
}

.target-bar {
  background-color: #3b82f6;
}

.actual-bar {
  background-color: #10b981;
}

.session-summary {
  background-color: #f0f9ff;
  border: 2px solid #3b82f6;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}
```

## 実装順序

### Step 1: 共通スタイルの追加
- すべてのUIファイルに共通スタイルを追加

### Step 2: Home画面の改善
- 文言の改善
- ボタンの追加と改善
- 説明文の追加
- Timeline遷移の実装

### Step 3: Timeline画面の改善
- 文言の改善
- ボタンの追加
- 説明文の追加
- セッション停止機能の実装

### Step 4: Result画面の改善
- 文言の改善
- ボタンの改善
- 時間比較の視覚化
- 説明文の追加

### Step 5: Reflection画面の改善
- 文言の改善
- 目的の表示
- ボタンの改善
- 説明文の追加

### Step 6: Pattern画面の改善
- 文言の改善
- セッションサマリーの表示
- ボタンの改善
- 説明文の追加

## 検証方法

### UX改善の検証
1. 初心者が最初から最後まで使えるか
2. 各画面で「何をすべきか」が分かるか
3. ボタンの文言が分かりやすいか
4. 次に何が起きるかが予測できるか

### Phase 7.5の検証
1. 6つのパターンで実際に使用
2. 6つの指標を確認
3. Pattern画面の価値を確認

## まとめ

**初心者でも使いやすい改善**:
- 文言を具体的に
- 「何をすべきか」を明確に表示
- 次に何が起きるかをボタンの文言で示す
- 必要な情報だけを表示
- 用語を統一

**実装後の検証**:
- 初心者が最初から最後まで使えるか
- Phase 7.5コア体験検証

**次のステップ**:
- 検証結果に基づいてPhase 8に進む