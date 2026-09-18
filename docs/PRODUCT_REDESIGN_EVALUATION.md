# OffTracker 製品再設計評価と実装計画

## 新製品定義の評価

### ✅ 優れている点

**1. 明確なペルソナと課題**
- 具体的なユーザー像（佐藤さん）が設定されている
- 「やる気がない」ではなく「途中で離れてしまう」という現実的な課題
- 行動の「流れ」に焦点を当てている

**2. プロダクトの目的が明確**
- 「集中しろ」ではなく「理解する」アプリ
- 失敗を分解して原因を探るアプローチ
- 非判断的なデータ提供

**3. 基本ループが論理的**
- 目的設定 → 行動記録 → 結果振り返り → パターン理解
- AIの役割が適切（答えを決めるのではなく整理する）
- フェードアウトを「原因を探る手がかり」と位置づけ

**4. デスクトップ化の必然性**
- PC全体の行動観測が必要という明確な理由
- 技術選択が製品目的から導かれている

### ❌ 改善が必要な点

**1. MVP範囲が過度に大きい**
- 提案されたMVPは実質的にフル製品に近い
- 16のステップ全てを最初に実装するのは現実的ではない
- 製品価値を証明するための最小機能セットが必要

**2. 技術的複雑度の過小評価**
- Edge拡張統合は技術的に複雑
- AI統合はデータ蓄積が前提
- パターン分析はアルゴリズム開発が必要

**3. 既存資産との不一致**
- 現在のWeb UIは認証・ダッシュボード中心
- 新定義は目的設定・振り返り中心
- 既存コードの再利用が難しい

**4. 実装順序の問題**
- STEP 8（Timeline）までがMVPとしては適切
- それ以降はフェーズ分けが必要
- 全てを「最初の完成目標」にするのは現実的ではない

## 推奨される再設計

### Phase 1: 基本動作検証（現在完了✅）
- ✅ Windows APIによるアクティブウィンドウ検出
- ✅ 基本的なデータ収集
- ✅ シンプルなWeb UI

### Phase 2: 統一データモデル設計（新規）
```typescript
// セッション構造
interface Session {
  id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  result_level: 'completed' | 'mostly_completed' | 'partially_completed' | 'minimal' | 'not_completed';
  result_description: string;
}

// イベント構造（既存のものを拡張）
interface ActivityEvent {
  id: string;
  start_time: string;
  end_time: string;
  source: 'native' | 'browser';
  application: string;
  service?: string;
  window_title?: string;
  duration_seconds: number;
}

// 振り返り構造（新規）
interface Reflection {
  id: string;
  session_id: string;
  deviation_reason: string;
  reflection_details: string;
  created_at: string;
}
```

### Phase 3: 目的設定UIの実装（新規）
- 作業開始時の目的入力画面
- 具体的な目的設定（例：「ログイン機能を実装する」）
- 目標時間設定（オプション）

### Phase 4: セッション管理機能（新規）
- セッション開始/停止ボタン
- 現在の進捗表示
- 経過時間の表示

### Phase 5: 統一Timelineの実装（既存拡張）
- Windowsアプリ + ブラウザの統合表示
- 「流れ」の可視化
- ガントチャート形式

### Phase 6: 結果記録機能（新規）
- 作業終了時の結果入力
- 目標達成度の選択
- 具体的な成果の記述

### Phase 7: 振り返り機能（新規）
- 作業からの離脱理由の選択肢
- 自由入力欄
- フェードアウト候補との関連付け

### Phase 8: 過去比較機能（MVP後）
- 複数セッションの比較
- パターンの可視化
- 繰り返しの検出

### Phase 9: AI統合（MVP後）
- 行動の整理と要約
- パターン分析
- 次回の行動提案

## 推奨MVP範囲

### 必須機能（Phase 1-6）
1. ✅ Windows APIによるアクティブウィンドウ検出
2. ✅ 基本的なデータ収集と保存
3. 🆕 目的設定UI
4. 🆕 セッション管理（開始/停止）
5. 🆕 統一Timeline表示
6. 🆕 結果記録機能

### MVP後機能（Phase 7-9）
7. 振り返り機能
8. 過去比較機能
9. AI統合

## 技術構成の再設計

### 現実的なアプローチ（現在稼働中）
```
HTTP Server (Node.js)
├── Windows API (active-win)
├── Data Storage (JSON → SQLite)
├── Web UI (既存 + 新規)
└── Session Management
```

### 理想的なアプローチ（将来的）
```
Desktop App (Tauri/Rust)
├── Windows API
├── SQLite Database
├── Web UI
└── Edge Extension Integration
```

## 実装計画

### 短期目標（1-2週間）
1. 既存HTTPサーバーを拡張
2. 目的設定UIを追加
3. セッション管理機能を実装
4. 統一Timelineを改善

### 中期目標（1ヶ月）
1. 結果記録機能を追加
2. 振り返り機能を実装
3. データモデルを最適化
4. ユーザーテスト

### 長期目標（2-3ヶ月）
1. 過去比較機能
2. AI統合
3. Edge拡張統合
4. 本格的なデスクトップアプリ化

## 結論

新しい製品定義は非常に優れていますが、MVP範囲を現実的に縮小し、段階的に実装する必要があります。

**推奨アプローチ:**
1. 現在のHTTPサーバーアプローチを継続
2. 目的設定・セッション管理・Timeline・結果記録をMVPとして実装
3. 振り返り・過去比較・AIはMVP後に追加
4. TauriはCargo問題解決後に検討

このアプローチであれば、製品価値を早く検証でき、ユーザーフィードバックを得ながら段階的に機能を追加できます。