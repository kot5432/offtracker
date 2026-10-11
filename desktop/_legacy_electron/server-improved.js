const http = require('http');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const tracker = require('./tracker-improved');
const DataManager = require('./src/data-manager');
const SessionSummarizer = require('../../src/session-summarizer');
const HypothesisGenerator = require('../../src/hypothesis-generator');
const NextActionGenerator = require('../../src/next-action-generator');

const PORT = 3000;
const sessionFile = path.join(__dirname, 'current-session.json');
const sessionsFile = path.join(__dirname, 'sessions.json');
const eventsFile = path.join(__dirname, 'events.json');
const activitiesFile = path.join(__dirname, 'activities.json');
const resultsFile = path.join(__dirname, 'results.json');
const reflectionsFile = path.join(__dirname, 'reflections.json');
const uiDir = path.join(__dirname, '../ui');

// Initialize DataManager
const dataManager = new DataManager(__dirname);

// Initialize analyzers
const sessionSummarizer = new SessionSummarizer();
const hypothesisGenerator = new HypothesisGenerator();
const nextActionGenerator = new NextActionGenerator();

// Session state
let currentSession = null;
let isTracking = false;

// Session management functions
async function startSession(purpose, targetTimeMinutes) {
  console.log('[startSession] Function called with:', { purpose, targetTimeMinutes });

  const session = {
    id: uuidv4(),
    purpose: purpose,
    target_time_minutes: targetTimeMinutes,
    start_time: new Date().toISOString(),
    status: 'active'
  };
  console.log('[startSession] Session ID generated:', session.id);

  currentSession = session;

  // Save session
  try {
    fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
    console.log('[startSession] Session saved to file:', sessionFile);
  } catch (error) {
    console.error('[startSession] Error saving session:', error.message, error.stack);
  }

  console.log('Session started:', session);

  // Set session ID in tracker BEFORE starting tracking
  console.log('[startSession] About to call tracker.setSessionId() with:', session.id);
  tracker.setSessionId(session.id);
  console.log('[startSession] tracker.setSessionId() completed');

  // Set purpose for activity analysis
  console.log('[startSession] About to call tracker.setPurpose() with:', session.purpose);
  tracker.setPurpose(session.purpose);
  console.log('[startSession] tracker.setPurpose() completed');

  // Start tracking
  if (!isTracking) {
    console.log('[startSession] About to start tracking...');
    await tracker.startTracking(1000); // 1 second interval
    isTracking = true;
    console.log('[startSession] Tracking started and isTracking set to true');
  } else {
    console.log('[startSession] Tracking already active, skipping start');
  }

  console.log('[startSession] Function completed, returning session');
  return session;
}

function stopSession() {
  console.log('[stopSession] Function called');

  if (!currentSession) {
    console.log('[stopSession] No current session, returning null');
    return null;
  }

  currentSession.end_time = new Date().toISOString();
  currentSession.status = 'completed';

  // Calculate actual duration
  const startTime = new Date(currentSession.start_time);
  const endTime = new Date(currentSession.end_time);
  const actualDurationMinutes = Math.floor((endTime - startTime) / 60000);
  currentSession.actual_duration_minutes = actualDurationMinutes;

  // Save session to current-session.json
  try {
    fs.writeFileSync(sessionFile, JSON.stringify(currentSession, null, 2));
    console.log('[stopSession] Session saved to file:', sessionFile);
  } catch (error) {
    console.error('[stopSession] Error saving session:', error.message, error.stack);
  }

  // Save session to sessions.json for history
  try {
    let sessions = [];
    if (fs.existsSync(sessionsFile)) {
      const data = fs.readFileSync(sessionsFile, 'utf8');
      sessions = JSON.parse(data);
    }
    sessions.push(currentSession);
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
    console.log('[stopSession] Session saved to history:', sessionsFile);
  } catch (error) {
    console.error('[stopSession] Error saving session to history:', error.message, error.stack);
  }

  console.log('Session stopped:', currentSession);

  const session = currentSession;
  currentSession = null;

  // Stop tracking FIRST to finalize last event with session_id
  if (isTracking) {
    console.log('[stopSession] About to call tracker.stopTracking()');
    tracker.stopTracking(); // This will finalize the last event with current session_id
    isTracking = false;
    console.log('[stopSession] tracker.stopTracking() completed');
  }

  // THEN clear session ID in tracker
  console.log('[stopSession] About to call tracker.clearSessionId()');
  tracker.clearSessionId();
  console.log('[stopSession] tracker.clearSessionId() completed');

  console.log('[stopSession] Function completed, returning session');
  return session;
}

function getCurrentSession() {
  return currentSession;
}

function getElapsedTime() {
  if (!currentSession) return { elapsed_minutes: 0 };

  const startTime = new Date(currentSession.start_time);
  const now = new Date();
  const elapsedMs = now - startTime;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  return { elapsed_minutes };
}

function saveResult(sessionId, resultLevel, resultDescription, whatWasntDone) {
  const result = {
    id: uuidv4(),
    session_id: sessionId,
    result_level: resultLevel,
    result_description: resultDescription,
    what_wasnt_done: whatWasntDone || null,
    actual_duration_minutes: getElapsedTime().elapsed_minutes,
    created_at: new Date().toISOString()
  };

  // Load existing results
  let results = [];
  if (fs.existsSync(resultsFile)) {
    const data = fs.readFileSync(resultsFile, 'utf8');
    results = JSON.parse(data);
  }

  results.push(result);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log('Result saved:', result);

  return result;
}

function saveReflection(sessionId, deviationReason, reflectionDetails, selectedHypothesis, sessionSummary, nextAction) {
  const reflection = {
    id: uuidv4(),
    session_id: sessionId,
    deviation_reason: deviationReason,
    reflection_details: reflectionDetails,
    selected_hypothesis: selectedHypothesis,
    session_summary: sessionSummary,
    next_action: nextAction,
    created_at: new Date().toISOString()
  };

  // Load existing reflections
  let reflections = [];
  if (fs.existsSync(reflectionsFile)) {
    const data = fs.readFileSync(reflectionsFile, 'utf8');
    reflections = JSON.parse(data);
  }

  reflections.push(reflection);
  fs.writeFileSync(reflectionsFile, JSON.stringify(reflections, null, 2));
  console.log('Reflection saved:', reflection);

  return reflection;
}

function getSessionEvents(sessionId) {
  const allEvents = tracker.getAllEvents();
  return allEvents.filter(event => event.session_id === sessionId);
}

function loadSessionById(sessionId) {
  // First check if it's the current session
  if (currentSession && currentSession.id === sessionId) {
    return currentSession;
  }

  // Check current-session.json
  try {
    if (fs.existsSync(sessionFile)) {
      const data = fs.readFileSync(sessionFile, 'utf8');
      const session = JSON.parse(data);
      if (session.id === sessionId) {
        return session;
      }
    }
  } catch (error) {
    console.error('[loadSessionById] Error reading current session:', error);
  }

  // Check sessions.json for historical sessions
  try {
    if (fs.existsSync(sessionsFile)) {
      const data = fs.readFileSync(sessionsFile, 'utf8');
      const sessions = JSON.parse(data);
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        return session;
      }
    }
  } catch (error) {
    console.error('[loadSessionById] Error reading sessions history:', error);
  }

  return null;
}

// HTTP server
const server = http.createServer((req, res) => {
  // Parse URL to handle query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // Serve static files from ui directory
  if (pathname === '/' || pathname === '/home.html') {
    fs.readFile(path.join(uiDir, 'home.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (pathname === '/timeline.html') {
    fs.readFile(path.join(uiDir, 'timeline.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (pathname === '/result.html') {
    fs.readFile(path.join(uiDir, 'result.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (pathname === '/reflection.html') {
    fs.readFile(path.join(uiDir, 'reflection.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (pathname === '/pattern.html') {
    fs.readFile(path.join(uiDir, 'pattern.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (pathname === '/api/window') {
    tracker.getCurrentWindow().then(data => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });
  } else if (pathname === '/api/events') {
    // For backward compatibility, return activities
    const activities = dataManager.getAllActivities();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(activities));
  } else if (pathname === '/api/activities') {
    const activities = dataManager.getAllActivities();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(activities));
  } else if (pathname.startsWith('/api/session/events')) {
    const urlParams = new URLSearchParams(url.search);
    const sessionId = urlParams.get('session_id');
    const activities = dataManager.getActivitiesBySessionId(sessionId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(activities));
  } else if (pathname === '/api/session/start' && req.method === 'POST') {
    console.log('[API] Session start API handler called');
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        console.log('[API] Request body received');
        const { purpose, target_time_minutes } = JSON.parse(body);
        console.log('[API] Parsed request:', { purpose, target_time_minutes });
        const session = await startSession(purpose, target_time_minutes);
        console.log('[API] Session created successfully:', session.id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(session));
      } catch (error) {
        console.error('[API] Error in session start:', error.message, error.stack);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (pathname === '/api/session/stop' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const session = stopSession();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(session));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (pathname === '/api/session/current') {
    const session = getCurrentSession();
    if (session) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(session));
    } else {
      res.writeHead(404);
      res.end('No active session');
    }
  } else if (pathname === '/api/session/elapsed') {
    const elapsed = getElapsedTime();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(elapsed));
  } else if (pathname === '/api/session/result' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { session_id, result_level, result_description, what_wasnt_done } = JSON.parse(body);
        const result = saveResult(session_id, result_level, result_description, what_wasnt_done);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (pathname === '/api/reflection' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { session_id, deviation_reason, reflection_details, selected_hypothesis, session_summary, next_action } = JSON.parse(body);
        const reflection = saveReflection(session_id, deviation_reason, reflection_details, selected_hypothesis, session_summary, next_action);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reflection));
      } catch (error) {
        console.error('[API] Error in reflection save:', error);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (pathname === '/api/session/events' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('session_id');
    if (sessionId) {
      const events = getSessionEvents(sessionId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(events));
    } else {
      res.writeHead(400);
      res.end('Missing session_id parameter');
    }
  } else if (pathname === '/api/session/analyze' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('session_id');
    if (sessionId) {
      try {
        const session = loadSessionById(sessionId);
        if (!session) {
          res.writeHead(404);
          res.end('Session not found');
          return;
        }

        const activities = dataManager.getActivitiesBySessionId(sessionId);
        const summary = sessionSummarizer.summarizeSession(activities, session.purpose);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(summary));
      } catch (error) {
        console.error('[API] Error in session analyze:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to analyze session' }));
      }
    } else {
      res.writeHead(400);
      res.end('Missing session_id parameter');
    }
  } else if (pathname === '/api/session/hypotheses' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('session_id');
    if (sessionId) {
      try {
        const session = loadSessionById(sessionId);
        if (!session) {
          res.writeHead(404);
          res.end('Session not found');
          return;
        }

        const activities = dataManager.getActivitiesBySessionId(sessionId);
        const summary = sessionSummarizer.summarizeSession(activities, session.purpose);
        const hypotheses = hypothesisGenerator.generateHypotheses(activities, session.purpose, summary);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ hypotheses }));
      } catch (error) {
        console.error('[API] Error in session hypotheses:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to generate hypotheses' }));
      }
    } else {
      res.writeHead(400);
      res.end('Missing session_id parameter');
    }
  } else if (pathname === '/api/session/next-actions' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('session_id');
    if (sessionId) {
      try {
        const session = loadSessionById(sessionId);
        if (!session) {
          res.writeHead(404);
          res.end('Session not found');
          return;
        }

        const activities = dataManager.getActivitiesBySessionId(sessionId);
        const summary = sessionSummarizer.summarizeSession(activities, session.purpose);
        const hypotheses = hypothesisGenerator.generateHypotheses(activities, session.purpose, summary);
        const suggestions = nextActionGenerator.generateNextActions(hypotheses, [], session.purpose);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ suggestions }));
      } catch (error) {
        console.error('[API] Error in session next-actions:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to generate next actions' }));
      }
    } else {
      res.writeHead(400);
      res.end('Missing session_id parameter');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('OffTracker Desktop Server ready');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  if (isTracking) {
    tracker.stopTracking();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
