/**
 * 全局异常旁路监听。
 *
 * 设计要点：
 * - 仅监听，不拦截、不修改业务流程。
 * - 所有日志写到 console + sessionStorage 环形缓冲（最近 50 条），便于现场排查。
 * - 不向后端发送任何请求，避免新增网络开销与隐私风险。
 * - 幂等：多次 init 只生效一次。
 */

import { DEFENSE_FLAGS } from './flags';

const STORAGE_KEY = '__defense_log__';
const MAX_ENTRIES = 50;
let initialized = false;

interface LogEntry {
  ts: number;
  kind: 'error' | 'rejection' | 'auth';
  message: string;
  detail?: string;
}

function readBuffer(): LogEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeBuffer(entries: LogEntry[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    /* 忽略配额错误 */
  }
}

export function recordDefenseEvent(kind: LogEntry['kind'], message: string, detail?: unknown): void {
  const buf = readBuffer();
  buf.push({
    ts: Date.now(),
    kind,
    message: String(message).slice(0, 500),
    detail: detail == null ? undefined : safeStringify(detail).slice(0, 1000),
  });
  writeBuffer(buf);
}

function safeStringify(value: unknown): string {
  try {
    if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack ?? ''}`;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function getDefenseLog(): LogEntry[] {
  return readBuffer();
}

export function clearDefenseLog(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/**
 * 安装全局监听。仅在 RUNTIME / AUTH flag 任一开启时生效。
 * 不会重复挂载。
 */
export function installGlobalObservers(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  if (!DEFENSE_FLAGS.RUNTIME && !DEFENSE_FLAGS.AUTH) return;
  initialized = true;

  if (DEFENSE_FLAGS.RUNTIME) {
    window.addEventListener('error', (event) => {
      recordDefenseEvent('error', event.message ?? 'window.error', event.error);
    });
    window.addEventListener('unhandledrejection', (event) => {
      recordDefenseEvent('rejection', 'unhandledrejection', event.reason);
    });
  }

  if (DEFENSE_FLAGS.AUTH) {
    // 监听 storage 事件，捕获 supabase auth token 异常清空（可能是被攻击或多端踢出）
    window.addEventListener('storage', (event) => {
      if (!event.key) return;
      if (!event.key.includes('supabase.auth.token')) return;
      if (event.newValue === null && event.oldValue) {
        recordDefenseEvent('auth', 'auth-token-cleared', { key: event.key });
      }
    });
  }
}