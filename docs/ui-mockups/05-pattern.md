# Screen 5: Pattern

## Purpose
Compare current session with past behavior to identify patterns.

## Layout
```
┌─────────────────────────────────────────────────────┐
│  OffTracker - Pattern                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  これまでの作業を振り返る                           │
│  ───────────────────────────                        │
│                                                     │
│  最近3回のセッションで                              │
│                                                     │
│  「難しい問題に遭遇」                               │
│        ↓                                            │
│  「ブラウザで調査」                                 │
│        ↓                                            │
│  「作業終了」                                       │
│                                                     │
│  という流れが2回ありました。                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│  そのときの振り返り                                 │
│  ───────────────────────────                        │
│                                                     │
│  9/17  Webアプリのログイン機能を実装する            │
│        作業が難しかった                             │
│        エラーが解決できなかった                     │
│                                                     │
│  9/15  APIエンドポイントの実装                      │
│        作業が難しかった                             │
│        何を調べればいいか分からなかった             │
│                                                     │
├─────────────────────────────────────────────────────┤
│  インサイト                                         │
│  ───────────────────────────                        │
│                                                     │
│  難しい問題に遭遇したとき、                          │
│  調査に時間をかけすぎて                             │
│  作業を中断する傾向があります。                      │
│                                                     │
│  次回は以下を試してみてください：                  │
│  • 調査時間を15分に制限する                        │
│  • 分からないことは質問する                        │
│  • 問題を小さく分ける                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [ 新しいセッションを開始 ]                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Visual Elements

### Pattern Detection
- **Arrow diagram** showing flow
- **Count** of occurrences
- **Visual representation** of pattern

### Past Reflections
- **List** of similar sessions
- **Date** and **purpose**
- **Selected reasons** from reflection

### Insights
- **Factual observations** (not judgments)
- **Suggestions** for next action
- **Links** to past sessions

## Data Flow

### Load Pattern
```
GET /api/patterns?session_id=session-123
  ↓
Server Response
  {
    patterns: [
      {
        flow: ["難しい問題に遭遇", "ブラウザで調査", "作業終了"],
        count: 2,
        sessions: [
          {
            date: "2026-09-17",
            purpose: "Webアプリのログイン機能を実装する",
            deviation_reason: "作業が難しかった,エラーが発生した"
          },
          {
            date: "2026-09-15",
            purpose: "APIエンドポイントの実装",
            deviation_reason: "作業が難しかった,次に何をすればいいか分からなかった"
          }
        ]
      }
    ]
  }
  ↓
Render Pattern screen
```

## Interactions

### User Flow
1. User arrives from Reflection
2. User sees detected patterns
3. User reviews past reflections
4. User reads insights
5. User clicks "Start New Session"
6. Navigate to Home

### Expand/Collapse
- **Click** on pattern to expand details
- **Show** all related sessions
- **Collapse** to hide details

### Navigation
- **Click** on past session to view details (optional)
- **Link** to session timeline
- **Back** button to return

## Styling Considerations

### Visual Hierarchy
- Pattern detection is prominent
- Past reflections provide context
- Insights are actionable

### Color Scheme
- Pattern arrows: Blue
- Past sessions: Neutral
- Insights: Green accent

### Typography
- Pattern flow: Larger, bold
- Past sessions: Medium weight
- Insights: Regular weight

## Responsive Design

### Desktop
- **Side-by-side** layout (optional)
- Pattern on left, details on right
- Adequate spacing

### Mobile
- **Stacked** layout
- Pattern at top
- Details below
- Full-width elements

## Edge Cases

### No Patterns Detected
- Show message "まだパターンが見つかりません"
- Explain that patterns emerge over time
- Encourage continued use

### Single Pattern
- Show single pattern prominently
- Provide detailed breakdown
- Highlight significance

### Many Patterns
- **Paginate** or scroll
- Show most frequent first
- Allow filtering (future)

## Accessibility

### Keyboard Navigation
- **Tab** through patterns
- **Enter/Space** to expand/collapse
- **Escape** to close details

### Screen Readers
- **ARIA labels** for pattern flow
- **Live regions** for dynamic updates
- **Semantic HTML** structure

### High Contrast
- **High contrast** for arrows
- **Clear borders** for sections
- **Readable** text on all backgrounds

## Future Enhancements

### Trend Visualization
- **Chart** showing pattern frequency over time
- **Trend line** for improvement
- **Comparison** with baseline

### Custom Date Range
- **Date picker** for custom range
- **Filter** by result level
- **Compare** specific periods

### Pattern Strength
- **Score** pattern strength (1-10)
- **Show** confidence level
- **Highlight** strongest patterns

### AI Suggestions
- **AI-generated** insights (future)
- **Personalized** recommendations
- **Adaptive** based on user behavior

## Pattern Detection Algorithm (Future)

### Step 1: Identify Similar Sessions
```javascript
// Find sessions with similar deviation reasons
const similarSessions = sessions.filter(s =>
  s.deviation_reason.includes(currentSession.deviation_reason)
);
```

### Step 2: Extract Flow
```javascript
// Extract event sequence
const flow = events.map(e => e.application);
// Compare flows across sessions
const commonFlows = findCommonSubsequences(flows);
```

### Step 3: Count Occurrences
```javascript
// Count how many times each pattern occurs
const patternCounts = countOccurrences(commonFlows);
```

### Step 4: Generate Insights
```javascript
// Generate factual observations
const insights = generateInsights(patternCounts, reflections);
```

## Ethical Considerations

### Non-Judgmental
- **No blame** or shame
- **Factual observations** only
- **Supportive** tone

### Privacy
- **No sensitive data** in patterns
- **Aggregate** data only
- **User control** over sharing

### Transparency
- **Explain** how patterns are detected
- **Show** raw data
- **Allow** user to correct
