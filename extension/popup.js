// Supabase設定
const SUPABASE_URL = 'https://pgyczjsuuxulyftuuagq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_M3ePv_hOAcWp56L_nah4iA_w_sQ7YhW';

// Supabaseクライアント初期化
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// アプリケーション状態
let currentUser = null;
let currentSession = null;
let sessionInterval = null;

// DOM要素
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form-inner');
const authMessage = document.getElementById('auth-message');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    setDefaultDates();
});

// 認証状態チェック
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        showAppScreen();
        loadDashboard();
    } else {
        showLoginScreen();
    }
    
    // 認証状態変更を監視
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            showAppScreen();
            loadDashboard();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showLoginScreen();
        }
    });
}

// イベントリスナー設定
function setupEventListeners() {
    // ログインフォーム
    loginForm.addEventListener('submit', handleLogin);
    
    // 新規登録フォーム
    signupForm.addEventListener('submit', handleSignup);
    
    // タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });
    
    // ログイン/新規登録切り替え
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('email-tab').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('email-tab').classList.remove('hidden');
    });
    
    // OAuthログイン
    document.getElementById('google-login').addEventListener('click', () => handleOAuthLogin('google'));
    document.getElementById('github-login').addEventListener('click', () => handleOAuthLogin('github'));
    
    // ログアウト
    logoutBtn.addEventListener('click', handleLogout);
    
    // ナビゲーション
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            switchView(view);
        });
    });
    
    // セッション管理
    document.getElementById('start-session').addEventListener('click', startSession);
    document.getElementById('end-session').addEventListener('click', endSession);
    
    // イベント記録
    document.getElementById('add-event').addEventListener('click', openEventModal);
    document.getElementById('add-event-session').addEventListener('click', openEventModal);
    
    // タイムライン
    document.getElementById('load-timeline').addEventListener('click', loadTimeline);
    
    // 行動ストーリー
    document.getElementById('generate-story').addEventListener('click', generateStory);
    
    // イベントモーダル
    document.getElementById('cancel-event').addEventListener('click', closeEventModal);
    document.getElementById('event-form').addEventListener('submit', handleEventSubmit);
}

// タブ切り替え
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(`${tab}-tab`).classList.add('active');
}

// 画面切り替え
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
}

function showAppScreen() {
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    userEmail.textContent = currentUser.email;
}

function switchView(view) {
    navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    views.forEach(v => {
        v.classList.remove('active');
    });
    
    document.getElementById(`${view}-view`).classList.add('active');
}

// デフォルト日付設定
function setDefaultDates() {
    const now = new Date();
    const today = now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    document.getElementById('timeline-date').value = today;
    document.getElementById('story-date').value = today;
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

// 新規登録処理
async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        showAuthMessage('登録確認メールを送信しました', 'success');
    } catch (error) {
        showAuthMessage(error.message, 'error');
    }
}

// OAuthログイン
async function handleOAuthLogin(provider) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
    } catch (error) {
        showAuthMessage(error.message, 'error');
    }
}

// ログアウト
async function handleLogout() {
    await supabaseClient.auth.signOut();
    if (currentSession) {
        endSession();
    }
}

// 認証メッセージ表示
function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
    
    setTimeout(() => {
        authMessage.textContent = '';
        authMessage.className = 'message';
    }, 5000);
}

// グローバルメッセージ表示
function showGlobalMessage(message, type = 'success') {
    const globalMessage = document.getElementById('global-message');
    globalMessage.textContent = message;
    globalMessage.className = `global-message ${type}`;
    
    setTimeout(() => {
        globalMessage.classList.add('hidden');
    }, 3000);
}

// ダッシュボードデータ読み込み
async function loadDashboard() {
    if (!currentUser) return;
    
    // ローカル時間の今日の日付を取得
    const now = new Date();
    const today = now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    
    try {
        // 今日のセッションデータ取得（日付フィルタなしで全データ取得）
        const { data: sessions, error: sessionsError } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('started_at', { ascending: false });
        
        if (sessionsError) throw sessionsError;
        
        // 今日のイベントデータ取得（日付フィルタなしで全データ取得）
        const { data: events, error: eventsError } = await supabaseClient
            .from('events')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (eventsError) throw eventsError;
        
        // 統計計算
        updateDashboardStats(sessions, events, today);
        updateCurrentSession(sessions);
        updateTopApps(events);
        
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// ダッシュボード統計更新
function updateDashboardStats(sessions, events, today) {
    let totalTime = 0;
    let focusTime = 0;
    let distractionCount = 0;
    
    // ローカル時間で今日の日付を取得
    const getLocalDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    };
    
    // 今日のセッションのみフィルタリング
    const todaySessions = sessions.filter(session => {
        const sessionDate = getLocalDate(session.started_at);
        return sessionDate === today;
    });
    
    // 今日のイベントのみフィルタリング
    const todayEvents = events.filter(event => {
        const eventDate = getLocalDate(event.created_at);
        return eventDate === today;
    });
    
    todaySessions.forEach(session => {
        const start = new Date(session.started_at);
        const end = session.ended_at ? new Date(session.ended_at) : new Date();
        const duration = (end - start) / 1000 / 60; // 分
        totalTime += duration;
        
        if (session.session_type === 'focus') {
            focusTime += duration;
        }
    });
    
    todayEvents.forEach(event => {
        if (event.event_type === 'distraction') {
            distractionCount++;
        }
    });
    
    document.getElementById('today-time').textContent = formatTime(totalTime);
    document.getElementById('focus-time').textContent = formatTime(focusTime);
    document.getElementById('distraction-count').textContent = `${distractionCount}回`;
    document.getElementById('current-status').textContent = currentSession ? '作業中' : 'アイドル';
}

// 時間フォーマット
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}時間${mins}分`;
}

// 現在のセッション更新
function updateCurrentSession(sessions) {
    const activeSession = sessions.find(s => !s.ended_at);
    
    if (activeSession) {
        currentSession = activeSession;
        const duration = (new Date() - new Date(activeSession.started_at)) / 1000 / 60;
        document.getElementById('current-session').innerHTML = `
            <p>作業中: ${formatTime(duration)}</p>
        `;
        document.getElementById('current-session').classList.add('active');
        document.getElementById('start-session').classList.add('hidden');
        document.getElementById('end-session').classList.remove('hidden');
        
        // セッション時間をリアルタイム更新（1秒ごと）
        if (sessionInterval) clearInterval(sessionInterval);
        sessionInterval = setInterval(() => {
            if (currentSession) {
                const duration = (new Date() - new Date(currentSession.started_at)) / 1000 / 60;
                document.getElementById('current-session').innerHTML = `
                    <p>作業中: ${formatTime(duration)}</p>
                `;
            }
        }, 1000);
    } else {
        currentSession = null;
        document.getElementById('current-session').innerHTML = '<p>作業中のセッションはありません</p>';
        document.getElementById('current-session').classList.remove('active');
        document.getElementById('start-session').classList.remove('hidden');
        document.getElementById('end-session').classList.add('hidden');
        
        if (sessionInterval) {
            clearInterval(sessionInterval);
            sessionInterval = null;
        }
    }
}

// 上位アプリ更新
function updateTopApps(events) {
    const appTimes = {};
    
    events.forEach(event => {
        if (!appTimes[event.app_name]) {
            appTimes[event.app_name] = 0;
        }
        appTimes[event.app_name]++;
    });
    
    const sortedApps = Object.entries(appTimes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const topAppsContainer = document.getElementById('top-apps');
    
    if (sortedApps.length === 0) {
        topAppsContainer.innerHTML = '<p>データがありません</p>';
        return;
    }
    
    topAppsContainer.innerHTML = sortedApps.map(([app, count]) => `
        <div class="top-app-item">
            <span class="top-app-name">${app}</span>
            <span class="top-app-time">${count}回</span>
        </div>
    `).join('');
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
        
        // 自動で「作業開始」イベントを作成
        await supabaseClient
            .from('events')
            .insert({
                user_id: currentUser.id,
                app_name: '作業開始',
                service_name: null,
                event_type: 'focus',
                notes: 'セッション開始時に自動作成'
            });
        
        await loadDashboard(); // ダッシュボードを再読み込み
        showGlobalMessage('セッションを開始しました（自動トラッキング有効）');
        
    } catch (error) {
        console.error('Session start error:', error);
        showGlobalMessage('セッションの開始に失敗しました', 'error');
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
        loadDashboard();
        showGlobalMessage('セッションを終了しました（自動トラッキング停止）');
        
    } catch (error) {
        console.error('Session end error:', error);
        showGlobalMessage('セッションの終了に失敗しました', 'error');
    }
}

// タイムライン読み込み
async function loadTimeline() {
    if (!currentUser) return;
    
    const date = document.getElementById('timeline-date').value;
    
    try {
        // 全イベントを取得
        const { data: events, error } = await supabaseClient
            .from('events')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // ローカル時間でフィルタリング
        const getLocalDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
        };
        
        const filteredEvents = events.filter(event => {
            const eventDate = getLocalDate(event.created_at);
            return eventDate === date;
        });
        
        renderTimeline(filteredEvents);
        
    } catch (error) {
        console.error('Timeline load error:', error);
        showGlobalMessage('タイムラインの読み込みに失敗しました', 'error');
    }
}

// タイムライン描画
function renderTimeline(events) {
    const container = document.getElementById('timeline-container');
    
    if (events.length === 0) {
        container.innerHTML = '<p>データがありません</p>';
        return;
    }
    
    container.innerHTML = events.map(event => {
        const time = new Date(event.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        const typeLabel = {
            focus: '集中',
            distraction: '脱線',
            break: '休憩'
        }[event.app_name] || event.event_type;
        
        return `
            <div class="timeline-item ${event.event_type}">
                <div class="timeline-time">${time}</div>
                <div class="timeline-type ${event.event_type}">${typeLabel}</div>
                <div class="timeline-app">${event.app_name}${event.service_name ? ` - ${event.service_name}` : ''}</div>
                ${event.notes ? `<div class="timeline-notes">${event.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

// 行動ストーリー生成
async function generateStory() {
    if (!currentUser) return;
    
    const date = document.getElementById('story-date').value;
    const startDate = `${date}T00:00:00`;
    const endDate = `${date}T23:59:59`;
    
    // ローディング表示
    document.getElementById('story-container').classList.add('hidden');
    document.getElementById('story-loading').classList.remove('hidden');
    
    try {
        // データ取得
        const { data: events, error: eventsError } = await supabaseClient
            .from('events')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: true });
        
        if (eventsError) throw eventsError;
        
        const { data: sessions, error: sessionsError } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('started_at', startDate)
            .lte('started_at', endDate)
            .order('started_at', { ascending: true });
        
        if (sessionsError) throw sessionsError;
        
        // Azure AI API経由でストーリー生成
        const story = await generateStoryWithAI(events, sessions);
        
        // ストーリー表示
        document.getElementById('story-container').innerHTML = `
            <div class="story-content">
                ${story}
            </div>
        `;
        
    } catch (error) {
        console.error('Story generation error:', error);
        document.getElementById('story-container').innerHTML = `
            <p class="error">ストーリーの生成に失敗しました: ${error.message}</p>
        `;
    } finally {
        document.getElementById('story-container').classList.remove('hidden');
        document.getElementById('story-loading').classList.add('hidden');
    }
}

// Azure AI APIでストーリー生成
async function generateStoryWithAI(events, sessions) {
    try {
        const response = await fetch('/api/generate-story', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                events,
                sessions,
                date: document.getElementById('story-date').value
            })
        });
        
        if (!response.ok) {
            throw new Error('AI API呼び出しに失敗しました');
        }
        
        const data = await response.json();
        return data.story;
        
    } catch (error) {
        console.error('AI API error:', error);
        // フォールバック: ローカルでシンプルなストーリー生成
        return generateLocalStory(events, sessions);
    }
}

// ローカルでのシンプルなストーリー生成（フォールバック）
function generateLocalStory(events, sessions) {
    if (events.length === 0 && sessions.length === 0) {
        return '<p>この日の行動データはありません。</p>';
    }
    
    let story = `<h3>${document.getElementById('story-date').value}の行動ストーリー</h3>`;
    
    // セッション情報
    if (sessions.length > 0) {
        story += '<p><strong>作業セッション:</strong></p>';
        story += '<ul>';
        sessions.forEach(session => {
            const start = new Date(session.started_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            const end = session.ended_at ? new Date(session.ended_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '継続中';
            const duration = session.ended_at 
                ? formatTime((new Date(session.ended_at) - new Date(session.started_at)) / 1000 / 60)
                : '進行中';
            story += `<li>${start} - ${end} (${duration})</li>`;
        });
        story += '</ul>';
    }
    
    // イベント情報
    if (events.length > 0) {
        const focusEvents = events.filter(e => e.event_type === 'focus').length;
        const distractionEvents = events.filter(e => e.event_type === 'distraction').length;
        const breakEvents = events.filter(e => e.event_type === 'break').length;
        
        story += '<p><strong>行動パターン:</strong></p>';
        story += '<ul>';
        story += `<li>集中: ${focusEvents}回</li>`;
        story += `<li>脱線: ${distractionEvents}回</li>`;
        story += `<li>休憩: ${breakEvents}回</li>`;
        story += '</ul>';
        
        // よく使ったアプリ
        const appCounts = {};
        events.forEach(e => {
            appCounts[e.app_name] = (appCounts[e.app_name] || 0) + 1;
        });
        const topApps = Object.entries(appCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        if (topApps.length > 0) {
            story += '<p><strong>よく使用したアプリ:</strong></p>';
            story += '<ul>';
            topApps.forEach(([app, count]) => {
                story += `<li>${app}: ${count}回</li>`;
            });
            story += '</ul>';
        }
    }
    
    story += '<p><em>※ AI分析機能を有効にするには、Cloudflare Pages Functionsを設定してください。</em></p>';
    
    return story;
}

// イベントモーダル
function openEventModal() {
    document.getElementById('event-modal').classList.remove('hidden');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.add('hidden');
    document.getElementById('event-form').reset();
}

// イベント送信
async function handleEventSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const app = document.getElementById('event-app').value;
    const service = document.getElementById('event-service').value;
    const type = document.getElementById('event-type').value;
    const notes = document.getElementById('event-notes').value;
    
    try {
        const { error } = await supabaseClient
            .from('events')
            .insert({
                user_id: currentUser.id,
                app_name: app,
                service_name: service || null,
                event_type: type,
                notes: notes || null
            });
        
        if (error) throw error;
        
        closeEventModal();
        showGlobalMessage('イベントを記録しました');
        loadDashboard();
        
    } catch (error) {
        console.error('Event submit error:', error);
        showGlobalMessage('イベントの記録に失敗しました', 'error');
    }
}

// ページアンロード時にセッション終了
window.addEventListener('beforeunload', () => {
    if (currentSession) {
        // ナビゲーター.sendBeaconを使用してセッション終了を送信
        const data = JSON.stringify({
            session_id: currentSession.id,
            ended_at: new Date().toISOString()
        });
        
        navigator.sendBeacon('/api/end-session', data);
    }
});
