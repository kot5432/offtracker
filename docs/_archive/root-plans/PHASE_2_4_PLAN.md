# Phase 2-4: Activity分析とAI仮説生成の実装

OffTrackerのMVP完成条件を満たすため、Phase 2〜4を実装します。ユーザーが「行動が把握できない」というフィードバックを解決し、「なぜ」を考えるきっかけを提供します。

## 概要

Phase 1（EventとActivityの分離）は完了しましたが、ユーザーからのフィードバックで「行動が把握できない」「目的とのズレが分からない」「なぜを考えるきっかけが弱い」という重要な問題が残っています。これらを解決するために、Phase 2〜4を実装します。

## 実装ステップ

### Phase 2: Activityの目的との関係分析 ✅ 完了
**目的**: Activityを目的との関係で分類し、ユーザーが「どこで目的から外れたか」を理解できるようにする

**完了した実装**:
1. ✅ `desktop/src/purpose-analyzer.js`を作成
   - 目的キーワードに基づいてActivityを分類
   - `related`, `possibly_related`, `uncertain`, `possibly_unrelated`, `unrelated`の5段階で評価
   - YouTubeなどの自動判定を避ける（チュートリアルなども考慮）

2. ✅ `desktop/_legacy_electron/src/activity-generator.js`を拡張
   - 目的を渡して目的との関係を分析
   - Activityに`purpose_relation`フィールドを追加

3. ✅ `desktop/_legacy_electron/tracker-improved.js`を拡張
   - `setPurpose()`関数を追加
   - Activity生成時に目的を渡す

4. ✅ `desktop/_legacy_electron/server-improved.js`を拡張
   - セッション開始時に`tracker.setPurpose()`を呼び出す

5. ⏸️ Timeline画面の表示改善（未実装）
   - 目的との関係を可視化
   - Activityをカテゴリ別に表示

**完了条件**: Activityが目的との関係で分類され、Timelineで目的とのズレが視覚的に理解できる

### Phase 3: 「今回何を起きたか」の要約生成 ✅ 完了
**目的**: 連続するActivityを意味のある行動ブロックにまとめ、ユーザーが「今回何をしていたか」を理解できるようにする

**完了した実装**:
1. ✅ `desktop/src/session-summarizer.js`を作成
   - Activityを時間順に並べ替え
   - 同じタイプの連続Activityをマージ
   - 行動の遷移を検出（work → research → distraction_candidate → workなど）
   - 自然言語の要約を生成
   - 目的とのアライメントを計算

2. ✅ `desktop/ui/reflection.html`を拡張
   - 要約表示セクションを追加
   - 目的とのズレを視覚的に表示

**完了条件**: ユーザーが「今回、自分がどう行動したか理解できたか」と問えるレベルの要約が生成される

### Phase 4: Reflection画面の拡張 🔄 進行中
**目的**: AI仮説生成（ルールベース）、ユーザー判断、次回行動の決定機能を実装し、ユーザーが「なぜ」を考え、次回の行動を決められるようにする

**完了した実装**:
1. ✅ `desktop/src/hypothesis-generator.js`を作成
   - 行動パターンからルールベースで仮説を生成
   - 根拠を行動データと結びつける
   - 複数の仮説候補を提示

2. ✅ `desktop/src/next-action-generator.js`を作成
   - 原因に基づいて次回行動候補を生成
   - ユーザーが選択・編集できる

3. ✅ `desktop/ui/reflection.html`を大幅拡張
   - 要約表示セクション
   - 仮説表示セクション（仮説に同意/修正/否定的ができる）
   - 原因自由記述セクション
   - 次回行動選択・編集セクション

4. ✅ `desktop/_legacy_electron/server-improved.js`にモジュールインポートを追加

**未完了の実装**:
5. ⏸️ サーバーAPIを追加
   - `/api/session/analyze` - セッション分析API
   - `/api/session/hypotheses` - 仮説生成API
   - `/api/session/next-actions` - 次回行動候補API
   - `/api/reflection` - 振り返り保存API（更新）

**完了条件**: ユーザーがAIの仮説を確認・修正し、次回の行動を決めて保存できる

## ファイル変更リスト

### 新規作成
- `desktop/src/purpose-analyzer.js` - 目的分析ロジック
- `desktop/src/session-summarizer.js` - セッション要約生成ロジック
- `desktop/src/hypothesis-generator.js` - 仮説生成ロジック
- `desktop/src/next-action-generator.js` - 次回行動候補生成ロジック

### 修正
- `desktop/_legacy_electron/src/activity-generator.js` - 目的分析統合
- `desktop/_legacy_electron/server-improved.js` - 新規APIエンドポイント追加
- `desktop/ui/reflection.html` - 機能拡張
- `desktop/ui/result.html` - Reflectionへの遷移確認

## データ構造の変更

### Activityデータ構造の拡張
```json
{
  "id": "...",
  "type": "work",
  "start_time": "...",
  "end_time": "...",
  "duration_seconds": 75,
  "application": "Microsoft Edge",
  "service": null,
  "window_title": "...",
  "session_id": "...",
  "source_events": ["..."],
  "confidence": 0.5,
  "purpose_relation": "possibly_related",
  "purpose_confidence": 0.7
}
```

### Reflectionデータ構造の拡張
```json
{
  "id": "...",
  "session_id": "...",
  "summary": "...",
  "purpose_alignment": {
    "related_time": 57,
    "possibly_related_time": 18,
    "uncertain_time": 0,
    "possibly_unrelated_time": 0
  },
  "hypotheses": [
    {
      "id": "...",
      "description": "...",
      "evidence": ["..."],
      "confidence": "medium"
    }
  ],
  "selected_hypothesis": "...",
  "user_feedback": "...",
  "next_action": {
    "action": "...",
    "source": "user"
  }
}
```

## テスト計画

### 単体テスト
1. 新しいセッションを開始
2. 複数のアプリを使用（VS Code、ブラウザ、Terminalなど）
3. 記録を終了
4. Reflection画面で要約・仮説・次回行動を確認
5. データが正しく保存されているか確認

### 統合テスト
1. 以前のセッションデータとの互換性確認
2. Timelineでの目的との関係表示確認
3. Reflectionから次回のセッション開始までのフロー確認

## リスクと考慮事項

### Phase 2のリスク
- 目的キーワードの精度に依存する
- ユーザーが自由入力した目的に対して適切に分析できるか

### Phase 3のリスク
- ルールベースでの要約生成の限界
- ユーザーが意図したような要約にならない可能性

### Phase 4のリスク
- ルールベースの仮説生成の限界
- AIを使用しない場合の仮説の質

### 考慮事項
- AI統合はPhase 5以降で検討
- まずルールベースで実装し、ユーザーフィードバックに基づいて改善
- 既存データとの互換性を維持
- UIの複雑化を避ける

## 成功基準

- [ ] Activityが目的との関係で分類される
- [ ] Timelineで目的とのズレが視覚的に理解できる
- [ ] セッション要約が生成され、ユーザーが理解できる
- [ ] 仮説候補が提示され、ユーザーが判断できる
- [ ] 次回行動を決定して保存できる
- [ ] 1セッション全体のフローが完成する
