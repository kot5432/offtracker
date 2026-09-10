// Supabase設定
const SUPABASE_URL = 'https://pgyczjsuuxulyftuuagq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_M3ePv_hOAcWp56L_nah4iA_w_sQ7YhW';

// Supabaseクライアント初期化
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// アプリケーション状態
let currentUser = null;
let currentSession = null;

// DOM要素
const loginScreen = document.getElementById('login-screen');
const sessionScreen = document.getElementById('session-screen');
const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const sessionStatus = document.getElementById('session-status');
const startSessionBtn = document.getElementById('start-session');
const endSessionBtn = document.getElementById('end-session');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// 認証状態チェック
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        showSessionScreen();
        checkCurrentSession();
    } else {
        showLoginScreen();
    }
    
    // 認証状態変更を監視
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            showSessionScreen();
            checkCurrentSession();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            currentSession = null;
            showLoginScreen();
        }
    });
}

// イベントリスナー設定
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    startSessionBtn.addEventListener('click', startSession);
    endSessionBtn.addEventListener('click', endSession);
}

// 画面切り替え
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    sessionScreen.classList.add('hidden');
}

function showSessionScreen() {
    loginScreen.classList.add('hidden');
    sessionScreen.classList.remove('hidden');
}

// ログイン処理
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        showAuthMessage('ログインしました', 'success');
    } catch (error) {
        showAuthMessage(error.message, 'error');
    }
}

// 認証メッセージ表示
function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
    authMessage.classList.remove('hidden');
    
    setTimeout(() => {
        authMessage.classList.add('hidden');
    }, 3000);
}

// 現在のセッションチェック
async function checkCurrentSession() {
    if (!currentUser) return;
    
    try {
        const { data: sessions, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('started_at', { ascending: false });
        
        if (error) throw error;
        
        const activeSession = sessions.find(s => !s.ended_at);
        
        if (activeSession) {
            currentSession = activeSession;
            updateSessionStatus(true);
        } else {
            currentSession = null;
            updateSessionStatus(false);
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

// セッションステータス更新
function updateSessionStatus(isActive) {
    if (isActive) {
        sessionStatus.textContent = 'セッション進行中';
        sessionStatus.className = 'status active';
        startSessionBtn.classList.add('hidden');
        endSessionBtn.classList.remove('hidden');
    } else {
        sessionStatus.textContent = 'セッション停止中';
        sessionStatus.className = 'status inactive';
        startSessionBtn.classList.remove('hidden');
        endSessionBtn.classList.add('hidden');
    }
}

// セッション開始
async function startSession() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('sessions')
            .insert({
                user_id: currentUser.id,
                started_at: new Date().toISOString(),
                session_type: 'focus'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        currentSession = data;
        
        // background.jsにユーザーとセッション情報を送信
        chrome.runtime.sendMessage({
            action: 'setUser',
            user: currentUser,
            accessToken: (await supabaseClient.auth.getSession()).data.session?.access_token
        });
        chrome.runtime.sendMessage({
            action: 'setSession',
            session: currentSession
        });
        
        // 自動トラッキングを開始
        chrome.runtime.sendMessage({ action: 'startTracking' });
        
        updateSessionStatus(true);
        
    } catch (error) {
        console.error('Session start error:', error);
        alert('セッションの開始に失敗しました');
    }
}

// セッション終了
async function endSession() {
    if (!currentSession) return;
    
    try {
        const { error } = await supabaseClient
            .from('sessions')
            .update({
                ended_at: new Date().toISOString()
            })
            .eq('id', currentSession.id);
        
        if (error) throw error;
        
        // 自動トラッキングを停止
        chrome.runtime.sendMessage({ action: 'stopTracking' });
        
        currentSession = null;
        updateSessionStatus(false);
        
    } catch (error) {
        console.error('Session end error:', error);
        alert('セッションの終了に失敗しました');
    }
}
