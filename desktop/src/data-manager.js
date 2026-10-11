const fs = require('fs');
const path = require('path');
const supabaseClient = require('./supabase-client');

class DataManager {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.rawEventsFile = path.join(this.baseDir, 'raw-events.json');
    this.activitiesFile = path.join(this.baseDir, 'activities.json');
    this.sessionsFile = path.join(this.baseDir, 'current-session.json');
    this.resultsFile = path.join(this.baseDir, 'results.json');
    this.reflectionsFile = path.join(this.baseDir, 'reflections.json');
  }

  // Ensure file exists
  ensureFile(filePath) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
    }
  }

  // Read JSON file
  readJsonFile(filePath) {
    try {
      this.ensureFile(filePath);
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return [];
    }
  }

  // Write JSON file
  writeJsonFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
    }
  }

  // Raw Event operations
  saveRawEvent(rawEvent) {
    // Save to local file
    const rawEvents = this.readJsonFile(this.rawEventsFile);
    rawEvents.push(rawEvent);
    this.writeJsonFile(this.rawEventsFile, rawEvents);

    // Save to Supabase if available
    if (supabaseClient.isAvailable()) {
      supabaseClient.createRawEvent(rawEvent);
    }
  }

  getRawEventsBySession(sessionId) {
    const rawEvents = this.readJsonFile(this.rawEventsFile);
    return rawEvents.filter(event => event.session_id === sessionId);
  }

  // Activity operations
  saveActivity(activity) {
    // Save to local file
    const activities = this.readJsonFile(this.activitiesFile);
    activities.push(activity);
    this.writeJsonFile(this.activitiesFile, activities);

    // Save to Supabase if available
    if (supabaseClient.isAvailable()) {
      supabaseClient.createActivity(activity);
    }
  }

  getActivitiesBySession(sessionId) {
    const activities = this.readJsonFile(this.activitiesFile);
    return activities.filter(activity => activity.session_id === sessionId);
  }

  getAllActivities() {
    return this.readJsonFile(this.activitiesFile);
  }

  // Session operations
  saveSession(session) {
    this.writeJsonFile(this.sessionsFile, session);

    // Save to Supabase if available
    if (supabaseClient.isAvailable()) {
      supabaseClient.createSession(session);
    }
  }

  getSession() {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = fs.readFileSync(this.sessionsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading session:', error);
    }
    return null;
  }

  updateSession(session) {
    this.writeJsonFile(this.sessionsFile, session);

    // Update in Supabase if available
    if (supabaseClient.isAvailable()) {
      supabaseClient.updateSession(session.id, session);
    }
  }

  // Result operations
  saveResult(result) {
    const results = this.readJsonFile(this.resultsFile);
    results.push(result);
    this.writeJsonFile(this.resultsFile, results);

    // Save to Supabase if available
    if (supabaseClient.isAvailable()) {
      supabaseClient.createResult(result);
    }
  }

  // Reflection operations
  saveReflection(reflection) {
    const reflections = this.readJsonFile(this.reflectionsFile);
    reflections.push(reflection);
    this.writeJsonFile(this.reflectionsFile, reflections);

    // Save to Supabase if available
    if (supabaseClient.isAvailable()) {
      supabaseClient.createReflection(reflection);
    }
  }
}

module.exports = new DataManager();
