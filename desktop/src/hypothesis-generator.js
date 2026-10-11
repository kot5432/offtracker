/**
 * HypothesisGenerator - 仮説生成ロジック
 * 
 * 行動パターンからルールベースで仮説を生成
 * 根拠を行動データと結びつける
 */
class HypothesisGenerator {
  constructor() {
    // 仮説パターン
    this.patterns = [
      {
        name: 'research_to_distraction',
        description: '作業中に問題が発生し、次に何をすればよいか分からなくなった可能性があります。',
        evidence: ['調査後に目的外の可能性がある行動へ移行', '調査が長時間化'],
        conditions: (activities, transitions) => {
          const researchToDistraction = transitions.some(t => 
            t.from === 'research' && t.to === 'distraction_candidate'
          );
          const longResearch = activities.some(a => 
            a.type === 'research' && a.duration_seconds > 600
          );
          return researchToDistraction || longResearch;
        }
      },
      {
        name: 'frequent_switching',
        description: 'アプリの切り替えが頻繁に発生しており、集中が途切れている可能性があります。',
        evidence: ['アプリの切り替えが頻繁に発生'],
        conditions: (activities, transitions) => {
          const frequentSwitching = activities.some(a => 
            a.source_events && a.source_events.length > 10
          );
          return frequentSwitching;
        }
      },
      {
        name: 'long_distraction',
        description: '目的外の可能性がある行動が長時間続いており、脱線している可能性があります。',
        evidence: ['目的外の可能性がある行動が長時間継続'],
        conditions: (activities, transitions) => {
          const longDistraction = activities.some(a => 
            a.type === 'distraction_candidate' && a.duration_seconds > 600
          );
          return longDistraction;
        }
      },
      {
        name: 'difficulty_spike',
        description: '作業中にエラーや問題が発生し、調査が必要になった可能性があります。',
        evidence: ['作業中に調査へ移行', '調査が発生'],
        conditions: (activities, transitions) => {
          const workToResearch = transitions.some(t => 
            t.from === 'work' && t.to === 'research'
          );
          return workToResearch;
        }
      },
      {
        name: 'idle_pattern',
        description: 'アイドル状態が発生しており、休憩や作業中断があった可能性があります。',
        evidence: ['アイドル状態が発生'],
        conditions: (activities, transitions) => {
          const idleActivity = activities.some(a => a.type === 'idle');
          return idleActivity;
        }
      },
      {
        name: 'uncertain_activity',
        description: '目的との関係が不明な活動が多く、明確な目的意識を持って取り組めていない可能性があります。',
        evidence: ['目的との関係が不明な活動が多い'],
        conditions: (activities, transitions) => {
          const uncertainCount = activities.filter(a => 
            a.purpose_relation === 'uncertain' || a.purpose_relation === 'possibly_unrelated'
          ).length;
          return uncertainCount > activities.length * 0.3;
        }
      }
    ];
  }

  /**
   * 仮説を生成
   * @param {Array} activities - Activityの配列
   * @param {string} purpose - 目的
   * @param {Object} summary - セッション要約
   * @returns {Array} 仮説の配列
   */
  generateHypotheses(activities, purpose, summary) {
    if (!activities || activities.length === 0) {
      return [];
    }

    const transitions = summary.transitions || [];
    const hypotheses = [];

    // 各パターンをチェック
    this.patterns.forEach(pattern => {
      if (pattern.conditions(activities, transitions)) {
        const evidence = this.generateEvidence(activities, transitions, pattern);
        const confidence = this.calculateConfidence(activities, transitions, pattern);

        hypotheses.push({
          id: this.generateId(),
          pattern: pattern.name,
          description: pattern.description,
          evidence: evidence,
          confidence: confidence
        });
      }
    });

    // 信頼度でソート
    hypotheses.sort((a, b) => b.confidence - a.confidence);

    // 上位3つを返す
    return hypotheses.slice(0, 3);
  }

  /**
   * 根拠を生成
   * @param {Array} activities - Activityの配列
   * @param {Array} transitions - 遷移の配列
   * @param {Object} pattern - パターン
   * @returns {Array} 根拠の配列
   */
  generateEvidence(activities, transitions, pattern) {
    const evidence = [];

    // パターンに基づいて根拠を生成
    if (pattern.name === 'research_to_distraction') {
      const researchToDistraction = transitions.find(t => 
        t.from === 'research' && t.to === 'distraction_candidate'
      );
      if (researchToDistraction) {
        evidence.push(
          `${researchToDistraction.from_activity}での調査後に${researchToDistraction.to_activity}へ移行`
        );
      }
      const longResearch = activities.find(a => 
        a.type === 'research' && a.duration_seconds > 600
      );
      if (longResearch) {
        evidence.push(
          `${longResearch.application}での調査が${Math.floor(longResearch.duration_seconds / 60)}分継続`
        );
      }
    }

    if (pattern.name === 'frequent_switching') {
      const frequentActivity = activities.find(a => 
        a.source_events && a.source_events.length > 10
      );
      if (frequentActivity) {
        evidence.push(
          `${frequentActivity.application}で${frequentActivity.source_events.length}回の切り替え`
        );
      }
    }

    if (pattern.name === 'long_distraction') {
      const longDistraction = activities.find(a => 
        a.type === 'distraction_candidate' && a.duration_seconds > 600
      );
      if (longDistraction) {
        evidence.push(
          `${longDistraction.application}を${Math.floor(longDistraction.duration_seconds / 60)}分使用`
        );
      }
    }

    if (pattern.name === 'difficulty_spike') {
      const workToResearch = transitions.find(t => 
        t.from === 'work' && t.to === 'research'
      );
      if (workToResearch) {
        evidence.push(
          `${workToResearch.from_activity}での作業中に${workToResearch.to_activity}へ移行`
        );
      }
    }

    if (pattern.name === 'idle_pattern') {
      const idleActivity = activities.find(a => a.type === 'idle');
      if (idleActivity) {
        evidence.push(
          `アイドル状態が${Math.floor(idleActivity.duration_seconds / 60)}分発生`
        );
      }
    }

    if (pattern.name === 'uncertain_activity') {
      const uncertainActivities = activities.filter(a => 
        a.purpose_relation === 'uncertain' || a.purpose_relation === 'possibly_unrelated'
      );
      if (uncertainActivities.length > 0) {
        evidence.push(
          `${uncertainActivities.length}件の活動で目的との関係が不明`
        );
      }
    }

    return evidence.length > 0 ? evidence : pattern.evidence;
  }

  /**
   * 信頼度を計算
   * @param {Array} activities - Activityの配列
   * @param {Array} transitions - 遷移の配列
   * @param {Object} pattern - パターン
   * @returns {string} 信頼度
   */
  calculateConfidence(activities, transitions, pattern) {
    let confidence = 0.5; // 基本信頼度

    // パターンに基づいて信頼度を調整
    if (pattern.name === 'research_to_distraction') {
      const researchToDistraction = transitions.some(t => 
        t.from === 'research' && t.to === 'distraction_candidate'
      );
      const longResearch = activities.some(a => 
        a.type === 'research' && a.duration_seconds > 600
      );
      if (researchToDistraction && longResearch) {
        confidence = 0.8;
      } else if (researchToDistraction || longResearch) {
        confidence = 0.6;
      }
    }

    if (pattern.name === 'frequent_switching') {
      const maxSwitches = Math.max(...activities.map(a => 
        a.source_events ? a.source_events.length : 0
      ));
      if (maxSwitches > 20) {
        confidence = 0.8;
      } else if (maxSwitches > 10) {
        confidence = 0.6;
      }
    }

    if (pattern.name === 'long_distraction') {
      const maxDistraction = Math.max(...activities
        .filter(a => a.type === 'distraction_candidate')
        .map(a => a.duration_seconds)
      );
      if (maxDistraction > 1800) { // 30分以上
        confidence = 0.8;
      } else if (maxDistraction > 600) { // 10分以上
        confidence = 0.6;
      }
    }

    if (pattern.name === 'difficulty_spike') {
      const workToResearchCount = transitions.filter(t => 
        t.from === 'work' && t.to === 'research'
      ).length;
      if (workToResearchCount > 1) {
        confidence = 0.7;
      } else if (workToResearchCount === 1) {
        confidence = 0.5;
      }
    }

    if (pattern.name === 'idle_pattern') {
      const totalIdle = activities
        .filter(a => a.type === 'idle')
        .reduce((sum, a) => sum + a.duration_seconds, 0);
      const totalDuration = activities.reduce((sum, a) => sum + a.duration_seconds, 0);
      const idleRatio = totalIdle / totalDuration;
      if (idleRatio > 0.3) {
        confidence = 0.7;
      } else if (idleRatio > 0.1) {
        confidence = 0.5;
      }
    }

    if (pattern.name === 'uncertain_activity') {
      const uncertainCount = activities.filter(a => 
        a.purpose_relation === 'uncertain' || a.purpose_relation === 'possibly_unrelated'
      ).length;
      const uncertainRatio = uncertainCount / activities.length;
      if (uncertainRatio > 0.5) {
        confidence = 0.7;
      } else if (uncertainRatio > 0.3) {
        confidence = 0.5;
      }
    }

    // 信頼度を文字列に変換
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * IDを生成
   * @returns {string} ID
   */
  generateId() {
    return `hypothesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 仮説をユーザーに提示する形式に変換
   * @param {Array} hypotheses - 仮説の配列
   * @returns {Array} 提示用仮説の配列
   */
  formatForDisplay(hypotheses) {
    return hypotheses.map(h => ({
      id: h.id,
      description: h.description,
      evidence: h.evidence.join('、'),
      confidence: this.translateConfidence(h.confidence)
    }));
  }

  /**
   * 信頼度を翻訳
   * @param {string} confidence - 信頼度
   * @returns {string} 翻訳された信頼度
   */
  translateConfidence(confidence) {
    const translations = {
      'high': '高い',
      'medium': '中程度',
      'low': '低い'
    };
    return translations[confidence] || confidence;
  }
}

module.exports = HypothesisGenerator;
