export const PURPOSE_CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ['leisure', 'learning', 'task', 'admin', 'other', 'ambiguous'] },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    ambiguous: { type: 'boolean' }
  },
  required: ['category', 'confidence', 'ambiguous'],
  additionalProperties: false
};

export const PURPOSE_CLASSIFICATION_PROMPT = [
  '入力された目的文を、leisure、learning、task、admin、other、ambiguousのいずれかに分類してください。',
  '最初に、目的文に達成したい結果が一つだけ具体的に書かれているか確認してください。',
  '各カテゴリの定義:',
  '- leisure: 楽しむ、休む、気分転換することが明示された目的。動画・SNS・ゲーム等の対象だけでは分類しない。',
  '- learning: 知識や技能を理解・習得・練習・復習することが明示された目的。',
  '- admin: 人や組織への連絡、日程調整、予約、申請など、その手続き自体を完了する目的。具体的な手続きでもtaskよりadminを優先する。',
  '- task: 提出物や制作物を完成させる、具体的な作業結果を得る目的。学業・仕事に限らず、写真の整理や重複ファイル削除もtask。',
  '- other: 目的と達成したいことが明確で、上記に当てはまらない日常の情報確認や端末環境の調整。例: 天気を見て服を決める、荷物状況を確認する、画面の明るさを調整する。',
  '- ambiguous: 達成したい結果が具体的に書かれていない、行動だけで目的を読み取れない、または異なる目的・結果が複数あり一つに決められない。',
  '「勉強する」「作業を進める」など、分野や活動だけで具体的な結果が分からない場合はambiguousです。もっともらしい結果を補ってはいけません。',
  'leisureに分類するには、楽しむ、休む、気分転換する意図を表す言葉が目的文に必要です。動画やゲームの利用本数・時間など、利用量だけではleisureと判断せず、具体的な結果もなければambiguousにしてください。',
  '「YouTubeを見る」「本を読む」「音楽を流す」「ネットで調べ物をする」「学校の作業をする」は、それだけでは目的が分からないのでambiguousです。',
  '対象や使うアプリから意図を推測しないでください。書かれていない理由を補わないでください。',
  '娯楽と学習など異なる目的が同じ文に並ぶ場合、主目的を勝手に選ばずambiguousにしてください。',
  '一つの結果を決めるための情報確認は、その確認後にしたいことが明確ならotherです。情報を調べるだけで決めたいことが書かれていない場合はambiguousです。',
  '調査や確認の中に連絡・予約など別の手続きも含まれる場合は、adminを優先せず、複数目的としてambiguousにしてください。',
  'ambiguousの場合はconfidenceをlowにしてください。',
  '分類理由や助言は返さず、指定されたJSONだけを返してください。'
].join('\n');
