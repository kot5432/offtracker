# OffTracker Data Model

## Core Data Structures

### Session
Represents a work session with a specific purpose.

```typescript
interface Session {
  id: string;                    // Unique session identifier (UUID)
  purpose: string;                // What the user intended to do
  target_time_minutes?: number;   // Optional target duration
  start_time: string;             // ISO timestamp (e.g., "2026-09-16T18:00:00Z")
  end_time?: string;              // ISO timestamp (null if active)
  status: 'active' | 'completed'; // Session status
  created_at: string;             // ISO timestamp
}
```

### Event
Represents a behavior event (application usage).

```typescript
interface Event {
  id: string;                    // Unique event identifier (UUID)
  session_id: string;            // Reference to session
  start_time: string;            // ISO timestamp
  end_time: string;              // ISO timestamp
  source: 'native' | 'browser';  // Data source
  application: string;           // App name (e.g., "VS Code", "Chrome")
  service?: string;              // Web service (e.g., "Google", "YouTube")
  window_title?: string;         // Window title for context
  process_id?: number;           // Process ID for native apps
  duration_seconds: number;      // Duration in seconds
  created_at: string;            // ISO timestamp
}
```

### Result
Represents the outcome of a session.

```typescript
interface Result {
  id: string;                    // Unique result identifier (UUID)
  session_id: string;            // Reference to session
  result_level: ResultLevel;     // Completion level
  result_description: string;    // What was actually accomplished
  actual_duration_minutes: number; // Actual time spent
  created_at: string;            // ISO timestamp
}

type ResultLevel =
  | 'completed'           // Fully completed
  | 'mostly_completed'    // Mostly completed, minor gaps
  | 'partially_completed' // Partially completed
  | 'minimal'             // Minimal progress
  | 'not_completed';      // Not completed
```

### Reflection
Represents user's reflection on why they didn't complete the task.

```typescript
interface Reflection {
  id: string;                    // Unique reflection identifier (UUID)
  session_id: string;            // Reference to session
  deviation_reason: string;      // Checkbox selection (comma-separated)
  reflection_details: string;    // Free text input
  created_at: string;            // ISO timestamp
}
```

## Database Schema (SQLite)

### Sessions Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  purpose TEXT NOT NULL,
  target_time_minutes INTEGER,
  start_time TEXT NOT NULL,
  end_time TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_sessions_status ON sessions(status);
```

### Events Table
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('native', 'browser')),
  application TEXT NOT NULL,
  service TEXT,
  window_title TEXT,
  process_id INTEGER,
  duration_seconds INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_application ON events(application);
```

### Results Table
```sql
CREATE TABLE results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  result_level TEXT NOT NULL CHECK (result_level IN ('completed', 'mostly_completed', 'partially_completed', 'minimal', 'not_completed')),
  result_description TEXT NOT NULL,
  actual_duration_minutes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_results_session_id ON results(session_id);
```

### Reflections Table
```sql
CREATE TABLE reflections (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  deviation_reason TEXT NOT NULL,
  reflection_details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_reflections_session_id ON reflections(session_id);
```

## Data Relationships

```
Session (1)
    ├── (1..n) Events
    ├── (0..1) Result
    └── (0..1) Reflection
```

## Data Flow

### Session Lifecycle
```
1. User sets purpose
   → Create Session record (status: active)

2. System tracks events
   → Create Event records linked to Session

3. User stops session
   → Update Session (status: completed, end_time)
   → Create Result record
   → Create Reflection record
```

### Event Detection
```
Active Window Changes
    ↓
Detect New Application/Service
    ↓
Finalize Previous Event (set end_time)
    ↓
Create New Event (set start_time)
    ↓
Link to Current Session
```

## Data Validation Rules

### Session
- `purpose` cannot be empty
- `start_time` must be before `end_time`
- `status` must be 'active' or 'completed'
- Active session cannot have end_time

### Event
- `session_id` must reference existing session
- `start_time` must be before `end_time`
- `duration_seconds` must be positive
- `source` must be 'native' or 'browser'
- If `source` is 'browser', `service` should be provided

### Result
- `session_id` must reference existing session
- `result_level` must be valid enum value
- `actual_duration_minutes` must be positive
- Only one result per session

### Reflection
- `session_id` must reference existing session
- `deviation_reason` cannot be empty
- Only one reflection per session

## Privacy Considerations

### What We Store
- ✅ Application name (e.g., "VS Code", "Chrome")
- ✅ Web service name (e.g., "Google", "YouTube")
- ✅ Window title (e.g., "OffTracker - Visual Studio Code")
- ✅ Process ID (for technical identification)
- ✅ Timestamps
- ✅ Duration
- ✅ User-provided purpose, result, reflection

### What We Don't Store
- ❌ Keyboard input
- ❌ Passwords
- ❌ Screenshots
- ❌ File contents
- ❌ Clipboard contents
- ❌ Search terms
- ❌ Network traffic
- ❌ Mouse coordinates
- ❌ Detailed user interactions

### Window Title Handling
Window titles may contain sensitive information. Future implementation should:
- Allow user to opt-out of window title collection
- Provide option to redact certain patterns
- Default to minimal window title collection

## Data Export Format

### Session Export (JSON)
```json
{
  "session": {
    "id": "session-123",
    "purpose": "Webアプリのログイン機能を実装する",
    "target_time_minutes": 180,
    "start_time": "2026-09-16T18:00:00Z",
    "end_time": "2026-09-16T19:30:00Z",
    "status": "completed"
  },
  "events": [
    {
      "id": "evt-1",
      "start_time": "2026-09-16T18:00:00Z",
      "end_time": "2026-09-16T18:35:00Z",
      "source": "native",
      "application": "VS Code",
      "window_title": "OffTracker - Visual Studio Code",
      "duration_seconds": 2100
    },
    {
      "id": "evt-2",
      "start_time": "2026-09-16T18:35:00Z",
      "end_time": "2026-09-16T18:42:00Z",
      "source": "browser",
      "application": "Chrome",
      "service": "Google",
      "duration_seconds": 420
    }
  ],
  "result": {
    "result_level": "partially_completed",
    "result_description": "ログイン画面のUIを完成させた",
    "actual_duration_minutes": 90
  },
  "reflection": {
    "deviation_reason": "別のことをしてしまった, 作業が難しかった",
    "reflection_details": "途中でYouTubeを見てしまった"
  }
}
```

## Data Retention

### Default Policy
- Sessions: Keep indefinitely
- Events: Keep indefinitely
- Results: Keep indefinitely
- Reflections: Keep indefinitely

### User Options (Future)
- Automatic deletion after X days
- Manual deletion
- Export before deletion

## Data Synchronization (Future)

### Local-First Approach
- Data is stored locally by default
- Cloud sync is optional
- User must explicitly enable sync
- User can disable sync at any time

### Sync Conflict Resolution
- Last-write-wins for same session
- Manual resolution for conflicts (future)
- Prefer local data if sync disabled

## Migration Strategy

### JSON to SQLite
When migrating from JSON to SQLite:
1. Parse JSON files
2. Validate data structure
3. Insert into SQLite tables
4. Verify data integrity
5. Archive JSON files

### Schema Evolution
When schema changes:
1. Create migration script
2. Backup existing data
3. Apply migration
4. Verify data integrity
5. Provide rollback option
