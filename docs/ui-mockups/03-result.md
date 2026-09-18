# Screen 3: Result

## Purpose
Record what was actually accomplished compared to the original purpose.

## Layout
```
┌─────────────────────────────────────────────────────┐
│  OffTracker - Result                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  今日の結果                                         │
│  ───────────────────────────                        │
│                                                     │
│  目的                                               │
│  ───────────────────────────                        │
│  Webアプリのログイン機能を                          │
│  実装する                                           │
│                                                     │
│  目標時間: 3時間                                    │
│  実際の時間: 1時間49分                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│  結果                                               │
│  ───────────────────────────                        │
│                                                     │
│  ○ 完了                                             │
│  ○ ほぼ完了                                         │
│  ● 一部完了                                         │
│  ○ 最小限                                           │
│  ○ 未完了                                           │
│                                                     │
├─────────────────────────────────────────────────────┤
│  できたこと                                         │
│  ───────────────────────────                        │
│  [ ログイン画面のUIを                               │
│    完成させた                            ]         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  できなかったこと                                   │
│  ───────────────────────────                        │
│  [ 認証処理の実装                        ]         │
│  [ バックエンドとの接続                  ]         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [ 振り返る ]                                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Form Elements

### Result Level
- **Type:** Radio buttons
- **Options:**
  - 完了 - Fully completed
  - ほぼ完了 - Mostly completed
  - 一部完了 - Partially completed
  - 最小限 - Minimal progress
  - 未完了 - Not completed
- **Required:** Yes
- **Default:** None selected

### What Was Done
- **Type:** Text area
- **Placeholder:** 何ができましたか？
- **Required:** Yes
- **Validation:** Cannot be empty

### What Wasn't Done
- **Type:** Text area
- **Placeholder:** 何ができませんでしたか？
- **Required:** No
- **Validation:** Optional

### Buttons
- **Reflect:** Submits form, navigates to Reflection
- **Back:** Returns to Timeline (optional)

## Data Flow

### Load Result
```
GET /api/session/current
  ↓
Server Response
  {
    id: "session-123",
    purpose: "Webアプリのログイン機能を実装する",
    target_time_minutes: 180,
    start_time: "2026-09-16T18:00:00Z",
    end_time: "2026-09-16T19:49:00Z"
  }
  ↓
GET /api/session/elapsed
  ↓
Server Response
  {
    elapsed_minutes: 109
  }
  ↓
Render Result form
```

### Submit Result
```
User Input → POST /api/session/result
  {
    session_id: "session-123",
    result_level: "partially_completed",
    result_description: "ログイン画面のUIを完成させた",
    actual_duration_minutes: 109
  }
  ↓
Server Response
  {
    id: "res-123",
    session_id: "session-123",
    result_level: "partially_completed",
    result_description: "...",
    actual_duration_minutes: 109
  }
  ↓
Navigate to Reflection screen
```

## Interactions

### User Flow
1. User arrives from Timeline
2. User sees original purpose
3. User sees target vs actual time
4. User selects result level
5. User types what was accomplished
6. User optionally types what wasn't accomplished
7. User clicks "Reflect"
8. Navigate to Reflection

### Validation
- Result level must be selected
- "What was done" cannot be empty
- Show error message if validation fails

### Auto-Calculation
- Actual duration auto-calculated from events
- Target time from session data
- Show time difference (optional)

## Styling Considerations

### Visual Hierarchy
- Purpose display is prominent
- Result level selection is clear
- Text areas are secondary

### Color Scheme
- Selected radio: Green accent
- Text areas: Neutral border
- Primary button: Green

### Typography
- Purpose: Larger, bold
- Labels: Medium weight
- Input text: Regular weight

## Responsive Design

### Desktop
- **Side-by-side** layout (optional)
- Purpose on left, form on right
- Adequate spacing

### Mobile
- **Stacked** layout
- Purpose at top
- Form below
- Full-width inputs

## Edge Cases

### Duration Mismatch
- If actual > target, show warning (optional)
- If actual << target, highlight difference
- No judgment, just facts

### Empty What Wasn't Done
- Allow submission without "what wasn't done"
- If result level is "completed", hide this field (optional)

### Server Error
- Show error message
- Allow retry
- Preserve user input

## Accessibility

### Keyboard Navigation
- **Tab** through form fields
- **Arrow keys** for radio buttons
- **Enter** to submit

### Screen Readers
- **ARIA labels** for radio groups
- **Required field** indicators
- **Error message** announcements

### High Contrast
- **High contrast** for radio buttons
- **Clear borders** for text areas
- **Readable** text on all backgrounds

## Future Enhancements

### Automatic Suggestions
- **Suggest** what was done based on events
- **Auto-fill** based on timeline analysis
- **User can edit** suggestions

### Time Analysis
- **Break down** time by app
- **Show** time spent on different tasks
- **Compare** with target time

### Quick Templates
- **Templates** for common results
- **Auto-fill** based on result level
- **Customizable** by user
