# OffTracker

OffTracker は、PCを使う前に本人が決めた目的と、実際の行動記録・本人の結果を見比べ、自分なりの気づきを得るためのアプリです。

## 現在の開発対象

現在のメインアプリは Tauri 2 と Rust、SQLite で作られたデスクトップアプリです。

- Rustアプリとデータベース: `desktop/src-tauri/`
- アプリ画面: `desktop/ui/`
- 画面例・レビュー用プロトタイプ: `desktop/ui/review/`
- 現在の開発計画: [MASTER_DEVELOPMENT_PLAN.md](MASTER_DEVELOPMENT_PLAN.md)

画面は「目的 → 結果 → 行動記録 → 振り返り」の順に進みます。画面例は架空データを使うレビュー素材で、実際の分析機能とは区別しています。

## リポジトリ内の別プロジェクト・参考資産

- `desktop/_legacy_electron/` と `desktop/src/`: 旧Electron版とその共有JavaScript。旧版からの参照があるため、移動・削除しないでください。
- ルートの `package.json` / `package-lock.json`: 旧Electron向けのNode設定です。現在のTauriアプリは `desktop/src-tauri/Cargo.toml` から管理します。
- `web/` と `functions/`: 以前のWeb版資産。
- `extension/`: ブラウザー拡張機能の資産。
- `docs/_archive/`: 古い計画・調査記録・仕様書。履歴として内容を保持しています。

## ドキュメント

現在参照すべき文書と各文書の役割は [docs/README.md](docs/README.md) にまとめています。
