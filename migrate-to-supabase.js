const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Data files
const baseDir = path.join(__dirname, 'desktop/_legacy_electron');
const rawEventsFile = path.join(baseDir, 'raw-events.json');
const activitiesFile = path.join(baseDir, 'activities.json');
const currentSessionFile = path.join(baseDir, 'current-session.json');
const resultsFile = path.join(baseDir, 'results.json');
const reflectionsFile = path.join(baseDir, 'reflections.json');

// Read JSON file
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Migrate sessions
async function migrateSessions() {
  console.log('Migrating sessions...');
  
  const currentSession = readJsonFile(currentSessionFile);
  if (currentSession && currentSession.id) {
    const { data, error } = await supabase
      .from('sessions')
      .upsert({
        id: currentSession.id,
        purpose: currentSession.purpose,
        target_time_minutes: currentSession.target_time_minutes,
        start_time: currentSession.start_time,
        end_time: currentSession.end_time,
        status: currentSession.status,
        actual_duration_minutes: currentSession.actual_duration_minutes
      });
    
    if (error) {
      console.error('Error migrating session:', error);
    } else {
      console.log('Session migrated:', currentSession.id);
    }
  }
}

// Migrate raw events
async function migrateRawEvents() {
  console.log('Migrating raw events...');
  
  const rawEvents = readJsonFile(rawEventsFile);
  console.log(`Found ${rawEvents.length} raw events`);
  
  let migrated = 0;
  for (const event of rawEvents) {
    const { error } = await supabase
      .from('raw_events')
      .upsert({
        id: event.id,
        timestamp: event.timestamp,
        source: event.source,
        application: event.application,
        service: event.service,
        window_title: event.window_title,
        process_id: event.process_id,
        session_id: event.session_id,
        end_time: event.end_time,
        duration_seconds: event.duration_seconds
      });
    
    if (!error) {
      migrated++;
    } else {
      console.error('Error migrating raw event:', error);
    }
  }
  
  console.log(`Migrated ${migrated}/${rawEvents.length} raw events`);
}

// Migrate activities
async function migrateActivities() {
  console.log('Migrating activities...');
  
  const activities = readJsonFile(activitiesFile);
  console.log(`Found ${activities.length} activities`);
  
  let migrated = 0;
  for (const activity of activities) {
    const { error } = await supabase
      .from('activities')
      .upsert({
        id: activity.id,
        type: activity.type,
        start_time: activity.start_time,
        end_time: activity.end_time,
        duration_seconds: activity.duration_seconds,
        application: activity.application,
        service: activity.service,
        window_title: activity.window_title,
        session_id: activity.session_id,
        source_events: activity.source_events,
        confidence: activity.confidence
      });
    
    if (!error) {
      migrated++;
    } else {
      console.error('Error migrating activity:', error);
    }
  }
  
  console.log(`Migrated ${migrated}/${activities.length} activities`);
}

// Migrate results
async function migrateResults() {
  console.log('Migrating results...');
  
  const results = readJsonFile(resultsFile);
  console.log(`Found ${results.length} results`);
  
  let migrated = 0;
  for (const result of results) {
    const { error } = await supabase
      .from('results')
      .upsert({
        id: result.id,
        session_id: result.session_id,
        result_level: result.result_level,
        result_description: result.result_description,
        what_wasnt_done: result.what_wasnt_done
      });
    
    if (!error) {
      migrated++;
    } else {
      console.error('Error migrating result:', error);
    }
  }
  
  console.log(`Migrated ${migrated}/${results.length} results`);
}

// Migrate reflections
async function migrateReflections() {
  console.log('Migrating reflections...');
  
  const reflections = readJsonFile(reflectionsFile);
  console.log(`Found ${reflections.length} reflections`);
  
  let migrated = 0;
  for (const reflection of reflections) {
    const { error } = await supabase
      .from('reflections')
      .upsert({
        id: reflection.id,
        session_id: reflection.session_id,
        cause_hypothesis: reflection.deviation_reason,
        cause_feedback: reflection.reflection_details
      });
    
    if (!error) {
      migrated++;
    } else {
      console.error('Error migrating reflection:', error);
    }
  }
  
  console.log(`Migrated ${migrated}/${reflections.length} reflections`);
}

// Main migration function
async function migrate() {
  console.log('Starting migration to Supabase...');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    await migrateSessions();
    await migrateRawEvents();
    await migrateActivities();
    await migrateResults();
    await migrateReflections();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
