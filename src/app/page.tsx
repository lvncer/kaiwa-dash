"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-2xl">
        {/* タイトル */}
        <h1 className="mb-2 text-4xl font-bold text-gray-800">会話ダッシュ</h1>
        <p className="mb-8 text-gray-600">MVP Phase 2</p>

        {/* 説明 */}
        <div className="mb-8 rounded-lg bg-gray-50 p-4 text-left">
          <p className="mb-2 text-sm text-gray-700">
            🎯 4つのモード × 4人のキャラクター
          </p>
          <p className="mb-2 text-sm text-gray-700">
            ⚡ 反応速度と会話の質を評価
          </p>
          <p className="text-sm text-gray-700">
            💬 AIからフィードバックをもらおう
          </p>
        </div>

        {/* ボタン */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => router.push("/select")}
            className="w-full rounded-lg bg-linear-to-r from-blue-500 to-purple-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
          >
            プレイ開始
          </button>

          <button
            type="button"
            onClick={() => router.push("/stats")}
            className="w-full rounded-lg border-2 border-purple-300 bg-white px-8 py-4 text-lg font-bold text-purple-600 shadow transition-transform hover:scale-105 hover:bg-purple-50"
          >
            統計を見る
          </button>
        </div>
      </div>
    </div>
  );
}
