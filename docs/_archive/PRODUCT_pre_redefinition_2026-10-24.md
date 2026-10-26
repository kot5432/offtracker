# OffTracker Product Definition

## なぜ作るか

OffTrackerは、自分の過ごし方を振り返って自分の力で気づき、時間の使い方を変えられるよう支援する。勉強・課題・娯楽など、その回の目的は本人が決める。アプリは記録を振り返る材料と、本人が選ぶ次の試みを用意するが、改善内容を指示したり、行動を一律に良し悪しで評価したりしない。

## 中心となる体験

本人がその回の目的を決め、PC上の行動記録を手掛かりに振り返る。気になる変化点があれば任意で選び、そのとき何が起きていたかを本人が考えられる。必要なら次に試すことを自分で選び、次回に採用・変更・見送りを決め、後から自分の実感と結果を見比べる。原因をアプリが推測したり、振り返りを毎回強制したりしない。通常の振り返りは短く、追加の問いや記述は必要な場合だけにする。

## 現行機能のレビューと判断

現在の目的入力・アプリ利用記録・Activity整理・目的との関係表示・結果入力・任意の振り返りは、時間の使い方を見直す材料になる。ただし、利用者が自分で気づき、実際に時間の使い方を変えられるかは未検証で、現時点で目的を達成できているとは判断しない。記録と本人の見方を区別し、気になる変化点を本人が選ぶ軽い手掛かりと、本人が選んだ次の試みを後から見返せる流れを確かめる。

機能追加は観察された課題に対応させる。誤分類が問題なら補足・訂正、文脈不足なら最小限の任意質問、選択肢の迷いなら結果入力を見直す。次の優先候補は、本人が次に試すことを任意で残し、次回のセッションで採用・変更・見送りを選び、後から比較できる仕組み。AI分析や複数回比較の詳細は、基本の振り返りループが役立つか確かめてから判断する。

## Product Name
OffTracker

## Purpose
自分の過ごし方を振り返って自分の力で気づき、時間の使い方を変えられるよう支援する。勉強・課題・娯楽など、各回の目的は本人が決める。

## Value
目的・記録・結果・本人の気づきを並べ、本人が望むときだけ次に試すことを決めて後から比べられるようにする。時間の使い方を変えるかどうか、その方法は本人が決める。

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
今回の目的・行動・結果を並べて見る
    ↓
必要なら理由や気づきを任意で残す
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
| Optional Reflection | 気づいたこと・進み方に影響したこと | User Input, Optional |
| Past Behavior | 同じパターンが3回 | Data Analysis |
| Optional Reflection Note | 今回気づいたことを残す（空欄可） | User |

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
**「この機能は、本人が自分の過ごし方に気づき、自分で時間の使い方を変えることをどう支えるか？」**

If the answer is unclear or the contribution is indirect, do not add the feature.

## Success Criteria

### Evaluation 1: Can you set a purpose?
- User can input what they intend to do

### Evaluation 2: Can you understand actual behavior?
- User can see what they actually did

### Evaluation 3: Can you compare purpose with actual behavior?
- User can see the gap between intention and reality

### Evaluation 4: Can you reflect on "why"?
- User can notice a relevant aspect of their own time use without being told what it means

### Evaluation 5: Can you understand patterns over time?
- If the user wants, they can compare sessions without flattening different purposes into a score

### Evaluation 6: Can you connect to next action?
- User can optionally choose a next experiment and later decide whether it changed how they used their time
- In real use, the user can identify which record prompted their insight and whether reflection felt manageable

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

OffTracker helps people notice how they spend their time and make their own choices about changing it, without judgment or shame.
