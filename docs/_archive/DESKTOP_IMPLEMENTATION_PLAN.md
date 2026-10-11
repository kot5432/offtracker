# OffTracker Desktop Implementation Plan

## Summary
Implement Tauri desktop app with Windows API integration following 4-layer product architecture (Purpose → Behavior Collection → Behavior Understanding → Reflection).

## Current Situation Analysis

### ✅ Completed
- Web dashboard UI fully functional (index.html, style.css, authentication, timelines, charts)
- Project structure reorganized (web/, desktop/, docs/)
- Rust 1.98.1 installed
- VSCode extensions added (rust-analyzer, lldb)
- GitHub integration with Cloudflare Pages

### ❌ Current Issues
- Tauri CLI installation failed due to permission errors (cargo install, npm install)
- No actual data collection capability exists
- Existing Edge extension not integrated with planned architecture
- No unified data format between desktop and browser events

### 📋 Provided Design vs Current State

**Product Architecture Gap:**
- Provided: 4-layer structure (Purpose → Behavior Collection → Behavior Understanding → Reflection)
- Current: Only Web UI exists, no data collection layer

**Data Collection Gap:**
- Provided: Desktop app + Edge extension with unified event format
- Current: Only Edge extension exists, no desktop integration

**MVP Scope Gap:**
- Provided: Includes fade-out detection, reflection, pattern analysis using rules
- Current: Simple data collection only

**Technical Gap:**
- Provided: Tauri + Rust with Windows API
- Current: Tauri installation blocked by permissions

## Implementation Plan

### Phase 0: Resolve Installation Issues

**Alternative Approach:** Use npx for Tauri CLI without installation
```bash
cd desktop
npx @tauri-apps/cli init
```

If npx fails, consider:
1. Using project-local npm install: `npm install --save-dev @tauri-apps/cli`
2. Alternative: Create minimal Tauri project manually
3. Fallback: Electron if permission issues persist

### Phase 1: Data Specification (Foundation)

**Unified Event Format:**
```typescript
interface ActivityEvent {
  start_time: string;      // ISO timestamp
  end_time: string;        // ISO timestamp
  source: 'native' | 'browser';
  application: string;     // App name (VS Code, Chrome)
  service?: string;         // Web service (Google, YouTube)
}
```

**Privacy-Preserving Data Collection:**
- ✅ Collect: App name, window title, timestamps
- ❌ Exclude: Keyboard input, passwords, screenshots, file contents, clipboard, search terms

### Phase 2: Technical Validation - Windows API Access

**Proof of Concept:** Simple Rust program to test Windows API access
```rust
// Test active window detection
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

fn main() {
    let hwnd = unsafe { GetForegroundWindow() };
    // Get window title and process name
}
```

**Dependencies:** `windows-rs` crate for Windows API access

### Phase 3: Tauri Project Setup

**Structure:**
```
offtracker/
├── web/                 # Existing Web UI (index.html, style.css)
├── desktop/
│   ├── src/             # Tauri frontend (Web UI integration)
│   │   ├── index.html
│   │   ├── style.css
│   │   └── app.js      # Tauri commands
│   └── src-tauri/      # Rust backend
│       ├── src/
│       │   ├── main.rs         # Entry point
│       │   ├── window.rs       # Window monitoring
│       │   ├── event.rs        # Event generation
│       │   └── storage.rs      # SQLite storage
│       ├── Cargo.toml
│       └── tauri.conf.json
├── extension/          # Existing Edge extension (preserve)
└── functions/          # Cloudflare Pages Functions (preserve)
```

### Phase 4: Desktop Data Collection (MVP Core)

**Rust Implementation:**
1. Active window monitoring using Windows API
2. Event generation on window switch (not polling)
3. Local SQLite storage for events
4. Tauri commands for frontend communication

**Key Logic:**
```rust
// Event-based, not polling
if current_window != previous_window {
    create_event(previous_window.end_time, current_window.start_time);
}
```

### Phase 5: Edge Extension Integration

**Integration Strategy:**
- Edge extension: Browser service detection (Google, YouTube, GitHub)
- Desktop app: Native app detection (VS Code, Discord, Spotify)
- Unified timeline: Merge both data sources in Web UI

**Communication:**
- Edge extension → Local storage or WebSocket
- Desktop app → SQLite
- Web UI → Both sources via Tauri commands

### Phase 6: Timeline Visualization

**UI Components:**
1. Gantt chart for activity flow
2. Time calculation per application
3. Color coding by source (native vs browser)

**Data Flow:**
```
Windows API + Edge Extension
    ↓
Unified Events (SQLite)
    ↓
Tauri Commands
    ↓
Web UI Timeline
```

### Phase 7: Purpose Comparison & Fade-out Detection

**Rule-Based Detection (No AI yet):**
1. User sets purpose: "3 hours programming"
2. Track deviation: VS Code → Google → YouTube (22 min)
3. Simple rule: If non-work app > X minutes + not returned to work → fade-out candidate

**UI Flow:**
- Home: Set purpose
- Timeline: Show activity
- Fade-out: Highlight deviation points
- Reflection: Ask user "What happened?"

### Phase 8: Reflection & Pattern Analysis

**User Feedback Collection:**
- Simple selection: Researching, Got stuck, Taking break, Distracted, Other
- Free text input
- Store with event data

**Pattern Detection (Future AI Phase):**
- After data accumulation: "Problem → Browser → YouTube" pattern repeats
- Use AI for story generation when sufficient data exists

## Development Order

### Phase 1: Desktop Foundation (1-2 weeks)
- Resolve Tauri installation
- Basic Tauri project setup
- Windows API POC

### Phase 2: Data Collection (1-2 weeks)
- Active window monitoring
- Event generation
- SQLite storage
- Basic timeline display

### Phase 3: Edge Integration (1 week)
- Modify Edge extension for data export
- Unified timeline display
- Data format standardization

### Phase 4: Purpose & Analysis (1-2 weeks)
- Purpose setting in desktop app
- Rule-based fade-out detection
- Reflection UI
- Basic pattern analysis

### Phase 5: AI Integration (Future)
- Connect to Azure OpenAI
- Story generation
- Pattern analysis
- Improvement suggestions

## Risk Mitigation

**Installation Issues:**
- Try npx approach first
- Consider Electron if Tauri permission issues persist
- Manual project setup as fallback

**Technical Complexity:**
- Start with Windows API POC before full implementation
- Use AI coding assistance for Rust code
- Focus on single successful feature first

**Edge Extension Integration:**
- Preserve existing extension
- Add export functionality
- Design simple communication protocol

## Success Criteria

**Phase 1:** Tauri project runs, shows empty window
**Phase 2:** Can detect VS Code → Chrome → Discord switching
**Phase 3:** Unified timeline shows both desktop and browser events
**Phase 4:** Purpose setting and basic fade-out detection works
**Phase 5:** User can provide reflection, data accumulates for future AI

## Immediate Next Steps

1. Try `npx @tauri-apps/cli init` in desktop directory
2. If fails, try project-local npm install
3. Create simple Windows API POC in Rust
4. Integrate existing Web UI into Tauri frontend
5. Implement basic event generation and storage