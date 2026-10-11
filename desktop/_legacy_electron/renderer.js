const { ipcRenderer } = require('electron');

// DOM elements
const currentWindowDiv = document.getElementById('current-window');
const startTrackingBtn = document.getElementById('start-tracking');
const stopTrackingBtn = document.getElementById('stop-tracking');
const trackingStatus = document.getElementById('tracking-status');

// Get current active window
async function getCurrentWindow() {
  try {
    const windowData = await ipcRenderer.invoke('get-active-window');
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
async function startTracking() {
  try {
    const result = await ipcRenderer.invoke('start-tracking');
    trackingStatus.textContent = result.message;
    trackingStatus.style.color = 'green';
    startTrackingBtn.disabled = true;
    stopTrackingBtn.disabled = false;
  } catch (error) {
    console.error('Error starting tracking:', error);
    trackingStatus.textContent = 'Error starting tracking';
    trackingStatus.style.color = 'red';
  }
}

// Stop tracking
async function stopTracking() {
  try {
    const result = await ipcRenderer.invoke('stop-tracking');
    trackingStatus.textContent = result.message;
    trackingStatus.style.color = 'orange';
    startTrackingBtn.disabled = false;
    stopTrackingBtn.disabled = true;
  } catch (error) {
    console.error('Error stopping tracking:', error);
    trackingStatus.textContent = 'Error stopping tracking';
    trackingStatus.style.color = 'red';
  }
}

// Listen for window updates
ipcRenderer.on('window-update', (event, data) => {
  if (currentWindowDiv) {
    currentWindowDiv.innerHTML = `
      <h3>Current Active Window</h3>
      <p><strong>Title:</strong> ${data.title}</p>
      <p><strong>Owner:</strong> ${data.owner}</p>
      <p><strong>ID:</strong> ${data.id}</p>
      <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
    `;
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (startTrackingBtn) {
    startTrackingBtn.addEventListener('click', startTracking);
  }
  if (stopTrackingBtn) {
    stopTrackingBtn.addEventListener('click', stopTracking);
  }

  // Get initial window data
  getCurrentWindow();
});