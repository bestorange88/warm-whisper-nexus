/**
 * 前台通知反馈工具：提示音 + 浏览器系统通知 + 震动。
 *
 * - 提示音：用 Web Audio API 合成（无需音频资源），双音"叮咚"
 * - 浏览器通知：调用 Notification API，App 在后台标签时也能弹系统通知
 * - 震动：navigator.vibrate（iOS Safari 不支持，Android/原生 App 有效）
 *
 * 所有 API 都做了能力检测，缺失或未授权时静默降级，不会抛错。
 */

let audioCtx: AudioContext | null = null;
let lastSoundAt = 0;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * 播放短促的"叮"提示音。最短间隔 800ms，避免连续消息时声音重叠刺耳。
 */
export function playMessageSound(): void {
  const now = Date.now();
  if (now - lastSoundAt < 800) return;
  lastSoundAt = now;

  const ctx = getCtx();
  if (!ctx) return;

  try {
    // 双音"叮咚"：880Hz 然后 1175Hz，每段约 90ms
    [
      { freq: 880, start: 0, duration: 0.09 },
      { freq: 1175, start: 0.1, duration: 0.12 },
    ].forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    });
  } catch {
    /* 静默降级 */
  }
}

/**
 * 短震动反馈，仅在 Android / 原生 App 生效（iOS Safari 不支持）。
 */
export function vibrateShort(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(60);
    }
  } catch {
    /* 静默降级 */
  }
}

/* ====================== 浏览器系统通知 ====================== */

function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** 当前通知权限。`default` 表示尚未询问。 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * 请求浏览器系统通知权限。已授权则直接返回 true；不支持的环境返回 false。
 * 必须由用户手势触发（点击、聚焦），首次请求会弹浏览器原生授权框。
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

export interface SystemNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  /** 通知点击后跳转到这个路径（同源） */
  navigateTo?: string;
  /** 同 tag 通知会替换上一条，避免堆叠 */
  tag?: string;
}

/**
 * 弹出浏览器系统通知。仅在已授权 + 页面非可见时（用户切走或最小化）显示，
 * 避免用户正在看页面时还重复弹通知。
 */
export function showSystemNotification(opts: SystemNotificationOptions): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  // 页面可见时跳过——交给应用内 toast 即可
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;

  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      icon: opts.icon || '/app-icon.png',
      badge: '/app-icon.png',
      tag: opts.tag,
      // @ts-expect-error 部分浏览器支持
      renotify: !!opts.tag,
    });
    n.onclick = () => {
      try {
        window.focus();
        if (opts.navigateTo) {
          window.location.href = opts.navigateTo;
        }
      } finally {
        n.close();
      }
    };
  } catch {
    /* 静默降级 */
  }
}

/**
 * 一次性触发完整的"前台通知反馈"组合：提示音 + 震动 + 浏览器通知。
 */
export function notifyForeground(opts: SystemNotificationOptions): void {
  playMessageSound();
  vibrateShort();
  showSystemNotification(opts);
}