# AI 評価アルゴリズム設計書 - 会話ダッシュ

## 📋 概要

このドキュメントでは、プレイヤーの会話応答を評価するためのアルゴリズムを定義します。
5 つの評価軸に基づき、それぞれ 0-100 点のスコアを算出し、最終的な総合スコアを計算します。

---

## 🎯 評価項目の定義

| 評価項目      | 重み | 説明                                     |
| ------------- | ---- | ---------------------------------------- |
| 🗣️ 反応速度   | 20%  | 返答までの秒数（早いほど高得点）         |
| 💬 自然さ     | 25%  | 文脈の一貫性・相手に対する適切さ         |
| 🎯 共感力     | 20%  | 「わかる」「それいいね！」などの共感表現 |
| 🤝 話題展開力 | 20%  | 会話を続けるための質問や話題振り         |
| 😂 感情表現   | 15%  | 絵文字・トーン・ユーモアなどの自然さ     |

**総合スコア計算式:**

```
総合スコア = (反応速度 × 0.2) + (自然さ × 0.25) + (共感力 × 0.2) + (話題展開力 × 0.2) + (感情表現 × 0.15)
```

---

## 🗣️ 評価項目 1: 反応速度

### 目的

リアルタイム会話における「瞬発力」を評価する

### 計算方法

#### 基本スコア計算

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

#### スコア例（制限時間 5 秒の場合）

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

## 💬 評価項目 2: 自然さ

### 目的

会話の文脈に沿った適切な返答かどうかを評価する

### 計算方法

#### アプローチ: OpenAI API を使用した評価

```typescript
async function calculateNaturalnessScore(
  playerMessage: string,
  aiMessage: string,
  conversationHistory: Message[]
): Promise<number> {
  const systemPrompt = `
あなたは会話の自然さを評価する専門家です。
以下の基準で、プレイヤーの返答を0-100点で評価してください。

【評価基準】
- 文脈との一貫性（40点）: AIの発言に対して適切な返答か
- 会話の自然な流れ（30点）: 唐突でなく、スムーズな会話か
- 言葉遣いの適切さ（30点）: 不自然な表現や誤字脱字がないか

【減点要素】
- 文脈を無視した返答: -30点
- 意味不明な返答: -40点
- 単語のみの返答（「うん」「はい」など）: -20点
- 返答が長すぎる（100文字以上）: -10点

スコアのみを数値で返してください。
`;

  const userPrompt = `
【会話履歴】
${conversationHistory.map((m) => `${m.sender}: ${m.content}`).join("\n")}

【AI の発言】
${aiMessage}

【プレイヤーの返答】
${playerMessage}

スコア:
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3, // 評価の一貫性を保つため低めに設定
    max_tokens: 10,
  });

  const scoreText = response.choices[0].message.content?.trim() || "50";
  const score = Math.max(0, Math.min(100, parseInt(scoreText, 10)));

  return score;
}
```

#### 補助的なルールベース評価（フォールバック用）

```typescript
function calculateNaturalnessScoreRuleBased(
  playerMessage: string,
  aiMessage: string
): number {
  let score = 70; // ベーススコア

  // 極端に短い返答（3文字以下）
  if (playerMessage.length <= 3) {
    score -= 20;
  }

  // 極端に長い返答（150文字以上）
  if (playerMessage.length >= 150) {
    score -= 10;
  }

  // 質問に対して答えていない（AIが「？」で終わる質問をしている場合）
  if (aiMessage.endsWith("？") || aiMessage.endsWith("?")) {
    const hasAnswer = playerMessage.length > 5; // 簡易チェック
    if (!hasAnswer) {
      score -= 15;
    }
  }

  // 適度な長さの返答にボーナス
  if (playerMessage.length >= 10 && playerMessage.length <= 80) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}
```

### データ構造

```typescript
type NaturalnessEvaluation = {
  score: number; // 0-100
  method: "ai" | "rule"; // 使用した評価方法
  messageLength: number; // 返答の文字数
  contextRelevance: number; // 文脈との関連性（AIによる評価の場合）
};
```

---

## 🎯 評価項目 3: 共感力

### 目的

相手への共感や理解を示す表現が含まれているかを評価する

### 計算方法

#### 共感ワード辞書

```typescript
const empathyKeywords = {
  strong: [
    "わかる",
    "わかります",
    "分かる",
    "共感",
    "そうだよね",
    "ほんとそれ",
    "確かに",
    "めっちゃわかる",
    "すごくわかる",
    "いいね",
    "それいいね",
    "ナイス",
    "素敵",
    "良いですね",
    "すごい",
  ],
  medium: [
    "なるほど",
    "そうなんだ",
    "へー",
    "ほー",
    "そっか",
    "そうか",
    "マジで",
    "ホント",
    "うんうん",
    "そうそう",
  ],
  weak: ["うん", "ええ", "はい", "ふむ"],
};

const empathyEmojis = [
  "😊",
  "😄",
  "😆",
  "🥺",
  "😭",
  "👍",
  "✨",
  "💕",
  "❤️",
  "🎉",
  "👏",
  "🙌",
  "💪",
  "😂",
  "🤣",
  "😢",
  "😱",
];
```

#### スコア計算

```typescript
function calculateEmpathyScore(playerMessage: string): number {
  let score = 50; // ベーススコア

  // 強い共感ワードの検出（1つにつき+15点、最大45点）
  const strongMatches = empathyKeywords.strong.filter((keyword) =>
    playerMessage.includes(keyword)
  );
  score += Math.min(strongMatches.length * 15, 45);

  // 中程度の共感ワードの検出（1つにつき+8点、最大24点）
  const mediumMatches = empathyKeywords.medium.filter((keyword) =>
    playerMessage.includes(keyword)
  );
  score += Math.min(mediumMatches.length * 8, 24);

  // 弱い共感ワードの検出（1つにつき+3点、最大9点）
  const weakMatches = empathyKeywords.weak.filter((keyword) =>
    playerMessage.includes(keyword)
  );
  score += Math.min(weakMatches.length * 3, 9);

  // 共感的な絵文字の検出（1つにつき+5点、最大20点）
  const emojiMatches = empathyEmojis.filter((emoji) =>
    playerMessage.includes(emoji)
  );
  score += Math.min(emojiMatches.length * 5, 20);

  // 感嘆符による強調（+5点、最大10点）
  const exclamationCount = (playerMessage.match(/[！!]/g) || []).length;
  score += Math.min(exclamationCount * 5, 10);

  return Math.max(0, Math.min(100, score));
}
```

#### スコア例

| 返答例                            | スコア | 評価     |
| --------------------------------- | ------ | -------- |
| 「めっちゃわかる！それいいね ✨」 | 95 点  | 最高     |
| 「わかる〜そうだよね」            | 73 点  | 良い     |
| 「なるほど」                      | 58 点  | まあまあ |
| 「うん」                          | 53 点  | 低い     |
| 「それは違う」（共感なし）        | 50 点  | 最低     |

### データ構造

```typescript
type EmpathyEvaluation = {
  score: number; // 0-100
  strongKeywords: string[]; // 検出された強い共感ワード
  mediumKeywords: string[]; // 検出された中程度の共感ワード
  weakKeywords: string[]; // 検出された弱い共感ワード
  emojis: string[]; // 検出された絵文字
  exclamationCount: number; // 感嘆符の数
};
```

---

## 🤝 評価項目 4: 話題展開力

### 目的

会話を継続・発展させる力を評価する

### 計算方法

#### 話題展開要素の検出

```typescript
function calculateTopicExpansionScore(
  playerMessage: string,
  aiMessage: string
): number {
  let score = 40; // ベーススコア

  // 1. 質問を含んでいるか（最大+30点）
  const questionMarks = (playerMessage.match(/[？?]/g) || []).length;
  score += Math.min(questionMarks * 15, 30);

  // 疑問形の検出（「〜の？」「〜かな」など）
  const questionPatterns = [
    /どう[？?]?$/,
    /何[？?]?$/,
    /いつ[？?]?$/,
    /どこ[？?]?$/,
    /誰[？?]?$/,
    /なぜ[？?]?$/,
    /[のかな？]+$/,
    /ですか[？?]?$/,
    /ますか[？?]?$/,
  ];

  const hasQuestionPattern = questionPatterns.some((pattern) =>
    pattern.test(playerMessage)
  );
  if (hasQuestionPattern && questionMarks === 0) {
    score += 15; // 疑問符がなくても質問形式ならボーナス
  }

  // 2. 新しい話題の提供（最大+25点）
  const topicKeywords = [
    "ところで",
    "そういえば",
    "あと",
    "それと",
    "ちなみに",
    "話変わるけど",
    "関係ないけど",
  ];

  const hasTopicChange = topicKeywords.some((keyword) =>
    playerMessage.includes(keyword)
  );
  if (hasTopicChange) {
    score += 25;
  }

  // 3. 相手の発言を掘り下げる（最大+20点）
  const deepenKeywords = [
    "もっと詳しく",
    "どんな",
    "どういう",
    "なんで",
    "例えば",
    "どうして",
    "というと",
  ];

  const hasDeepenKeyword = deepenKeywords.some((keyword) =>
    playerMessage.includes(keyword)
  );
  if (hasDeepenKeyword) {
    score += 20;
  }

  // 4. 自分の経験や意見を追加（最大+15点）
  const shareKeywords = [
    "私も",
    "俺も",
    "自分も",
    "実は",
    "昔",
    "前に",
    "〜したことある",
    "〜した時",
  ];

  const hasSharing = shareKeywords.some((keyword) =>
    playerMessage.includes(keyword)
  );
  if (hasSharing) {
    score += 15;
  }

  // 5. 単語のみの返答にペナルティ（-30点）
  if (playerMessage.length <= 3 && !questionMarks) {
    score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}
```

#### スコア例

| 返答例                                     | スコア | 評価 |
| ------------------------------------------ | ------ | ---- |
| 「マジで！何してたの？詳しく聞きたい！」   | 95 点  | 最高 |
| 「それいいね！俺も似たようなことあったよ」 | 75 点  | 良い |
| 「へー、そうなんだ」                       | 40 点  | 普通 |
| 「うん」                                   | 10 点  | 悪い |

### データ構造

```typescript
type TopicExpansionEvaluation = {
  score: number; // 0-100
  hasQuestion: boolean; // 質問を含むか
  questionCount: number; // 質問の数
  hasTopicChange: boolean; // 話題転換があるか
  hasDeepenAttempt: boolean; // 掘り下げようとしているか
  hasPersonalSharing: boolean; // 自分の経験を共有しているか
  detectedPatterns: string[]; // 検出されたパターン
};
```

---

## 😂 評価項目 5: 感情表現

### 目的

感情が伝わる豊かな表現を評価する

### 計算方法

#### 感情表現要素の検出

```typescript
function calculateEmotionScore(playerMessage: string): number {
  let score = 50; // ベーススコア

  // 1. 絵文字の使用（1つにつき+8点、最大24点）
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiCount = (playerMessage.match(emojiRegex) || []).length;
  score += Math.min(emojiCount * 8, 24);

  // 2. 感嘆符・疑問符の使用（1つにつき+4点、最大12点）
  const punctuationCount = (playerMessage.match(/[！!？?]/g) || []).length;
  score += Math.min(punctuationCount * 4, 12);

  // 3. 感情を表す言葉（最大+20点）
  const emotionWords = {
    positive: ["嬉しい", "楽しい", "幸せ", "最高", "やった", "ワクワク"],
    negative: ["悲しい", "辛い", "残念", "ショック", "やばい"],
    surprise: ["びっくり", "驚いた", "まさか", "えっ", "マジで"],
  };

  const allEmotionWords = [
    ...emotionWords.positive,
    ...emotionWords.negative,
    ...emotionWords.surprise,
  ];

  const emotionMatches = allEmotionWords.filter((word) =>
    playerMessage.includes(word)
  );
  score += Math.min(emotionMatches.length * 10, 20);

  // 4. 繰り返し表現（「あはは」「わーい」など）（+8点）
  const repeatPatterns = [
    /あはは+/,
    /わー+い?/,
    /うわー+/,
    /おー+/,
    /えー+/,
    /へー+/,
  ];

  const hasRepeat = repeatPatterns.some((pattern) =>
    pattern.test(playerMessage)
  );
  if (hasRepeat) {
    score += 8;
  }

  // 5. カタカナ表現（「ヤバい」「マジ」など）（+5点）
  const katakanaRatio =
    (playerMessage.match(/[ァ-ヴ]/g) || []).length / playerMessage.length;
  if (katakanaRatio > 0.1) {
    score += 5;
  }

  // 6. 句読点のない長文（読みにくい）にペナルティ（-10点）
  if (playerMessage.length > 30) {
    const hasPunctuation = /[、。，．,.]/.test(playerMessage);
    if (!hasPunctuation) {
      score -= 10;
    }
  }

  // 7. 感情表現が全くない場合（-20点）
  const hasAnyEmotion =
    emojiCount > 0 || punctuationCount > 0 || emotionMatches.length > 0;
  if (!hasAnyEmotion && playerMessage.length > 10) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}
```

#### スコア例

| 返答例                       | スコア | 評価   |
| ---------------------------- | ------ | ------ |
| 「マジで！？超嬉しい〜！✨」 | 94 点  | 最高   |
| 「わーい！やった！」         | 78 点  | 良い   |
| 「うん、いいね」             | 54 点  | 普通   |
| 「そうですね」               | 30 点  | 無機質 |

### データ構造

```typescript
type EmotionEvaluation = {
  score: number; // 0-100
  emojiCount: number; // 絵文字の数
  punctuationCount: number; // 感嘆符・疑問符の数
  emotionWords: string[]; // 検出された感情語
  hasRepeatExpression: boolean; // 繰り返し表現があるか
  katakanaRatio: number; // カタカナの比率
};
```

---

## 📊 総合評価の生成

### 総合スコアの計算

```typescript
type ComprehensiveScore = {
  total: number; // 総合スコア（0-100）
  speed: number; // 反応速度（0-100）
  naturalness: number; // 自然さ（0-100）
  empathy: number; // 共感力（0-100）
  topicExpansion: number; // 話題展開力（0-100）
  emotion: number; // 感情表現（0-100）
  grade: "S" | "A" | "B" | "C" | "D"; // 評価ランク
};

function calculateComprehensiveScore(
  speedScore: number,
  naturalnessScore: number,
  empathyScore: number,
  topicExpansionScore: number,
  emotionScore: number
): ComprehensiveScore {
  // 重み付け総合スコア
  const total = Math.round(
    speedScore * 0.2 +
      naturalnessScore * 0.25 +
      empathyScore * 0.2 +
      topicExpansionScore * 0.2 +
      emotionScore * 0.15
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
    naturalness: naturalnessScore,
    empathy: empathyScore,
    topicExpansion: topicExpansionScore,
    emotion: emotionScore,
    grade,
  };
}
```

### グレード基準

| グレード | スコア範囲 | 評価                   |
| -------- | ---------- | ---------------------- |
| S        | 90-100     | 完璧な会話！流石です！ |
| A        | 75-89      | 素晴らしい！自然な会話 |
| B        | 60-74      | 良い感じ！もう少し     |
| C        | 45-59      | まあまあ。練習が必要   |
| D        | 0-44       | 要改善。もっと頑張ろう |

---

## 💬 AI コメント生成

### コメント生成ロジック

```typescript
async function generateAIComment(
  score: ComprehensiveScore,
  character: Character,
  conversationHistory: Message[]
): Promise<string> {
  // 強み・弱みの特定
  const scores = [
    { name: "反応速度", value: score.speed },
    { name: "自然さ", value: score.naturalness },
    { name: "共感力", value: score.empathy },
    { name: "話題展開力", value: score.topicExpansion },
    { name: "感情表現", value: score.emotion },
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

【評価結果】
- 総合スコア: ${score.total}点（グレード: ${score.grade}）
- 最も良かった点: ${strength.name}（${strength.value}点）
- 改善できる点: ${weakness.name}（${weakness.value}点）
`;

  const userPrompt = `コメントを生成してください。`;

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

  describe("EmpathyScore", () => {
    it("共感ワードが多いほど高得点", () => {
      const score1 = calculateEmpathyScore("わかる！めっちゃ共感✨");
      const score2 = calculateEmpathyScore("うん");
      expect(score1).toBeGreaterThan(score2);
      expect(score1).toBeGreaterThan(80);
    });
  });

  describe("TopicExpansionScore", () => {
    it("質問を含むと高得点", () => {
      const score = calculateTopicExpansionScore(
        "それってどういうこと？詳しく聞きたい！",
        "AI message"
      );
      expect(score).toBeGreaterThan(70);
    });
  });
});
```

---

## 📝 実装時の注意点

### 1. パフォーマンス最適化

- **OpenAI API 呼び出しの並列化**
  - 自然さの評価と AI の次の発言生成を並列実行
  - `Promise.all()` を使用

```typescript
const [naturalnessScore, nextAIMessage] = await Promise.all([
  calculateNaturalnessScore(playerMessage, aiMessage, history),
  generateAIResponse(playerMessage, character, history),
]);
```

### 2. エラーハンドリング

- API 呼び出し失敗時はルールベース評価にフォールバック
- タイムアウトを設定（3 秒）

```typescript
try {
  const score = await Promise.race([
    calculateNaturalnessScore(message, ai, history),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 3000)
    ),
  ]);
} catch (error) {
  console.warn("AI evaluation failed, using rule-based fallback");
  return calculateNaturalnessScoreRuleBased(message, ai);
}
```

### 3. コスト管理

- GPT-4o-mini を使用してコストを抑制
- 評価は 1 ターンあたり 1 回のみ
- キャッシュ可能な部分は事前計算

### 4. モード別の調整

- モードによって評価の重み付けを変更可能

```typescript
const modeWeights: Record<ModeId, EvaluationWeights> = {
  "first-meeting": {
    speed: 0.15,
    naturalness: 0.3,
    empathy: 0.25,
    topicExpansion: 0.2,
    emotion: 0.1,
  },
  "freetalk-hell": {
    speed: 0.4, // 反射重視
    naturalness: 0.25,
    empathy: 0.15,
    topicExpansion: 0.15,
    emotion: 0.05,
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

- [x] 5 つの評価項目の定義
- [x] 各項目の計算アルゴリズム設計
- [x] スコアの重み付けと総合評価
- [x] AI コメント生成ロジック
- [x] コンボ・称号システムの設計
- [x] テストケースの例示
- [x] 実装時の注意点の記載
