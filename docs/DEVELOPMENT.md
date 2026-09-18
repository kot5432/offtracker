# OffTracker Development Guide

## Development Philosophy

OffTracker development follows a **purpose-driven, privacy-first, step-by-step** approach. Every decision starts from the core purpose defined in PRODUCT.md.

## Core Purpose

「やろう」と思っていたことができなかったとき、実際の行動・作業状況・結果・振り返りをもとに、なぜ実行できなかったのかを理解できるようにする。

## Development Workflow

### For Large Changes

1. **Read Product Documents**
   - Start with `docs/PRODUCT.md`
   - Review `docs/REQUIREMENTS.md`
   - Check `docs/DATA_MODEL.md`
   - Review `docs/UX.md`
   - Review `docs/AI_RULES.md`

2. **Use Plan Mode**
   - Research codebase thoroughly
   - Trace data flow
   - Identify exact code to change
   - Write implementation plan
   - Get user approval
   - Implement according to plan

3. **Verify Alignment**
   - Check AI_RULES.md
   - Confirm purpose contribution
   - Assess privacy impact
   - Evaluate complexity

4. **Implement**
   - Follow approved plan
   - Make changes incrementally
   - Test each change
   - Update documentation

5. **Validate**
   - Test end-to-end
   - Verify data integrity
   - Check privacy controls
   - Ensure no judgment/shame

### For Small Changes

1. **Read Relevant Documents**
   - At minimum, review AI_RULES.md
   - Check if change affects data model

2. **Make Change**
   - Keep changes minimal
   - Focus on specific issue
   - Test thoroughly

3. **Document**
   - Update relevant docs
   - Explain reasoning
   - Note any trade-offs

## AI Collaboration Guidelines

### How to Give Instructions to AI

#### Bad Example
```
「OffTrackerを完成させてください」
```

**Problems:**
- Too vague
- No context
- No boundaries
- Risk of feature creep
- Likely to violate AI_RULES.md

#### Good Example
```
「OffTrackerの目的は『やろうと思っていたことができなかった理由を、実際の行動・結果・振り返りから理解できるようにすること』です。

まずdocs/PRODUCT.mdを読んでください。

今回のタスクは『Timeline画面の実装』です。

目的は、ユーザーが『自分が実際にどのような行動をしていたか』を確認できるようにすることです。

実装前に、以下を整理してください：
1. 現在のコード構造
2. 関係するファイル
3. 必要な変更
4. データ構造
5. UI構成
6. 想定される問題
7. テスト方法

まだコードは変更しないでください。まず計画を提示してください。」
```

**Benefits:**
- Clear purpose
- Specific task
- Boundaries defined
- AI Rules referenced
- Planning first approach

### Step-by-Step AI Collaboration

1. **Set Context**
   - Always start with PRODUCT.md
   - Define the specific task
   - Set boundaries
   - Reference AI_RULES.md

2. **Ask for Plan**
   - Request implementation plan first
   - No code changes yet
   - Require documentation of approach

3. **Review Plan**
   - Check against AI_RULES.md
   - Verify purpose contribution
   - Assess privacy impact
   - Evaluate complexity

4. **Approve or Refine**
   - If approved: "この計画で実装してください"
   - If issues: Request revisions
   - Be specific about concerns

5. **Request Implementation**
   - "この計画で実装してください"
   - "変更したファイルと変更内容を最後にまとめてください"

6. **Review Changes**
   - Check against approved plan
   - Verify no violations
   - Test functionality
   - Update documentation

## Task Segmentation

### Do Not
- ❌ Ask AI to "complete OffTracker"
- ❌ Implement multiple screens at once
- ❌ Add features without purpose justification
- ❌ Skip planning phase

### Do
- ✅ Focus on one screen at a time
- ✅ Implement one feature at a time
- ✅ Always justify with purpose
- ✅ Always plan before implementing

### Example Task Segmentation

Instead of:
```
「OffTrackerのUIを完成させてください」
```

Do:
```
Task 1: Home画面の実装
Task 2: Timeline画面の実装
Task 3: Result画面の実装
Task 4: Reflection画面の実装
Task 5: Pattern画面の実装
```

## Code Structure

### Current Implementation
```
offtracker/
├── desktop/              # Local prototype
│   ├── simple-server.js  # HTTP server with session management
│   ├── tracker.js        # Window tracking
│   ├── desktop-test.html # Simple UI
│   └── renderer-simple.js # Frontend logic
├── docs/                 # Documentation
│   ├── PRODUCT.md        # Product definition
│   ├── REQUIREMENTS.md   # Requirements
│   ├── DATA_MODEL.md     # Data model
│   ├── UX.md             # UX design
│   ├── AI_RULES.md       # AI development rules
│   └── DEVELOPMENT.md    # This file
└── web/                  # Existing web dashboard (to be replaced)
```

### Future Structure
```
offtracker/
├── desktop/              # Desktop app
│   ├── src/              # Frontend
│   │   ├── home.html
│   │   ├── timeline.html
│   │   ├── result.html
│   │   ├── reflection.html
│   │   └── pattern.html
│   ├── server.js         # Backend
│   └── tracker.js        # Window tracking
├── docs/                 # Documentation
└── data/                 # Local data
    ├── sessions.db       # SQLite database
    └── export/           # Data exports
```

## Data Flow

### Current Flow
```
Windows API (active-win)
    ↓
tracker.js (polling every 5s)
    ↓
simple-server.js (HTTP API)
    ↓
JSON files (storage)
    ↓
desktop-test.html (UI)
```

### Target Flow
```
Windows API (event-based)
    ↓
tracker.js (event detection)
    ↓
server.js (HTTP API)
    ↓
SQLite database (storage)
    ↓
HTML pages (UI)
```

## Testing Strategy

### What to Test
- Window detection accuracy
- Event recording reliability
- Session management
- Data persistence
- Timeline rendering
- Form validation
- Privacy controls

### How to Test
1. **Unit Tests** (future)
   - Window detection functions
   - Event validation
   - Data model operations

2. **Integration Tests** (future)
   - Session lifecycle
   - API endpoints
   - Database operations

3. **Manual Tests** (current)
   - Start session
   - Track events
   - Stop session
   - Record result
   - View timeline
   - Add reflection

### Test Data
Use mock sessions from `docs/mock-sessions/` for testing UI rendering.

## Privacy Testing

### What to Verify
- No keyboard logging
- No screenshots
- No clipboard monitoring
- No file content reading
- No password collection
- No search term collection
- No network traffic monitoring

### How to Verify
- Review code for prohibited APIs
- Check data collection points
- Verify data storage
- Test data export
- Audit external communications

## Deployment Strategy

### Current: Local Only
- Node.js server runs locally
- Data stored in JSON files
- No cloud sync
- No external dependencies

### Future: Optional Cloud
- Local-first approach
- Optional cloud sync
- User-controlled
- Privacy-preserving
- End-to-end encryption (if implemented)

## Rollback Strategy

### If Change Breaks Something
1. Identify the breaking change
2. Revert the change
3. Review what went wrong
4. Update AI_RULES.md if needed
5. Replan the approach

### If AI Violates Rules
1. Stop immediately
2. Review what was generated
3. Identify which rule was violated
4. Explain to AI why it's wrong
5. Request correction with explicit boundaries

## Common Pitfalls

### Adding Judgment
**Pitfall:** Adding "productivity score" or "focus level"
**Prevention:** Check AI_RULES.md rule #2

### Collecting Too Much Data
**Pitfall:** Adding window title collection without controls
**Prevention:** Check AI_RULES.md rule #6

### Feature Creep
**Pitfall:** Adding notifications, timers, gamification
**Prevention:** Always ask: "Does this contribute to understanding why?"

### Skipping Planning
**Pitfall:** Implementing without plan
**Prevention:** Use Plan Mode for any non-trivial change

### Breaking Privacy
**Pitfall:** Adding data collection without user consent
**Prevention:** Check AI_RULES.md rule #10

## Documentation Updates

### When to Update Docs
- After any structural change
- After adding new features
- After changing data model
- After privacy changes
- After bug fixes that affect behavior

### Which Docs to Update
- `docs/PRODUCT.md` - Rarely changes
- `docs/REQUIREMENTS.md` - When requirements change
- `docs/DATA_MODEL.md` - When data model changes
- `docs/UX.md` - When UI changes
- `docs/AI_RULES.md` - When rules need clarification
- `docs/DEVELOPMENT.md` - When process changes

## Getting Help

### If Stuck
1. Review PRODUCT.md
2. Review AI_RULES.md
3. Check existing code
4. Consult mock data
5. Re-read the specific task instructions

### If Confused About Purpose
Re-read PRODUCT.md. If still unclear, the task may not align with the product purpose.

### If AI Misbehaves
1. Stop the AI
2. Review what it generated
3. Identify the violation
4. Give explicit correction
5. Reference specific AI_RULES.md rule

## Success Criteria

### Development Success
- ✅ Code aligns with PRODUCT.md
- ✅ No violations of AI_RULES.md
- ✅ Privacy is preserved
- ✅ Data is accurate
- ✅ UI is non-judgmental
- ✅ Tests pass

### Product Success
- ✅ User can set purpose
- ✅ User can see behavior
- ✅ User can compare purpose vs reality
- ✅ User can reflect on reasons
- ✅ User can identify patterns
- ✅ User feels supported, not judged

## Remember

**Every line of code should serve the purpose defined in PRODUCT.md.**

If you're unsure whether a feature or change is appropriate, the answer is probably "no."
