import type { MVPPlayHistory } from "@/types/game";

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

