# Tauri移行計画

## 現在のプロジェクト構造整理

### 不要なファイルの削除
- 多数のzipファイル（app (1).zip - app (51).zip）を削除
- プロジェクトをクリーンな状態にする

### 移行前の整理
```
offtracker/
├── .git/
├── .gitignore
├── index.html          # メインWeb UI
├── style.css           # スタイルシート
├── README.md           # プロジェクトドキュメント
├── PROGRESS.md         # 進捗状況
├── ELECTRON_TAURI_COMPARISON.md  # 技術比較
├── extension/          # 既存のブラウザ拡張機能（保留）
└── functions/          # Cloudflare Pages Functions（保留）
```

---

## Tauriプロジェクト構成案

### 推奨構造
```
offtracker/
├── web/                     # Webダッシュボード（既存コード）
│   ├── index.html
│   ├── style.css
│   └── (既存Webコード)
├── desktop/                 # Tauriデスクトップアプリ
│   ├── src-tauri/          # Rustバックエンド
│   │   ├── src/
│   │   │   ├── main.rs     # エントリーポイント
│   │   │   ├── commands.rs # データ収集コマンド
│   │   │   └── lib.rs      # 共通ロジック
│   │   ├── Cargo.toml      # Rust依存関係
│   │   ├── tauri.conf.json # Tauri設定
│   │   └── icons/          # アプリアイコン
│   └── src/                # フロントエンド（Webコード）
│       ├── index.html      # Tauri用に調整
│       ├── style.css
│       └── main.js         # Tauriとの通信ロジック
├── functions/              # Cloudflare Pages Functions（変更なし）
│   └── api/
├── extension/             # ブラウザ拡張機能（保留・将来検討）
├── docs/                  # ドキュメント
│   ├── README.md
│   ├── PROGRESS.md
│   └── ELECTRON_TAURI_COMPARISON.md
└── .gitignore
```

---

## 移行ステップ

### ステップ1: プロジェクト整理
1. 不要なzipファイルを削除
2. ディレクトリ構造を再編成
3. Gitにコミット

### ステップ2: Tauri環境セットアップ
1. **Rustインストール**
   - Windows: `winget install Rustlang.Rust.MSVC`
   - または https://rustup.rs/

2. **Node.jsインストール**（既存ならスキップ）
   - Node.js 18+ が必要

3. **Tauri CLIインストール**
   ```bash
   cargo install tauri-cli
   ```

4. **Tauriプロジェクト作成**
   ```bash
   cd offtracker
   cargo tauri init
   ```

### ステップ3: 既存Webコードの統合
1. **Web UIのTauri対応**
   - index.htmlの調整
   - Tauri API呼び出しの追加
   - プロセス監視UIの追加

2. **データ収集ロジックの実装**
   - Rustでプロセス監視実装
   - Supabaseとの連携
   - ローカルストレージ管理

### ステップ4: ビルドとテスト
1. **開発ビルド**
   ```bash
   cargo tauri dev
   ```

2. **リリースビルド**
   ```bash
   cargo tauri build
   ```

### ステップ5: GitHub連携
1. 既存リポジトリにTauriコードを追加
2. 自動デプロイ設定（将来的に検討）

---

## 技術的な質問

### ❓ わからないことがあれば教えてください

1. **Rust学習方法**
   - Rustlingsチュートリアルから始めるべきか？
   - オンラインコースの推奨はありますか？

2. **プロセス監視の実装**
   - Windowsでプロセス監視するライブラリは何が良いですか？
   - Rustのライブラリ（sysinfoなど）の推奨は？

3. **既存Supabase連携**
   - TauriからSupabaseに接続する方法は？
   - 既存の認証システムを再利用できますか？

4. **データ収集方法**
   - Windows APIを直接呼ぶべきか？
   - サードパーティライブラリの推奨は？

5. **開発環境**
   - 推奨のIDEは？（VS Code、IntelliJ Rustプラグインなど）
   - デバッグ方法は？

6. **パッケージング**
   - Windowsインストーラーの作成方法は？
   - コード署名は必要ですか？

---

## 開発スケジュール案

### 週1: 環境セットアップ
- Rust学習（基礎）
- Tauriプロジェクト作成
- 既存Webコードの統合

### 週2: データ収集実装
- プロセス監視の実装
- Supabase連携
- 基本的なUI調整

### 週3: 機能拡張
- バックグラウンド動作
- データ同期
- エラーハンドリング

### 週4: テストと改善
- ユーザーテスト
- バグ修正
- パフォーマンス最適化

---

## 注意点

### ⚠️ 重要な考慮事項

1. **ブラウザ拡張機能の将来**
   - 現在のextension/ディレクトリはどうする？
   - Tauriに統合するか、別途維続するか？

2. **Webダッシュボードとの関係**
   - Tauriアプリはスタンドアロンか？
   - Webダッシュボードも継続して使用するか？

3. **認証システム**
   - 既存のSupabase認証を継続使用
   - Tauriアプリ内での認証フロー

4. **データの重複**
   - ローカルデータとクラウドデータの同期
   - オフライン機能の検討

---

## 次のステップ

### 🎯 即座に開始できること
1. プロジェクト整理（zipファイル削除）
2. Rust環境セットアップ
3. Tauriプロジェクト作成

### 📋 事前に決定すべきこと
1. ブラウザ拡張機能の将来（維続/廃止）
2. Webダッシュボードとの連携方針
3. データ収集の詳細要件

どのステップから始めますか？また、上記の質問についてお答えいただければ、より具体的なアドバイスができます。