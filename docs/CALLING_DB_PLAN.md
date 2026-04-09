# 通话数据库设计

## 新增表

### 1. call_sessions

记录每次通话会话的完整生命周期。

```sql
CREATE TABLE public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,        -- 关联的聊天会话
  caller_id UUID NOT NULL,              -- 发起方
  callee_id UUID NOT NULL,              -- 接听方
  call_type TEXT NOT NULL,              -- 'audio' | 'video'
  status TEXT NOT NULL DEFAULT 'initiated',
  -- status 值：initiated, ringing, accepted, rejected, cancelled, missed, ended, failed
  hms_room_id TEXT,                     -- 100ms 房间 ID
  started_at TIMESTAMPTZ,              -- 通话开始时间（accepted 时记录）
  accepted_at TIMESTAMPTZ,             -- 接听时间
  ended_at TIMESTAMPTZ,                -- 结束时间
  duration_seconds INTEGER DEFAULT 0,   -- 通话时长（秒）
  ended_by UUID,                        -- 谁挂断的
  end_reason TEXT,                      -- completed/rejected/cancelled/missed/failed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS 策略：**
- SELECT：caller 或 callee 可查看
- INSERT：仅 caller 可创建（实际由 Edge Function 创建）
- UPDATE：caller 或 callee 可更新

### 2. 为什么不需要 call_participants 表

一对一通话只有两个参与者（caller + callee），其信息已在 `call_sessions` 中完整记录。
独立的 participants 表适用于多人通话场景，当前不需要。

### 3. 为什么不需要 call_signals 表

使用 Supabase Realtime 监听 `call_sessions` 表的 `postgres_changes` 事件即可实现信令：
- 状态从 `initiated` → `ringing`：触发来电通知
- 状态从 `ringing` → `accepted`：触发接听
- 状态变为 `rejected/cancelled/ended`：触发结束

优势：
- 无需额外表和清理逻辑
- Realtime 延迟足够低（<500ms）
- 简化架构

## 通话消息集成

通话结束后，向 `messages` 表插入一条系统消息：

```json
{
  "conversation_id": "<conv_id>",
  "sender_id": "<caller_id>",
  "type": "system",
  "content": "[语音通话] 通话时长 02:14",
  "created_at": "<ended_at>"
}
```

消息格式：
| 场景 | content |
|------|---------|
| 正常结束 | `[语音通话] 通话时长 02:14` |
| 对方拒绝 | `[视频通话] 已拒绝` |
| 发起方取消 | `[语音通话] 已取消` |
| 未接听 | `[视频通话] 未接听` |
| 失败 | `[语音通话] 通话失败` |

## Realtime 配置

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
```

## 索引建议

```sql
CREATE INDEX idx_call_sessions_conversation ON call_sessions(conversation_id);
CREATE INDEX idx_call_sessions_callee_status ON call_sessions(callee_id, status);
CREATE INDEX idx_call_sessions_caller_status ON call_sessions(caller_id, status);
```
