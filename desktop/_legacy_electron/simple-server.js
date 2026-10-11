const http = require('http');
const fs = require('fs');
const path = require('path');
const activeWin = require('active-win');
const { v4: uuidv4 } = require('uuid');

const PORT = 3000;
const dataFile = path.join(__dirname, 'window-data.json');
const sessionFile = path.join(__dirname, 'current-session.json');
const eventsFile = path.join(__dirname, 'events.json');
const resultsFile = path.join(__dirname, 'results.json');

// Session state
let currentSession = null;
let windowEvents = [];
let lastWindow = null;

// Window tracking function
async function trackActiveWindow() {
  try {
    const activeWindow = await activeWin();
    const data = {
      timestamp: new Date().toISOString(),
      title: activeWindow.title,
      owner: activeWindow.owner.name,
      id: activeWindow.id
    };

    console.log('Active Window:', data);

    // Save to JSON file
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    // Track window changes if session is active
    if (currentSession && lastWindow) {
      if (lastWindow.owner !== data.owner || lastWindow.title !== data.title) {
        // Window changed, save event
        const event = {
          id: uuidv4(),
          session_id: currentSession.id,
          timestamp: new Date().toISOString(),
          from_application: lastWindow.owner,
          to_application: data.owner,
          from_title: lastWindow.title,
          to_title: data.title
        };
        windowEvents.push(event);
        saveEvents();
      }
    }
    lastWindow = data;

    return data;
  } catch (error) {
    console.error('Error tracking active window:', error);
    return null;
  }
}

// Session management functions
function startSession(purpose, targetTimeMinutes) {
  const session = {
    id: uuidv4(),
    purpose: purpose,
    target_time_minutes: targetTimeMinutes,
    start_time: new Date().toISOString(),
    status: 'active'
  };
  currentSession = session;
  windowEvents = [];
  lastWindow = null;

  // Save session
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
  console.log('Session started:', session);

  return session;
}

function stopSession() {
  if (!currentSession) return null;

  currentSession.end_time = new Date().toISOString();
  currentSession.status = 'completed';

  // Save session
  fs.writeFileSync(sessionFile, JSON.stringify(currentSession, null, 2));
  console.log('Session stopped:', currentSession);

  const session = currentSession;
  currentSession = null;
  windowEvents = [];
  lastWindow = null;

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

function saveResult(sessionId, resultLevel, resultDescription) {
  const result = {
    id: uuidv4(),
    session_id: sessionId,
    result_level: resultLevel,
    result_description: resultDescription,
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

function saveEvents() {
  fs.writeFileSync(eventsFile, JSON.stringify(windowEvents, null, 2));
}

// HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(path.join(__dirname, 'desktop-test.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/api/window') {
    trackActiveWindow().then(data => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });
  } else if (req.url === '/api/data') {
    try {
      if (fs.existsSync(dataFile)) {
        const data = fs.readFileSync(dataFile, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      } else {
        res.writeHead(404);
        res.end('No data available');
      }
    } catch (error) {
      res.writeHead(500);
      res.end('Error reading data');
    }
  } else if (req.url === '/api/session/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { purpose, target_time_minutes } = JSON.parse(body);
        const session = startSession(purpose, target_time_minutes);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(session));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (req.url === '/api/session/stop' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { session_id } = JSON.parse(body);
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
        const { session_id, result_level, result_description } = JSON.parse(body);
        const result = saveResult(session_id, result_level, result_description);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('OffTracker Desktop Server ready');
});