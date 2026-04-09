# Archimi Chat 开发日志

## 2026-04-09 (下午) - 100ms 音视频通话
- 输出7份设计文档（架构、状态机、数据库、UI流程、iOS权限、审核计划、V1限制）
- 创建 call_sessions 表 + RLS + Realtime + 索引
- 部署 call-session Edge Function（create/join/end）
- 安装 @100mslive/react-sdk
- 实现通话状态机 (callStateMachine.ts)
- 实现 CallProvider 全局 Context + Realtime 监听
- 实现来电弹层 IncomingCallModal
- 实现通话界面 ActiveCallScreen（静音/摄像头/挂断）
- 实现通话消息渲染 CallMessageRenderer
- ChatDetail 集成通话按钮（仅单聊显示）
- App.tsx 包裹 CallProvider + 全局通话覆盖层

## 2026-04-09
- 项目初始化，从 GitHub 克隆代码并配置
- 关闭密码泄露检测(HIBP)，注册密码仅需大于6位
- 启用邮箱自动确认(auto_confirm_email)，注册后无需验证邮箱
- 修复已注册用户因邮箱未确认无法登录的问题（批量确认所有未验证账户）
- 创建项目记忆文件、开发日志、门禁规范
- 修复 conversations 表 RLS 策略错误引用（conversation_members.id → conversations.id）
- 添加外键约束：messages.sender_id, conversation_members.user_id, friendships, friend_requests
- 启用 messages 表 Supabase Realtime 实时推送
- 完善 useConversations：获取对方用户信息、最后消息、未读计数
- 添加 useFindOrCreateDirectChat hook：查找或创建私聊会话
- ChatDetail 页面：显示对方用户名/头像，自动标记已读
- Contacts 页面：添加聊天按钮，修复路由一致性
- UserProfile 页面：发送消息按钮改为查找/创建私聊会话
- 实时消息：通过 postgres_changes 订阅自动刷新消息列表
