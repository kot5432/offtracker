const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const eventsFile = path.join(__dirname, 'events.json');
const activitiesFile = path.join(__dirname, 'activities.json');

/**
 * 既存のevents.jsonをactivities.jsonに移行
 */
function migrateEventsToActivities() {
  console.log('[Migration] Starting migration from events.json to activities.json');

  try {
    // 既存のevents.jsonを読み込み
    if (!fs.existsSync(eventsFile)) {
      console.log('[Migration] events.json does not exist, nothing to migrate');
      return;
    }

    const data = fs.readFileSync(eventsFile, 'utf8');
    const events = JSON.parse(data);
    console.log('[Migration] Loaded', events.length, 'events from events.json');

    // 既存のactivities.jsonがあれば読み込み
    let existingActivities = [];
    if (fs.existsSync(activitiesFile)) {
      const existingData = fs.readFileSync(activitiesFile, 'utf8');
      existingActivities = JSON.parse(existingData);
      console.log('[Migration] Loaded', existingActivities.length, 'existing activities');
    }

    // イベントをActivityに変換
    const newActivities = events.map(event => ({
      id: uuidv4(),
      type: 'unknown', // 後でActivityGeneratorで再分類
      start_time: event.start_time,
      end_time: event.end_time,
      duration_seconds: event.duration_seconds,
      application: event.application,
      service: event.service,
      window_title: event.window_title,
      session_id: event.session_id,
      source_events: [event.id],
      confidence: 0.5 // デフォルト確信度
    }));

    console.log('[Migration] Converted', newActivities.length, 'events to activities');

    // 既存のアクティビティと結合
    const allActivities = [...existingActivities, ...newActivities];
    console.log('[Migration] Total activities after merge:', allActivities.length);

    // activities.jsonに保存
    fs.writeFileSync(activitiesFile, JSON.stringify(allActivities, null, 2));
    console.log('[Migration] Saved activities to activities.json');

    // バックアップを作成
    const backupFile = path.join(__dirname, 'events.json.backup');
    fs.copyFileSync(eventsFile, backupFile);
    console.log('[Migration] Created backup:', backupFile);

    console.log('[Migration] Migration completed successfully');
  } catch (error) {
    console.error('[Migration] Error during migration:', error);
    throw error;
  }
}

// 実行
if (require.main === module) {
  migrateEventsToActivities();
}

module.exports = { migrateEventsToActivities };
