/**
 * SessionSummarizer - セッション要約生成ロジック
 * 
 * Activityをまとめて「今回何を起きたか」を生成する
 */
class SessionSummarizer {
  constructor() {
    this.transitionPatterns = {
      'work_to_research': '作業中に調査へ移行',
      'research_to_work': '調査後に作業へ復帰',
      'work_to_distraction_candidate': '作業中に目的外の可能性がある行動へ移行',
      'distraction_candidate_to_work': '目的外の可能性がある行動から作業へ復帰',
      'research_to_distraction_candidate': '調査後に目的外の可能性がある行動へ移行',
      'distraction_candidate_to_research': '目的外の可能性がある行動から調査へ移行',
      'idle_to_work': 'アイドル状態から作業開始',
      'work_to_idle': '作業中にアイドル状態へ移行',
    };
  }

  /**
   * セッションを要約
   * @param {Array} activities - Activityの配列
   * @param {string} purpose - 目的
   * @returns {Object} 要約結果
   */
  summarizeSession(activities, purpose) {
    if (!activities || activities.length === 0) {
      return {
        summary: '記録された活動がありません。',
        transitions: [],
        notable_events: [],
        purpose_alignment: null
      };
    }

    // Activityを時間順にソート
    const sortedActivities = this.sortActivitiesByTime(activities);

    // 行動の遷移を検出
    const transitions = this.detectTransitions(sortedActivities);

    // 特徴的なイベントを検出
    const notableEvents = this.detectNotableEvents(sortedActivities, purpose);

    // 要約を生成
    const summary = this.generateSummary(sortedActivities, transitions, purpose);

    // 目的とのアライメントを計算
    const purposeAlignment = this.calculatePurposeAlignment(sortedActivities);

    return {
      summary,
      transitions,
      notable_events: notableEvents,
      purpose_alignment: purposeAlignment
    };
  }

  /**
   * Activityを時間順にソート
   * @param {Array} activities - Activityの配列
   * @returns {Array} ソートされたActivityの配列
   */
  sortActivitiesByTime(activities) {
    return activities.sort((a, b) => {
      const timeA = new Date(a.start_time);
      const timeB = new Date(b.start_time);
      return timeA - timeB;
    });
  }

  /**
   * 行動の遷移を検出
   * @param {Array} activities - Activityの配列
   * @returns {Array} 遷移の配列
   */
  detectTransitions(activities) {
    const transitions = [];

    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i];
      const next = activities[i + 1];

      if (current.type !== next.type) {
        const transitionKey = `${current.type}_to_${next.type}`;
        const description = this.transitionPatterns[transitionKey] || 
                          `${current.type}から${next.type}へ移行`;

        transitions.push({
          from: current.type,
          to: next.type,
          from_activity: current.application,
          to_activity: next.application,
          timestamp: next.start_time,
          description
        });
      }
    }

    return transitions;
  }

  /**
   * 特徴的なイベントを検出
   * @param {Array} activities - Activityの配列
   * @param {string} purpose - 目的
   * @returns {Array} 特徴的なイベントの配列
   */
  detectNotableEvents(activities, purpose) {
    const notableEvents = [];

    activities.forEach(activity => {
      // 長時間の脱線候補
      if (activity.type === 'distraction_candidate' && activity.duration_seconds > 600) {
        notableEvents.push({
          type: 'long_distraction',
          description: `${activity.application}を${Math.floor(activity.duration_seconds / 60)}分使用しています。脱線している可能性があります。`,
          activity: activity.application,
          duration: activity.duration_seconds
        });
      }

      // 長時間の調査
      if (activity.type === 'research' && activity.duration_seconds > 600) {
        notableEvents.push({
          type: 'long_research',
          description: `${activity.application}での調査が${Math.floor(activity.duration_seconds / 60)}分続いています。調査が長引いている可能性があります。`,
          activity: activity.application,
          duration: activity.duration_seconds
        });
      }

      // 目的との関係が不明な長時間の活動
      if (activity.purpose_relation === 'uncertain' && activity.duration_seconds > 300) {
        notableEvents.push({
          type: 'uncertain_activity',
          description: `${activity.application}を${Math.floor(activity.duration_seconds / 60)}分使用しています。目的との関係が不明です。`,
          activity: activity.application,
          duration: activity.duration_seconds
        });
      }

      // 頻繁なアプリ切り替え
      if (activity.source_events && activity.source_events.length > 10) {
        notableEvents.push({
          type: 'frequent_switching',
          description: 'アプリの切り替えが頻繁に発生しています。集中が途切れている可能性があります。',
          activity: activity.application,
          switch_count: activity.source_events.length
        });
      }
    });

    return notableEvents;
  }

  /**
   * 要約を生成
   * @param {Array} activities - Activityの配列
   * @param {Array} transitions - 遷移の配列
   * @param {string} purpose - 目的
   * @returns {string} 要約
   */
  generateSummary(activities, transitions, purpose) {
    if (activities.length === 0) {
      return '記録された活動がありません。';
    }

    const totalDuration = activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
    const totalMinutes = Math.floor(totalDuration / 60);

    let summary = `合計${totalMinutes}分のセッションで、`;

    // Activityタイプの分布
    const typeCounts = {};
    activities.forEach(a => {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + (a.duration_seconds || 0);
    });

    const typeDescriptions = [];
    if (typeCounts.work) {
      typeDescriptions.push(`作業${Math.floor(typeCounts.work / 60)}分`);
    }
    if (typeCounts.research) {
      typeDescriptions.push(`調査${Math.floor(typeCounts.research / 60)}分`);
    }
    if (typeCounts.distraction_candidate) {
      typeDescriptions.push(`目的外の可能性がある行動${Math.floor(typeCounts.distraction_candidate / 60)}分`);
    }
    if (typeCounts.idle) {
      typeDescriptions.push(`アイドル${Math.floor(typeCounts.idle / 60)}分`);
    }

    if (typeDescriptions.length > 0) {
      summary += typeDescriptions.join('、') + 'が記録されました。';
    } else {
      summary += '活動が記録されました。';
    }

    // 遷移の説明
    if (transitions.length > 0) {
      const transitionCount = transitions.length;
      summary += ` 行動の切り替えが${transitionCount}回発生しました。`;
      
      // 特徴的な遷移を追加
      const distractionTransitions = transitions.filter(t => 
        t.to === 'distraction_candidate' || t.from === 'distraction_candidate'
      );
      if (distractionTransitions.length > 0) {
        summary += ' そのうち、目的外の可能性がある行動への移行が含まれています。';
      }
    }

    return summary;
  }

  /**
   * 目的とのアライメントを計算
   * @param {Array} activities - Activityの配列
   * @returns {Object} アライメント集計
   */
  calculatePurposeAlignment(activities) {
    const alignment = {
      related_time: 0,
      possibly_related_time: 0,
      uncertain_time: 0,
      possibly_unrelated_time: 0,
      unrelated_time: 0,
      total_time: 0
    };

    activities.forEach(activity => {
      const duration = activity.duration_seconds || 0;
      const relation = activity.purpose_relation || 'uncertain';

      alignment[`${relation}_time`] += duration;
      alignment.total_time += duration;
    });

    return alignment;
  }

  /**
   * Activityをタイプ別にグループ化
   * @param {Array} activities - Activityの配列
   * @returns {Object} タイプ別のActivityグループ
   */
  groupActivitiesByType(activities) {
    const groups = {
      work: [],
      research: [],
      distraction_candidate: [],
      idle: [],
      unknown: []
    };

    activities.forEach(activity => {
      const type = activity.type || 'unknown';
      if (groups[type]) {
        groups[type].push(activity);
      }
    });

    return groups;
  }

  /**
   * タイプ別の合計時間を計算
   * @param {Array} activities - Activityの配列
   * @returns {Object} タイプ別の合計時間
   */
  calculateTimeByType(activities) {
    const timeByType = {
      work: 0,
      research: 0,
      distraction_candidate: 0,
      idle: 0,
      unknown: 0
    };

    activities.forEach(activity => {
      const type = activity.type || 'unknown';
      const duration = activity.duration_seconds || 0;
      if (timeByType[type] !== undefined) {
        timeByType[type] += duration;
      }
    });

    return timeByType;
  }
}

module.exports = SessionSummarizer;
