/**
 * 内存级节流（防误点 / 防暴力提交）。
 *
 * 用途：登录、发送好友请求、举报提交、敏感操作确认等。
 * 严禁用于消息收发主链路（性能影响 + 改业务）。
 */

import { DEFENSE_FLAGS } from './flags';

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** 最大令牌数（突发上限） */
  capacity: number;
  /** 每秒补充令牌数 */
  refillPerSecond: number;
}

/**
 * 取走一个令牌，返回是否允许执行。
 * 关闭 INPUT flag 时永远 true。
 */
export function allow(key: string, options: RateLimitOptions): boolean {
  if (!DEFENSE_FLAGS.INPUT) return true;
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: options.capacity, updatedAt: now };

  const elapsedSec = (now - bucket.updatedAt) / 1000;
  const refilled = Math.min(options.capacity, bucket.tokens + elapsedSec * options.refillPerSecond);

  if (refilled < 1) {
    bucket.tokens = refilled;
    bucket.updatedAt = now;
    buckets.set(key, bucket);
    return false;
  }

  bucket.tokens = refilled - 1;
  bucket.updatedAt = now;
  buckets.set(key, bucket);
  return true;
}

/** 仅供测试/紧急清理使用 */
export function _resetRateLimits(): void {
  buckets.clear();
}