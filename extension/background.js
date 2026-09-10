// Supabase設定
const SUPABASE_URL = 'https://pgyczjsuuxulyftuuagq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_M3ePv_hOAcWp56L_nah4iA_w_sQ7YhW';

// アプリケーション状態
let currentUser = null;
let currentSession = null;
let accessToken = null;
let trackingEnabled = false;
let trackingInterval = null;

// URLからアプリ名を抽出
function getAppNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        
        // 一般的なサイト名のマッピング
        const siteNames = {
            'google.com': 'Google',
            'youtube.com': 'YouTube',
            'github.com': 'GitHub',
            'twitter.com': 'Twitter',
            'x.com': 'Twitter',
            'facebook.com': 'Facebook',
            'instagram.com': 'Instagram',
            'linkedin.com': 'LinkedIn',
            'reddit.com': 'Reddit',
            'stackoverflow.com': 'Stack Overflow',
            'amazon.com': 'Amazon',
            'netflix.com': 'Netflix',
            'spotify.com': 'Spotify',
            'notion.so': 'Notion',
            'slack.com': 'Slack',
            'discord.com': 'Discord',
            'zoom.us': 'Zoom',
            'microsoft.com': 'Microsoft',
            'office.com': 'Microsoft Office',
            'docs.google.com': 'Google Docs',
            'sheets.google.com': 'Google Sheets',
            'slides.google.com': 'Google Slides',
            'drive.google.com': 'Google Drive',
            'mail.google.com': 'Gmail',
            'calendar.google.com': 'Google Calendar',
            'chatgpt.com': 'ChatGPT',
            'openai.com': 'OpenAI',
            'claude.ai': 'Claude'
        };
        
        // 完全一致または部分一致をチェック
        for (const [domain, name] of Object.entries(siteNames)) {
            if (hostname === domain || hostname.endsWith('.' + domain)) {
                return name;
            }
        }
        
        // ドメイン名からアプリ名を生成
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            return parts[parts.length - 2]; // 例: google.com -> google
        }
        
        return hostname;
    } catch (error) {
        console.error('URL parsing error:', error);
        return 'Unknown';
    }
}

// URLからサービス名を抽出
function getServiceNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        
        if (pathname.includes('/watch')) return '動画';
        if (pathname.includes('/search')) return '検索';
        if (pathname.includes('/profile')) return 'プロフィール';
        if (pathname.includes('/settings')) return '設定';
        if (pathname.includes('/notifications')) return '通知';
        if (pathname.includes('/messages')) return 'メッセージ';
        if (pathname.includes('/home')) return 'ホーム';
        if (pathname.includes('/explore')) return '探索';
        
        return null;
    } catch (error) {
        return null;
    }
}

// Supabaseクライアント初期化（簡易版）
async function supabaseRequest(endpoint, options = {}) {
    const url = `${SUPABASE_URL}${endpoint}`;
    const headers = {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${accessToken || SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase request failed:', response.status, errorText);
            throw new Error(`Supabase request failed: ${response.status} - ${errorText}`);
        }
        
        // 空のレスポンスを処理
        const text = await response.text();
        if (!text) {
            return null;
        }
        
        return JSON.parse(text);
    } catch (error) {
        console.error('Supabase request error:', error);
        throw error;
    }
}

// イベントを記録
async function recordEvent(appName, serviceName, eventType, notes = null) {
    if (!currentUser || !trackingEnabled) {
        console.log('Event recording skipped:', { currentUser: !!currentUser, trackingEnabled });
        return;
    }
    
    try {
        console.log('Recording event:', { appName, serviceName, eventType, notes });
        
        await supabaseRequest('/rest/v1/events', {
            method: 'POST',
            body: JSON.stringify({
                user_id: currentUser.id,
                app_name: appName,
                service_name: serviceName,
                event_type: eventType,
                notes: notes
            })
        });
        
        console.log('Event recorded successfully:', { appName, serviceName, eventType });
    } catch (error) {
        console.error('Event recording error:', error);
    }
}

// アクティブタブを監視
async function trackActiveTab() {
    console.log('trackActiveTab called:', { trackingEnabled, currentSession: !!currentSession });
    
    if (!trackingEnabled) {
        console.log('Tracking not enabled, skipping');
        return;
    }
    
    if (!currentSession) {
        console.log('No current session, skipping');
        return;
    }
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Active tab:', tab);
        
        if (tab && tab.url) {
            const appName = getAppNameFromUrl(tab.url);
            const serviceName = getServiceNameFromUrl(tab.url);
            console.log('App info:', { appName, serviceName, url: tab.url });
            
            // イベントタイプを判定（簡易版）
            let eventType = 'focus';
            if (appName === 'YouTube' || appName === 'Netflix' || appName === 'Spotify') {
                eventType = 'distraction';
            }
            
            await recordEvent(appName, serviceName, eventType, `URL: ${tab.url}`);
        } else {
            console.log('No active tab or URL found');
        }
    } catch (error) {
        console.error('Tab tracking error:', error);
    }
}

// トラッキングを開始
function startTracking() {
    if (trackingEnabled) {
        console.log('Tracking already enabled');
        return;
    }
    
    console.log('Starting tracking:', { currentUser: !!currentUser, currentSession: !!currentSession });
    trackingEnabled = true;
    trackingInterval = setInterval(trackActiveTab, 60000); // 1分ごとに記録
    console.log('Tracking started successfully');
    
    // 即時実行してテスト
    trackActiveTab();
}

// タブ切り替えイベントリスナーを追加
chrome.tabs.onActivated.addListener((activeInfo) => {
    if (trackingEnabled && currentSession) {
        console.log('Tab switched, recording event');
        trackActiveTab();
    }
});

// タブ更新イベントリスナーを追加（URLが変わったとき）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (trackingEnabled && currentSession && changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated, recording event');
        trackActiveTab();
    }
});

// トラッキングを停止
function stopTracking() {
    if (!trackingEnabled) return;
    
    trackingEnabled = false;
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    console.log('Tracking stopped');
}

// メッセージ受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setUser') {
        currentUser = request.user;
        accessToken = request.accessToken;
        console.log('User and access token set:', { user: !!currentUser, accessToken: !!accessToken });
        sendResponse({ success: true });
    } else if (request.action === 'setSession') {
        currentSession = request.session;
        console.log('Session set:', { session: !!currentSession });
        sendResponse({ success: true });
    } else if (request.action === 'startTracking') {
        startTracking();
        sendResponse({ success: true });
    } else if (request.action === 'stopTracking') {
        stopTracking();
        sendResponse({ success: true });
    } else if (request.action === 'isTracking') {
        sendResponse({ tracking: trackingEnabled });
    } else if (request.action === 'getCurrentTab') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                sendResponse({
                    appName: getAppNameFromUrl(tabs[0].url),
                    serviceName: getServiceNameFromUrl(tabs[0].url),
                    url: tabs[0].url
                });
            } else {
                sendResponse({ error: 'No active tab' });
            }
        });
        return true; // 非同期レスポンス
    }
    
    return true;
});

// 拡張機能インストール時
chrome.runtime.onInstalled.addListener(() => {
    console.log('ActionTracker extension installed');
});
