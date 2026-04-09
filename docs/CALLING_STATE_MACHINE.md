# 通话状态机设计

## 状态定义

```typescript
type CallState =
  | 'idle'                    // 无通话
  | 'requesting_permissions'  // 请求麦克风/摄像头权限
  | 'creating_session'        // 创建通话会话中
  | 'dialing'                 // 呼叫中（等待对方响应）
  | 'incoming'                // 收到来电
  | 'connecting'              // 正在连接 100ms Room
  | 'connected'               // 通话中
  | 'reconnecting'            // 断网重连中
  | 'ended'                   // 通话已结束
  | 'failed';                 // 通话失败
```

## 状态转换图

```
                    ┌──────────────────┐
                    │      idle        │
                    └────┬────────┬────┘
                         │        │
              发起通话    │        │  收到来电
                         ▼        ▼
              ┌─────────────┐  ┌─────────┐
              │ requesting  │  │incoming │
              │ permissions │  │         │
              └──────┬──────┘  └────┬────┘
                     │              │
              权限通过 │     接听     │  拒绝
                     ▼              │    │
              ┌─────────────┐       │    │
              │  creating   │       │    │
              │  session    │       │    │
              └──────┬──────┘       │    │
                     │              │    │
                     ▼              │    │
              ┌─────────────┐       │    │
              │  dialing    │       │    │
              └──────┬──────┘       │    │
                     │              │    │
         对方接听     │              │    │
                     ▼              ▼    │
              ┌─────────────┐            │
              │ connecting  │◄───────────┘ (接听)
              └──────┬──────┘            │
                     │                   │
                     ▼                   │
              ┌─────────────┐            │
              │  connected  │            │
              └──────┬──────┘            │
                     │                   │
              ┌──────┴──────┐            │
              │             │            │
         断网  ▼        挂断 ▼            ▼
     ┌──────────────┐ ┌─────────┐  ┌─────────┐
     │reconnecting  │ │  ended  │  │  ended  │
     └──────┬───────┘ └─────────┘  └─────────┘
            │
     恢复 / 失败
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
┌──────────┐ ┌─────────┐
│connected │ │ failed  │
└──────────┘ └─────────┘
```

## 转换规则

| 当前状态 | 事件 | 下一状态 |
|---------|------|---------|
| idle | 用户点击通话 | requesting_permissions |
| idle | 收到来电信号 | incoming |
| requesting_permissions | 权限授予 | creating_session |
| requesting_permissions | 权限拒绝 | failed |
| creating_session | 会话创建成功 | dialing |
| creating_session | 创建失败 | failed |
| dialing | 对方接听 | connecting |
| dialing | 对方拒绝 | ended |
| dialing | 超时未接 | ended |
| dialing | 发起方取消 | ended |
| incoming | 用户接听 | connecting |
| incoming | 用户拒绝 | ended |
| incoming | 对方取消 | ended |
| connecting | 加入房间成功 | connected |
| connecting | 加入失败 | failed |
| connected | 任一方挂断 | ended |
| connected | 网络断开 | reconnecting |
| reconnecting | 恢复连接 | connected |
| reconnecting | 超时/失败 | failed |
| ended | - | idle（自动重置） |
| failed | - | idle（自动重置） |

## 结束原因

```typescript
type CallEndReason =
  | 'completed'      // 正常挂断
  | 'rejected'       // 对方拒绝
  | 'cancelled'      // 发起方取消
  | 'missed'         // 未接听（超时）
  | 'failed'         // 技术故障
  | 'permission_denied'; // 权限被拒
```

## 实现要求

1. 使用 `useReducer` 或 Zustand store 管理状态
2. 所有 UI 组件仅读取状态渲染，不自行维护通话状态
3. 状态转换必须通过 dispatch，禁止直接 setState
4. 超时机制：dialing 状态 60 秒无响应自动转 ended(missed)
5. 双端同步：通过 Supabase Realtime 监听 call_sessions 变更
