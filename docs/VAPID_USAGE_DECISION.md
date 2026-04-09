# VAPID 使用决策

## 结论：当前项目 **不需要** VAPID

### 审计结果（2026-04-09）

| 检查项 | 结果 |
|--------|------|
| PWA (manifest / service worker) | ❌ 无 |
| 浏览器 Push Notification (PushManager) | ❌ 无 |
| Service Worker 消息推送 | ❌ 无 |
| Web Push 订阅逻辑 | ❌ 无 |
| `web-push` npm 依赖 | ❌ 无 |
| VAPID 环境变量引用 | ❌ 无 |
| 前端 `PushManager.subscribe` | ❌ 无 |
| push_subscriptions 表 | ✅ 已创建，但无前后端代码使用 |

### 原因

1. **首发目标平台是 iOS/Android（Capacitor）**，原生推送走 APNs/FCM，不需要 VAPID。
2. **当前无 PWA 实现**，浏览器 Web Push 无使用场景。
3. **应用内通知** 通过 Supabase Realtime + 前台 toast 即可满足。
4. **100ms 通话** 和 **Supabase Realtime** 均不依赖 VAPID。

### push_subscriptions 表处置

该表已创建，保留不删除。后续启用 Web Push 时可直接使用，不影响当前开发。

### 未来接入 Web Push 的路径

1. 生成 VAPID key pair（`web-push generate-vapid-keys`）
2. 将 `VAPID_PRIVATE_KEY` 存入后端 secrets
3. 将 `VAPID_PUBLIC_KEY` 存入前端环境变量
4. 创建 Service Worker (`sw.js`) 处理 push 事件
5. 前端调用 `PushManager.subscribe()` 并上传订阅到 `push_subscriptions` 表
6. 创建 Edge Function 使用 `web-push` 库发送通知
7. 配置 `vite-plugin-pwa`（注意 Lovable 预览限制）
