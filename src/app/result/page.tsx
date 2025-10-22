"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { Message, TurnScore } from "@/types/game";
import type { CharacterId, ModeId } from "@/lib/constants/game-config";
import { finalizeMVPSession } from "@/app/actions/game";
import { savePlayHistory } from "@/lib/storage";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessionId, setSessionId] = useState<string>("");
  const [averageScore, setAverageScore] = useState(0);
  const [averageSpeedScore, setAverageSpeedScore] = useState(0);
  const [averageQualityScore, setAverageQualityScore] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    finalizeSession();
  }, []);

  const finalizeSession = async () => {
    try {
      const sessionIdParam = searchParams.get("sessionId");
      const scoresParam = searchParams.get("scores");
      const mode = searchParams.get("mode") as ModeId | null;
      const character = searchParams.get("character") as CharacterId | null;

      if (!sessionIdParam || !scoresParam || !mode || !character) {
        console.error("Missing parameters");
        router.push("/");
        return;
      }

      setSessionId(sessionIdParam);

      const turnScores: TurnScore[] = JSON.parse(scoresParam);

      // 会話履歴を取得
      const conversationHistoryJson = localStorage.getItem(`conversation-${sessionIdParam}`);
      const conversationHistory: Message[] = conversationHistoryJson 
        ? JSON.parse(conversationHistoryJson) 
        : [];

      // 使用後は削除
      localStorage.removeItem(`conversation-${sessionIdParam}`);

      // スコア配列を作成
      const speedScores = turnScores.map((s) => s.speedScore);
      const qualityScores = turnScores.map((s) => s.qualityScore);
      const totalScores = turnScores.map((s) => s.totalScore);

      // 最終リザルトを計算
      const result = await finalizeMVPSession({
        sessionId: sessionIdParam,
        speedScores,
        qualityScores,
        totalScores,
        character,
        conversationHistory,
      });

      setAverageScore(result.averageScore);
      setAverageSpeedScore(result.averageSpeedScore);
      setAverageQualityScore(result.averageQualityScore);
      setComment(result.comment);

      // ローカルストレージに保存
      savePlayHistory({
        sessionId: sessionIdParam,
        mode,
        character,
        score: result.averageScore,
        playedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to finalize session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = () => {
    router.push("/select");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">リザルトを計算中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {/* タイトル */}
        <h1 className="mb-6 text-center text-3xl font-bold">リザルト</h1>

        {/* 総合スコア */}
        <div className="mb-8 rounded-lg bg-linear-to-r from-blue-500 to-purple-500 p-6 text-center text-white">
          <p className="mb-2 text-lg">総合スコア</p>
          <p className="text-5xl font-bold">★ {averageScore}点 ★</p>
        </div>

        {/* 内訳 */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <span className="font-semibold">⚡ 反応速度</span>
            <span className="text-xl font-bold">{averageSpeedScore}点</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <span className="font-semibold">💬 会話の質</span>
            <span className="text-xl font-bold">{averageQualityScore}点</span>
          </div>
        </div>

        {/* AIからのコメント */}
        <div className="mb-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <p className="mb-2 text-sm font-semibold text-blue-800">
            AIからのコメント
          </p>
          <p className="text-gray-800">{comment}</p>
        </div>

        {/* ボタン */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handlePlayAgain}
            className="w-full rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600"
          >
            もう一度プレイ
          </button>
          <button
            type="button"
            onClick={handleGoHome}
            className="w-full rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg">リザルトを準備中...</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}

