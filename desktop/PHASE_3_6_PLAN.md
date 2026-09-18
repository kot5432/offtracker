# OffTracker Implementation Plan - Phase 3-6

## Summary
Implement purpose setting UI, session management, unified timeline, and result recording features based on the new product definition, using the existing HTTP server + Windows API approach.

## Current Status

### ✅ Completed
- HTTP server with Windows API access (active-win)
- Basic window tracking functionality
- Simple web UI
- JSON data storage

### 🔄 In Progress
- Purpose setting UI HTML created
- Session management logic not implemented
- Result recording not implemented

### ❌ Not Implemented
- Session management logic
- Unified timeline display
- Reflection functionality
- SQLite database integration

## Implementation Plan

### Phase 3: Purpose Setting UI Implementation

**Files to modify:**
- `desktop-test.html` - ✅ UI completed
- `renderer-simple.js` - Add purpose setting logic
- `simple-server.js` - Add session management APIs

**Functionality to add:**
1. Purpose input form control
2. Session start functionality
3. Purpose data saving and loading

### Phase 4: Session Management

**APIs to implement:**
- `POST /api/session/start` - Start session
- `POST /api/session/stop` - Stop session
- `GET /api/session/current` - Current session info
- `GET /api/session/elapsed` - Elapsed time

**Data structure:**
```json
{
  "id": "session-123",
  "purpose": "Webアプリのログイン機能を実装する",
  "target_time_minutes": 180,
  "start_time": "2026-09-18T18:00:00Z",
  "status": "active"
}
```

### Phase 5: Unified Timeline

**Functionality needed:**
1. App switch event detection
2. Event sequence saving
3. Gantt chart display
4. Timeline visualization

**Timeline display:**
```
18:00  VS Code ─────────────── 35分
       │
18:35  Google ── 4分
       │
18:39  YouTube ─────────────── 22分
       │
19:01  Discord ── 8分
       │
19:09  VS Code ─────────────── 45分
```

### Phase 6: Result Recording

**APIs to implement:**
- `POST /api/session/result` - Save result
- `GET /api/session/history` - Past sessions

**Data structure:**
```json
{
  "session_id": "session-123",
  "result_level": "partially_completed",
  "result_description": "ログイン画面のUIを完成させた",
  "actual_duration_minutes": 114
}
```

## Implementation Order

### Immediate (Next Steps)
1. Add purpose setting logic to `renderer-simple.js`
2. Add session management APIs to `simple-server.js`
3. Implement session start/stop functionality
4. Add real-time elapsed time display

### Short-term (Today)
1. Complete purpose setting UI
2. Implement session management
3. Implement result recording
4. Basic functionality testing

### Medium-term (This Week)
1. SQLite database integration
2. Improve event detection
3. Implement timeline display
4. Data persistence

## Technical Changes

### Data Storage Improvement
- Current: JSON file (window-data.json)
- Improved: SQLite database (sessions, events, results)

### API Extension
- Current: `/api/window`, `/api/data`
- Additional: `/api/session/*`, `/api/events/*`, `/api/results/*`

### UI Improvement
- Current: Simple test UI
- Improved: Integrated UI with purpose setting, session management, result recording

## Success Criteria

### Phase 3-6 Completion
- ✅ Can set purpose and start session
- ✅ Elapsed time displays in real-time
- ✅ Can stop session and record result
- ✅ Basic window tracking works

### Final Goal
- ✅ Purpose → Action → Result loop completed
- ✅ Data persists permanently
- ✅ Timeline visualizes behavior flow