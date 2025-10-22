/**
 * 反応速度スコアを計算
 * @param responseTime 実際の返答時間（秒）
 * @param timeLimit 制限時間（秒）
 * @returns スコア（0-100）
 */
export function calculateSpeedScore(
  responseTime: number,
  timeLimit: number,
): number {
  // 制限時間の50%以内で返答 → 満点
  if (responseTime <= timeLimit * 0.5) {
    return 100;
  }

  // 制限時間の50%-80% → 80-100点の線形補間
  if (responseTime <= timeLimit * 0.8) {
    const ratio = (responseTime - timeLimit * 0.5) / (timeLimit * 0.3);
    return 100 - ratio * 20; // 100 → 80
  }

  // 制限時間の80%-100% → 50-80点の線形補間
  if (responseTime <= timeLimit) {
    const ratio = (responseTime - timeLimit * 0.8) / (timeLimit * 0.2);
    return 80 - ratio * 30; // 80 → 50
  }

  // タイムアウト → 20点
  return 20;
}

/**
 * 総合スコアを計算
 * @param speedScore 反応速度スコア（0-100）
 * @param qualityScore 会話の質スコア（0-100）
 * @returns 総合スコア（0-100）
 */
export function calculateFinalScore(
  speedScore: number,
  qualityScore: number,
): number {
  // 総合スコア = 反応速度(20%) + 会話の質(80%)
  return Math.round(speedScore * 0.2 + qualityScore * 0.8);
}

