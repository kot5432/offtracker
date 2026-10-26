# Cloudflare Pages

このPagesプロジェクトが配信するのは、旧Web版の `web/` です。現在の開発対象であるTauriデスクトップアプリとは別のものです。

## Git連携の設定

CloudflareのPagesプロジェクト `off-tracker` で次の設定を使います。

| 設定 | 値 |
|---|---|
| Production branch | `main` |
| Root directory | 空欄（リポジトリのルート） |
| Build command | `exit 0` |
| Build output directory | `web` |

リポジトリルートを指定するのは、`functions/`をPages Functionsとして認識させるためです。公開ファイルは`web/index.html`から始まります。設定の正本はルートの[`wrangler.toml`](../wrangler.toml)です。

## Pages Functionsの環境変数

`functions/api/`の機能を使う場合は、Cloudflareのプロジェクト設定で必要な値を**Secret**として登録します。値をソースコードやGitに保存しないでください。

- `/api/end-session`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `/api/generate-story`: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`; 任意で`AZURE_OPENAI_DEPLOYMENT`

この環境変数は旧Web版向けです。TauriアプリはCloudflare Pages FunctionsやWorkers AIを使いません。目的分類のWorkers AIスクリプトで使うAPIトークンとも別です。

## デプロイ後の確認

`https://off-tracker.pages.dev/`で旧Web版のトップ画面が開くことを確認します。Pages Functionsを使う場合は、必要なSecretを設定した後に対象APIも確認します。Git連携済みなら、`main`へのpushでPagesが再デプロイされます。
