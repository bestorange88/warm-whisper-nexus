# 通话架构设计：100ms 一对一音视频通话

## 1. 架构概览

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   User A    │◄───────►│  Supabase Cloud  │◄───────►│   User B    │
│  (Caller)   │         │                  │         │  (Callee)   │
└──────┬──────┘         │  - Realtime      │         └──────┬──────┘
       │                │  - Edge Functions │                │
       │                │  - Database       │                │
       │                └──────────────────┘                │
       │                                                     │
       │              ┌──────────────────┐                  │
       └─────────────►│   100ms Cloud    │◄─────────────────┘
                      │  (Audio/Video)   │
                      └──────────────────┘
```

## 2. 核心原则

- **通话是 IM 的附属能力**，不是独立会议系统
- **仅支持一对一**，不引入多人房间逻辑
- **安全优先**：100ms Token 仅由服务端签发
- **状态机驱动**：所有 UI 由统一状态机控制

## 3. 技术栈分工

| 层级 | 技术 | 职责 |
|------|------|------|
| 前端 | React + @100mslive/react-sdk | UI渲染、音视频流、用户交互 |
| 信令 | Supabase Realtime | 来电通知、状态同步、挂断信号 |
| 业务后端 | Supabase Edge Functions | Token签发、权限校验、会话管理 |
| 数据库 | Supabase PostgreSQL | call_sessions 记录、消息集成 |
| 音视频 | 100ms Cloud | WebRTC 媒体传输 |

## 4. 通话业务流程

### 4.1 发起通话
1. A 点击单聊页"语音/视频通话"按钮
2. 前端请求权限（麦克风/摄像头）
3. 前端调用 Edge Function `create-call-session`
4. Edge Function：
   - 校验 A 是否为该会话成员
   - 创建 `call_sessions` 记录 (status=initiated)
   - 创建 100ms Room（命名：`call_<convId>_<sessionId>`）
   - 为 A 生成 100ms auth token
   - 更新状态为 `ringing`
5. A 进入通话页面，等待接听
6. B 通过 Supabase Realtime 收到来电事件

### 4.2 接听通话
1. B 收到来电弹层
2. B 点击接听
3. 前端调用 Edge Function `join-call-session`
4. Edge Function：
   - 校验 B 是否为 callee
   - 校验 call_session 状态为 ringing
   - 为 B 生成 100ms auth token
   - 更新状态为 `accepted`
5. B 加入 100ms Room
6. 双方开始通话

### 4.3 结束通话
1. 任一方点击挂断
2. 前端离开 100ms Room
3. 调用 Edge Function `end-call-session`
4. Edge Function：
   - 更新 call_session 状态为 `ended`
   - 计算通话时长
   - 插入系统消息到聊天记录

## 5. 信令设计（Supabase Realtime）

使用 `call_sessions` 表的 `postgres_changes` 事件进行信令：

| 事件 | 触发条件 | 接收方 |
|------|---------|--------|
| 来电 | status: initiated → ringing | Callee |
| 已接听 | status: ringing → accepted | Caller |
| 已拒绝 | status: ringing → rejected | Caller |
| 已取消 | status: ringing → cancelled | Callee |
| 已结束 | status: accepted → ended | 双方 |

## 6. 100ms 集成

### 房间策略
- 房间命名：`call_<conversationId>_<callSessionId>`
- 仅两个角色：`caller`, `callee`
- 每个房间最多 2 人

### Token 签发
- 通过 Edge Function 使用 100ms Management Token（JWT）签发
- 所需密钥：`HMS_ACCESS_KEY`, `HMS_APP_SECRET`
- Token 中包含：room_id, user_id, role

## 7. 安全要求

- ✅ 100ms 密钥仅存在于 Edge Function 环境变量
- ✅ 每次 Token 签发校验用户身份和会话成员资格
- ✅ 已结束的通话不可重复加入
- ✅ 非参与者无法获取房间 Token
- ❌ 前端不持有任何管理密钥
