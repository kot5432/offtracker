const activeWin = require('active-win');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'window-data.json');

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

    return data;
  } catch (error) {
    console.error('Error tracking active window:', error);
    return null;
  }
}

// Run tracking every 5 seconds
setInterval(trackActiveWindow, 5000);

// Initial run
trackActiveWindow();

console.log('Window tracking started. Press Ctrl+C to stop.');