# OffTracker Product Definition

## Product Name
OffTracker

## Purpose
自分が「やろう」と思っていたことを実行できなかったとき、実際の行動・作業状況・結果・自分自身の振り返りをもとに、なぜ実行できなかったのかを理解し、次の行動につなげられるようにする。

## Value
「できなかった」という結果だけで自分を評価するのではなく、自分の行動を知ることで、自分に合った次の行動を選べるようにする。

## Core Philosophy

### 自己否定につなげない
失敗を責めるのではなく、事実として分析する

### 行動を事実として扱う
「集中力が低かった」ではなく「YouTubeを1時間使用していた」

### AIが原因を断定しない
観測事実と仮説を区別する

### YouTube等を一律に悪い行動と判断しない
休息や調査の一部である可能性もある

### 自動取得できない情報は自己申告する
心理状態や理由はユーザー自身が入力する

## Persona

### Name
佐藤（20歳、大学生）

### Characteristics
- 情報技術を専攻
- PCを課題や自己啓発に使用
- 作業を開始できるが、エラーや難しい問題に遭遇すると途中で離れてしまう
- 情報検索からYouTube、SNS、Discordへ漂流し、後で「あまり進捗がない」と感じるが明確な理由を説明できない

### Target Behavior
「やる気はないわけではない。作業も始める。でも、途中でいつの間にか目的から離れてしまう人」

## Core Loop

```
目的を設定
    ↓
実際に行動
    ↓
PCが自動記録
    ↓
結果を記録
    ↓
行動・作業状況を振り返る
    ↓
「なぜできなかった？」を考える
    ↓
過去の記録と比較
    ↓
自分のパターンを理解
    ↓
次回の行動を考える
```

## Information Needed to Understand "Why"

| Information | Example | Collection Method |
|-------------|---------|-------------------|
| Purpose | Webアプリを完成させる | User Input |
| Work Time | 18:00〜20:00 | Automatic |
| Used Apps | VS Code | Automatic |
| Web Usage | Google, YouTube | Automatic |
| Behavior Flow | VS Code→Google→YouTube | Automatic |
| Work Result | ログイン機能まで完成 | User Input |
| Reason for Failure | エラーが解決できなかった | User Input |
| Past Behavior | 同じパターンが3回 | Data Analysis |
| Next Action | 次回は問題を小さく分ける | User + AI |

## What NOT to Do

### Feature Restrictions
- ❌ Productivity Score
- ❌ Gamification
- ❌ Pomodoro Timer
- ❌ Notifications
- ❌ AI Chat
- ❌ "You lacked focus" messaging

### Evaluation Restrictions
- ❌ Evaluating user behavior as "good" or "bad"
- ❌ Judging YouTube usage as "distraction" by default
- ❌ Inferring psychological state from logs
- ❌ Determining causes definitively
- ❌ Shaming the user

### Privacy Restrictions
- ❌ Keyloggers
- ❌ Screenshots
- ❌ Clipboard monitoring
- ❌ File content reading
- ❌ Password collection
- ❌ Search term collection
- ❌ Network traffic monitoring

## Feature Addition Criteria

Before adding any feature, ask:
**「この機能は『やろうと思っていたことができなかった理由を理解する』という目的にどう貢献するか？」**

If the answer is unclear or the contribution is indirect, do not add the feature.

## Success Criteria

### Evaluation 1: Can you set a purpose?
- User can input what they intend to do

### Evaluation 2: Can you understand actual behavior?
- User can see what they actually did

### Evaluation 3: Can you compare purpose with actual behavior?
- User can see the gap between intention and reality

### Evaluation 4: Can you reflect on "why"?
- User can think about why they couldn't complete the task

### Evaluation 5: Can you understand patterns over time?
- User can see recurring patterns in their behavior

### Evaluation 6: Can you connect to next action?
- User can derive insights for future behavior

## Technical Foundation

### What Can Be Collected Automatically
- Application name (VS Code, Chrome, Discord, etc.)
- Web service name (Google, YouTube, GitHub, etc.)
- Start and end times
- Window title (subject to privacy controls)
- Process ID (for technical identification)
- Transition sequences

### What Requires Self-Reporting
- Why the user deviated from the task
- What happened (error, interruption, fatigue, etc.)
- How the user felt
- What they think they should do next

### Collection vs. Analysis Division
- **Automatic Collection** = What the user was doing
- **Self-Reporting** = What was happening to the user

This division minimizes user input while capturing necessary information.

## Minimum User Input

### At Start
- Today's purpose (e.g., "Implement login functionality")

### At End
- How far did you get? (e.g., "Partially completed")
- Why didn't you proceed as planned? (e.g., "Got stuck on an error")

Input is limited to information that cannot be automatically determined.

## Vision

OffTracker helps users understand their own behavior patterns when they fail to complete intended tasks, without judgment or shame, enabling them to make better choices for future work.
