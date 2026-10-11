const activeWin = require('active-win');
const { v4: uuidv4 } = require('uuid');

/**
 * EventCollector - Raw Event収集ロジック
 * 
 * プラットフォーム抽象化を行い、Raw Eventを収集する
 * Raw EventはPCが観測した事実そのもの
 */
class EventCollector {
  constructor() {
    this.sessionId = null;
  }

  /**
   * セッションIDを設定
   * @param {string} sessionId - セッションID
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  /**
   * セッションIDをクリア
   */
  clearSessionId() {
    this.sessionId = null;
  }

  /**
   * ウィンドウ情報を収集
   * @returns {Promise<Object>} Raw Event
   */
  async collectWindowInfo() {
    try {
      const activeWindow = await activeWin();
      
      if (!activeWindow) {
        return null;
      }

      const rawEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'native',
        application: activeWindow.owner.name,
        service: null,
        window_title: activeWindow.title,
        process_id: activeWindow.owner.processId,
        session_id: this.sessionId
      };

      // サービス検出（ブラウザの場合）
      if (this.isBrowser(activeWindow.owner.name)) {
        rawEvent.service = this.detectService(activeWindow.title);
      }

      return rawEvent;
    } catch (error) {
      console.error('[EventCollector] Error collecting window info:', error);
      return null;
    }
  }

  /**
   * ブラウザかどうかを判定
   * @param {string} application - アプリケーション名
   * @returns {boolean}
   */
  isBrowser(application) {
    const appLower = application.toLowerCase();
    return appLower.includes('chrome') || 
           appLower.includes('edge') || 
           appLower.includes('firefox') ||
           appLower.includes('safari');
  }

  /**
   * サービスを検出
   * @param {string} windowTitle - ウィンドウタイトル
   * @returns {string|null}
   */
  detectService(windowTitle) {
    if (!windowTitle) return null;

    const title = windowTitle.toLowerCase();

    // YouTube
    if (title.includes('youtube.com') || title.includes('youtube')) {
      return 'YouTube';
    }
    
    // GitHub
    if (title.includes('github.com') || title.includes('github')) {
      return 'GitHub';
    }
    
    // Google
    if (title.includes('google.com') || title.includes('google search') || title.includes('google')) {
      return 'Google';
    }
    
    // Stack Overflow
    if (title.includes('stackoverflow.com') || title.includes('stackoverflow')) {
      return 'Stack Overflow';
    }
    
    // ChatGPT
    if (title.includes('chatgpt') || title.includes('openai')) {
      return 'ChatGPT';
    }

    return null;
  }
}

module.exports = EventCollector;
