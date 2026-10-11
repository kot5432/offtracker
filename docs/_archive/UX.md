# OffTracker UX Design

## Screen Architecture

OffTracker consists of 5 core screens that guide the user through the complete reflection loop:

1. **Home** - Set purpose and start work
2. **Timeline** - View actual behavior
3. **Result** - Record outcome
4. **Reflection** - Reflect on reasons
5. **Pattern** - Compare with past behavior

## Screen 1: Home

### Purpose
Set today's purpose and start a work session.

### Layout
```
┌─────────────────────────────────────┐
│  OffTracker                         │
├─────────────────────────────────────┤
│                                     │
│  今日の目的                         │
│  ─────────────────                  │
│                                     │
│  [ Webアプリのログイン機能を        │
│    実装する               ]         │
│                                     │
│  目標時間（オプション）              │
│  [ 3 時間      ] 分                 │
│                                     │
│  [ 作業を開始 ]                     │
│                                     │
├─────────────────────────────────────┤
│  現在                               │
│  ─────────────────                  │
│                                     │
│  セッション中                       │
│  VS Code                            │
│  作業時間 32分                      │
│                                     │
│  [ 作業を終了 ]                     │
│                                     │
└─────────────────────────────────────┘
```

### States
- **Idle (no active session)**: Show purpose input and start button
- **Active (session in progress)**: Show current activity and stop button

### Interactions
- User types purpose
- User optionally sets target time
- User clicks "Start Work" → Session starts, tracking begins
- User clicks "Stop Work" → Navigate to Result screen

## Screen 2: Timeline

### Purpose
Visualize the actual behavior flow during the session.

### Layout
```
┌─────────────────────────────────────┐
│  OffTracker - Timeline              │
├─────────────────────────────────────┤
│                                     │
│  今日の行動                         │
│  ─────────────────                  │
│                                     │
│  18:00 ━━━━━━━━━━━━━━ VS Code (35分)│
│         │                           │
│  18:35 ━━ Google (4分)              │
│         │                           │
│  18:39 ━━━━━━━━━━━━━━ YouTube (22分)│
│         │                           │
│  19:01 ━━ Discord (8分)             │
│         │                           │
│  19:09 ━━━━━━━━━━━━━━ VS Code (45分)│
│                                     │
│  総作業時間: 1時間49分               │
│                                     │
│  [ 結果を記録 ]                     │
│                                     │
└─────────────────────────────────────┘
```

### Visual Elements
- **Timeline**: Horizontal bars showing duration
- **Time labels**: Left side shows start time
- **App labels**: Next to each bar
- **Duration labels**: In parentheses
- **Color coding**:
  - Native apps: Blue
  - Browser services: Green
  - Idle periods: Gray

### Interactions
- User scrolls through timeline if long
- User clicks on event to see details (optional)
- User clicks "Record Result" → Navigate to Result screen

## Screen 3: Result

### Purpose
Record what was actually accomplished compared to the original purpose.

### Layout
```
┌─────────────────────────────────────┐
│  OffTracker - Result               │
├─────────────────────────────────────┤
│                                     │
│  今日の結果                         │
│  ─────────────────                  │
│                                     │
│  目的                               │
│  ─────────────────                  │
│  Webアプリのログイン機能を          │
│  実装する                           │
│                                     │
│  結果                               │
│  ─────────────────                  │
│  ○ 完了                             │
│  ○ ほぼ完了                         │
│  ● 一部完了                         │
│  ○ 最小限                           │
│  ○ 未完了                           │
│                                     │
│  できたこと                         │
│  ─────────────────                  │
│  [ ログイン画面のUIを               │
│    完成させた            ]          │
│                                     │
│  できなかったこと                   │
│  ─────────────────                  │
│  [ 認証処理の実装          ]        │
│                                     │
│  実際の作業時間                     │
│  1時間49分                          │
│                                     │
│  [ 振り返る ]                       │
│                                     │
└─────────────────────────────────────┘
```

### Form Elements
- **Result Level**: Radio buttons for completion level
- **What Was Done**: Text area for accomplishments
- **What Wasn't Done**: Text area for gaps
- **Actual Duration**: Auto-calculated from events

### Interactions
- User selects result level
- User types what was accomplished
- User types what wasn't accomplished
- User clicks "Reflect" → Navigate to Reflection screen

## Screen 4: Reflection

### Purpose
Reflect on why the user didn't complete the task as planned.

### Layout
```
┌─────────────────────────────────────┐
│  OffTracker - Reflection            │
├─────────────────────────────────────┤
│                                     │
│  振り返ってみよう                   │
│  ─────────────────                  │
│                                     │
│  なぜ予定通りできなかったと          │
│  思いますか？                       │
│                                     │
│  ☑ 作業が難しかった                 │
│  ☐ 次に何をすればいいか             │
│    分からなかった                    │
│  ☑ 別のことをしてしまった           │
│  ☐ 時間が足りなかった               │
│  ☐ 予定が入った                     │
│  ☐ 疲れていた                       │
│  ☐ エラーが発生した                 │
│  ☐ その他                           │
│                                     │
│  自由に書く                         │
│  ─────────────────                  │
│  [ 途中でYouTubeを見て              │
│    しまい、その後Discordで           │
│    話してしまった            ]      │
│                                     │
│  [ 完了 ]                           │
│                                     │
└─────────────────────────────────────┘
```

### Form Elements
- **Deviation Reasons**: Checkboxes for common reasons
- **Free Text**: Text area for additional details

### Checkbox Options
- 作業が難しかった
- 次に何をすればいいか分からなかった
- 別のことをしてしまった
- 時間が足りなかった
- 予定が入った
- 疲れていた
- エラーが発生した
- その他

### Interactions
- User selects one or more reasons
- User optionally adds free text
- User clicks "Complete" → Navigate to Pattern screen

## Screen 5: Pattern

### Purpose
Compare current session with past behavior to identify patterns.

### Layout
```
┌─────────────────────────────────────┐
│  OffTracker - Pattern              │
├─────────────────────────────────────┤
│                                     │
│  これまでの作業を振り返る           │
│  ─────────────────                  │
│                                     │
│  最近3回のセッションで              │
│                                     │
│  「難しい問題に遭遇」               │
│        ↓                            │
│  「ブラウザで調査」                 │
│        ↓                            │
│  「作業終了」                       │
│                                     │
│  という流れが2回ありました。        │
│                                     │
│  そのときの振り返り：               │
│  ・エラーが解決できなかった         │
│  ・何を調べればいいか               │
│    分からなかった                   │
│                                     │
│  [ 新しいセッションを開始 ]         │
│                                     │
└─────────────────────────────────────┘
```

### Content
- **Pattern Detection**: Automatically identify recurring patterns
- **Past Reflections**: Show what user reflected in similar situations
- **Insight**: Provide factual observation, not judgment

### Interactions
- User reviews patterns
- User clicks "Start New Session" → Navigate to Home screen

## Navigation Flow

```
Home (Purpose)
    ↓ [Start Work]
Timeline (Active Tracking)
    ↓ [Stop Work]
Result (Record Outcome)
    ↓ [Reflect]
Reflection (Reflect on Reasons)
    ↓ [Complete]
Pattern (Compare with Past)
    ↓ [Start New Session]
Home (Purpose)
```

## Design Principles

### Non-Judgmental
- No "you lacked focus" messaging
- No shame or guilt induction
- Present facts, not evaluations

### Minimal Input
- Purpose at start: 1 text field
- Result at end: 1 radio selection + 2 text fields
- Reflection: Checkboxes + optional free text

### Clear Visualization
- Timeline shows actual behavior flow
- Comparison between purpose and reality is explicit
- Patterns are presented as observations

### Privacy-Aware
- No sensitive data displayed
- Window titles optional
- User controls what is shown

## Responsive Design

### Desktop
- Full-width timeline
- Side-by-side layout for Result/Reflection (optional)
- Pattern analysis in dedicated section

### Mobile (Future)
- Vertical timeline
- Stacked form fields
- Simplified pattern display

## Accessibility

### Keyboard Navigation
- All interactive elements accessible via keyboard
- Clear focus indicators
- Logical tab order

### Screen Readers
- Semantic HTML structure
- ARIA labels where needed
- Alternative text for visual elements

### Color Contrast
- High contrast for text
- Color not the only indicator (use symbols/labels)

## Error States

### Validation Errors
- Purpose cannot be empty
- Result level must be selected
- At least one deviation reason must be selected

### Data Errors
- No events recorded for session
- Timeline data corrupted
- Pattern analysis failed

### Recovery
- Clear error messages
- Suggested actions
- Data preservation on errors

## Loading States

### Initial Load
- Show placeholder for timeline
- Show loading indicator for pattern analysis

### Data Refresh
- Update timeline incrementally
- Show progress for pattern detection

## Empty States

### No Active Session
- Show purpose input
- Prompt user to start

### No Past Sessions
- Show message "No past sessions to compare"
- Encourage user to continue using

### No Patterns Detected
- Show message "No clear patterns yet"
- Explain that patterns emerge over time

## Future Enhancements

### Timeline
- Hover for event details
- Filter by application type
- Export timeline as image

### Result
- Compare with target time
- Show efficiency metrics (optional)

### Reflection
- Suggest next actions based on reflection
- Link to similar past sessions

### Pattern
- Trend visualization over time
- Pattern strength indicators
- Custom date range selection
