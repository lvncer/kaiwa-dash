"use server";

import type { Message } from "@/types/game";
import {
  evaluateQuality,
  generateAIMessage,
  generateFinalComment,
} from "@/lib/openai";
import { calculateFinalScore, calculateSpeedScore } from "@/lib/scoring";

/**
 * MVPセッションを開始
 * @returns セッションID、初回AI発言
 */
export async function startMVPSession(): Promise<{
  sessionId: string;
  firstMessage: string;
}> {
  console.log("[startMVPSession] セッション開始");
  const sessionId = crypto.randomUUID();
  console.log("[startMVPSession] セッションID生成:", sessionId);

  const firstMessage = await generateAIMessage(null, []);
  console.log("[startMVPSession] 初回メッセージ生成完了:", firstMessage);

  return { sessionId, firstMessage };
}

/**
 * ターンを評価
 * @param input 評価に必要な情報
 * @returns スコア、次のAI発言
 */
export async function evaluateTurn(input: {
  playerMessage: string;
  responseTime: number;
  conversationHistory: Message[];
}): Promise<{
  speedScore: number;
  qualityScore: number;
  totalScore: number;
  nextMessage: string;
}> {
  console.log("[evaluateTurn] ターン評価開始", {
    playerMessage: input.playerMessage,
    responseTime: input.responseTime,
    historyLength: input.conversationHistory.length,
  });

  const { playerMessage, responseTime, conversationHistory } = input;

  // 直前のAIメッセージを取得
  const lastAIMessage =
    conversationHistory
      .filter((m) => m.sender === "ai")
      .slice(-1)[0]?.content || "";

  // 並列処理: 評価 + 次のAI発言生成
  const [speedScore, qualityScore, nextMessage] = await Promise.all([
    // 反応速度評価（同期処理だがPromiseでラップ）
    Promise.resolve(calculateSpeedScore(responseTime, 30)),
    // 会話の質評価
    evaluateQuality(playerMessage, lastAIMessage),
    // 次のAI発言生成
    generateAIMessage(playerMessage, conversationHistory),
  ]);

  // 総合スコア計算
  const totalScore = calculateFinalScore(speedScore, qualityScore);

  console.log("[evaluateTurn] 評価完了", {
    speedScore: Math.round(speedScore),
    qualityScore: Math.round(qualityScore),
    totalScore,
    nextMessagePreview: nextMessage.substring(0, 20),
  });

  return {
    speedScore: Math.round(speedScore),
    qualityScore: Math.round(qualityScore),
    totalScore,
    nextMessage,
  };
}

/**
 * MVPセッションを終了
 * @param input スコア配列
 * @returns 平均スコア、AIコメント
 */
export async function finalizeMVPSession(input: {
  sessionId: string;
  speedScores: number[];
  qualityScores: number[];
  totalScores: number[];
}): Promise<{
  averageScore: number;
  averageSpeedScore: number;
  averageQualityScore: number;
  comment: string;
}> {
  console.log("[finalizeMVPSession] セッション終了処理開始", {
    sessionId: input.sessionId,
    turnsCount: input.totalScores.length,
  });

  const { speedScores, qualityScores, totalScores } = input;

  // 平均スコア計算
  const averageScore = Math.round(
    totalScores.reduce((sum, s) => sum + s, 0) / totalScores.length,
  );

  const averageSpeedScore = Math.round(
    speedScores.reduce((sum, s) => sum + s, 0) / speedScores.length,
  );

  const averageQualityScore = Math.round(
    qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length,
  );

  // AI総評生成
  const comment = await generateFinalComment(
    averageScore,
    averageSpeedScore,
    averageQualityScore,
  );

  console.log("[finalizeMVPSession] セッション終了処理完了", {
    averageScore,
    averageSpeedScore,
    averageQualityScore,
    commentPreview: comment.substring(0, 30),
  });

  return {
    averageScore,
    averageSpeedScore,
    averageQualityScore,
    comment,
  };
}

