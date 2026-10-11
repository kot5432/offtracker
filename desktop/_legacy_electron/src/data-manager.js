const fs = require('fs');
const path = require('path');
const supabaseClient = require('../../src/supabase-client');

/**
 * DataManager - データ管理ロジック
 * 
 * Raw EventとActivityの保存・読み込みを管理
 * ローカルファイルとSupabaseの両方に保存する
 */
class DataManager {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.rawEventsFile = path.join(baseDir, 'raw-events.json');
    this.activitiesFile = path.join(baseDir, 'activities.json');
  }

  /**
   * Raw Eventを保存
   * @param {Object} rawEvent - Raw Event
   */
  saveRawEvent(rawEvent) {
    try {
      let rawEvents = [];
      
      if (fs.existsSync(this.rawEventsFile)) {
        const data = fs.readFileSync(this.rawEventsFile, 'utf8');
        rawEvents = JSON.parse(data);
      }
      
      rawEvents.push(rawEvent);
      fs.writeFileSync(this.rawEventsFile, JSON.stringify(rawEvents, null, 2));
      
      console.log('[DataManager] Raw event saved:', rawEvent.id);
      
      // Save to Supabase if available
      if (supabaseClient.isAvailable()) {
        supabaseClient.createRawEvent(rawEvent);
      }
    } catch (error) {
      console.error('[DataManager] Error saving raw event:', error);
    }
  }

  /**
   * Activityを保存
   * @param {Object} activity - Activity
   */
  saveActivity(activity) {
    try {
      let activities = [];
      
      if (fs.existsSync(this.activitiesFile)) {
        const data = fs.readFileSync(this.activitiesFile, 'utf8');
        activities = JSON.parse(data);
      }
      
      activities.push(activity);
      fs.writeFileSync(this.activitiesFile, JSON.stringify(activities, null, 2));
      
      console.log('[DataManager] Activity saved:', activity.id);
      
      // Save to Supabase if available
      if (supabaseClient.isAvailable()) {
        supabaseClient.createActivity(activity);
      }
    } catch (error) {
      console.error('[DataManager] Error saving activity:', error);
    }
  }

  /**
   * セッションIDでRaw Eventを取得
   * @param {string} sessionId - セッションID
   * @returns {Array} Raw Eventの配列
   */
  getRawEventsBySessionId(sessionId) {
    try {
      if (!fs.existsSync(this.rawEventsFile)) {
        return [];
      }
      
      const data = fs.readFileSync(this.rawEventsFile, 'utf8');
      const rawEvents = JSON.parse(data);
      
      return rawEvents.filter(event => event.session_id === sessionId);
    } catch (error) {
      console.error('[DataManager] Error getting raw events:', error);
      return [];
    }
  }

  /**
   * セッションIDでActivityを取得
   * @param {string} sessionId - セッションID
   * @returns {Array} Activityの配列
   */
  getActivitiesBySessionId(sessionId) {
    try {
      if (!fs.existsSync(this.activitiesFile)) {
        return [];
      }
      
      const data = fs.readFileSync(this.activitiesFile, 'utf8');
      const activities = JSON.parse(data);
      
      return activities.filter(activity => activity.session_id === sessionId);
    } catch (error) {
      console.error('[DataManager] Error getting activities:', error);
      return [];
    }
  }

  /**
   * 全てのActivityを取得
   * @returns {Array} Activityの配列
   */
  getAllActivities() {
    try {
      if (!fs.existsSync(this.activitiesFile)) {
        return [];
      }
      
      const data = fs.readFileSync(this.activitiesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[DataManager] Error getting all activities:', error);
      return [];
    }
  }

  /**
   * セッションIDでActivityを削除
   * @param {string} sessionId - セッションID
   */
  deleteActivitiesBySessionId(sessionId) {
    try {
      if (!fs.existsSync(this.activitiesFile)) {
        return;
      }
      
      const data = fs.readFileSync(this.activitiesFile, 'utf8');
      const activities = JSON.parse(data);
      
      const filtered = activities.filter(activity => activity.session_id !== sessionId);
      fs.writeFileSync(this.activitiesFile, JSON.stringify(filtered, null, 2));
      
      console.log('[DataManager] Activities deleted for session:', sessionId);
    } catch (error) {
      console.error('[DataManager] Error deleting activities:', error);
    }
  }

  /**
   * セッションIDでRaw Eventを削除
   * @param {string} sessionId - セッションID
   */
  deleteRawEventsBySessionId(sessionId) {
    try {
      if (!fs.existsSync(this.rawEventsFile)) {
        return;
      }
      
      const data = fs.readFileSync(this.rawEventsFile, 'utf8');
      const rawEvents = JSON.parse(data);
      
      const filtered = rawEvents.filter(event => event.session_id !== sessionId);
      fs.writeFileSync(this.rawEventsFile, JSON.stringify(filtered, null, 2));
      
      console.log('[DataManager] Raw events deleted for session:', sessionId);
    } catch (error) {
      console.error('[DataManager] Error deleting raw events:', error);
    }
  }
}

module.exports = DataManager;
