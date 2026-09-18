# Screen 2: Timeline

## Purpose
Visualize the actual behavior flow during the session.

## Layout
```
┌─────────────────────────────────────────────────────┐
│  OffTracker - Timeline                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  今日の行動                                         │
│  ───────────────────────────                        │
│                                                     │
│  18:00 ━━━━━━━━━━━━━━━━━━━━━━ VS Code (35分)       │
│         │                                           │
│  18:35 ━━━━ Google (4分)                            │
│         │                                           │
│  18:39 ━━━━━━━━━━━━━━━━━━━━━━ YouTube (22分)       │
│         │                                           │
│  19:01 ━━━━ Discord (8分)                           │
│         │                                           │
│  19:09 ━━━━━━━━━━━━━━━━━━━━━━ VS Code (45分)       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  サマリー                                           │
│  ───────────────────────────                        │
│                                                     │
│  総作業時間: 1時間49分                              │
│  アプリ切り替え: 4回                                │
│  最長使用: VS Code (80分)                          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  フィルター                                         │
│  ───────────────────────────                        │
│                                                     │
│  [☑] ネイティブアプリ                               │
│  [☑] ブラウザ                                      │
│  [☐] アイドル時間                                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [ 結果を記録 ]                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Visual Elements

### Timeline Bars
- **Horizontal bars** representing duration
- **Length** proportional to duration
- **Color coding:**
  - Native apps: Blue (#3B82F6)
  - Browser services: Green (#10B981)
  - Idle periods: Gray (#6B7280)

### Time Labels
- **Left side:** Start time (HH:MM)
- **Right side:** Duration in parentheses
- **Font:** Monospace for alignment

### App Labels
- **Position:** Next to each bar
- **Format:** Application name (and service if browser)
- **Example:** "VS Code", "Chrome/Google", "Chrome/YouTube"

### Connection Lines
- **Vertical lines** connecting bars
- **Show sequence** of behavior
- **Visual flow** from top to bottom

## Data Flow

### Load Timeline
```
GET /api/events?session_id=session-123
  ↓
Server Response
  [
    {
      id: "evt-1",
      start_time: "2026-09-16T18:00:00Z",
      end_time: "2026-09-16T18:35:00Z",
      application: "VS Code",
      duration_seconds: 2100
    },
    ...
  ]
  ↓
Render Timeline
```

### Filter Events
```
User toggles filter checkboxes
  ↓
Client-side filtering
  ↓
Re-render timeline
```

## Interactions

### Scroll
- **Vertical scroll** for long timelines
- **Smooth scrolling** for better UX
- **Sticky header** for time labels

### Hover
- **Hover over bar** to see details
- **Tooltip:** App name, duration, window title
- **Highlight** the hovered bar

### Click
- **Click on bar** to expand details
- **Show:** Window title, process ID, exact times
- **Close** on click outside

### Filter
- **Toggle checkboxes** to show/hide event types
- **Real-time filtering** without page reload
- **Preserve scroll position**

## Calculations

### Summary Statistics
```javascript
const totalDuration = events.reduce((sum, e) => sum + e.duration_seconds, 0);
const switchCount = events.length - 1;
const longestEvent = events.reduce((max, e) =>
  e.duration_seconds > max.duration_seconds ? e : max
);
```

### Timeline Scale
```javascript
const maxDuration = Math.max(...events.map(e => e.duration_seconds));
const scale = 100 / maxDuration; // pixels per second
const barWidth = event.duration_seconds * scale;
```

## Styling Considerations

### Color Coding
- **Consistent colors** for app types
- **High contrast** for readability
- **Color blind friendly** (use symbols too)

### Typography
- **Monospace** for time labels
- **Sans-serif** for app labels
- **Appropriate font sizes** for readability

### Spacing
- **Consistent padding** between bars
- **Clear separation** between sections
- **Adequate whitespace** for visual breathing room

## Responsive Design

### Desktop
- **Full-width** timeline
- **Side-by-side** summary and filters
- **Hover details** available

### Mobile
- **Vertical timeline** (already vertical)
- **Stacked** summary and filters
- **Tap** for details instead of hover

## Edge Cases

### No Events
- Show message "記録されたイベントがありません"
- Explain that tracking may not have started
- Offer to return to Home

### Single Event
- Show single bar
- No connection lines needed
- Still show summary

### Long Duration
- **Scale timeline** to fit screen
- **Provide zoom** functionality (future)
- **Show scroll indicators**

### Many Events
- **Virtual scrolling** for performance (future)
- **Lazy loading** for very long sessions
- **Pagination** option (future)

## Accessibility

### Keyboard Navigation
- **Tab** through timeline bars
- **Enter/Space** to expand details
- **Escape** to close details

### Screen Readers
- **ARIA labels** for timeline bars
- **Live regions** for summary updates
- **Semantic HTML** structure

### High Contrast
- **High contrast mode** support
- **Text readable** on all backgrounds
- **Alternative indicators** besides color

## Future Enhancements

### Zoom and Pan
- **Zoom in/out** to see more/less detail
- **Pan** to navigate long timelines
- **Minimap** for overview

### Export
- **Export as image** (PNG)
- **Export as CSV** (data)
- **Share** with others (optional)

### Comparison
- **Side-by-side** comparison with previous sessions
- **Overlay** timelines
- **Difference highlighting**
