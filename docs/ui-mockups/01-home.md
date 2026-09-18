# Screen 1: Home

## Purpose
Set today's purpose and start a work session.

## Layout

### State: Idle (No Active Session)
```
┌─────────────────────────────────────────────────────┐
│  OffTracker                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  今日の目的                                         │
│  ───────────────────────────                        │
│                                                     │
│  [ Webアプリのログイン機能を                         │
│    実装する                              ]         │
│                                                     │
│  目標時間（オプション）                              │
│  [ 3 ] 時間  [ 00 ] 分                              │
│                                                     │
│  [ 作業を開始 ]                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  最近のセッション                                   │
│  ───────────────────────────                        │
│                                                     │
│  9/20  Webアプリを完成させる                        │
│        結果: 最小限                                 │
│                                                     │
│  9/19  Webアプリのログイン機能を実装する            │
│        結果: 最小限                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### State: Active (Session in Progress)
```
┌─────────────────────────────────────────────────────┐
│  OffTracker                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  現在のセッション                                   │
│  ───────────────────────────                        │
│                                                     │
│  目的: Webアプリのログイン機能を実装する             │
│  目標: 3時間                                        │
│  開始: 18:00                                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│  現在                                               │
│  ───────────────────────────                        │
│                                                     │
│  セッション中                                       │
│  VS Code                                            │
│  作業時間 32分                                      │
│                                                     │
│  [ 作業を終了 ]                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Form Elements

### Purpose Input
- **Type:** Text area
- **Placeholder:** 今日やることを入力してください
- **Required:** Yes
- **Validation:** Cannot be empty

### Target Time Input
- **Type:** Number input (hours, minutes)
- **Required:** No
- **Default:** None
- **Validation:** Must be positive if provided

### Buttons
- **Start Work:** Submits form, starts session
- **Stop Work:** Ends session, navigates to Timeline

## Data Flow

### Start Session
```
User Input → POST /api/session/start
  {
    purpose: "Webアプリのログイン機能を実装する",
    target_time_minutes: 180
  }
  ↓
Server Response
  {
    id: "session-123",
    purpose: "...",
    start_time: "2026-09-16T18:00:00Z",
    status: "active"
  }
  ↓
UI updates to Active state
```

### Stop Session
```
User Click → POST /api/session/stop
  {
    session_id: "session-123"
  }
  ↓
Server Response
  {
    id: "session-123",
    end_time: "2026-09-16T19:30:00Z",
    status: "completed"
  }
  ↓
Navigate to Timeline screen
```

## Interactions

### User Flow
1. User opens app
2. User sees idle state
3. User types purpose
4. User optionally sets target time
5. User clicks "Start Work"
6. UI updates to active state
7. User works (background tracking)
8. User clicks "Stop Work"
9. Navigate to Timeline

### Validation
- Purpose cannot be empty
- Target time must be positive if provided
- Show error message if validation fails

### Loading States
- Show "Starting session..." when submitting
- Show "Stopping session..." when stopping

## Styling Considerations

### Visual Hierarchy
- Purpose input is the primary focus
- Target time is secondary
- Recent sessions provide context

### Color Scheme
- Primary button: Green (start)
- Danger button: Red (stop)
- Neutral colors for informational text

### Responsive Design
- Stack inputs vertically on mobile
- Maintain readable input size
- Button tap targets large enough

## Edge Cases

### No Recent Sessions
- Show message "過去のセッションはありません"
- Encourage user to start first session

### Session Already Active
- If server reports active session, show active state
- Allow user to stop existing session

### Server Error
- Show error message
- Allow retry
- Preserve user input
