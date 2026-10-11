/**
 * NextActionGenerator - 次回行動候補生成ロジック
 * 
 * 原因に基づいて次回行動候補を生成
 */
class NextActionGenerator {
  constructor() {
    // 原因→次回行動候補のマッピング
    this.actionMap = {
      'research_to_distraction': [
        {
          action: '10分調べても解決しなければ、分からない点を整理して質問する',
          reason: '調査後に目的外行動へ移行していたため'
        },
        {
          action: '調査を始める前に、何が分からないのかを1文で書く',
          reason: '調査が長時間化していたため'
        },
        {
          action: '調査時間を15分に制限し、その後は必ず作業に戻る',
          reason: '調査が脱線のきっかけになっていたため'
        }
      ],
      'frequent_switching': [
        {
          action: '1つのタスクに15分集中し、その後のみアプリを切り替える',
          reason: '頻繁な切り替えが集中を阻害していたため'
        },
        {
          action: '作業中は必要なアプリ以外を閉じる',
          reason: 'アプリの切り替えが頻繁に発生していたため'
        },
        {
          action: 'ポモドーロテクニックを試す（25分作業、5分休憩）',
          reason: '集中を維持するためのリズムを作るため'
        }
      ],
      'long_distraction': [
        {
          action: '目的外のアプリを使用する前に、3秒間考える',
          reason: '脱線を防ぐための意識付け'
        },
        {
          action: '目的外の行動を5分に制限する',
          reason: '長時間の脱線を防ぐため'
        },
        {
          action: '脱線した場合は、必ず何をしていたかを記録する',
          reason: '脱線のパターンを把握するため'
        }
      ],
      'difficulty_spike': [
        {
          action: '難しい箇所に出会ったら、10分以内に人に質問する',
          reason: 'エラー解決の時間を短縮するため'
        },
        {
          action: '分からない箇所をメモし、後でまとめて調べる',
          reason: '作業の流れを維持するため'
        },
        {
          action: 'エラーが発生したら、まずはエラーメッセージをコピーして保存する',
          reason: '調査の効率を上げるため'
        }
      ],
      'idle_pattern': [
        {
          action: 'アイドル状態が発生したら、5分休憩して再開する',
          reason: '適切な休憩をとるため'
        },
        {
          action: '作業開始前に、最初の15分でやることを決める',
          reason: '作業の方向性を明確にするため'
        },
        {
          action: 'アイドル状態が長い場合、タスクを小さく分ける',
          reason: 'タスクの負担を減らすため'
        }
      ],
      'uncertain_activity': [
        {
          action: '作業開始前に、今回の目的を1文で書く',
          reason: '目的意識を明確にするため'
        },
        {
          action: 'アプリを開く前に、それが目的に関連しているか確認する',
          reason: '目的との関係を意識するため'
        },
        {
          action: '30分ごとに、今やっていることが目的に合っているか確認する',
          reason: '方向性を修正するため'
        }
      ]
    };

    // 原因カテゴリ→次回行動候補のマッピング
    this.causeActionMap = {
      '作業が難しかった': [
        'タスクを小さく分けて取り組む',
        '難しい箇所から取り組むのではなく、簡単な箇所から始める',
        '必要な資料や情報を事前に確認する'
      ],
      '次に何をすればいいか分からなかった': [
        '作業開始前に、今日やるタスクをリストアップする',
        'タスクの終了条件を明確にする',
        '分からない箇所をメモし、まとめて調べる'
      ],
      '別のことをしてしまった': [
        '作業中はスマートフォンを別の部屋に置く',
        'SNSを通知オフにする',
        '目的外のアプリを一時的にアンインストールする'
      ],
      '時間が足りなかった': [
        'タスクの見積もりを2倍にする',
        '最初の15分で進捗を確認し、残り時間を調整する',
        '重要度の高いタスクから順に取り組む'
      ],
      '予定が入った': [
        '作業時間をブロックし、カレンダーに予定を入れる',
        '緊急の予定に対応するためのバッファ時間を設ける',
        '予定が入った場合、タスクの優先順位を再評価する'
      ],
      '疲れていた': [
        '集中できる時間帯に重要なタスクを割り当てる',
        '25分作業して5分休憩を繰り返す',
        '十分な睡眠をとる'
      ],
      'エラーが発生した': [
        'エラーが発生したら、まずはエラーメッセージを保存する',
        '10分以内に解決しなければ、質問サイトを確認する',
        'エラーの解決方法をメモし、次回活用する'
      ]
    };
  }

  /**
   * 次回行動候補を生成
   * @param {Array} hypotheses - 仮説の配列
   * @param {Array} selectedCauses - ユーザーが選択した原因の配列
   * @param {string} purpose - 目的
   * @returns {Array} 次回行動候補の配列
   */
  generateNextActions(hypotheses, selectedCauses, purpose) {
    const actions = [];

    // 仮説に基づく次回行動候補
    if (hypotheses && hypotheses.length > 0) {
      hypotheses.forEach(hypothesis => {
        const patternActions = this.actionMap[hypothesis.pattern];
        if (patternActions) {
          actions.push(...patternActions);
        }
      });
    }

    // ユーザーが選択した原因に基づく次回行動候補
    if (selectedCauses && selectedCauses.length > 0) {
      selectedCauses.forEach(cause => {
        const causeActions = this.causeActionMap[cause];
        if (causeActions) {
          causeActions.forEach(action => {
            // 重複を避ける
            if (!actions.some(a => a.action === action)) {
              actions.push({
                action: action,
                reason: cause
              });
            }
          });
        }
      });
    }

    // 重複を除去
    const uniqueActions = [];
    const seenActions = new Set();
    actions.forEach(action => {
      if (!seenActions.has(action.action)) {
        seenActions.add(action.action);
        uniqueActions.push(action);
      }
    });

    // 上位5つを返す
    return uniqueActions.slice(0, 5);
  }

  /**
   * 目的に基づいたカスタム次回行動候補を生成
   * @param {string} purpose - 目的
   * @returns {Array} カスタム次回行動候補の配列
   */
  generateCustomActions(purpose) {
    const customActions = [];

    // 目的の種類に基づいた次回行動候補
    if (purpose.includes('プログラミング') || purpose.includes('コード') || purpose.includes('開発')) {
      customActions.push({
        action: 'コードを書く前に、実装したい機能を図で描く',
        reason: '実装の方向性を明確にするため'
      });
      customActions.push({
        action: 'テストを先に書く',
        reason: '実装の目的を明確にするため'
      });
    }

    if (purpose.includes('レポート') || purpose.includes('文書') || purpose.includes('資料')) {
      customActions.push({
        action: '執筆前にアウトラインを作成する',
        reason: '構成を明確にするため'
      });
      customActions.push({
        action: '最初に結論を書く',
        reason: '文書の方向性を決めるため'
      });
    }

    if (purpose.includes('勉強') || purpose.includes('学習') || purpose.includes('課題')) {
      customActions.push({
        action: '学習の目標を具体的に設定する',
        reason: '学習の方向性を明確にするため'
      });
      customActions.push({
        action: '学んだことを自分の言葉でまとめる',
        reason: '理解度を確認するため'
      });
    }

    if (purpose.includes('調べもの') || purpose.includes('調査') || purpose.includes('検索')) {
      customActions.push({
        action: '調べる前に、知りたいことを3つ書く',
        reason: '調査の焦点を絞るため'
      });
      customActions.push({
        action: '情報源をメモする',
        reason: '情報の信頼性を確認するため'
      });
    }

    return customActions;
  }

  /**
   * 次回行動候補をユーザーに提示する形式に変換
   * @param {Array} actions - 次回行動候補の配列
   * @returns {Array} 提示用次回行動候補の配列
   */
  formatForDisplay(actions) {
    return actions.map((a, index) => ({
      id: `action_${index}`,
      action: a.action,
      reason: a.reason
    }));
  }

  /**
   * デフォルトの次回行動候補を生成
   * @returns {Array} デフォルト次回行動候補の配列
   */
  generateDefaultActions() {
    return [
      {
        action: '作業開始前に、今日やることをリストアップする',
        reason: 'タスクを明確にするため'
      },
      {
        action: '25分作業して5分休憩を繰り返す',
        reason: '集中を維持するため'
      },
      {
        action: '目的外のアプリを使用する前に、3秒間考える',
        reason: '脱線を防ぐため'
      }
    ];
  }
}

module.exports = NextActionGenerator;
