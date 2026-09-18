# Screen 4: Reflection

## Purpose
Reflect on why the user didn't complete the task as planned.

## Layout
```
┌─────────────────────────────────────────────────────┐
│  OffTracker - Reflection                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  振り返ってみよう                                   │
│  ───────────────────────────                        │
│                                                     │
│  なぜ予定通りできなかったと                          │
│  思いますか？                                       │
│                                                     │
│  ☑ 作業が難しかった                                 │
│  ☐ 次に何をすればいいか                             │
│    分からなかった                                  │
│  ☑ 別のことをしてしまった                           │
│  ☐ 時間が足りなかった                               │
│  ☐ 予定が入った                                     │
│  ☐ 疲れていた                                       │
│  ☐ エラーが発生した                                 │
│  ☐ その他                                           │
│                                                     │
├─────────────────────────────────────────────────────┤
│  自由に書く                                         │
│  ───────────────────────────                        │
│  [ 途中でYouTubeを見て                              │
│    しまい、その後Discordで                         │
│    話してしまった                        ]         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [ 完了 ]                                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Form Elements

### Deviation Reasons
- **Type:** Checkboxes
- **Options:**
  - 作業が難しかった
  - 次に何をすればいいか分からなかった
  - 別のことをしてしまった
  - 時間が足りなかった
  - 予定が入った
  - 疲れていた
  - エラーが発生した
  - その他
- **Required:** At least one must be selected
- **Multiple selection:** Yes

### Free Text
- **Type:** Text area
- **Placeholder:** 詳しく書く（オプション）
- **Required:** No
- **Validation:** Optional

### Buttons
- **Complete:** Submits form, navigates to Pattern
- **Back:** Returns to Result (optional)

## Data Flow

### Load Reflection
```
GET /api/session/current
  ↓
Server Response
  {
    id: "session-123",
    purpose: "Webアプリのログイン機能を実装する"
  }
  ↓
Render Reflection form
```

### Submit Reflection
```
User Input → POST /api/reflection
  {
    session_id: "session-123",
    deviation_reason: "作業が難しかった,別のことをしてしまった",
    reflection_details: "途中でYouTubeを見てしまい、その後Discordで話してしまった"
  }
  ↓
Server Response
  {
    id: "ref-123",
    session_id: "session-123",
    deviation_reason: "...",
    reflection_details: "..."
  }
  ↓
Navigate to Pattern screen
```

## Interactions

### User Flow
1. User arrives from Result
2. User sees question
3. User selects one or more reasons
4. User optionally adds free text
5. User clicks "Complete"
6. Navigate to Pattern

### Validation
- At least one reason must be selected
- Show error message if none selected
- Free text is optional

### Dynamic Behavior
- If "その他" is selected, show additional text field (optional)
- If user selects multiple reasons, all are saved
- Clear visual indication of selected items

## Styling Considerations

### Visual Hierarchy
- Question is prominent
- Checkboxes are clearly labeled
- Free text is secondary

### Color Scheme
- Selected checkbox: Green accent
- Unselected: Neutral
- Primary button: Green

### Typography
- Question: Larger, bold
- Checkbox labels: Medium weight
- Free text placeholder: Lighter weight

## Responsive Design

### Desktop
- **Two-column** layout for checkboxes (optional)
- Adequate spacing
- Clear visual grouping

### Mobile
- **Single-column** layout
- Full-width checkboxes
- Larger tap targets

## Edge Cases

### No Reason Selected
- Show error message "少なくとも1つ選択してください"
- Highlight checkboxes
- Prevent submission

### Only "Other" Selected
- If "その他" is the only selection, require free text
- Show error if free text is empty
- Provide guidance

### Server Error
- Show error message
- Allow retry
- Preserve user input

## Accessibility

### Keyboard Navigation
- **Tab** through checkboxes
- **Space** to toggle checkboxes
- **Enter** to submit

### Screen Readers
- **ARIA labels** for checkbox group
- **Required field** indicators
- **Error message** announcements

### High Contrast
- **High contrast** for checkboxes
- **Clear borders** for text area
- **Readable** text on all backgrounds

## Future Enhancements

### Smart Suggestions
- **Suggest** reasons based on timeline
- Example: If YouTube was used, suggest "別のことをしてしまった"
- User can accept or reject

### Contextual Questions
- **Dynamic questions** based on result level
- If "未完了", ask about specific obstacles
- If "一部完了", ask about gaps

### Pattern Integration
- **Show** similar past reflections
- "前回も同じ理由でした"
- Link to Pattern screen
