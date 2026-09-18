# OffTracker AI Development Rules

## Core Principle

Before adding any feature, ask:
**「この機能は『やろうと思っていたことができなかった理由を理解する』という目的にどう貢献するか？」**

If the answer is unclear or the contribution is indirect, do not add the feature.

## What NOT to Do

### 1. 目的に直接関係しない機能を追加しない

**Examples of forbidden features:**
- ❌ Productivity score (生産性スコア)
- ❌ Gamification (ゲーミフィケーション)
- ❌ Pomodoro timer (ポモドーロタイマー)
- ❌ Notifications (通知機能)
- ❌ AI chat (AIチャット)
- ❌ Habit tracking (習慣トラッキング)
- ❌ Goal setting beyond purpose (目的以外の目標設定)

**Rationale:** These features distract from the core purpose of understanding why tasks weren't completed.

### 2. ユーザーの行動を「良い・悪い」と評価しない

**Forbidden messaging:**
- ❌ "あなたはYouTubeを1時間使いました。集中力が低下しています"
- ❌ "今日の生産性は42点です"
- ❌ "もっと集中する必要があります"
- ❌ "悪い習慣です"

**Allowed messaging:**
- ✅ "YouTubeを1時間使用していました"
- ✅ "VS Codeを35分使用していました"
- ✅ "Googleで4分間調査していました"

**Rationale:** OffTracker should present facts, not judgments. Shaming the user is counterproductive.

### 3. YouTube利用だけで「集中力が切れた」と判断しない

**Forbidden assumptions:**
- ❌ YouTubeへのアクセス＝脱線
- ❌ 娯楽サイト＝悪い行動
- ❌ 休憩＝生産性の低下

**Allowed analysis:**
- ✅ "YouTubeを1時間使用していました"
- ✅ "調査のためにYouTubeを見ていた可能性があります"
- ✅ "休憩としてYouTubeを使用していました"

**Rationale:** YouTube usage can be for research, relaxation, or many other legitimate reasons. Context matters.

### 4. ログからユーザーの心理状態を推測しない

**Forbidden inferences:**
- ❌ "ユーザーは疲れているようです"
- ❌ "ユーザーはモチベーションが低下しています"
- ❌ "ユーザーは退屈しています"
- ❌ "ユーザーはストレスを感じています"

**Allowed observations:**
- ✅ "2時間以上連続作業しています"
- ✅ "アプリの切り替えが頻繁に発生しています"
- ✅ "長時間休憩しています"

**Rationale:** Psychological state cannot be reliably inferred from behavior logs. Stick to observable facts.

### 5. 原因を断定せず、観測事実と仮説を区別する

**Forbidden statements:**
- ❌ "エラーが原因で作業が中断されました"
- ❌ "YouTubeによって集中が途切れました"
- ❌ "疲労のために作業を終了しました"

**Allowed statements:**
- ✅ "エラー発生後にブラウザ調査が始まりました"
- ✅ "YouTube使用後に作業を再開しました"
- ✅ "長時間作業後に休憩を取りました"

**Rationale:** We can observe correlations but cannot definitively determine causation. Distinguish between facts and hypotheses.

### 6. 個人情報を必要以上に収集しない

**Forbidden data collection:**
- ❌ Keyloggers (キーロガー)
- ❌ Screenshots (スクリーンショット)
- ❌ Clipboard monitoring (クリップボード監視)
- ❌ File content reading (ファイル内容の読み取り)
- ❌ Password collection (パスワード収集)
- ❌ Search term collection (検索語句収集)
- ❌ Network traffic monitoring (ネットワークトラフィック監視)
- ❌ Mouse coordinates (マウス座標)
- ❌ Detailed user interactions (詳細なユーザー操作)

**Allowed data collection:**
- ✅ Application name (VS Code, Chrome, etc.)
- ✅ Web service name (Google, YouTube, etc.)
- ✅ Window title (subject to privacy controls)
- ✅ Process ID (for technical identification)
- ✅ Timestamps (start/end times)
- ✅ Duration
- ✅ User-provided purpose, result, reflection

**Rationale:** Privacy is paramount. Only collect data necessary for the core purpose.

### 7. 大きな変更の前には実装計画を作る

**Required process:**
1. Use Plan Mode for large changes
2. Propose implementation plan before coding
3. Get user approval
4. Implement according to plan
5. Update plan as understanding evolves

**Examples of large changes:**
- New screen or major UI change
- Database schema migration
- Data model restructuring
- New data collection mechanism
- Integration with external services

**Rationale:** Large changes have significant impact. Planning reduces risk and ensures alignment with purpose.

### 8. 既存機能を壊さない

**Required checks:**
- Verify existing functionality still works
- Run tests if available
- Check data migration if schema changes
- Test user flows end-to-end

**Rationale:** Breaking changes frustrate users and reduce trust. Maintain stability.

### 9. 新機能追加前に「目的への貢献」を確認する

**Required question:**
"この機能は『やろうと思っていたことができなかった理由を理解する』という目的にどう貢献するか？"

**Evaluation criteria:**
- Direct contribution to understanding "why"
- Enables better reflection
- Improves pattern detection
- Supports next action planning

**If contribution is unclear:**
- Do not implement
- Reconsider the feature
- Simplify or remove parts

**Rationale:** Prevent feature creep and maintain focus on core purpose.

### 10. プライバシーを最優先する

**Required practices:**
- Data is stored locally by default
- Cloud sync is optional
- User must explicitly grant permissions
- User can delete their data
- User can export their data
- User can disable tracking at any time

**Forbidden practices:**
- ❌ Send data without user consent
- ❌ Collect sensitive information
- ❌ Share data with third parties
- ❌ Retain data indefinitely without user control

**Rationale:** Trust is essential. Privacy violations undermine the product's value.

## Feature Addition Checklist

Before implementing any new feature, answer:

1. **Purpose Contribution:** How does this help users understand why they didn't complete tasks?
2. **Direct vs Indirect:** Is the contribution direct or indirect?
3. **Necessity:** Is this necessary for the core purpose, or nice-to-have?
4. **Privacy Impact:** Does this affect user privacy? How is it mitigated?
5. **Complexity:** Does this add unnecessary complexity?
6. **Alternative:** Is there a simpler way to achieve the same goal?

If any answer is concerning, reconsider the feature.

## Messaging Guidelines

### Do Say
- "YouTubeを1時間使用していました"
- "VS Codeを35分使用していました"
- "Googleで4分間調査していました"
- "2時間以上連続作業しています"
- "アプリの切り替えが頻繁に発生しています"

### Don't Say
- "集中力が低下しています"
- "生産性スコアは42点です"
- "悪い習慣です"
- "もっと集中する必要があります"
- "YouTubeは脱線です"

## Data Collection Guidelines

### Do Collect
- Application name
- Web service name
- Timestamps
- Duration
- Window title (with privacy controls)
- User-provided purpose, result, reflection

### Don't Collect
- Keyboard input
- Passwords
- Screenshots
- File contents
- Clipboard contents
- Search terms
- Network traffic
- Mouse coordinates
- Detailed user interactions

## AI Usage Guidelines

### When Using AI for Analysis
- Present observations, not conclusions
- Distinguish between facts and hypotheses
- Allow user to interpret patterns
- Provide context, not judgment

### When Using AI for Suggestions
- Frame as options, not prescriptions
- Allow user to accept or reject
- Explain reasoning
- Respect user autonomy

## Testing Guidelines

### What to Test
- Window detection accuracy
- Event recording reliability
- Timeline rendering correctness
- Data integrity
- Privacy controls

### What Not to Test
- Productivity metrics (we don't have them)
- User psychological state (we don't measure it)
- Good/bad behavior (we don't judge)

## Code Review Checklist

When reviewing code changes:
- [ ] Does this contribute to the core purpose?
- [ ] Does this add judgment or shame?
- [ ] Does this collect unnecessary data?
- [ ] Does this respect user privacy?
- [ ] Does this break existing functionality?
- [ ] Is this consistent with PRODUCT.md?

## Documentation Requirements

All code changes must:
- Reference the purpose they serve
- Explain privacy implications
- Document data flow
- Update relevant documentation

## Emergency Override

If a critical bug or security issue requires immediate action:
1. Fix the issue
2. Document the emergency
3. Review against these rules ASAP
4. Update documentation

## Remember

**OffTracker's purpose is to help users understand their behavior, not to judge, shame, or control them.**

Every feature, message, and data collection must align with this purpose.
