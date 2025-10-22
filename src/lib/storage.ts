import type { MVPPlayHistory } from "@/types/game";
import type { ModeId } from "./constants/game-config";

const STORAGE_KEY = "kaiwa-dash-mvp-history";
const MAX_HISTORY_COUNT = 10;

/**
 * プレイ履歴を保存
 * @param playData プレイデータ
 */
export function savePlayHistory(playData: MVPPlayHistory): void {
  if (typeof window === "undefined") return;

  try {
    const history = getPlayHistory();
    history.unshift(playData); // 新しいものを先頭に

    // 最大10件まで保存
    const trimmedHistory = history.slice(0, MAX_HISTORY_COUNT);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Failed to save play history:", error);
  }
}

/**
 * プレイ履歴を取得
 * @returns プレイ履歴（最新10件）
 */
export function getPlayHistory(): MVPPlayHistory[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load play history:", error);
    return [];
  }
}

/**
 * 平均スコアを計算
 * @param history プレイ履歴（省略時は全履歴）
 * @returns 平均スコア
 */
export function calculateAverageScore(history?: MVPPlayHistory[]): number {
  const data = history || getPlayHistory();
  if (data.length === 0) return 0;

  const total = data.reduce((sum, play) => sum + play.score, 0);
  return Math.round(total / data.length);
}

/**
 * モード別の統計を取得
 * @param mode モードID
 * @returns モード別の統計
 */
export function getModeStats(mode: ModeId): {
  playCount: number;
  averageScore: number;
  history: MVPPlayHistory[];
} {
  const allHistory = getPlayHistory();
  const modeHistory = allHistory.filter((play) => play.mode === mode);

  return {
    playCount: modeHistory.length,
    averageScore: calculateAverageScore(modeHistory),
    history: modeHistory,
  };
}

/**
 * 全モードの統計を取得
 * @returns 全モードの統計
 */
export function getAllStats(): {
  totalPlays: number;
  averageScore: number;
  modeStats: Record<
    ModeId,
    {
      playCount: number;
      averageScore: number;
    }
  >;
} {
  const allHistory = getPlayHistory();

  const modes: ModeId[] = [
    "first-meeting",
    "casual-sprint",
    "pinch-recovery",
    "freetalk-hell",
  ];

  const modeStats = modes.reduce(
    (acc, mode) => {
      const stats = getModeStats(mode);
      acc[mode] = {
        playCount: stats.playCount,
        averageScore: stats.averageScore,
      };
      return acc;
    },
    {} as Record<ModeId, { playCount: number; averageScore: number }>,
  );

  return {
    totalPlays: allHistory.length,
    averageScore: calculateAverageScore(allHistory),
    modeStats,
  };
}

