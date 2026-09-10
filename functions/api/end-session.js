// Cloudflare Pages Function for ending sessions
// This function handles session end requests (used for beacon on page unload)

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // リクエストボディの解析
        const body = await request.json();
        const { session_id, ended_at } = body;
        
        // Supabase設定（環境変数から取得）
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            return new Response(
                JSON.stringify({ error: 'Supabase configuration is missing' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        // セッション終了をSupabaseに送信
        const response = await fetch(`${supabaseUrl}/rest/v1/sessions?id=eq.${session_id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                ended_at: ended_at
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to end session');
        }
        
        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
        
    } catch (error) {
        console.error('Session end error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
