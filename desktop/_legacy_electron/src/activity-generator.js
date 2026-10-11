const { v4: uuidv4 } = require('uuid');
const PurposeAnalyzer = require('../../src/purpose-analyzer');

/**
 * ActivityGenerator - Activity生成ロジック
 * 
 * Raw EventからActivityを生成する
 * ActivityはEventをまとめた意味のある行動
 */
class ActivityGenerator {
  constructor() {
    this.MIN_DURATION_SECONDS = 3; // 3分未満のイベントは無視
    this.MERGE_GAP_SECONDS = 60; // 1分以内の連続イベントはマージ
    this.purposeAnalyzer = new PurposeAnalyzer();
  }

  /**
   * Raw EventからActivityを生成
   * @param {Array} rawEvents - Raw Eventの配列
   * @param {string} purpose - 目的（オプション）
   * @returns {Array} Activityの配列
   */
  generateActivities(rawEvents, purpose = null) {
    console.log('[ActivityGenerator] generateActivities called with', rawEvents.length, 'raw events');
    
    if (!rawEvents || rawEvents.length === 0) {
      console.log('[ActivityGenerator] No raw events to process');
      return [];
    }

    // Raw Eventをマージしてdurationを計算
    const mergedEvents = this.mergeConsecutiveEvents(rawEvents);
    console.log('[ActivityGenerator] Merged events:', mergedEvents.length);

    // 短時間のイベントをフィルタリング
    const significantEvents = mergedEvents.filter(event => {
      const duration = this.calculateDuration(event);
      const isSignificant = duration >= this.MIN_DURATION_SECONDS;
      if (!isSignificant) {
        console.log('[ActivityGenerator] Filtered out short event:', event.application, duration, 'seconds');
      }
      return isSignificant;
    });

    console.log('[ActivityGenerator] Significant events after filtering:', significantEvents.length);

    if (significantEvents.length === 0) {
      console.log('[ActivityGenerator] No significant events');
      return [];
    }

    // Activityに変換
    const activities = significantEvents.map(event => {
      const activity = this.eventToActivity(event);
      console.log('[ActivityGenerator] Created activity:', activity.application, activity.duration_seconds, 'seconds');
      return activity;
    });

    // 目的との関係を分析
    if (purpose) {
      console.log('[ActivityGenerator] Analyzing purpose relation for', purpose);
      const analyzedActivities = this.purposeAnalyzer.analyzeActivities(activities, purpose);
      console.log('[ActivityGenerator] Purpose analysis completed');
      return analyzedActivities;
    }

    console.log('[ActivityGenerator] Generated', activities.length, 'activities');
    return activities;
  }

  /**
   * イベントの持続時間を計算
   * @param {Object} event - イベント
   * @returns {number} 持続時間（秒）
   */
  calculateDuration(event) {
    // Raw Event: timestampとend_timeから計算
    if (event.timestamp && event.end_time) {
      const start = new Date(event.timestamp);
      const end = new Date(event.end_time);
      return (end - start) / 1000;
    }
    // Legacy Event: start_timeとend_timeから計算
    if (event.start_time && event.end_time) {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      return (end - start) / 1000;
    }
    // duration_secondsがあれば使用
    if (event.duration_seconds) {
      return event.duration_seconds;
    }
    return 0;
  }

  /**
   * 同じアプリの連続イベントをマージ
   * @param {Array} events - イベントの配列
   * @returns {Array} マージされたイベントの配列
   */
  mergeConsecutiveEvents(events) {
    // アプリごとにグループ化
    const grouped = {};
    events.forEach(event => {
      const key = this.getAppKey(event);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });

    // 各グループで連続イベントをマージ
    const merged = [];
    for (const [appKey, appEvents] of Object.entries(grouped)) {
      // 時間順にソート（timestamp優先、なければstart_time）
      appEvents.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp) : new Date(a.start_time);
        const timeB = b.timestamp ? new Date(b.timestamp) : new Date(b.start_time);
        return timeA - timeB;
      });

      // 連続イベントをマージ
      const mergedAppEvents = this.mergeGroup(appEvents);
      merged.push(...mergedAppEvents);
    }

    // 時間順にソート（timestamp優先、なければstart_time）
    merged.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp) : new Date(a.start_time);
      const timeB = b.timestamp ? new Date(b.timestamp) : new Date(b.start_time);
      return timeA - timeB;
    });

    return merged;
  }

  /**
   * アプリのキーを取得
   * @param {Object} event - イベント
   * @returns {string} アプリのキー
   */
  getAppKey(event) {
    if (event.service) {
      return `${event.application}/${event.service}`;
    }
    return event.application;
  }

  /**
   * グループ内の連続イベントをマージ
   * @param {Array} events - イベントの配列
   * @returns {Array} マージされたイベントの配列
   */
  mergeGroup(events) {
    if (events.length === 0) {
      return [];
    }

    const merged = [];
    let currentEvent = { ...events[0] };

    for (let i = 1; i < events.length; i++) {
      const nextEvent = events[i];
      
      // 時刻を取得（timestamp優先、なければstart_time）
      const currentEndTime = currentEvent.end_time ? new Date(currentEvent.end_time) : new Date(currentEvent.timestamp);
      const nextStartTime = nextEvent.timestamp ? new Date(nextEvent.timestamp) : new Date(nextEvent.start_time);

      // 連続しているかチェック
      const gap = (nextStartTime - currentEndTime) / 1000;

      if (gap < this.MERGE_GAP_SECONDS) {
        // マージ
        if (nextEvent.end_time) {
          currentEvent.end_time = nextEvent.end_time;
        } else {
          currentEvent.end_time = nextEvent.timestamp;
        }
        // durationを計算
        if (currentEvent.timestamp && currentEvent.end_time) {
          currentEvent.duration_seconds = (new Date(currentEvent.end_time) - new Date(currentEvent.timestamp)) / 1000;
        }
        if (!currentEvent.source_events) {
          currentEvent.source_events = [];
        }
        currentEvent.source_events.push(nextEvent.id);
      } else {
        // 現在のイベントを追加
        if (!currentEvent.source_events) {
          currentEvent.source_events = [currentEvent.id];
        }
        merged.push(currentEvent);
        currentEvent = { ...nextEvent };
      }
    }

    // 最後のイベントを追加
    if (!currentEvent.source_events) {
      currentEvent.source_events = [currentEvent.id];
    }
    merged.push(currentEvent);

    return merged;
  }

  /**
   * イベントをActivityに変換
   * @param {Object} event - イベント
   * @returns {Object} Activity
   */
  eventToActivity(event) {
    const activity = {
      id: uuidv4(),
      type: this.classifyActivity(event),
      start_time: event.start_time || event.timestamp,
      end_time: event.end_time,
      duration_seconds: event.duration_seconds,
      application: event.application,
      service: event.service,
      window_title: event.window_title,
      session_id: event.session_id,
      source_events: event.source_events || [event.id],
      confidence: this.calculateConfidence(event)
    };

    return activity;
  }

  /**
   * アクティビティタイプを分類
   * @param {Object} event - イベント
   * @returns {string} アクティビティタイプ
   */
  classifyActivity(event) {
    const appLower = event.application.toLowerCase();
    const service = event.service;

    // YouTube, X, Reddit, Discord は distraction_candidate
    if (service === 'YouTube' || 
        appLower.includes('x.com') || 
        appLower.includes('twitter') ||
        appLower.includes('reddit') ||
        appLower.includes('discord')) {
      return 'distraction_candidate';
    }

    // Google, Stack Overflow は research
    if (service === 'Google' || service === 'Stack Overflow') {
      return 'research';
    }

    // VS Code, Word, Excel, PowerPoint は work
    if (appLower.includes('vs code') || 
        appLower.includes('visual studio code') ||
        appLower.includes('word') ||
        appLower.includes('excel') ||
        appLower.includes('powerpoint') ||
        appLower.includes('pdf')) {
      return 'work';
    }

    // デフォルトは unknown
    return 'unknown';
  }

  /**
   * 確信度を計算
   * @param {Object} event - イベント
   * @returns {number} 確信度（0-1）
   */
  calculateConfidence(event) {
    // source_eventsが多いほど確信度が高い
    const sourceEventCount = event.source_events ? event.source_events.length : 1;
    
    // 持続時間が長いほど確信度が高い
    const duration = event.duration_seconds || 0;
    
    // 基本確信度は0.5
    let confidence = 0.5;
    
    // source_events数に応じて確信度を上げる
    confidence += Math.min(sourceEventCount * 0.1, 0.3);
    
    // 持続時間に応じて確信度を上げる
    confidence += Math.min(duration / 600, 0.2); // 10分で最大
    
    return Math.min(confidence, 1.0);
  }
}

module.exports = ActivityGenerator;
