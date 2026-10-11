const activeWin = require('active-win');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const EventCollector = require('./src/event-collector');
const ActivityGenerator = require('./src/activity-generator');
const DataManager = require('./src/data-manager');

const dataFile = path.join(__dirname, 'window-data.json');
const eventsFile = path.join(__dirname, 'events.json');

// Initialize new components
const eventCollector = new EventCollector();
const activityGenerator = new ActivityGenerator();
const dataManager = new DataManager(__dirname);

// Tracking state
let lastWindow = null;
let currentEventStart = null;
let lastRawEvent = null;
let pollingInterval = null;
let currentSessionId = null;
let currentPurpose = null; // Keep track of current purpose
let rawEvents = []; // Collect raw events during tracking

// Detect service from window title (simple heuristic)
function detectService(windowTitle, application) {
  console.log('[detectService] Called with:', { windowTitle, application });

  const appLower = application.toLowerCase();
  if (!appLower.includes('chrome') && !appLower.includes('edge') && !appLower.includes('firefox')) {
    console.log('[detectService] Application is not a browser, returning null');
    return null;
  }

  const title = windowTitle.toLowerCase();
  console.log('[detectService] Title lowercase:', title);

  // YouTube
  if (title.includes('youtube.com') || title.includes('youtube')) {
    console.log('[detectService] Detected YouTube');
    return 'YouTube';
  }
  
  // GitHub
  if (title.includes('github.com') || title.includes('github')) {
    console.log('[detectService] Detected GitHub');
    return 'GitHub';
  }
  
  // Google
  if (title.includes('google.com') || title.includes('google search') || title.includes('google')) {
    console.log('[detectService] Detected Google');
    return 'Google';
  }
  
  // Stack Overflow
  if (title.includes('stackoverflow.com') || title.includes('stackoverflow')) {
    console.log('[detectService] Detected Stack Overflow');
    return 'Stack Overflow';
  }
  
  // Reddit
  if (title.includes('reddit.com') || title.includes('reddit')) {
    console.log('[detectService] Detected Reddit');
    return 'Reddit';
  }
  
  // X (Twitter)
  if (title.includes('twitter.com') || title.includes('x.com') || title.includes('twitter') || title.includes('x ')) {
    console.log('[detectService] Detected X');
    return 'X';
  }
  
  // Discord
  if (title.includes('discord.com') || title.includes('discord')) {
    console.log('[detectService] Detected Discord');
    return 'Discord';
  }

  console.log('[detectService] No service detected, returning null');
  return null;
}

// Convert window data to event format
function windowToEventData(windowData, source) {
  const service = detectService(windowData.title, windowData.owner);

  return {
    id: uuidv4(),
    start_time: null, // Will be set when event starts
    end_time: null, // Will be set when event ends
    source: source,
    application: windowData.owner,
    service: service,
    window_title: windowData.title,
    process_id: windowData.id,
    duration_seconds: 0
  };
}

// Finalize current event
function finalizeCurrentEvent() {
  console.log('[finalizeCurrentEvent] Function called');

  if (!lastWindow || !currentEventStart) {
    console.log('[finalizeCurrentEvent] No window or event start, returning null');
    return null;
  }

  const endTime = new Date();
  const startTime = new Date(currentEventStart);
  const durationSeconds = Math.floor((endTime - startTime) / 1000);

  console.log('[finalizeCurrentEvent] Duration calculated:', durationSeconds, 'seconds');

  // Only save if duration is meaningful (> 1 second)
  if (durationSeconds < 1) {
    console.log('[finalizeCurrentEvent] Duration too short, returning null');
    return null;
  }

  const event = windowToEventData(lastWindow, 'native');
  event.start_time = currentEventStart;
  event.end_time = endTime.toISOString();
  event.duration_seconds = durationSeconds;
  event.session_id = currentSessionId;

  console.log('[finalizeCurrentEvent] Event created:', {
    application: event.application,
    service: event.service,
    duration: durationSeconds,
    session_id: event.session_id
  });

  return event;
}

// Set session ID for event tracking
function setSessionId(sessionId) {
  console.log('[setSessionId] Called with:', sessionId);
  currentSessionId = sessionId;
  eventCollector.setSessionId(sessionId);
  console.log('[setSessionId] currentSessionId set to:', currentSessionId);
}

// Set purpose for activity analysis
function setPurpose(purpose) {
  console.log('[setPurpose] Called with:', purpose);
  currentPurpose = purpose;
  console.log('[setPurpose] currentPurpose set to:', currentPurpose);
}

// Clear session ID
function clearSessionId() {
  console.log('[clearSessionId] Called');
  currentSessionId = null;
  currentPurpose = null;
  eventCollector.clearSessionId();
  console.log('[clearSessionId] currentSessionId cleared');
}

// Save event to file
function saveEvent(event) {
  console.log('[saveEvent] Function called with event:', event.id);
  console.log('[saveEvent] Events file path:', eventsFile);

  if (!event) {
    console.log('[saveEvent] No event provided, returning');
    return;
  }

  try {
    let events = [];
    if (fs.existsSync(eventsFile)) {
      const data = fs.readFileSync(eventsFile, 'utf8');
      events = JSON.parse(data);
      console.log('[saveEvent] Loaded existing events:', events.length);
    } else {
      console.log('[saveEvent] Events file does not exist, creating new array');
    }

    events.push(event);
    fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
    console.log('[saveEvent] Event saved:', event.id);
    console.log('[saveEvent] Total events in file:', events.length);
  } catch (error) {
    console.error('[saveEvent] Error:', error.message, error.stack);
  }
}

// Track active window (event-based detection)
async function trackActiveWindow() {
  try {
    console.log('[trackActiveWindow] Function called');
    
    // Collect raw event using EventCollector
    const rawEvent = await eventCollector.collectWindowInfo();
    
    if (!rawEvent) {
      console.log('[trackActiveWindow] No raw event collected');
      return null;
    }

    console.log('[trackActiveWindow] Raw event collected:', rawEvent.application);

    // Calculate duration from last raw event
    if (lastRawEvent) {
      const lastTimestamp = new Date(lastRawEvent.timestamp);
      const currentTimestamp = new Date(rawEvent.timestamp);
      const durationSeconds = (currentTimestamp - lastTimestamp) / 1000;
      
      // Update last raw event with end time and duration
      lastRawEvent.end_time = rawEvent.timestamp;
      lastRawEvent.duration_seconds = durationSeconds;
      
      // Save updated last raw event
      dataManager.saveRawEvent(lastRawEvent);
    }

    // Save new raw event
    dataManager.saveRawEvent(rawEvent);
    rawEvents.push(rawEvent);
    lastRawEvent = rawEvent;

    const currentWindow = {
      timestamp: rawEvent.timestamp,
      title: rawEvent.window_title,
      owner: rawEvent.application,
      id: rawEvent.process_id
    };

    console.log('[trackActiveWindow] Active Window:', currentWindow.owner, currentWindow.title);

    // Check if window changed
    if (lastWindow) {
      const windowChanged =
        lastWindow.owner !== currentWindow.owner ||
        lastWindow.title !== currentWindow.title;

      if (windowChanged) {
        console.log('[trackActiveWindow] Window changed:', lastWindow.owner, '->', currentWindow.owner);
        // Finalize previous event
        const event = finalizeCurrentEvent();
        if (event) {
          console.log('[trackActiveWindow] About to save event');
          saveEvent(event);
          console.log('[trackActiveWindow] Event saved');
        }

        // Start new event
        currentEventStart = currentWindow.timestamp;
      }
    } else {
      console.log('[trackActiveWindow] First window detected:', currentWindow.owner);
      // First window
      currentEventStart = currentWindow.timestamp;
    }

    // Update last window
    lastWindow = currentWindow;

    // Save current window data
    fs.writeFileSync(dataFile, JSON.stringify(currentWindow, null, 2));

    console.log('[trackActiveWindow] Function completed');
    return currentWindow;
  } catch (error) {
    console.error('[trackActiveWindow] Error:', error.message, error.stack);
    return null;
  }
}

// Start tracking
async function startTracking(intervalMs = 1000) {
  console.log('[startTracking] Function called with interval:', intervalMs);

  try {
    // Initial check
    console.log('[startTracking] About to call trackActiveWindow() for initial check');
    await trackActiveWindow();
    console.log('[startTracking] Initial check completed');

    // Poll at specified interval
    console.log('[startTracking] Setting up setInterval with interval:', intervalMs);
    pollingInterval = setInterval(() => {
      console.log('[setInterval] Tick triggered');
      trackActiveWindow().catch(err => {
        console.error('[setInterval] Error in trackActiveWindow:', err.message, err.stack);
      });
    }, intervalMs);

    console.log(`[startTracking] Tracking started (interval: ${intervalMs}ms)`);
  } catch (error) {
    console.error('[startTracking] Error:', error.message, error.stack);
  }
}

// Stop tracking
function stopTracking() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  // Finalize last raw event
  if (lastRawEvent) {
    const currentTimestamp = new Date();
    lastRawEvent.end_time = currentTimestamp.toISOString();
    lastRawEvent.duration_seconds = (currentTimestamp - new Date(lastRawEvent.timestamp)) / 1000;
    dataManager.saveRawEvent(lastRawEvent);
  }

  // Finalize last event
  const event = finalizeCurrentEvent();
  if (event) {
    saveEvent(event);
  }

  // Generate activities from raw events
  if (rawEvents.length > 0) {
    console.log('[stopTracking] Generating activities from raw events...');
    console.log('[stopTracking] Raw events count:', rawEvents.length);
    console.log('[stopTracking] First raw event:', JSON.stringify(rawEvents[0], null, 2));
    console.log('[stopTracking] Current purpose:', currentPurpose);
    
    const activities = activityGenerator.generateActivities(rawEvents, currentPurpose);
    console.log('[stopTracking] Generated', activities.length, 'activities');
    
    // Save activities
    activities.forEach(activity => {
      dataManager.saveActivity(activity);
    });
  }

  // Reset state
  lastWindow = null;
  currentEventStart = null;
  lastRawEvent = null;
  rawEvents = [];

  console.log('Tracking stopped');
}

// Get current window
async function getCurrentWindow() {
  try {
    const activeWindow = await activeWin();
    return {
      timestamp: new Date().toISOString(),
      title: activeWindow.title,
      owner: activeWindow.owner.name,
      id: activeWindow.id
    };
  } catch (error) {
    console.error('Error getting current window:', error);
    return null;
  }
}

// Get all events
function getAllEvents() {
  if (!fs.existsSync(eventsFile)) {
    return [];
  }

  const data = fs.readFileSync(eventsFile, 'utf8');
  return JSON.parse(data);
}

// Export functions
module.exports = {
  trackActiveWindow,
  startTracking,
  stopTracking,
  getCurrentWindow,
  getAllEvents,
  setSessionId,
  setPurpose,
  clearSessionId
};

// If run directly, start tracking
if (require.main === module) {
  startTracking(1000); // 1 second interval

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    stopTracking();
    process.exit(0);
  });

  console.log('Press Ctrl+C to stop tracking');
}
