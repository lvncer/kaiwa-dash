"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Message, TurnScore } from "@/types/game";
import { evaluateTurn, startMVPSession } from "@/app/actions/game";

const MAX_TURNS = 5;
const TIME_LIMIT = 30; // 秒

export default function PlayPage() {
  const router = useRouter();

  // セッション情報
  const [sessionId, setSessionId] = useState<string>("");
  const [currentTurn, setCurrentTurn] = useState(0);

  // 会話関連
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  // タイマー関連
  const [remainingTime, setRemainingTime] = useState(TIME_LIMIT);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerStartRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // スコア関連
  const [turnScores, setTurnScores] = useState<TurnScore[]>([]);
  const [currentTurnScore, setCurrentTurnScore] = useState<TurnScore | null>(
    null,
  );

  // UI状態
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // 初回セッション開始
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const { sessionId: newSessionId, firstMessage } =
        await startMVPSession();

      setSessionId(newSessionId);

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        content: firstMessage,
        timestamp: new Date(),
      };

      setConversationHistory([aiMessage]);
      setCurrentTurn(1);
      startTimer();
    } catch (error) {
      console.error("Failed to initialize session:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  // タイマー開始
  const startTimer = () => {
    timerStartRef.current = Date.now();
    setRemainingTime(TIME_LIMIT);
    setIsTimerActive(true);

    timerIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - timerStartRef.current) / 1000;
      const remaining = TIME_LIMIT - elapsed;

      if (remaining <= 0) {
        setRemainingTime(0);
        stopTimer();
      } else {
        setRemainingTime(remaining);
      }
    }, 100);
  };

  // タイマー停止
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsTimerActive(false);
  };

  // 返答送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading || !isTimerActive) return;

    stopTimer();
    const responseTime = (Date.now() - timerStartRef.current) / 1000;

    setIsLoading(true);

    try {
      // プレイヤーのメッセージを追加
      const playerMessage: Message = {
        id: crypto.randomUUID(),
        sender: "player",
        content: inputMessage.trim(),
        timestamp: new Date(),
      };

      const newHistory = [...conversationHistory, playerMessage];
      setConversationHistory(newHistory);
      setInputMessage("");

      // 評価実行
      const { speedScore, qualityScore, totalScore, nextMessage } =
        await evaluateTurn({
          playerMessage: playerMessage.content,
          responseTime,
          conversationHistory: newHistory,
        });

      // スコアを保存
      const score: TurnScore = {
        turnNumber: currentTurn,
        speedScore,
        qualityScore,
        totalScore,
        responseTime,
      };

      setTurnScores([...turnScores, score]);
      setCurrentTurnScore(score);

      // 次のターンへ
      if (currentTurn < MAX_TURNS) {
        // AIメッセージを追加
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          sender: "ai",
          content: nextMessage,
          timestamp: new Date(),
        };

        setConversationHistory([...newHistory, aiMessage]);
        setCurrentTurn(currentTurn + 1);

        // 少し待ってからタイマー再開
        setTimeout(() => {
          setCurrentTurnScore(null);
          startTimer();
        }, 2000);
      } else {
        // ゲーム終了 → リザルト画面へ
        setTimeout(() => {
          router.push(
            `/result?sessionId=${sessionId}&scores=${JSON.stringify([...turnScores, score])}`,
          );
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to evaluate turn:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // タイマー表示の色
  const getTimerColor = () => {
    const ratio = remainingTime / TIME_LIMIT;
    if (ratio > 0.5) return "bg-green-500";
    if (ratio > 0.2) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">ゲームを準備中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 p-4">
      {/* ヘッダー */}
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold">会話ダッシュ MVP</h1>
        <p className="text-gray-600">
          ターン {currentTurn}/{MAX_TURNS}
        </p>
      </div>

      {/* 会話エリア */}
      <div className="mx-auto mb-4 w-full max-w-2xl flex-1 space-y-3 overflow-y-auto rounded-lg bg-white p-4 shadow">
        {conversationHistory.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg p-3 ${
              msg.sender === "ai"
                ? "bg-blue-100 text-left"
                : "ml-auto bg-gray-200 text-right"
            } max-w-[80%]`}
          >
            <p className="text-sm font-semibold text-gray-600">
              {msg.sender === "ai" ? "AI" : "You"}
            </p>
            <p className="mt-1">{msg.content}</p>
          </div>
        ))}

        {/* スコア表示 */}
        {currentTurnScore && (
          <div className="animate-bounce rounded-lg bg-yellow-100 p-4 text-center">
            <p className="text-2xl font-bold">
              {currentTurnScore.totalScore}点
            </p>
            <p className="text-sm text-gray-600">
              反応速度: {currentTurnScore.speedScore}点 / 会話の質:{" "}
              {currentTurnScore.qualityScore}点
            </p>
          </div>
        )}
      </div>

      {/* タイマー */}
      {isTimerActive && (
        <div className="mx-auto mb-4 w-full max-w-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">残り時間</span>
            <span className="text-lg font-bold">
              {remainingTime.toFixed(1)}秒
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full transition-all duration-100 ${getTimerColor()}`}
              style={{ width: `${(remainingTime / TIME_LIMIT) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 入力フォーム */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-2xl rounded-lg bg-white p-4 shadow"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="あなたの返答を入力..."
            disabled={isLoading || !isTimerActive}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={
              isLoading || !isTimerActive || !inputMessage.trim()
            }
            className="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600 disabled:bg-gray-300"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
}

