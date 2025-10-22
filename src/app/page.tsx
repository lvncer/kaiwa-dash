import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-2xl">
        {/* タイトル */}
        <h1 className="mb-2 text-4xl font-bold text-gray-800">会話ダッシュ</h1>
        <p className="mb-8 text-gray-600">MVP Phase 1</p>

        {/* 説明 */}
        <div className="mb-8 rounded-lg bg-gray-50 p-4 text-left">
          <p className="mb-2 text-sm text-gray-700">
            🎯 5ターンの会話練習
          </p>
          <p className="mb-2 text-sm text-gray-700">
            ⚡ 反応速度と会話の質を評価
          </p>
          <p className="text-sm text-gray-700">
            💬 AIからフィードバックをもらおう
          </p>
        </div>

        {/* プレイ開始ボタン */}
        <Link
          href="/play"
          className="block w-full rounded-lg bg-linear-to-r from-blue-500 to-purple-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
        >
          プレイ開始
        </Link>

        {/* 注意書き */}
        <p className="mt-4 text-xs text-gray-500">
          現在: 雑談スプリント × 真面目くん
        </p>
      </div>
    </div>
  );
}
