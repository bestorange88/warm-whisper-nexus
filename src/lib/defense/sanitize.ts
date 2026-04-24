/**
 * 输入净化工具集（旁路使用，不修改既有消息流）。
 *
 * 关键约束：
 * - 全部为纯函数，无副作用。
 * - 关闭 INPUT flag 时返回原值，便于一键回退。
 * - 不依赖 DOMPurify 等第三方包，避免引入新依赖。
 */

import { DEFENSE_FLAGS } from './flags';

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u2060]/g;
const CONTROL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * 移除零宽字符与控制字符，保留正常换行 \n \r \t。
 * 用途：注册用户名、个人简介、群名、消息文本等。
 */
export function stripInvisible(input: string): string {
  if (!DEFENSE_FLAGS.INPUT) return input;
  if (typeof input !== 'string') return input;
  return input.replace(ZERO_WIDTH, '').replace(CONTROL, '');
}

/**
 * 收紧空白：合并连续空白为单个空格，去掉首尾空白。
 * 仅用于短文本字段（用户名、群名）。
 */
export function collapseWhitespace(input: string): string {
  if (!DEFENSE_FLAGS.INPUT) return input;
  return stripInvisible(input).replace(/\s+/g, ' ').trim();
}

/**
 * 限制长度，超出截断（按 code unit 计算）。
 * 永不抛错，便于在表单 onChange 中安全使用。
 */
export function clampLength(input: string, max: number): string {
  if (typeof input !== 'string') return input;
  if (input.length <= max) return input;
  return input.slice(0, max);
}

/**
 * 校验 URL 是否安全（仅允许 http/https/mailto）。
 * 拒绝 javascript:、data:、file: 等危险协议。
 */
export function isSafeUrl(raw: string): boolean {
  if (!DEFENSE_FLAGS.INPUT) return true;
  if (typeof raw !== 'string' || !raw) return false;
  try {
    const url = new URL(raw, window.location.origin);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * 转义 HTML 关键字符，仅在需要 innerHTML 拼接时使用。
 * 业务消息渲染走 React 即可，本函数为防御兜底。
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}