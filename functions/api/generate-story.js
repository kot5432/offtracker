// Cloudflare Pages Function for Azure AI API integration
// This function handles story generation using Azure OpenAI Service

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // リクエストボディの解析
        const body = await request.json();
        const { events, sessions, date } = body;
        
        // Azure AI APIの設定（環境変数から取得）
        const azureOpenAIEndpoint = env.AZURE_OPENAI_ENDPOINT;
        const azureOpenAIKey = env.AZURE_OPENAI_KEY;
        const azureOpenAIDeployment = env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
        
        if (!azureOpenAIEndpoint || !azureOpenAIKey) {
            return new Response(
                JSON.stringify({ error: 'Azure AI API configuration is missing' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        // プロンプトの構築
        const prompt = buildStoryPrompt(events, sessions, date);
        
        // Azure OpenAI APIの呼び出し
        const story = await callAzureOpenAI(
            azureOpenAIEndpoint,
            azureOpenAIKey,
            azureOpenAIDeployment,
            prompt
        );
        
        return new Response(
            JSON.stringify({ story }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
        
    } catch (error) {
        console.error('Story generation error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// プロンプト構築
function buildStoryPrompt(events, sessions, date) {
    let prompt = `以下の行動データに基づいて、${date}の行動ストーリーを日本語で作成してください。
ユーザーの行動パターン、集中と脱線の傾向、生産性の高い時間帯などを分析し、
読みやすく洞察に満ちたストーリーとしてまとめてください。

`;
    
    // セッション情報
    if (sessions && sessions.length > 0) {
        prompt += '【作業セッション】\n';
        sessions.forEach((session, index) => {
            const start = new Date(session.started_at).toLocaleTimeString('ja-JP');
            const end = session.ended_at ? new Date(session.ended_at).toLocaleTimeString('ja-JP') : '継続中';
            const duration = session.ended_at 
                ? Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 1000 / 60)
                : null;
            prompt += `${index + 1}. ${start} - ${end} (${duration ? duration + '分' : '進行中'}) タイプ: ${session.session_type}\n`;
        });
        prompt += '\n';
    }
    
    // イベント情報
    if (events && events.length > 0) {
        prompt += '【行動イベント】\n';
        events.forEach((event, index) => {
            const time = new Date(event.created_at).toLocaleTimeString('ja-JP');
            const typeLabel = {
                focus: '集中',
                distraction: '脱線',
                break: '休憩'
            }[event.event_type] || event.event_type;
            prompt += `${index + 1}. ${time} [${typeLabel}] ${event.app_name}`;
            if (event.service_name) {
                prompt += ` (${event.service_name})`;
            }
            if (event.notes) {
                prompt += ` - ${event.notes}`;
            }
            prompt += '\n';
        });
        prompt += '\n';
    }
    
    prompt += `
【分析の観点】
- 集中が続いた時間帯とその理由
- 脱線が起きたタイミングとトリガー
- 作業のリズムとパターン
- 生産性を高めるための提案
- 繰り返されている行動の傾向

【出力形式】
マークダウン形式で、見出しや箇条書きを適切に使用して読みやすくまとめてください。
`;
    
    return prompt;
}

// Azure OpenAI APIの呼び出し
async function callAzureOpenAI(endpoint, apiKey, deployment, prompt) {
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'system',
                    content: 'あなたは行動分析の専門家です。ユーザーのPC使用データを分析し、洞察に満ちた行動ストーリーを作成してください。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}
