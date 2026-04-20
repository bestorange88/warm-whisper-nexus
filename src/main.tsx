import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App.tsx";
import "./index.css";

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

createRoot(document.getElementById("root")!).render(<App />);
