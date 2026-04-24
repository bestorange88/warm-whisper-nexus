/**
 * iOS 原生视口适配：处理 Capacitor Keyboard 事件，将键盘高度写入 CSS 变量 --keyboard-h。
 * 同时配置 StatusBar 样式与背景色，保证安全区显示一致。
 * Web 端无副作用（Capacitor 插件在浏览器中静默失败）。
 */
import { Capacitor } from "@capacitor/core";

let initialized = false;

export async function initIosViewport() {
  if (initialized) return;
  initialized = true;

  // 仅在原生平台启用插件 API
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
    // native 模式下让 WebView 自动调整高度，body 内容会被压缩
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    // 输入框聚焦时不滚动到顶部，避免布局抖动
    await Keyboard.setScroll({ isDisabled: true });

    Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty("--keyboard-h", `${info.keyboardHeight}px`);
    });
    Keyboard.addListener("keyboardDidShow", (info) => {
      document.documentElement.style.setProperty("--keyboard-h", `${info.keyboardHeight}px`);
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-h", "0px");
    });
  } catch (err) {
    console.warn("[iosViewport] Keyboard 插件初始化失败", err);
  }

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // 状态栏覆盖在 WebView 之上，由我们的安全区 CSS 接管
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Default });
  } catch (err) {
    console.warn("[iosViewport] StatusBar 初始化失败", err);
  }
}