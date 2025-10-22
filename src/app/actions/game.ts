"use server";

import type { Message } from "@/types/game";
import type { CharacterId, ModeId } from "@/lib/constants/game-config";
import { getCharacterById } from "@/lib/constants/game-config";
import {
  evaluateQuality,
  generateAIMessage,
  generateFinalComment,
} from "@/lib/openai";
import { calculateFinalScore, calculateSpeedScore } from "@/lib/scoring";

/**
 * MVPセッションを開始
 * @param mode モードID
 * @param character キャラクターID
 * @returns セッションID、初回AI発言
 */
export async function startMVPSession(input: {
  mode: ModeId;
  character: CharacterId;
}): Promise<{
  sessionId: string;
  firstMessage: string;
}> {
  console.log("[startMVPSession] セッション開始", input);
  const sessionId = crypto.randomUUID();
  console.log("[startMVPSession] セッションID生成:", sessionId);

  const characterData = getCharacterById(input.character);
  const firstMessage = await generateAIMessage(null, characterData, []);
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
  character: CharacterId;
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
    character: input.character,
  });

  const { playerMessage, responseTime, conversationHistory, character } = input;

  // 直前のAIメッセージを取得
  const lastAIMessage =
    conversationHistory
      .filter((m) => m.sender === "ai")
      .slice(-1)[0]?.content || "";

  const characterData = getCharacterById(character);

  // 並列処理: 評価 + 次のAI発言生成
  const [speedScore, qualityScore, nextMessage] = await Promise.all([
    // 反応速度評価（同期処理だがPromiseでラップ）
    Promise.resolve(calculateSpeedScore(responseTime, 30)),
    // 会話の質評価
    evaluateQuality(playerMessage, lastAIMessage),
    // 次のAI発言生成
    generateAIMessage(playerMessage, characterData, conversationHistory),
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
  character: CharacterId;
  conversationHistory: Message[];
}): Promise<{
  averageScore: number;
  averageSpeedScore: number;
  averageQualityScore: number;
  comment: string;
}> {
  console.log("[finalizeMVPSession] セッション終了処理開始", {
    sessionId: input.sessionId,
    turnsCount: input.totalScores.length,
    character: input.character,
    historyLength: input.conversationHistory.length,
  });

  const { speedScores, qualityScores, totalScores, character, conversationHistory } = input;

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

  const characterData = getCharacterById(character);

  // AI総評生成
  const comment = await generateFinalComment(
    averageScore,
    averageSpeedScore,
    averageQualityScore,
    characterData,
    conversationHistory,
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

