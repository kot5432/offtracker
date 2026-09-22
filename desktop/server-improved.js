const http = require('http');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const tracker = require('./tracker-improved');

const PORT = 3000;
const sessionFile = path.join(__dirname, 'current-session.json');
const eventsFile = path.join(__dirname, 'events.json');
const resultsFile = path.join(__dirname, 'results.json');
const reflectionsFile = path.join(__dirname, 'reflections.json');

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

  // Save session
  try {
    fs.writeFileSync(sessionFile, JSON.stringify(currentSession, null, 2));
    console.log('[stopSession] Session saved to file:', sessionFile);
  } catch (error) {
    console.error('[stopSession] Error saving session:', error.message, error.stack);
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
  console.log('[stopSession] About to call tracker.setSessionId(null)');
  tracker.setSessionId(null);
  console.log('[stopSession] tracker.setSessionId(null) completed');

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

function saveReflection(sessionId, deviationReason, reflectionDetails) {
  const reflection = {
    id: uuidv4(),
    session_id: sessionId,
    deviation_reason: deviationReason,
    reflection_details: reflectionDetails,
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

// HTTP server
const server = http.createServer((req, res) => {
  // Serve static files from ui directory
  if (req.url === '/' || req.url === '/home.html') {
    fs.readFile(path.join(__dirname, 'ui', 'home.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/timeline.html') {
    fs.readFile(path.join(__dirname, 'ui', 'timeline.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/result.html') {
    fs.readFile(path.join(__dirname, 'ui', 'result.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/reflection.html') {
    fs.readFile(path.join(__dirname, 'ui', 'reflection.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/pattern.html') {
    fs.readFile(path.join(__dirname, 'ui', 'pattern.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/api/window') {
    tracker.getCurrentWindow().then(data => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });
  } else if (req.url === '/api/events') {
    const events = tracker.getAllEvents();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(events));
  } else if (req.url === '/api/session/start' && req.method === 'POST') {
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
  } else if (req.url === '/api/session/stop' && req.method === 'POST') {
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
  } else if (req.url === '/api/session/current') {
    const session = getCurrentSession();
    if (session) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(session));
    } else {
      res.writeHead(404);
      res.end('No active session');
    }
  } else if (req.url === '/api/session/elapsed') {
    const elapsed = getElapsedTime();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(elapsed));
  } else if (req.url === '/api/session/result' && req.method === 'POST') {
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
  } else if (req.url === '/api/reflection' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { session_id, deviation_reason, reflection_details } = JSON.parse(body);
        const reflection = saveReflection(session_id, deviation_reason, reflection_details);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reflection));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (req.url === '/api/session/events' && req.method === 'GET') {
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
