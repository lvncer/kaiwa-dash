"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllStats, getPlayHistory } from "@/lib/storage";
import type { MVPPlayHistory } from "@/types/game";
import {
  getCharacterById,
  getModeById,
  getModes,
} from "@/lib/constants/game-config";
import type { ModeId } from "@/lib/constants/game-config";

export default function StatsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<MVPPlayHistory[]>([]);
  const [stats, setStats] = useState<{
    totalPlays: number;
    averageScore: number;
    modeStats: Record<
      ModeId,
      {
        playCount: number;
        averageScore: number;
      }
    >;
  } | null>(null);

  useEffect(() => {
    // データ読み込み
    const loadedHistory = getPlayHistory();
    const loadedStats = getAllStats();

    setHistory(loadedHistory);
    setStats(loadedStats);
  }, []);

  const modes = getModes();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">統計</h1>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            ホームへ戻る
          </button>
        </div>

        {/* 全体統計 */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">全体統計</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-600">総プレイ回数</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats?.totalPlays || 0}回
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-gray-600">平均スコア</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats?.averageScore || 0}点
              </p>
            </div>
          </div>
        </section>

        {/* モード別統計 */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">モード別統計</h2>
          <div className="space-y-4">
            {modes.map((mode) => {
              const modeStats = stats?.modeStats[mode.id];
              const playCount = modeStats?.playCount || 0;
              const avgScore = modeStats?.averageScore || 0;
              const maxScore = Math.max(...history.map((h) => h.score), 100);
              const barWidth = playCount > 0 ? (avgScore / maxScore) * 100 : 0;

              return (
                <div key={mode.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{mode.icon}</span>
                      <h3 className="font-bold">{mode.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {playCount}回プレイ
                      </p>
                      <p className="text-lg font-bold">{avgScore}点</p>
                    </div>
                  </div>
                  {/* 簡易グラフ */}
                  {playCount > 0 && (
                    <div className="h-4 w-full rounded-full bg-gray-200">
                      <div
                        className="h-4 rounded-full bg-linear-to-r from-blue-400 to-purple-400 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* プレイ履歴 */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">プレイ履歴（最新10件）</h2>
          {history.length === 0 ? (
            <p className="text-center text-gray-500">
              まだプレイ履歴がありません
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((play, index) => {
                const mode = getModeById(play.mode);
                const character = getCharacterById(play.character);
                const date = new Date(play.playedAt);

                return (
                  <div
                    key={play.sessionId}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">#{index + 1}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{mode.icon}</span>
                          <span className="font-semibold">{mode.name}</span>
                          <span className="text-gray-400">×</span>
                          <span>{character.icon}</span>
                          <span className="text-sm text-gray-600">
                            {character.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {date.toLocaleString("ja-JP")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {play.score}点
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

