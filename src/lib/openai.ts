import OpenAI from "openai";
import type { Message } from "@/types/game";
import type { Character } from "@/lib/constants/game-config";

// OpenAIクライアント初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-5-nano";

/**
 * AI発言を生成
 * @param playerMessage プレイヤーの発言（初回はnull）
 * @param character キャラクター設定
 * @param conversationHistory 会話履歴
 * @returns AI発言
 */
export async function generateAIMessage(
  playerMessage: string | null,
  character: Character,
  conversationHistory: Message[],
): Promise<string> {
  console.log("[generateAIMessage] 関数開始", {
    playerMessage,
    character: character.id,
    historyLength: conversationHistory.length,
  });

  const systemPrompt = `
あなたは${character.name}です。
性格: ${character.personality}

【会話のルール】
1. ${character.responseStyle}
2. 50文字以内で返答してください
3. 絵文字の使用は自然な範囲で（キャラクターに合わせて）
4. 相手が返答しやすいように、時々質問も入れてください
5. キャラクターの性格を保ってください
`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  // 会話履歴を追加（最新3ターンのみ）
  const recentHistory = conversationHistory.slice(-6); // AI+プレイヤーで3ターン
  for (const msg of recentHistory) {
    messages.push({
      role: msg.sender === "ai" ? "assistant" : "user",
      content: msg.content,
    });
  }

  // プレイヤーの発言があれば追加
  if (playerMessage) {
    messages.push({
      role: "user",
      content: playerMessage,
    });
  }

  try {
    console.log("[generateAIMessage] API呼び出し開始", {
      model: MODEL,
      messagesCount: messages.length,
    });

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
    });

    console.log("[generateAIMessage] API呼び出し成功", {
      content: response.choices[0].message.content,
      finishReason: response.choices[0].finish_reason,
    });

    return response.choices[0].message.content?.trim() || "...";
  } catch (error) {
    console.error("[generateAIMessage] AI message generation failed:", error);
    return "ごめん、ちょっと考え中...";
  }
}

/**
 * 会話の質を評価
 * @param playerMessage プレイヤーの発言
 * @param aiMessage 直前のAI発言
 * @returns 会話の質スコア（0-100）
 */
export async function evaluateQuality(
  playerMessage: string,
  aiMessage: string,
): Promise<number> {
  console.log("[evaluateQuality] 関数開始", {
    playerMessageLength: playerMessage.length,
    aiMessageLength: aiMessage.length,
  });

  const systemPrompt = `
あなたは会話の質を評価する専門家です。
プレイヤーの返答を以下の観点から評価し、0-100点のスコアを返してください。

【評価観点】
1. 自然さ: 文脈に合った適切な返答か
2. 共感力: 相手の発言を受け止めているか
3. 話題展開力: 会話を続けるための要素があるか
4. 感情表現: 感情が伝わる表現か

【評価のポイント】
- 極端に短い返答（「うん」のみなど）は低評価
- 長すぎる返答（150文字以上）は減点
- 文脈を無視した返答は大きく減点
- 質問や共感の言葉があれば高評価

【出力形式】
数値のみを返してください（例: 85）
`;

  const userPrompt = `
【AI の発言】
${aiMessage}

【プレイヤーの返答】
${playerMessage}

評価スコア（0-100）:
`;

  try {
    console.log("[evaluateQuality] API呼び出し開始");

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0].message.content?.trim() || "50";
    const score = Number.parseInt(content, 10);

    console.log("[evaluateQuality] API呼び出し成功", { content, score });

    // 0-100に正規化
    return Math.max(0, Math.min(100, Number.isNaN(score) ? 50 : score));
  } catch (error) {
    console.error("[evaluateQuality] Quality evaluation failed:", error);
    // フォールバック: 基本スコアを返す
    return 50;
  }
}

/**
 * AI総評コメントを生成
 * @param averageScore 平均スコア
 * @param averageSpeedScore 平均反応速度
 * @param averageQualityScore 平均会話の質
 * @param character キャラクター設定
 * @returns AI総評
 */
export async function generateFinalComment(
  averageScore: number,
  averageSpeedScore: number,
  averageQualityScore: number,
  character: Character,
): Promise<string> {
  console.log("[generateFinalComment] 関数開始", {
    averageScore,
    averageSpeedScore,
    averageQualityScore,
    character: character.id,
  });

  const systemPrompt = `
あなたは${character.name}として、プレイヤーの会話を評価してコメントします。
性格: ${character.personality}
返答スタイル: ${character.responseStyle}

以下の評価結果に基づき、2-3文で簡潔にコメントしてください。

【コメントのルール】
1. ポジティブな点を先に述べる
2. 改善点を1つだけ優しく指摘
3. 真面目で丁寧な口調を保つ
4. 60文字以内に収める
`;

  const userPrompt = `
【評価結果】
- 総合スコア: ${averageScore}点
- 反応速度: ${averageSpeedScore}点
- 会話の質: ${averageQualityScore}点

コメント:
`;

  try {
    console.log("[generateFinalComment] API呼び出し開始");

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const comment =
      response.choices[0].message.content?.trim() ||
      "お疲れ様でした。良い会話でしたね。";

    console.log("[generateFinalComment] API呼び出し成功", { comment });

    return comment;
  } catch (error) {
    console.error("[generateFinalComment] Comment generation failed:", error);
    return "お疲れ様でした。良い会話でしたね。";
  }
}

