# AI 評価アルゴリズム設計書 - 会話ダッシュ

## 概要

このドキュメントでは、プレイヤーの会話応答を評価するためのアルゴリズムを定義します。
**反応速度**と**会話の質**の 2 つの軸で評価を行い、最終的な総合スコアを計算します。

---

## 評価項目の定義

会話ダッシュでは、**反応速度**と**会話の質**の 2 つの軸で評価を行います。

| 評価項目 | 重み | 説明                                                      |
| -------- | ---- | --------------------------------------------------------- |
| 反応速度 | 20%  | 返答までの秒数（早いほど高得点）                          |
| 会話の質 | 80%  | AI による総合評価（自然さ・共感力・話題展開力・感情表現） |

**会話の質の内訳:**

会話の質は、以下の 4 つの観点で AI が総合的に評価します。

| 観点       | 説明                             |
| ---------- | -------------------------------- |
| 自然さ     | 文脈の一貫性・相手に対する適切さ |
| 共感力     | 相手への共感や理解を示す表現     |
| 話題展開力 | 会話を続けるための質問や話題振り |
| 感情表現   | 感情が伝わる豊かな表現           |

**総合スコア計算式:**

```
総合スコア = (反応速度スコア × 0.2) + (会話の質スコア × 0.8)
```

---

## ⚡ 評価項目 1: 反応速度

### 目的

リアルタイム会話における「瞬発力」を評価する

### 計算方法

```typescript
function calculateSpeedScore(responseTime: number, timeLimit: number): number {
  // responseTime: プレイヤーの実際の返答時間（秒）
  // timeLimit: そのターンの制限時間（秒）

  // 制限時間の50%以内で返答 → 満点
  if (responseTime <= timeLimit * 0.5) {
    return 100;
  }

  // 制限時間の50%-80% → 80-100点の線形補間
  if (responseTime <= timeLimit * 0.8) {
    const ratio = (responseTime - timeLimit * 0.5) / (timeLimit * 0.3);
    return 100 - ratio * 20; // 100 → 80
  }

  // 制限時間の80%-100% → 50-80点の線形補間
  if (responseTime <= timeLimit) {
    const ratio = (responseTime - timeLimit * 0.8) / (timeLimit * 0.2);
    return 80 - ratio * 30; // 80 → 50
  }

  // タイムアウト → 20点
  return 20;
}
```

### スコア例（制限時間 5 秒の場合）

| 返答時間 | スコア | 評価         |
| -------- | ------ | ------------ |
| 1-2.5 秒 | 100 点 | 完璧！       |
| 3 秒     | 90 点  | 素早い       |
| 4 秒     | 65 点  | まあまあ     |
| 5 秒     | 50 点  | ギリギリ     |
| 5 秒超   | 20 点  | タイムアウト |

### データ構造

```typescript
type SpeedEvaluation = {
  score: number; // 0-100
  responseTime: number; // 実際の返答時間（秒）
  timeLimit: number; // 制限時間（秒）
  ratio: number; // responseTime / timeLimit
};
```

---

## 💬 評価項目 2: 会話の質

### 目的

会話の総合的な質を AI が評価します。自然さ、共感力、話題展開力、感情表現の 4 つの観点から、プレイヤーの返答がどれだけ良い会話になっているかをスコア化します。

### 計算方法 - OpenAI API による総合評価

```typescript
async function calculateConversationQualityScore(
  playerMessage: string,
  aiMessage: string,
  conversationHistory: Message[]
): Promise<ConversationQualityEvaluation> {
  const systemPrompt = `
あなたは会話の質を評価する専門家です。
プレイヤーの返答を以下の4つの観点から評価し、JSON形式で返してください。

【評価観点】

1. 自然さ (naturalness: 0-100)
   - 文脈との一貫性: AIの発言に対して適切な返答か
   - 会話の流れ: 唐突でなく、スムーズな会話か
   - 言葉遣い: 自然で違和感のない表現か

2. 共感力 (empathy: 0-100)
   - 相手への共感: 相手の気持ちを理解しようとしているか
   - 肯定的な反応: 相手の発言を受け止めているか
   - リアクション: 適切な相槌や同意の表現があるか

3. 話題展開力 (topicExpansion: 0-100)
   - 質問の有無: 会話を続けるための質問があるか
   - 話題の深掘り: 相手の発言を掘り下げようとしているか
   - 新しい情報: 自分の経験や意見を追加しているか

4. 感情表現 (emotion: 0-100)
   - 感情の伝達: 感情が適切に表現されているか
   - 表現の豊かさ: 絵文字や感嘆符などで感情が伝わるか
   - トーンの適切さ: 状況に応じた適切な感情表現か

【評価のポイント】
- 各項目を独立して評価してください
- 極端に短い返答（「うん」のみなど）は全体的に低評価
- 長すぎる返答（150文字以上）は自然さを減点
- 文脈を無視した返答は自然さを大きく減点

【出力形式】
JSON形式で各項目のスコア（0-100）とコメントを返してください。
{
  "naturalness": 85,
  "empathy": 70,
  "topicExpansion": 90,
  "emotion": 75,
  "comment": "簡潔な改善アドバイス（30文字以内）"
}
`;

  const userPrompt = `
【会話履歴】
${conversationHistory
  .slice(-3)
  .map((m) => `${m.sender}: ${m.content}`)
  .join("\n")}

【AI の発言】
${aiMessage}

【プレイヤーの返答】
${playerMessage}

評価結果を JSON で返してください:
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }, // JSON モードを使用
      temperature: 0.3, // 評価の一貫性を保つ
      max_tokens: 200,
    });

    const content = response.choices[0].message.content?.trim() || "{}";
    const evaluation = JSON.parse(content);

    // 各スコアを 0-100 に正規化
    const normalizedScores = {
      naturalness: Math.max(0, Math.min(100, evaluation.naturalness || 50)),
      empathy: Math.max(0, Math.min(100, evaluation.empathy || 50)),
      topicExpansion: Math.max(
        0,
        Math.min(100, evaluation.topicExpansion || 50)
      ),
      emotion: Math.max(0, Math.min(100, evaluation.emotion || 50)),
    };

    // 会話の質の総合スコア（4つの平均）
    const totalScore = Math.round(
      (normalizedScores.naturalness +
        normalizedScores.empathy +
        normalizedScores.topicExpansion +
        normalizedScores.emotion) /
        4
    );

    return {
      totalScore,
      breakdown: normalizedScores,
      comment: evaluation.comment || "",
      messageLength: playerMessage.length,
    };
  } catch (error) {
    console.error("AI evaluation failed:", error);
    // フォールバック: 基本スコアを返す
    return {
      totalScore: 50,
      breakdown: {
        naturalness: 50,
        empathy: 50,
        topicExpansion: 50,
        emotion: 50,
      },
      comment: "評価エラーが発生しました",
      messageLength: playerMessage.length,
    };
  }
}
```

### データ構造

```typescript
type ConversationQualityEvaluation = {
  totalScore: number; // 会話の質の総合スコア（0-100）
  breakdown: {
    naturalness: number; // 自然さ（0-100）
    empathy: number; // 共感力（0-100）
    topicExpansion: number; // 話題展開力（0-100）
    emotion: number; // 感情表現（0-100）
  };
  comment: string; // AI からの簡潔なコメント
  messageLength: number; // 返答の文字数
};
```

### 評価例

#### 例 1: 高評価の返答

**AI の発言:** 「昨日寝不足でさ〜」

**プレイヤーの返答:** 「わかる！俺も昨日 3 時まで起きてた。何してたの？」

**評価結果:**

```json
{
  "naturalness": 95,
  "empathy": 90,
  "topicExpansion": 85,
  "emotion": 80,
  "comment": "共感と質問のバランスが素晴らしい"
}
```

**総合スコア:** 87.5 点

#### 例 2: 改善が必要な返答

**AI の発言:** 「昨日寝不足でさ〜」

**プレイヤーの返答:** 「そうなんだ」

**評価結果:**

```json
{
  "naturalness": 60,
  "empathy": 40,
  "topicExpansion": 20,
  "emotion": 30,
  "comment": "質問や自分の経験を追加してみよう"
}
```

**総合スコア:** 37.5 点

---

## 📊 総合評価の生成

### 総合スコアの計算

反応速度スコアと会話の質スコアを組み合わせて、最終的な総合スコアを算出します。

```typescript
async function calculateFinalScore(
  speedScore: number,
  qualityEvaluation: ConversationQualityEvaluation
): Promise<ComprehensiveScore> {
  // 総合スコア = 反応速度(20%) + 会話の質(80%)
  const total = Math.round(
    speedScore * 0.2 + qualityEvaluation.totalScore * 0.8
  );

  // グレード判定
  let grade: "S" | "A" | "B" | "C" | "D";
  if (total >= 90) grade = "S";
  else if (total >= 75) grade = "A";
  else if (total >= 60) grade = "B";
  else if (total >= 45) grade = "C";
  else grade = "D";

  return {
    total,
    speed: speedScore,
    conversationQuality: qualityEvaluation.totalScore,
    breakdown: qualityEvaluation.breakdown,
    grade,
  };
}
```

### データ構造

```typescript
type ComprehensiveScore = {
  total: number; // 総合スコア（0-100）
  speed: number; // 反応速度スコア（0-100）
  conversationQuality: number; // 会話の質スコア（0-100）
  breakdown: {
    // 会話の質の内訳
    naturalness: number; // 自然さ（0-100）
    empathy: number; // 共感力（0-100）
    topicExpansion: number; // 話題展開力（0-100）
    emotion: number; // 感情表現（0-100）
  };
  grade: "S" | "A" | "B" | "C" | "D"; // 評価ランク
};
```

### グレード基準

| グレード | スコア範囲 | 評価                   |
| -------- | ---------- | ---------------------- |
| S        | 90-100     | 完璧な会話！流石です！ |
| A        | 75-89      | 素晴らしい！自然な会話 |
| B        | 60-74      | 良い感じ！もう少し     |
| C        | 45-59      | まあまあ。練習が必要   |
| D        | 0-44       | 要改善。もっと頑張ろう |

### 評価フローの例

```typescript
// 1ターンの評価処理
async function evaluateTurn(
  playerMessage: string,
  aiMessage: string,
  responseTime: number,
  timeLimit: number,
  conversationHistory: Message[]
): Promise<ComprehensiveScore> {
  // 反応速度の評価
  const speedScore = calculateSpeedScore(responseTime, timeLimit);

  // 会話の質の評価（AI による総合評価）
  const qualityEvaluation = await calculateConversationQualityScore(
    playerMessage,
    aiMessage,
    conversationHistory
  );

  // 総合スコアの計算
  const finalScore = await calculateFinalScore(speedScore, qualityEvaluation);

  return finalScore;
}
```

---

## 💬 AI コメント生成

### コメント生成ロジック

キャラクターの性格に合わせて、プレイヤーへのフィードバックコメントを生成します。

```typescript
async function generateAIComment(
  score: ComprehensiveScore,
  character: Character,
  playerMessage: string
): Promise<string> {
  // 強み・弱みの特定
  const breakdown = score.breakdown;
  const scores = [
    { name: "自然さ", value: breakdown.naturalness },
    { name: "共感力", value: breakdown.empathy },
    { name: "話題展開力", value: breakdown.topicExpansion },
    { name: "感情表現", value: breakdown.emotion },
  ];

  const sortedScores = scores.sort((a, b) => b.value - a.value);
  const strength = sortedScores[0];
  const weakness = sortedScores[sortedScores.length - 1];

  const systemPrompt = `
あなたは${character.name}として、プレイヤーの会話を評価してコメントします。
性格: ${character.description}

以下の評価結果に基づき、1-2文で簡潔にコメントしてください。

【コメントのルール】
1. ポジティブな点を先に述べる
2. 改善点を1つだけ優しく指摘
3. キャラクターの性格に合った口調で
4. 絵文字を1-2個使う
5. 30文字以内に収める

【評価結果】
- 総合スコア: ${score.total}点（グレード: ${score.grade}）
- 反応速度: ${score.speed}点
- 最も良かった点: ${strength.name}（${strength.value}点）
- 改善できる点: ${weakness.name}（${weakness.value}点）
`;

  const userPrompt = `プレイヤーの返答: 「${playerMessage}」\n\nコメントを生成してください。`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8, // コメントのバリエーションを増やす
      max_tokens: 100,
    });

    return (
      response.choices[0].message.content?.trim() ||
      `${score.grade}ランク！${strength.name}が素晴らしかったよ！`
    );
  } catch (error) {
    console.error("Comment generation failed:", error);
    return `${score.grade}ランク！ナイスだよ！`;
  }
}
```

### コメント例

**真面目くん（S ランク）:**

> 「素晴らしい会話でしたね。特に反応速度とテンポが完璧でした 👍 ただ、もう少し共感表現を加えると、さらに良くなりますよ。」

**明るい女子（A ランク）:**

> 「めっちゃ良かった〜！✨ 感情表現が豊かで楽しかったよ！ちょっとだけ質問返しを増やすともっといいかも 😊」

**オタク仲間（B ランク）:**

> 「おお、いい感じじゃん 🤓 話題の掘り下げ方がナイス！もうちょい速く返せるようになると完璧だね。」

**冷静タイプ（C ランク）:**

> 「悪くはないけど...😏 反応速度はいいんだけど、会話を広げる力がもう少し欲しいかな。」

---

## 🎯 コンボ判定

### コンボシステム

連続して高スコアを獲得すると、コンボが発生します。

```typescript
type ComboState = {
  count: number; // 現在のコンボ数
  threshold: number; // コンボ判定の閾値スコア
  maxCombo: number; // 最大コンボ数
  isActive: boolean; // コンボ中かどうか
};

function checkCombo(
  currentTurnScore: number,
  comboState: ComboState
): ComboState {
  const threshold = 70; // 70点以上でコンボ継続

  if (currentTurnScore >= threshold) {
    return {
      ...comboState,
      count: comboState.count + 1,
      maxCombo: Math.max(comboState.maxCombo, comboState.count + 1),
      isActive: true,
    };
  } else {
    return {
      ...comboState,
      count: 0,
      isActive: false,
    };
  }
}

function getComboMessage(comboCount: number): string | null {
  if (comboCount === 3) return "🔥 トークコンボ × 3！";
  if (comboCount === 5) return "🔥🔥 すごい！コンボ × 5！";
  if (comboCount === 7) return "🔥🔥🔥 完璧！コンボ × 7！";
  if (comboCount >= 10) return "✨🔥 神トーク！コンボ × " + comboCount + "！";
  return null;
}
```

---

## 🏆 称号・レベルシステム

### 経験値の計算

```typescript
function calculateExperience(score: ComprehensiveScore): number {
  // 基本経験値: スコアに応じて10-100 XP
  const baseXP = Math.floor(score.total);

  // グレードボーナス
  const gradeBonus = {
    S: 50,
    A: 30,
    B: 15,
    C: 5,
    D: 0,
  };

  return baseXP + gradeBonus[score.grade];
}
```

### 称号の判定

```typescript
type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: PlayerStats) => boolean;
};

const achievements: Achievement[] = [
  {
    id: "speed-ninja",
    name: "リアクション忍者",
    description: "5ターン連続で3秒以内に返答",
    icon: "⚡",
    condition: (stats) => stats.consecutiveFastResponses >= 5,
  },
  {
    id: "empathy-master",
    name: "共感の達人",
    description: "共感力90点以上を3回達成",
    icon: "💕",
    condition: (stats) => stats.highEmpathyCount >= 3,
  },
  {
    id: "topic-expander",
    name: "話題製造機",
    description: "話題展開力が平均80点以上",
    icon: "💬",
    condition: (stats) => stats.averageTopicExpansion >= 80,
  },
  {
    id: "combo-master",
    name: "コンボマスター",
    description: "10コンボ達成",
    icon: "🔥",
    condition: (stats) => stats.maxCombo >= 10,
  },
  {
    id: "awkward-breaker",
    name: "気まずさ克服",
    description: "ピンチ返しモードでSランク達成",
    icon: "😅",
    condition: (stats) => stats.modeStats["pinch-recovery"]?.sRankCount > 0,
  },
];
```

---

## 🧪 テストケース

### 評価アルゴリズムのテスト例

```typescript
describe("AI Evaluation Algorithms", () => {
  describe("SpeedScore", () => {
    it("制限時間の50%以内で満点", () => {
      const score = calculateSpeedScore(2, 5);
      expect(score).toBe(100);
    });

    it("タイムアウトで20点", () => {
      const score = calculateSpeedScore(6, 5);
      expect(score).toBe(20);
    });
  });

  describe("ConversationQualityScore", () => {
    it("高品質な返答で高得点", async () => {
      const evaluation = await calculateConversationQualityScore(
        "わかる！俺も昨日3時まで起きてた。何してたの？",
        "昨日寝不足でさ〜",
        []
      );
      expect(evaluation.totalScore).toBeGreaterThan(80);
    });

    it("短すぎる返答で低得点", async () => {
      const evaluation = await calculateConversationQualityScore(
        "うん",
        "昨日寝不足でさ〜",
        []
      );
      expect(evaluation.totalScore).toBeLessThan(60);
    });
  });
});
```

---

## 📝 実装時の注意点

### 1. パフォーマンス最適化

- **OpenAI API 呼び出しの並列化**

  - 会話の質評価と AI の次の発言生成を並列実行
  - `Promise.all()` を使用

    ```typescript
    const [qualityEvaluation, nextAIMessage] = await Promise.all([
      calculateConversationQualityScore(playerMessage, aiMessage, history),
      generateAIResponse(playerMessage, character, history),
    ]);
    ```

### 2. エラーハンドリング

- API 呼び出し失敗時は基本スコア（50 点）を返す
- タイムアウトを設定（3 秒）

  ```typescript
  try {
    const score = await Promise.race([
      calculateConversationQualityScore(message, ai, history),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000)
      ),
    ]);
  } catch (error) {
    console.warn("AI evaluation failed, using fallback score");
    return {
      totalScore: 50,
      breakdown: {
        naturalness: 50,
        empathy: 50,
        topicExpansion: 50,
        emotion: 50,
      },
      comment: "",
      messageLength: message.length,
    };
  }
  ```

### 3. コスト管理

- GPT-4o-mini を使用してコストを抑制
- 評価は 1 ターンあたり 1 回のみ
- JSON モードで確実にパース可能な出力を取得

### 4. モード別の調整

- モードによって評価の重み付けを変更可能

  ```typescript
  const modeWeights: Record<ModeId, EvaluationWeights> = {
    "first-meeting": {
      speed: 0.15,
      conversationQuality: 0.85, // 初対面は会話の質を重視
    },
    "freetalk-hell": {
      speed: 0.4, // 反射重視
      conversationQuality: 0.6,
    },
    // ...
  };
  ```

---

## 🔄 今後の拡張案

### 1. 機械学習モデルの導入

- ファインチューニングされたモデルで評価精度向上
- プレイヤーごとのカスタマイズ評価

### 2. リアルタイム フィードバック

- タイピング中にヒント表示
- 「質問を追加してみよう」などのサジェスト

### 3. 音声評価（将来的に）

- 声のトーン分析
- 話す速度の評価
- 間（ま）の取り方

### 4. 対人評価

- 他のプレイヤーとのマッチングモード
- 相互評価システム

---

## ✅ チェックリスト

- [x] 2 つの評価項目の定義（反応速度・会話の質）
- [x] 各項目の計算アルゴリズム設計
- [x] OpenAI API による総合評価
- [x] スコアの重み付けと総合評価
- [x] AI コメント生成ロジック
- [x] コンボ・称号システムの設計
- [x] テストケースの例示
- [x] 実装時の注意点の記載
- [x] 文字列含有チェックを排除し、AI による評価に統一
