/**
 * PurposeAnalyzer - 目的との関係分析ロジック
 * 
 * Activityを目的との関係で分類する
 * 目的キーワードに基づいて5段階で評価
 */
class PurposeAnalyzer {
  constructor() {
    // 目的キーワードマッピング
    this.keywordMap = {
      // プログラミング関連
      'プログラミング': ['vs code', 'visual studio code', 'github', 'git', 'stack overflow', 'terminal', 'cmd', 'powershell'],
      'コード': ['vs code', 'visual studio code', 'github', 'git', 'stack overflow'],
      '開発': ['vs code', 'visual studio code', 'github', 'git', 'stack overflow'],
      
      // レポート・文書作成関連
      'レポート': ['word', 'excel', 'powerpoint', 'pdf', 'google docs', 'notion'],
      '文書': ['word', 'excel', 'powerpoint', 'pdf', 'google docs', 'notion'],
      '資料': ['word', 'excel', 'powerpoint', 'pdf', 'google docs', 'notion'],
      
      // 勉強関連
      '勉強': ['pdf', 'word', 'excel', 'powerpoint', 'notion', 'quizlet', 'anki'],
      '学習': ['pdf', 'word', 'excel', 'powerpoint', 'notion', 'quizlet', 'anki'],
      '課題': ['pdf', 'word', 'excel', 'powerpoint', 'notion'],
      
      // 調べもの関連
      '調べもの': ['google', 'bing', 'duckduckgo', 'wikipedia', 'youtube'],
      '調査': ['google', 'bing', 'duckduckgo', 'wikipedia', 'youtube'],
      '検索': ['google', 'bing', 'duckduckgo', 'wikipedia'],
      
      // メール関連
      'メール': ['outlook', 'gmail', 'thunderbird', 'mail'],
      '連絡': ['outlook', 'gmail', 'thunderbird', 'mail', 'slack', 'discord'],
      
      // 読書関連
      '読書': ['pdf', 'kindle', 'adobe reader', 'ibooks'],
      '本': ['pdf', 'kindle', 'adobe reader', 'ibooks'],
    };
  }

  /**
   * 目的との関係を分析
   * @param {Object} activity - Activity
   * @param {string} purpose - 目的
   * @returns {Object} 目的との関係分析結果
   */
  analyzePurposeRelation(activity, purpose) {
    if (!purpose || !activity) {
      return {
        relation: 'uncertain',
        confidence: 0.0
      };
    }

    const keywords = this.extractKeywords(purpose);
    const appLower = activity.application.toLowerCase();
    const service = activity.service ? activity.service.toLowerCase() : '';
    const windowTitle = activity.window_title ? activity.window_title.toLowerCase() : '';

    // キーワードマッチング
    let matchCount = 0;
    let totalKeywords = keywords.length;

    keywords.forEach(keyword => {
      if (appLower.includes(keyword) || 
          service.includes(keyword) || 
          windowTitle.includes(keyword)) {
        matchCount++;
      }
    });

    // マッチ率を計算
    const matchRate = totalKeywords > 0 ? matchCount / totalKeywords : 0;

    // 関係性を判定
    let relation;
    let confidence;

    if (matchRate >= 0.5) {
      relation = 'related';
      confidence = 0.7 + (matchRate * 0.3);
    } else if (matchRate >= 0.25) {
      relation = 'possibly_related';
      confidence = 0.5 + (matchRate * 0.4);
    } else if (matchRate >= 0.1) {
      relation = 'uncertain';
      confidence = 0.3 + (matchRate * 0.4);
    } else if (matchRate > 0) {
      relation = 'possibly_unrelated';
      confidence = 0.2 + (matchRate * 0.3);
    } else {
      relation = 'uncertain';
      confidence = 0.0;
    }

    // Activityタイプに基づく調整
    const typeAdjustment = this.adjustByActivityType(activity.type, relation);
    if (typeAdjustment.adjustedRelation) {
      relation = typeAdjustment.adjustedRelation;
      confidence = Math.min(confidence + typeAdjustment.confidenceBoost, 1.0);
    }

    return {
      relation,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * 目的からキーワードを抽出
   * @param {string} purpose - 目的
   * @returns {Array} キーワードの配列
   */
  extractKeywords(purpose) {
    const keywords = [];
    const purposeLower = purpose.toLowerCase();

    // 事前定義されたキーワードマップから取得
    for (const [key, values] of Object.entries(this.keywordMap)) {
      if (purposeLower.includes(key)) {
        keywords.push(...values);
      }
    }

    // 目的のテキストからもキーワードを抽出
    const words = purposeLower.split(/\s+/);
    keywords.push(...words.filter(word => word.length > 1));

    return [...new Set(keywords)]; // 重複を除去
  }

  /**
   * Activityタイプに基づいて関係性を調整
   * @param {string} activityType - Activityタイプ
   * @param {string} currentRelation - 現在の関係性
   * @returns {Object} 調整結果
   */
  adjustByActivityType(activityType, currentRelation) {
    // workタイプは関連性を上げる
    if (activityType === 'work') {
      if (currentRelation === 'uncertain') {
        return { adjustedRelation: 'possibly_related', confidenceBoost: 0.2 };
      }
      if (currentRelation === 'possibly_related') {
        return { adjustedRelation: 'related', confidenceBoost: 0.1 };
      }
    }

    // researchタイプは調整なし（目的との関係を確認する必要がある）
    if (activityType === 'research') {
      return { adjustedRelation: null, confidenceBoost: 0 };
    }

    // distraction_candidateタイプは関連性を下げる
    if (activityType === 'distraction_candidate') {
      if (currentRelation === 'related') {
        return { adjustedRelation: 'possibly_related', confidenceBoost: -0.2 };
      }
      if (currentRelation === 'possibly_related') {
        return { adjustedRelation: 'uncertain', confidenceBoost: -0.1 };
      }
      if (currentRelation === 'uncertain') {
        return { adjustedRelation: 'possibly_unrelated', confidenceBoost: 0.1 };
      }
    }

    return { adjustedRelation: null, confidenceBoost: 0 };
  }

  /**
   * 複数のActivityを分析
   * @param {Array} activities - Activityの配列
   * @param {string} purpose - 目的
   * @returns {Array} 分析結果の配列
   */
  analyzeActivities(activities, purpose) {
    return activities.map(activity => {
      const analysis = this.analyzePurposeRelation(activity, purpose);
      return {
        ...activity,
        purpose_relation: analysis.relation,
        purpose_confidence: analysis.confidence
      };
    });
  }

  /**
   * 目的とのアライメントを集計
   * @param {Array} activities - Activityの配列
   * @returns {Object} アライメント集計
   */
  calculateAlignment(activities) {
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
}

module.exports = PurposeAnalyzer;
