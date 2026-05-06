/**
 * 时长估算与校验工具
 */

/** 根据文本字数和语速估算 TTS 时长（秒） */
export function estimateDuration(text: string, charsPerSecond: number): number {
  const charCount = text.replace(/\s/g, '').length
  return charCount / charsPerSecond
}

/** 校验实际时长与目标时长的偏差 */
export function validateDuration(
  target: number,
  actual: number,
  tolerance: number = 0.15,
): { ok: boolean; diff: number; ratio: number } {
  const diff = actual - target
  const ratio = Math.abs(diff) / target
  return { ok: ratio <= tolerance, diff, ratio }
}
