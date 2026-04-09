# 通知策略 v1 — 阿基米●聊 / Archimi Chat

## 首发版本通知范围

### ✅ 首发支持（应用内）

| 通知类型 | 展示方式 | 触发条件 |
|----------|----------|----------|
| 新消息 | toast + 未读 badge | Realtime INSERT on messages |
| 来电 | 全屏来电弹窗 | Realtime UPDATE on call_sessions |
| 好友请求 | toast + 列表红点 | Realtime INSERT on friend_requests |
| 群组邀请 | toast | Realtime INSERT on conversation_members |

### ⏳ v2 规划（移动端系统通知）

| 通知类型 | 平台 | 技术 |
|----------|------|------|
| 新消息离线推送 | iOS | APNs via Capacitor |
| 新消息离线推送 | Android | FCM via Capacitor |
| 来电离线推送 | iOS/Android | APNs/FCM high-priority |

### 🔮 v3 可选（浏览器 Web Push）

- 仅在用户明确需要桌面浏览器通知时启用
- 需要 VAPID + Service Worker + PWA

## 权限策略

### Apple 审核友好原则

1. **不在启动时请求通知权限** — 用户完成注册/登录后再引导
2. **场景化引导** — 仅在用户首次收到消息或来电时，提示开启通知
3. **渐进式** — 先展示应用内通知价值，再请求系统权限
4. **可随时关闭** — 设置页提供细粒度控制

### 权限请求时机

```
用户注册成功
  → 不请求任何权限
  → 正常使用 App

收到第一条消息 / 来电
  → 应用内 toast 正常展示
  → 不弹系统权限请求

用户进入通知设置页
  → 展示"开启系统通知"开关
  → 用户主动开启时才请求权限
```

## 用户设置结构

```
通知设置
├── 新消息提醒
│   ├── 开关
│   ├── 声音
│   └── 消息预览
├── 通话提醒
│   ├── 开关
│   └── 振铃
├── 好友与群组
│   ├── 好友请求提醒
│   └── 群组邀请提醒
└── 高级
    ├── 免打扰时段
    └── 仅应用内提醒（禁用系统通知）
```

## 不做的事

- ❌ 不在 v1 接入 Web Push / VAPID
- ❌ 不在 v1 接入 APNs/FCM
- ❌ 不在启动时弹出权限请求
- ❌ 不发送营销/广告类通知
