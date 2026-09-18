# OffTracker Requirements

## Information Requirements

### What Information is Needed to Understand "Why"?

| Information | Example | Collection Method | Priority |
|-------------|---------|-------------------|----------|
| Purpose | Webアプリを完成させる | User Input | High |
| Work Time | 18:00〜20:00 | Automatic | High |
| Used Apps | VS Code | Automatic | High |
| Web Usage | Google, YouTube | Automatic | High |
| Behavior Flow | VS Code→Google→YouTube | Automatic | High |
| Work Result | ログイン機能まで完成 | User Input | High |
| Reason for Failure | エラーが解決できなかった | User Input | High |
| Past Behavior | 同じパターンが3回 | Data Analysis | Medium |
| Next Action | 次回は問題を小さく分ける | User + AI | Low |

### Key Insight
**Automatic collection alone cannot determine "why"**

The psychological reasons and context require self-reporting from the user.

## Functional Requirements

### Session Management
- User can set a purpose before starting work
- User can start a session
- User can stop a session
- User can record the result of the session
- User can reflect on why they didn't complete the task

### Behavior Tracking
- System automatically detects active window/application
- System records application switching events
- System records timestamps for each event
- System records duration for each event
- System can identify web services when in browser

### Data Display
- Timeline view showing behavior flow
- Comparison between purpose and actual behavior
- Historical pattern comparison
- Reflection interface for user input

### Privacy Protection
- System does NOT collect keyboard input
- System does NOT collect passwords
- System does NOT take screenshots
- System does NOT collect file contents
- System does NOT monitor clipboard
- System does NOT collect search terms
- System does NOT monitor network traffic

## Non-Functional Requirements

### Performance
- Active window detection should respond within 1 second
- Data storage should not block the UI
- Timeline rendering should be smooth

### Privacy
- Data is stored locally by default
- Cloud sync is optional
- User must explicitly grant permissions
- Sensitive information is excluded from collection

### Usability
- User input should be minimal
- Automatic tracking should be transparent
- UI should be intuitive
- Learning curve should be low

## Technical Requirements

### Platform
- Windows 10/11 (primary)
- Data storage: SQLite (local) or JSON (development)
- HTTP server for local development

### Data Collection
- Windows API for active window detection
- Event-based detection (not polling)
- Time-series data storage

### Data Storage
- Local SQLite database (production)
- JSON files (development/prototype)
- Optional cloud sync (future)

## Constraints

### What OffTracker Does NOT Do
- ❌ Evaluate productivity
- ❌ Gamify behavior
- ❌ Send notifications
- ❌ Use timers
- ❌ Implement AI chat
- ❌ Judge user behavior
- ❌ Infer psychological state
- ❌ Make definitive cause statements

### What OffTracker DOES Do
- ✅ Record behavior as facts
- ✅ Show timeline of actions
- ✅ Compare purpose with reality
- ✅ Enable reflection
- ✅ Identify patterns over time
- ✅ Support next action planning

## User Input Requirements

### Minimum Input at Session Start
- Purpose (what the user intends to do)
- Optional: Target duration

### Minimum Input at Session End
- Result level (completed, mostly completed, partially completed, minimal, not completed)
- Result description (what was actually accomplished)
- Deviation reason (checkbox selection)
- Reflection details (free text, optional)

### Rationale
Input is limited to information that cannot be automatically determined. This minimizes user friction while capturing necessary context.

## Data Accuracy Requirements

### What Must Be Accurate
- Application names
- Timestamps
- Event sequences
- Duration calculations

### What Is Subjective
- Whether a deviation was "intentional" or "unintentional"
- The actual cause of failure
- The user's emotional state
- The quality of work

## Integration Requirements

### Desktop App
- Runs continuously in background
- Detects active window
- Records events
- Stores data locally

### Browser Extension (Future)
- Detects web service (Google, YouTube, GitHub, etc.)
- Sends events to desktop app
- Does NOT collect page content or search terms

### Cloud Services (Future)
- Optional sync
- AI analysis
- Multi-device support

## Security Requirements

### Data Protection
- Data encryption at rest (future)
- Secure cloud transmission (future)
- User consent for data sharing
- No data sent without explicit permission

### Access Control
- User owns their data
- User can delete their data
- User can export their data
- User can control cloud sync

## Success Criteria

### Technical Success
- ✅ Accurate window detection
- ✅ Reliable event recording
- ✅ Smooth timeline rendering
- ✅ Minimal performance impact

### User Success
- ✅ User can set purpose
- ✅ User can see their behavior
- ✅ User can compare purpose vs reality
- ✅ User can reflect on reasons
- ✅ User can identify patterns
- ✅ User can plan next actions

### Product Success
- ✅ User understands why they failed
- ✅ User feels supported, not judged
- ✅ User takes constructive next actions
- ✅ User continues to use the app

## Future Considerations

### Potential Future Features
- Multi-platform support (macOS, Linux)
- Mobile companion app
- Team usage scenarios
- Educational institution integration
- Enterprise use cases

### NOT in Scope for MVP
- AI analysis
- Advanced pattern recognition
- Predictive suggestions
- Social features
- Gamification
- External integrations
