// DOM elements
const currentWindowDiv = document.getElementById('current-window');
const startTrackingBtn = document.getElementById('start-tracking');
const stopTrackingBtn = document.getElementById('stop-tracking');
const trackingStatus = document.getElementById('tracking-status');

// New DOM elements for session management
const purposeSection = document.getElementById('purpose-section');
const sessionSection = document.getElementById('session-section');
const resultSection = document.getElementById('result-section');
const trackingSection = document.getElementById('tracking-section');

const purposeInput = document.getElementById('purpose-input');
const targetTimeInput = document.getElementById('target-time');
const setPurposeBtn = document.getElementById('set-purpose');
const stopSessionBtn = document.getElementById('stop-session');

const currentPurpose = document.getElementById('current-purpose');
const currentTargetTime = document.getElementById('current-target-time');
const elapsedTime = document.getElementById('elapsed-time');
const startTime = document.getElementById('start-time');

const resultLevel = document.getElementById('result-level');
const resultDescription = document.getElementById('result-description');
const saveResultBtn = document.getElementById('save-result');

let trackingInterval = null;
let sessionInterval = null;
let currentSession = null;

// Get current active window
async function getCurrentWindow() {
  try {
    const response = await fetch('/api/window');
    const windowData = await response.json();
    if (windowData) {
      currentWindowDiv.innerHTML = `
        <h3>Current Active Window</h3>
        <p><strong>Title:</strong> ${windowData.title}</p>
        <p><strong>Owner:</strong> ${windowData.owner}</p>
        <p><strong>ID:</strong> ${windowData.id}</p>
        <p><strong>Timestamp:</strong> ${new Date(windowData.timestamp).toLocaleString()}</p>
      `;
    }
  } catch (error) {
    console.error('Error getting current window:', error);
  }
}

// Start tracking
function startTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }
  trackingInterval = setInterval(getCurrentWindow, 5000);
  trackingStatus.textContent = '追跡中';
  trackingStatus.className = 'status-green';
  startTrackingBtn.disabled = true;
  stopTrackingBtn.disabled = false;
  getCurrentWindow(); // Immediate update
}

// Stop tracking
function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  trackingStatus.textContent = '追跡停止中';
  trackingStatus.className = 'status-orange';
  startTrackingBtn.disabled = false;
  stopTrackingBtn.disabled = true;
}

// Set purpose and start session
async function setPurpose() {
  const purpose = purposeInput.value.trim();
  const targetTime = targetTimeInput.value;

  if (!purpose) {
    alert('目的を入力してください');
    return;
  }

  try {
    const response = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purpose: purpose,
        target_time_minutes: parseInt(targetTime) || 60
      })
    });

    const session = await response.json();
    currentSession = session;

    // Update UI
    purposeSection.classList.add('hidden');
    sessionSection.classList.remove('hidden');
    trackingSection.classList.remove('hidden');

    currentPurpose.textContent = session.purpose;
    currentTargetTime.textContent = session.target_time_minutes;
    startTime.textContent = new Date(session.start_time).toLocaleString();

    // Start elapsed time updates
    updateElapsedTime();
    sessionInterval = setInterval(updateElapsedTime, 1000);

    // Start window tracking automatically
    startTracking();

  } catch (error) {
    console.error('Error starting session:', error);
    alert('セッション開始に失敗しました');
  }
}

// Stop session
async function stopSession() {
  try {
    const response = await fetch('/api/session/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: currentSession.id })
    });

    if (response.ok) {
      // Stop tracking
      stopTracking();

      // Clear elapsed time interval
      if (sessionInterval) {
        clearInterval(sessionInterval);
        sessionInterval = null;
      }

      // Show result section
      sessionSection.classList.add('hidden');
      trackingSection.classList.add('hidden');
      resultSection.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error stopping session:', error);
    alert('セッション終了に失敗しました');
  }
}

// Update elapsed time
async function updateElapsedTime() {
  try {
    const response = await fetch('/api/session/elapsed');
    const data = await response.json();
    if (data.elapsed_minutes !== undefined) {
      const hours = Math.floor(data.elapsed_minutes / 60);
      const minutes = data.elapsed_minutes % 60;
      elapsedTime.textContent = `${hours}時間${minutes}分`;
    }
  } catch (error) {
    console.error('Error getting elapsed time:', error);
  }
}

// Save result
async function saveResult() {
  const resultLevelValue = resultLevel.value;
  const resultDescriptionValue = resultDescription.value.trim();

  if (!resultDescriptionValue) {
    alert('具体的な成果を入力してください');
    return;
  }

  try {
    const response = await fetch('/api/session/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: currentSession.id,
        result_level: resultLevelValue,
        result_description: resultDescriptionValue
      })
    });

    if (response.ok) {
      alert('結果を保存しました！');
      // Reset UI
      resultSection.classList.add('hidden');
      purposeSection.classList.remove('hidden');
      currentSession = null;
      purposeInput.value = '';
      targetTimeInput.value = '';
    }
  } catch (error) {
    console.error('Error saving result:', error);
    alert('結果の保存に失敗しました');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Window tracking buttons
  if (startTrackingBtn) {
    startTrackingBtn.addEventListener('click', startTracking);
  }
  if (stopTrackingBtn) {
    stopTrackingBtn.addEventListener('click', stopTracking);
  }

  // Session management buttons
  if (setPurposeBtn) {
    setPurposeBtn.addEventListener('click', setPurpose);
  }
  if (stopSessionBtn) {
    stopSessionBtn.addEventListener('click', stopSession);
  }

  // Result recording button
  if (saveResultBtn) {
    saveResultBtn.addEventListener('click', saveResult);
  }

  // Get initial window data
  getCurrentWindow();
});