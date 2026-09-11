# OffTracker - 行動分析プラットフォーム

PC上の行動履歴を収集・分析し、「何にどれだけ時間を使ったか」だけでなく、「どのような流れで行動し、なぜ集中や脱線が起きたのか」を可視化する行動理解プラットフォーム。

## プロジェクト構成

```
offtracker/
├── web/                    # Webダッシュボード
│   ├── index.html         # メインUI
│   └── style.css          # スタイルシート
├── desktop/               # Tauriデスクトップアプリ（開発中）
├── functions/             # Cloudflare Pages Functions
│   └── api/
├── extension/             # ブラウザ拡張機能（保留）
├── docs/                  # ドキュメント
│   ├── README.md          # 詳細README
│   ├── PROGRESS.md        # 進捗状況
│   ├── ELECTRON_TAURI_COMPARISON.md  # 技術比較
│   └── TAURI_MIGRATION_PLAN.md      # 移行計画
└── .gitignore
```

## 現在の状態

### ✅ 完了
- WebダッシュボードUI完成
- Supabase認証システム
- Cloudflare Pagesデプロイ
- GitHub連携による自動デプロイ

### 🔲 開発中
- Tauriデスクトップアプリ
- データ収集機能
- ネイティブアプリ統合

## 開発計画

詳細は [docs/PROGRESS.md](docs/PROGRESS.md) を参照してください。

## クイックスタート

### Webダッシュボード
Cloudflare Pagesで自動デプロイされています。

### デスクトップアプリ（開発中）
Tauriを使用したネイティブアプリを開発中です。

## 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **バックエンド**: Supabase (PostgreSQL)
- **ホスティング**: Cloudflare Pages
- **デスクトップ**: Tauri (Rust + Web技術)

## ドキュメント

- [プロジェクト概要](docs/README.md)
- [進捗状況](docs/PROGRESS.md)
- [技術比較](docs/ELECTRON_TAURI_COMPARISON.md)
- [移行計画](docs/TAURI_MIGRATION_PLAN.md)

## ライセンス

MIT License