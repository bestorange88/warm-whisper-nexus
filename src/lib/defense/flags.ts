/**
 * 防御层 Feature Flag 集中读取。
 *
 * 设计原则：
 * - 所有开关默认 ON，关闭后行为应等价于未引入防御层。
 * - 通过 import.meta.env.VITE_DEFENSE_* 控制，便于在 Codemagic / .env 一键切换。
 * - 严禁在业务代码内直接读取 env，统一走本模块。
 */

function readBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).toLowerCase().trim();
  if (['0', 'false', 'off', 'no'].includes(v)) return false;
  if (['1', 'true', 'on', 'yes'].includes(v)) return true;
  return fallback;
}

export const DEFENSE_FLAGS = {
  /** 全局 ErrorBoundary + 未捕获异常旁路 */
  RUNTIME: readBool(import.meta.env.VITE_DEFENSE_RUNTIME, true),
  /** 输入净化与内容校验工具实际生效（关闭后 sanitize 透传原文） */
  INPUT: readBool(import.meta.env.VITE_DEFENSE_INPUT, true),
  /** 认证/会话异常旁路监听（不修改 useAuth） */
  AUTH: readBool(import.meta.env.VITE_DEFENSE_AUTH, true),
} as const;

export type DefenseFlagKey = keyof typeof DEFENSE_FLAGS;

export function isDefenseEnabled(key: DefenseFlagKey): boolean {
  return DEFENSE_FLAGS[key];
}