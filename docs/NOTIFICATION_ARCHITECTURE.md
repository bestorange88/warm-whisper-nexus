# 通知架构 — 阿基米●聊 / Archimi Chat

## 三层通知体系

```
┌─────────────────────────────────────────────────┐
│  第一层：应用内通知（v1 首发）                      │
│  ├── Supabase Realtime 事件驱动                   │
│  ├── 会话未读计数 / 红点                           │
│  ├── 应用内 toast 提示 (sonner)                    │
│  └── 来电弹窗 (IncomingCallModal)                 │
├─────────────────────────────────────────────────┤
│  第二层：移动端系统通知（v2 规划）                   │
│  ├── Capacitor Push Notifications 插件             │
│  ├── iOS → APNs                                   │
│  ├── Android → FCM                                │
│  └── 后端 Edge Function 统一发送                   │
├─────────────────────────────────────────────────┤
│  第三层：浏览器 Web Push（v3 可选）                  │
│  ├── PWA + Service Worker                         │
│  ├── VAPID key pair                               │
│  ├── PushManager.subscribe()                      │
│  └── web-push 库 (Edge Function)                  │
└─────────────────────────────────────────────────┘
```

## 各层边界说明

### 第一层 — 应用内通知

- **触发源**：Supabase Realtime postgres_changes / broadcast
- **展示方式**：toast、未读 badge、来电弹窗
- **依赖**：仅 Supabase JS SDK，无额外配置
- **限制**：仅在 App 前台有效

### 第二层 — 移动端系统通知

- **触发源**：后端 Edge Function 调用 APNs/FCM API
- **依赖**：Capacitor `@capacitor/push-notifications`、APNs 证书、FCM server key
- **与 VAPID 无关**：这是原生推送协议，不使用 Web Push 标准

### 第三层 — 浏览器 Web Push

- **触发源**：后端 Edge Function 使用 `web-push` 库
- **依赖**：VAPID key pair、Service Worker、`push_subscriptions` 表
- **使用场景**：仅 PWA / 桌面浏览器

## 技术无关性声明

| 技术 | 是否需要 VAPID |
|------|---------------|
| 100ms 音视频通话 | ❌ |
| Supabase Realtime | ❌ |
| 应用内即时消息 | ❌ |
| Capacitor 原生推送 (APNs/FCM) | ❌ |
| 浏览器 Web Push | ✅ 仅此需要 |

## 数据流

```
新消息 → Supabase INSERT → Realtime 广播
                         ↓
              ┌──────────┴──────────┐
              │                     │
         用户在线               用户离线
         (前台)                (后台/锁屏)
              │                     │
        应用内 toast          第二层/第三层推送
        未读 badge            (根据平台选择)
```
