# GitHub コミット計画と次の開発計画

## 現状分析

### 完了した実装（Phase 2-4）
- ✅ Phase 2: Activityの目的との関係分析（ロジック実装）
- ✅ Phase 2: Timeline画面の表示改善（purpose_relationに基づく可視化）
- ✅ Phase 3: セッション要約生成
- ✅ Phase 4: Reflection画面の拡張とサーバーAPI

### ただし重要な注意点
これらの実装は **`desktop/_legacy_electron/` ディレクトリ内の Electron 版**です。MASTER_DEVELOPMENT_PLAN.md によると:
- Tauri 2.x (Rust) が正式採用済み
- Electron系ファイルは `desktop/_legacy_electron/` に隔離済み、MVP時削除予定
- 現在のメイン開発は `desktop/src-tauri/` （Tauri/Rust版）

## GitHub コミット計画

### コミット1: Phase 2-4 Timeline表示改善（Electron legacy版）
**目的**: Phase 2-4の実装をコミットとして確定させる

**変更ファイル**:
- `desktop/ui/timeline.html` - purpose_relationに基づくカラーコーディング、凡例、サマリー、フィルター

**コミットメッセージ**:
```
Phase 2-4: Timeline画面の表示改善を実装

Activityのpurpose_relationフィールドに基づいて、目的との関係を視覚的に表示する機能を追加

変更内容:
- purpose_relationに基づくカラーコーディング（related/possibly_related/uncertain/possibly_unrelated/unrelated）
- 凡例を5つのカテゴリに更新
- サマリーに各カテゴリの時間統計を追加
- purpose_relationに基づくフィルター機能を追加
- determineBarClass関数を更新してpurpose_relationを優先的に使用
- 後方互換性を維持（legacy events対応）

Note: これはdesktop/_legacy_electron/（Electron版）の実装です。
Tauri版への移行はMASTER_DEVELOPMENT_PLAN.mdに従って進行します。

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
```

### コミット2: Phase 2-4 サーバーAPI実装（Electron legacy版）
**目的**: Phase 4のサーバーAPIエンドポイントをコミット

**変更ファイル**:
- `desktop/_legacy_electron/server-improved.js` - APIエンドポイント追加
- `desktop/_legacy_electron/sessions.json` - セッション履歴ファイル作成

**コミットメッセージ**:
```
Phase 2-4: サーバーAPIエンドポイントを実装

Reflection画面で必要なサーバーAPIエンドポイントを追加

変更内容:
- /api/session/analyze - セッション分析API
- /api/session/hypotheses - 仮説生成API
- /api/session/next-actions - 次回行動候補API
- /api/reflection - 振り返り保存API（更新）
- loadSessionById()ヘルパー関数追加
- stopSession()を更新してsessions.jsonに履歴を保存
- sessions.jsonファイル作成

Note: これはdesktop/_legacy_electron/（Electron版）の実装です。
Tauri版への移行はMASTER_DEVELOPMENT_PLAN.mdに従って進行します。

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
```

## 次の開発計画（MASTER_DEVELOPMENT_PLAN.md に基づく）

### 優先順位の確認
MASTER_DEVELOPMENT_PLAN.md によると:
1. **Phase 0**: 未Accept Diffを全部確定（機能開発ではない）
2. **Phase 1**: 自動記録を「実際に使える状態」にする
3. **Phase 2**: Event → Activity 中間層
4. **Phase 3**: Activity × Purpose 関係判定
5. **Phase 4**: 行動の意味づけ(ストーリー化)
6. 以下続く...

### 注意点
- 現在の `_legacy_electron/` 版の Phase 2-4 実装は、Tauri版の開発の参考になるが、最終的には削除予定
- MASTER_DEVELOPMENT_PLAN.md に従って、Tauri版の Phase 0 から始めるべき

### 推奨される次のステップ
1. まず上記2つのコミットを実行して、Electron legacy版の Phase 2-4 を確定
2. MASTER_DEVELOPMENT_PLAN.md の Phase 0 に従って、Tauri版の未Accept Diffを確定
3. Tauri版の Phase 1 で自動記録の実機検証
4. Tauri版の Phase 2-4 を実装（Electron版の実装を参考にしつつ、Tauri/Rustに移植）

### ユーザーへの質問
Electron legacy版の実装をコミットした後、どのように進めますか？

**選択肢**:
1. MASTER_DEVELOPMENT_PLAN.md に従って Tauri版の Phase 0 から開始
2. Electron legacy版の実装をテストして、機能が動作することを確認
3. その他（具体的に教えてください）
