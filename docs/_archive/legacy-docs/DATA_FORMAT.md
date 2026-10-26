# OffTracker Unified Data Format

## Unified Event Format

### TypeScript Interface
```typescript
interface ActivityEvent {
  id: string;                    // Unique event identifier
  start_time: string;            // ISO timestamp (e.g., "2026-09-16T18:00:00Z")
  end_time: string;              // ISO timestamp (e.g., "2026-09-16T18:35:20Z")
  source: 'native' | 'browser';  // Data source
  application: string;           // App name (e.g., "VS Code", "Chrome")
  service?: string;              // Web service (e.g., "Google", "YouTube")
  window_title?: string;         // Window title for additional context
  process_id?: number;           // Process ID for native apps
  duration_seconds: number;      // Duration in seconds
}
```

### Database Schema (SQLite)
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  source TEXT NOT NULL,
  application TEXT NOT NULL,
  service TEXT,
  window_title TEXT,
  process_id INTEGER,
  duration_seconds INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_application ON events(application);
```

## Privacy-Preserving Data Collection

### ✅ Data We Collect
- Application name (e.g., "VS Code", "Chrome")
- Window title (e.g., "OffTracker - Visual Studio Code")
- Process ID (for native apps)
- Timestamps (start/end times)
- Web service name (e.g., "Google", "YouTube" for browser events)

### ❌ Data We Don't Collect
- Keyboard input
- Passwords
- Screenshots
- File contents
- Clipboard contents
- Search terms
- Network traffic
- Mouse coordinates
- Detailed user interactions

## Event Examples

### Native App Event
```json
{
  "id": "evt_1234567890",
  "start_time": "2026-09-16T18:00:00Z",
  "end_time": "2026-09-16T18:35:20Z",
  "source": "native",
  "application": "VS Code",
  "service": null,
  "window_title": "OffTracker - Visual Studio Code",
  "process_id": 12345,
  "duration_seconds": 2120
}
```

### Browser Event
```json
{
  "id": "evt_1234567891",
  "start_time": "2026-09-16T18:35:20Z",
  "end_time": "2026-09-16T18:39:10Z",
  "source": "browser",
  "application": "Chrome",
  "service": "Google",
  "window_title": "Google Search - offtracker desktop app",
  "process_id": null,
  "duration_seconds": 230
}
```

## Data Flow Architecture

```
Windows API (Desktop)
    ↓
Active Window Detection
    ↓
Native Event Generation
    ↓
    ↓
Edge Extension (Browser)
    ↓
Service Detection
    ↓
Browser Event Generation
    ↓
    ↓
SQLite Database (Unified Storage)
    ↓
Tauri Commands
    ↓
Web UI (Timeline & Analysis)
```

## Tauri Commands

### Command: get_events
```typescript
import { invoke } from '@tauri-apps/api/tauri';

const events = await invoke('get_events', {
  startDate: '2026-09-16T00:00:00Z',
  endDate: '2026-09-16T23:59:59Z'
});
```

### Command: start_tracking
```typescript
await invoke('start_tracking');
```

### Command: stop_tracking
```typescript
await invoke('stop_tracking');
```

### Command: get_current_activity
```typescript
const currentActivity = await invoke('get_current_activity');
// Returns: { application: string, window_title: string, start_time: string }
```

## Source Identification

### Native Applications
- VS Code
- Discord
- Spotify
- PowerPoint
- Excel
- Word
- Notepad
- etc.

### Browser Services
- Google
- YouTube
- GitHub
- X (Twitter)
- Stack Overflow
- Reddit
- etc.

## Event Generation Logic

### Not Polling, Event-Based
```rust
// Instead of polling every second:
for _ in 0..60 {
    let current_window = get_active_window();
    save_event(current_window);
    sleep(1s);
}

// We use event-based detection:
let mut previous_window = get_active_window();
loop {
    let current_window = get_active_window();
    if current_window != previous_window {
        finalize_event(previous_window);
        start_new_event(current_window);
        previous_window = current_window;
    }
    sleep(500ms); // Small delay for responsiveness
}
```

## Unified Timeline Visualization

### Timeline Example
```
18:00 ── VS Code (35 min) ──┐
                           │
18:35 ── Chrome/Google (4 min) ──┤
                                 │
18:39 ── Chrome/YouTube (22 min) ──┤
                                     │
19:01 ── Discord (8 min) ──┤
                            │
19:09 ── VS Code (44 min) ──┘
```

### Color Coding
- Native apps: Blue
- Browser services: Green
- Idle periods: Gray