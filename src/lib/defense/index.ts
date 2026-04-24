/**
 * 防御层统一入口（幂等）。
 *
 * 业务代码只需在 main.tsx 调用 `initDefense()` 一次即可。
 * 关闭所有 flag 后，本函数等同 no-op。
 */

import { installGlobalObservers } from './observer';

export { DEFENSE_FLAGS, isDefenseEnabled } from './flags';
export { stripInvisible, collapseWhitespace, clampLength, isSafeUrl, escapeHtml } from './sanitize';
export { allow as rateLimitAllow } from './rateLimit';
export { recordDefenseEvent, getDefenseLog, clearDefenseLog } from './observer';

let booted = false;

export function initDefense(): void {
  if (booted) return;
  booted = true;
  installGlobalObservers();
}