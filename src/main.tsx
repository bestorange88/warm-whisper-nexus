import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App.tsx";
import "./index.css";
import { initIosViewport } from "./lib/native/iosViewport";
import { initDefense } from "./lib/defense";

// 部署后旧版 chunk hash 失效会导致动态导入失败，自动刷新加载最新版本
const RELOAD_FLAG = "__chunk_reload_attempted__";
function isChunkLoadError(reason: unknown): boolean {
  const msg = reason instanceof Error ? reason.message : String(reason ?? "");
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg)
  );
}
function handleChunkError(reason: unknown) {
  if (!isChunkLoadError(reason)) return;
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
}
window.addEventListener("error", (e) => handleChunkError(e.error ?? e.message));
window.addEventListener("unhandledrejection", (e) => handleChunkError(e.reason));
// 页面成功加载后清除标记，允许下次部署再次自动刷新
window.addEventListener("load", () => sessionStorage.removeItem(RELOAD_FLAG));

// 原生平台初始化键盘 + 状态栏适配
initIosViewport();

// 防御层初始化（幂等；关闭 VITE_DEFENSE_* 后等价 no-op）
initDefense();

createRoot(document.getElementById("root")!).render(<App />);
