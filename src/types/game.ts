/**
 * 会話メッセージ
 */
export type Message = {
  id: string;
  sender: "ai" | "player";
  content: string;
  timestamp: Date;
};

/**
 * ゲームセッション
 */
export type GameSession = {
  sessionId: string;
  currentTurn: number;
  maxTurns: number;
  conversationHistory: Message[];
  turnScores: TurnScore[];
  startedAt: Date;
};

/**
 * ターンごとのスコア
 */
export type TurnScore = {
  turnNumber: number;
  speedScore: number; // 0-100
  qualityScore: number; // 0-100
  totalScore: number; // 0-100
  responseTime: number; // 秒
};

/**
 * 最終リザルト
 */
export type FinalResult = {
  sessionId: string;
  averageScore: number; // 0-100
  averageSpeedScore: number; // 0-100
  averageQualityScore: number; // 0-100
  comment: string; // AIからの総評
  playedAt: Date;
};

/**
 * ローカルストレージ用のプレイ履歴
 */
export type MVPPlayHistory = {
  sessionId: string;
  score: number; // 0-100
  playedAt: string; // ISO 8601
};

