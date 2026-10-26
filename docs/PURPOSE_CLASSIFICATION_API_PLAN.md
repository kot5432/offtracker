# 目的文のAI分類 API 計画

更新: 2026-10-20

## 目的

入力済みの目的文をAIで「娯楽・楽しむ時間」「勉強・学習」「課題・制作」「連絡・事務」「その他」「曖昧」に仮分類し、分類に応じて振り返り案を変える。AIは目的を決めつけず、最終判断は利用者に残す。

これはAI機能の小さな第一段階である。AIにセッション全体を分析させたり、原因や次の行動を自由文で作らせたりはしない。提案文は分類、本人の結果、PC記録の集計を使い、アプリ側で組み立てる。

## データの流れ

```text
OffTracker (Tauri)
  ─ HTTPS: 目的文だけ + 利用者認証 ─▶ 分類API (Cloudflare Workerを第一候補)
                                           ├ 入力サイズ・形式・利用者・回数を確認
                                           ├ AIプロバイダーへ分類依頼
                                           ├ 出力を許可カテゴリと信頼度に検証
                                           └ 分類結果だけ返す
  ◀───────────────────────────────────────
  ローカルで目的・分類・結果・行動記録を照合し、振り返り案を表示
```

1. 利用者が既存の目的欄に目的を書く。
2. 振り返りを開いたとき、分類結果が未保存ならアプリがHTTPSで分類APIを1回呼ぶ。
3. APIは目的文を検証し、サーバー側のAIキーまたはAIバインディングを使ってカテゴリを判定する。
4. APIは定義済みの分類・確信度だけを返す。アプリ側でも値を再検証する。
5. アプリは分類を表示し、既存の結果と行動記録をローカルで照合して任意の振り返り案を作る。
6. 分類結果はセッションIDに結び付けてローカル保存し、再表示時に同じAPIを繰り返し呼ばない。

## API契約案

Request:

```json
{
  "purpose_text": "数学の授業動画を見て、二次関数の問題を理解する"
}
```

Response:

```json
{
  "category": "learning",
  "confidence": "high",
  "ambiguous": false
}
```

`category` は `leisure | learning | task | admin | other | ambiguous`、`confidence` は `low | medium | high` に限定する。必要なら `ambiguous` を返し、曖昧な文章や複数の目的を無理に一つへまとめない。理由の長文や、AIによる次回行動の自由記述は返さない。モデル応答はJSON Schema等で制約し、サーバー・アプリ双方で列挙値、サイズ、型を確認する。

## 送信する／しないデータ

| データ | 目的分類APIへ送るか | 理由 |
|---|---|---|
| セッション目的文 | 送る（利用者に説明して同意を得た後） | 分類に必要 |
| Raw Event、アプリ名・サイト名 | 送らない | 目的分類には不要。アプリ内で使う |
| 行動の順序・時間・関係分類 | 送らない | 分類結果と記録の照合はローカルで行う |
| 結果・補足・振り返りメモ | 送らない | 目的分類には不要 |
| 氏名、メール、端末パス、ファイル名 | 送らない | 分類に不要 |

目的文に個人情報を書かないよう利用者へ案内し、API・AIプロバイダーのログへリクエスト本文を記録しない。目的文が端末の外に送られること、送信先、利用目的を送信前に画面で説明する。実セッションを使ったクラウド評価は、同意と送信先の扱いを確定するまで行わない。まず合成目的文だけで評価する。

## サーバーと認証の判断

- 第一候補はCloudflare Worker。小さなHTTP APIを一つ公開し、Worker側からAIプロバイダーを呼べるため、この用途の薄い中継層に合う。Workers AIを使う場合も、対応モデルの日本語分類品質を合成ケースで先に評価する。
- OpenAI API等を使う場合、プロバイダーのAPIキーはWorkerのSecretとして管理し、Tauriアプリへ含めない。
- Firebase Cloud FunctionsはFirebase Authenticationなどを既に使う場合に有力。Cloud Runはコンテナや複数のサーバー機能が必要になった段階で検討する。現状の小さな単一エンドポイントには運用要素が増えるため、最初の候補にはしない。
- サーバーを設置しただけでは公開APIの不正利用を防げない。現在のデスクトップアプリにユーザー認証はないため、認証が決まる前に一般公開しない。デスクトップに固定の共有APIキーを埋めても、アプリから取り出せるので利用者認証の代用にならない。
- 公開前に、利用者を識別する認証、ユーザー単位の回数制限、入力長と要求サイズの上限、AI利用上限、エラー時の停止、本文を含まない監査ログを用意する。CORS設定だけを認証として扱わない。
- [Workers AI JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/)はJSON Schemaに完全一致する応答を保証しない。今回の候補はJSON Mode対応が明記されたモデル一覧にも含まれないため、評価スクリプトはJSON形式を指示するだけにし、応答はローカルで検証する。API実装時もサーバー側で再検証し、不正なら分類なしへ切り替える。[現行モデル一覧](https://developers.cloudflare.com/workers-ai/models/)にあるQwen3 30B A3B（多言語対応）とgpt-oss-20Bを合成データ評価の候補にする。日本語の曖昧判定品質は未評価。
- [公式料金表](https://developers.cloudflare.com/workers-ai/platform/pricing/)（2026-10-20確認）ではWorkers AIに1日10,000 Neuronsの無料枠があり、Workers Paidは無料枠を超えると$0.011/1,000 Neurons。モデルごとの価格や有料要件・利用上限は、評価前に管理画面と料金表で確認する。

## 分類後の利用

- `leisure`: 本人が目標時間を決めた場合に限り、目標時間・実績時間・本人の実感を並べて見返す案を作る。
- `learning`: 学習に関連する記録時間と、本人が記録した結果・進捗を比べる案を作る。時間が長いことを「集中できた」と断定しない。
- `task`: 課題・制作に関連する記録時間と、本人が選んだ結果を比べる案を作る。記録だけから完成量や原因を推測しない。
- `admin`: 連絡・事務に関連する記録と、本人の結果を比べる案を作る。
- `other` / `ambiguous` / 低信頼度: 目的文をそのまま参照する中立的な案にするか、十分な根拠がなければ分類別の提案を出さない。

すべての提案は任意。分類の修正が必要と利用者レビューで分かった場合のみ、振り返り画面に一度の選択で直せる操作を追加する。追加質問を毎回必須にはしない。

## 分類品質の合成評価

`docs/mock-sessions/purpose-classification-cases.json` に24件の架空目的文を用意した。娯楽・学習・課題制作・連絡事務・その他の明確な文と、同じYouTubeでも目的が異なるケース、複数目的、意図の分からない短文を含む。

初期評価で使用した分類基準（v1/v2の記録用）:

- `leisure`: 楽しむ、休む、気分転換が主目的。
- `learning`: 知識・技能を理解、習得、練習することが主目的。
- `task`: 学校や仕事などの具体的な課題・提出物・成果物を進めることが主目的。一般的なPC作業や設定変更は含めない。
- `admin`: 連絡、予定調整、予約、申請などの手続きが主目的。
- `other`: 意図は明確だが上記4種以外。
- `ambiguous`: 目的を文章から読み取れない、または複数の種類が同時に含まれ一つに絞れない。

評価方法:

1. モデルに渡すのは各ケースの `purpose_text` だけ。`id`、`expected_category`、`reason` は採点用で、入力に含めない。
2. 同じ指示・同じ出力形式で全ケースを評価し、正答数だけでなく、複数目的の曖昧判定、信頼度、出力形式、応答時間を記録する。
3. 明確な単一目的は19件中18件以上正しく分類し、曖昧な5件は全件を `ambiguous` とすることを試作採用の目安にする。曖昧なケースに `high` を返す、未定義カテゴリや自由文を返す、入力にない意図を付与する場合は1件でも不合格。
4. 1モデル/1回の結果だけで決定しない。候補モデルは同じ24件を同一条件で複数回実行し、ぶれと応答時間を比較する。厳密な合格判定に満たないときは誤分類を分析し、分類文言や「その他／曖昧」の境界を見直す。
5. 評価ケースは目的文分類APIだけの試験に使う。セッション分析用の9ケース評価と混同しない。実際の利用者データは送らない。

採点には `scripts/score-purpose-classification.mjs` を使う。推論結果を次の形式でファイルに保存し、各ケースの`id`に対応する分類結果を記録してから実行する。実行時に正解データと照合し、欠落・重複・余分なID・不正なカテゴリ/確信度も検出する。結果JSONには合成文以外の秘密情報を含めない。

```json
{
  "provider": "provider-name",
  "model": "exact-model-id",
  "run": 1,
  "predictions": [
    {
      "id": "learning-math-video",
      "category": "learning",
      "confidence": "high",
      "ambiguous": false
    }
  ]
}
```

```powershell
node scripts/score-purpose-classification.mjs docs/mock-sessions/purpose-classification-results.json
```

初期プロンプト案（v1、Qwen3 4Bでの評価に使用）:

```text
入力された目的文を、娯楽・楽しむ時間、勉強・学習、課題・制作、連絡・事務、その他、曖昧のいずれかに分類してください。
目的文に書かれた意図だけを使い、アプリ名や一般的な連想から目的を推測しないでください。
複数の目的が同時に含まれる、または意図が読み取れない場合は曖昧にしてください。
成果物を進めることが中心なら課題・制作、知識を得ることが中心なら勉強・学習です。
分類理由や利用者向けの助言、原因推定は返さないでください。
許可済みのJSON Schemaに一致する分類、確信度、曖昧フラグだけを返してください。
```

この案は各モデルの入力で同じにし、合成データ評価の結果を見てから固定する。

初回評価で曖昧な文から目的を推測する傾向が出たため、v2では「行動」ではなく「なぜするか」を判定するよう明示し、境界例を追加した。Ollamaローカル比較スクリプトのv2指示では、動画/SNS/PC利用だけでは娯楽・学習とせず曖昧にすること、予約は事務、一般的なPC設定やバックアップはその他、成果物を進める学校・仕事の課題は課題・制作とすることを具体例で伝える。

### 目的分類モデルの試行状況（2026-10-20）

評価はすべてローカルのQwen3 4Bと架空の目的文だけで実施した。アプリからのAPI呼び出し、クラウド公開、実利用者データの送信は行っていない。

| 指示 | データ | 結果 | 判断 |
|---|---|---|---|
| v1 | 初期24件（調整用） | 明確16/19、曖昧1/5、高確信度の誤分類6 | 不合格 |
| v2 | 同じ初期24件（調整用） | 明確19/19、曖昧5/5、高確信度の誤分類0 | 初期セットのみ合格。汎化の証拠にはしない |
| v2 | 境界チャレンジ16件 | 明確10/10、曖昧2/6、高確信度の誤分類4 | 不合格。行動だけの文から目的を補う問題が残る |
| v3 | 未調整の確認用12件 | 明確8/9、曖昧0/3、高確信度の誤分類4 | 不合格。曖昧ケースをすべて誤って断定 |
| v4 | ルーブリックv2の新規28件 | 明確19/20、曖昧3/8、高確信度の誤分類6 | 不合格。明確目的はほぼ分類できるが、行動だけの文を保留できない |
| v4 | Cloudflare Workers AI gpt-oss-20b、ルーブリックv2の28件 | 明確19/20、曖昧6/8、不正・ポリシー違反2、高確信度の誤分類3 | 不合格。曖昧な目的への対応を優先してv5を評価する |
| v5 | Cloudflare Workers AI gpt-oss-20b、ルーブリックv2の28件 | 明確20/20、曖昧7/8、不正・ポリシー違反1、高確信度の誤分類1 | 不合格。利用量だけから娯楽意図を推測したため、leisure判定条件を明確化してv6を評価する |
| v6 | Cloudflare Workers AI gpt-oss-20b、ルーブリックv2の28件 | 明確17/20、曖昧5/8、不正・ポリシー違反4、高確信度の誤分類5 | 不合格。出力上限による空応答1件を含む。1回の評価では変更の効果と出力のばらつきを切り分けられないため、同条件でもう一度評価する |
| v6再実行 | Cloudflare Workers AI gpt-oss-20b、同じ28件 | 明確19/20、曖昧5/8、不正・ポリシー違反4、高確信度の誤分類3 | 不合格。曖昧正解数と違反数は同じだが、誤りの対象が一部入れ替わった |
| v6 | Cloudflare Workers AI gpt-oss-20b、未使用ホールドアウト24件 | 明確18/20、曖昧3/4、不正・ポリシー違反2、高確信度の誤分類2 | 不合格。未知の目的文でも誤分類と出力上限による空応答が残った |

v3の確認用セットは、プロンプト調整に使わずに保持した。誤りは「ファイルを整理する」をtask、「本を読む」「音楽を聴く」「ネットを見る」をそれぞれlearning/leisureへ高確信度で分類したもの。短い目的文から利用者の意図を読み取れないケースで、分類器がカテゴリを決めつけるリスクを確認した。したがって、調整用セットでのv2合格だけを根拠にAPIやUIへ接続しない。

この評価を受けて、分類境界自体も見直した。以前の定義はtaskを学校・仕事の提出物中心としており、「パソコン内のファイル整理」を`other`にする確認用正解と食い違っていた。今後は、分類したいものを「セッションで達成したい目的」とし、具体的な作業結果（個人ファイル整理を含む）を`task`に含める。明確な情報確認や端末環境調整は`other`とする。このため、v3確認用結果は当時の定義での歴史的記録として残し、以後の品質判定には使わない。

### 分類ルーブリックv2

| カテゴリ | 判定条件 | 例 |
|---|---|---|
| `leisure` | 楽しむ、休む、気分転換する意図が明示されている | 好きな番組を見てリラックスする |
| `learning` | 知識や技能を理解・習得・練習する意図が明示されている | 講義動画で微分を理解する |
| `admin` | 人への連絡、日程調整、予約、申請などを完了する目的 | 歯科の予約を変更する |
| `task` | 提出物・制作物を完成させる、または具体的な作業結果を得る目的。学業・仕事以外の個人作業も含む | レポートを仕上げる、重複ファイルを整理する |
| `other` | 目的と達成したいことが明確で、上記に当てはまらない日常の確認や環境調整 | 天気を確認して服を決める、画面の明るさを調整する |
| `ambiguous` | 行動しか書かれておらず目的が分からない、または異なる目的が複数あり一つに絞れない | YouTubeを見る、学習してからゲームをする |

優先順は、複数目的なら`ambiguous`、単一目的なら明示された娯楽・学習・事務を判定し、その他の具体的な作業結果は`task`、それ以外の明確な目的は`other`とする。対象サービス（YouTube、ブラウザ等）だけから目的を推測しない。`ambiguous`は`confidence: low`を返す。質問を毎回追加せず、分類できなければ中立的な振り返りにフォールバックする。

新しいルーブリック用の合成ケースは`docs/mock-sessions/purpose-classification-rubric-v2-cases.json`に28件用意した。分類器や画面には未接続。明確な20件中19件以上、曖昧な8件すべて、曖昧時の確信度`low`、不正出力なし、高確信度誤分類0件を初回ゲートとする。この小規模な一回の合格だけで採用は決めず、別の未使用ケースと複数回の安定性確認を行う。

```powershell
node scripts/evaluate-purpose-classification-ollama.mjs qwen3:4b docs/mock-sessions/purpose-classification-rubric-v2-cases.json
```

Cloudflare候補を評価するローカル用スクリプトも用意した。CloudflareのWorkers AI APIトークンとAccount IDは、Git管理対象外のプロジェクト直下`.cloudflare-credentials.json`にローカル保存し、PowerShellラッパーからプロセス環境変数としてNodeへ渡す。ファイルは`.gitignore`に登録済み。平文の秘密情報なので共有・同期フォルダーへ置かない。権限は評価に使うアカウントのWorkers AIに限定し、他サービス権限は追加しない。モデル評価以外のAPIや公開Workerは作らず、各呼び出しはCloudflareの利用枠・料金に計上される。

```powershell
.\scripts\evaluate-purpose-classification-cloudflare.ps1 -ModelName "@cf/qwen/qwen3-30b-a3b-fp8"
.\scripts\evaluate-purpose-classification-cloudflare.ps1 -ModelName "@cf/openai/gpt-oss-20b"
```

候補の最初の確認では`-MaxCases 1`を使って応答形式を確認してから、問題がなければ28件全体を評価する。結果は合成目的文と応答だけを含むJSONに保存する。どちらの候補も同じルーブリックv2を使い、同じ不合格条件を適用する。

2026-10-20のQwen3 4B診断では明確な目的19/20件、曖昧な目的3/8件が正解し、曖昧文を高確信度で誤分類したケースが6件あった。基準未達のため分類器へ採用しない。結果は`docs/mock-sessions/purpose-classification-rubric-v2-cases-qwen3-4b-2026-10-19T185000-690Z.json`。評価セットと分類器はアプリへ接続していない。

```powershell
node scripts/score-purpose-classification.mjs docs/mock-sessions/purpose-classification-rubric-v2-cases-qwen3-4b-2026-10-19T185000-690Z.json docs/mock-sessions/purpose-classification-rubric-v2-cases.json
```

### Cloudflare Qwen3 30Bの初回確認

- 28件を実行した記録では、全ケースの`result.response`が`null`で、分類テキストを取得できなかった。API成功・利用量の返却は確認できたが、分類性能は採点できない。出力ファイル: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-qwen-qwen3-30b-a3b-fp8-2026-10-19T191237-924Z.json`。
- 後続の1件確認で、`result.choices[0].message.content`も`null`であることを確認した。APIは成功を返し、エラーコードはなかった。分類テキストを返さないため、現状のQwen3候補は保留し、繰り返し実行しない。
- 初回28件の評価ファイルは`run_status: complete`だが、スクリプトの不具合で42レコードを含み、採点には使えない。ケースIDを一意にして見ると、分類文を取得できたのは13/28件で、13件は正解、15件は空応答だった（明確な目的12/20、曖昧1/8）。空応答の大半で`completion_tokens`が120上限に達していた。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T192425-194Z.json`。
- 観察された空応答は出力上限と重なり、GPT-OSSの標準的な推論設定が分類文を出す前に上限へ達した可能性が高い。CloudflareのGPT-OSS資料はResponses APIと推論レベルを案内しているため、評価条件を`reasoning.effort: low`、`max_output_tokens: 512`に変更する。Chat Completions形式の前回結果とは混ぜず、新しい実行として扱う。
- スクリプトの重複記録の不具合も修正した。今回の条件ではまず1件のスモークテストを行い、分類文を取得できたら同じ新条件で28件を最初から評価する。以前の出力から再開しない。
- 新条件のスモークテスト成功。`r2-leisure-1`を`leisure / high`と分類し、1.75秒で分類文を取得。594入力token、90出力token、13.25 neurons。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T193000-365Z.json`。形式確認のみで、精度評価には含めない。
- 新条件での28件実行は保存完了したが、Responses APIの出力抽出が推論テキストを分類回答として拾う場合があり、23件を誤って不正形式扱いした。精度評価として無効。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T193056-967Z.json`。抽出処理を修正し、assistantの`output_text`だけを分類結果として使う。
- 修正後のスモークテスト成功。`r2-leisure-1`の最終回答JSONを取得でき、`leisure / high`を確認した。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T193327-195Z.json`。精度評価には含めない。
- gpt-oss-20bの修正後28件評価が完了。明確な目的19/20件、曖昧な目的6/8件。不正・曖昧時の確信度ルール違反が2件、高確信度の誤分類が3件あり、初回ゲート不合格。誤りは「図書館の開館時間を確認し、いつ行くか決める」を`admin`、「勉強を進める」のように具体的な成果がない文を`task`、調査と先生への連絡を含む複数目的を`admin`としたもの。結果: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T193411-647Z.json`。
- この結果に合わせて共有プロンプトをv5に更新した。具体的な達成結果が一つに定まらない文は`ambiguous`、情報確認は決めたいことが書かれていれば`other`、確認と別の手続きが混在すれば`ambiguous`とする。これは改善仮説であり、まだ精度が上がったとは判断していない。次はgpt-oss-20bで形式確認を1件行い、成功したら同じ28件を全件評価する。
- v5の形式確認は成功。`r2-leisure-1`を`leisure / high`と分類した。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T193755-538Z.json`。これは形式確認のみで精度評価には含めない。実行環境からCloudflare APIのDNS解決ができず、28件評価はまだ実施できていない。利用者のPowerShellから次の全件コマンドを実行する。
- v5の28件評価では、明確な目的20/20件、曖昧な目的7/8件が正解。不正・ポリシー違反1件、高確信度の誤分類1件のためゲート不合格。唯一の誤りは「YouTubeで動画を2本見る」を`leisure / high`としたもの。視聴本数だけでは楽しむ意図が明示されないため、分類ルールに反する。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T193845-787Z.json`。
- v6では、`leisure`に楽しむ・休む・気分転換の意図を表す言葉を必須とし、利用本数や時間だけでは娯楽と推測しないルールを追加した。
- v6の形式確認は成功。`r2-leisure-1`を`leisure / high`と分類した。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T194135-219Z.json`。形式確認のみで精度評価には含めない。こちらの実行環境ではCloudflare APIのDNS解決ができず28件評価を開始できなかったため、利用者のPowerShellから全件コマンドを実行する。
- v6の28件評価では、明確な目的17/20件、曖昧な目的5/8件が正解。不正・ポリシー違反4件、高確信度の誤分類5件のためゲート不合格。曖昧な文を娯楽・課題・事務へ断定した誤りに加え、日常の確認や端末環境調整を課題と判定した。1件は出力token上限512まで推論し、再試行後も回答が空だった。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T194241-483Z.json`。v5より複数のカテゴリで結果が下がったため、すぐにプロンプトを重ねて変更せず、v6を同じ条件でもう一度評価して安定性を確認する。
- v6の再実行では明確な目的19/20件、曖昧な目的5/8件、不正・ポリシー違反4件、高確信度誤分類3件で、再びゲート不合格。出力上限512に達した空応答が1件。ほかに「音楽を流す」「学校の作業を進める」など曖昧な文3件を断定した。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-rubric-v2-cases--cf-openai-gpt-oss-20b-2026-10-19T194612-438Z.json`。2回で明確な正解数は17/20から19/20に変わった一方、曖昧は両方5/8。誤るケースも一部変わったため、安定した品質とは言えない。
- 既存28件へ合わせた調整を止め、別の合成ホールドアウト24件を`docs/mock-sessions/purpose-classification-v6-holdout-cases.json`に作成した。期待ラベルはモデルへ送らない。現行v6でこのセットを評価し、採用判断には使わず、未知の目的文への性能を調べる。採点は評価ファイルと同じホールドアウトJSONを指定する。

```powershell
.\scripts\evaluate-purpose-classification-cloudflare.ps1 -ModelName "@cf/openai/gpt-oss-20b" -CasesPath "docs/mock-sessions/purpose-classification-v6-holdout-cases.json"
node scripts/score-purpose-classification.mjs <評価結果JSON> docs/mock-sessions/purpose-classification-v6-holdout-cases.json
```

- v6のホールドアウト評価結果: 明確18/20件、曖昧3/4件。不正・ポリシー違反2件、高確信度誤分類2件でゲート不合格。市役所への連絡を`other`、目的が書かれていない読書を`learning`と高確信度で判定し、道順確認の1件では出力token上限512に達して回答が空になった。出力: `docs/mock-sessions/purpose-classification-cloudflare-purpose-classification-v6-holdout-cases--cf-openai-gpt-oss-20b-2026-10-19T195023-899Z.json`。既存ケースだけでなく未使用ケースでも誤りが出るため、現状のまま分類結果を確定値として使う設計にはしない。

### 振り返りでの分類の扱い

分類評価で誤りと空応答が確認されたため、振り返りでカテゴリを確定値として扱わない。現在の画面はローカルのキーワード判定を目安として表示し、利用者は必要なときだけ「分類を変更」から6択で直せる。変更は振り返りと一緒にSQLiteへ保存し、再表示時に復元する。選んだカテゴリに応じて「次に試せること」を更新する。未分類も選べ、分類を選ばなくても保存・完了できる。

今回の実装ではCloudflare APIを呼び出さず、目的文も送信しない。保存欄`purpose_category_override`は将来AIの仮分類を本人が訂正した場合にも使える。既存の振り返り行には新しい列を追加するだけで、過去データは削除しない。アプリ起動時のschema migration 5で追加する。

実装済み: 振り返り画面に任意の分類変更を追加し、変更した分類は保存・再表示される。選択内容を「次に試せること」の候補にも反映する。Rust側は許可された6値だけを保存する。`cargo run --manifest-path desktop/src-tauri/Cargo.toml`でビルドが完了し、アプリを起動した。画面上の操作確認はこれから行う。

過去セッションを選び直せるよう、Homeの過去セッション一覧を選択可能にし、選択したIDをTimelineとReflectionへ引き継ぐ。ReflectionはURLのsession_idから保存済みデータと振り返りを読み直す。これにより、保存済みの分類修正・本人の回答・記録を過去セッションから再確認できる。画面での操作確認は利用者のアプリ再起動後に行う。

```powershell
.\scripts\evaluate-purpose-classification-cloudflare.ps1 -ModelName "@cf/openai/gpt-oss-20b" -MaxCases 1
```

形式確認が成功したら:

```powershell
.\scripts\evaluate-purpose-classification-cloudflare.ps1 -ModelName "@cf/openai/gpt-oss-20b"
```

```powershell
.\scripts\evaluate-purpose-classification-cloudflare.ps1 -ModelName "@cf/openai/gpt-oss-20b" -MaxCases 1
```

形式確認が成功したら:

```powershell
.\scripts\evaluate-purpose-classification-cloudflare.ps1 -ModelName "@cf/openai/gpt-oss-20b"
```

```powershell
.\scripts\evaluate-purpose-classification-cloudflare.ps1 -ModelName "@cf/openai/gpt-oss-20b" -MaxCases 1
```

成功後、全件を実行する:

```powershell
.\scripts\evaluate-purpose-classification-cloudflare.ps1 -ModelName "@cf/openai/gpt-oss-20b"
```

評価結果ファイル:

- v1初期セット: `docs/mock-sessions/purpose-classification-qwen3-4b-2026-10-19T182806-875Z.json`
- v2初期セット: `docs/mock-sessions/purpose-classification-qwen3-4b-2026-10-19T183132-879Z.json`
- v2境界チャレンジ: `docs/mock-sessions/purpose-classification-purpose-classification-challenge-cases-qwen3-4b-2026-10-19T183444-829Z.json`
- v3未調整確認用: `docs/mock-sessions/purpose-classification-holdout-cases-qwen3-4b-2026-10-19T183658-703Z.json`

再評価コマンド例（第2引数で採点対象データを明示する）:

```powershell
node scripts/evaluate-purpose-classification-ollama.mjs qwen3:4b docs/mock-sessions/purpose-classification-holdout-cases.json
node scripts/score-purpose-classification.mjs docs/mock-sessions/purpose-classification-holdout-cases-qwen3-4b-<timestamp>.json docs/mock-sessions/purpose-classification-holdout-cases.json
```

**次の判断:** v5・v6とも品質ゲート不合格で、v6は未使用ホールドアウトでも不合格だった。振り返り画面でキーワード分類を任意に訂正して保存できるようにし、ビルドしてアプリを起動した。次は分類の変更・保存・再表示、変更しなくても完了できること、カテゴリに応じた提案更新を画面で確認する。フィードバックを反映してから、AI仮分類を同じ訂正可能な扱いで接続するか再判断する。送信同意・安全対策が済むまではアプリ/APIへ目的文を送らない。

### 初回ローカル評価（Qwen3 4B、v1、2026-10-20）

- 入力: 合成目的文24件。モデルへ送ったのは各ケースの目的文のみ。実際の目的文、アプリ履歴、外部APIは未使用。
- 結果: 明確な目的16/19件（基準18/19）、曖昧な目的1/5件（基準5/5）。不正形式は0件だったが、高い確信度での誤分類が6件あり、初期ゲート不合格。
- 主な誤り: 「YouTubeを見る」「SNSを見る」を娯楽と判断し、「パソコンを使う」をその他と判断。予約とバックアップ、PC設定を課題・制作に分類。複数目的の「復習しながらレポートを書く」を課題だけに分類。
- 所見: JSON形式の制約は満たした一方、カテゴリの意味境界と曖昧さの扱いが不十分。分類指示を具体例付きのv2へ改め、同じ24件で再評価する。合格までアプリへは接続しない。
- 出力と計測値: `docs/mock-sessions/purpose-classification-qwen3-4b-2026-10-19T182806-875Z.json`。これは単一モデル・単一試行の合成データ結果であり、一般的なモデル精度を示すものではない。

## 実装順と停止条件

1. 完了: `docs/mock-sessions/purpose-classification-cases.json` に合成目的文24件、`scripts/score-purpose-classification.mjs` に採点器を作成。正解ラベルはモデル入力へ含めない。
2. 完了: ローカルQwen3 4Bのv1/v2/v3を合成データで試行。調整用v2は初期24件に合格したが、境界チャレンジと未調整確認用で不合格。記録は上記の評価表を参照。
3. 完了: ファイル整理の分類矛盾を解消したルーブリックv2と新しい28件の合成評価セットを作成。ローカルQwen3 4Bは曖昧8件中5件を誤分類したため不採用。
4. 次: Cloudflare Workers AI上のQwen3 30B A3Bとgpt-oss-20Bを同じ合成セットで比較する。Cloudflareアカウントが利用可能になったら実施する。API認証情報はチャットへ貼らない。
5. 品質ゲートに合格してから、Worker APIを合成データで試作する。利用者認証、回数・費用上限、本文を残さないログを先に整える。
6. 送信同意の画面・通信失敗時の代替フローを整え、目的文を送る前に利用者へ明示する。実セッションを送るのはその後。

## 未決事項

- 推論先（Cloudflare Workers AIか、Worker経由のOpenAI API等）: 合成データ評価後に決める。
- アカウント・認証方式: サーバー公開前に決める。アプリには現時点で認証機能がない。
- 目的文の保存期間: AIプロバイダーの最新規約とログ設定を確認してから表示・記録する。
- API実装・クラウド公開・実セッション送信: 未実施。
