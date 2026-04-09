# Archimi Chat 项目记忆

## 项目概述
- **名称**: Archimi Chat / 阿基米●聊
- **标语**: 安全连接，畅快沟通
- **技术栈**: React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + Lovable Cloud (Supabase)
- **Lovable 项目 ID**: b97bc21c-1df9-48d4-b0f4-9f1416c25982

## 核心配置决策（不可回滚）
1. **密码策略**: 仅要求大于6位，已关闭HIBP密码泄露检测
2. **邮箱确认**: 已启用auto_confirm_email，注册后直接可登录
3. **注册流程**: 用户名 + 邮箱 + 密码，简化流程

## 数据库表结构
- profiles: 用户资料
- conversations: 会话
- conversation_members: 会话成员
- messages: 消息
- friendships: 好友关系
- friend_requests: 好友请求
- blocks: 拉黑
- reports / report_reasons: 举报
- account_deletion_requests: 账户删除请求

## 主题色
- 主色: #F97316 (橙色)
- 深色: #EA580C
- 浅色: #FFF7ED

## 已知问题与注意事项
- 所有表已启用 RLS，操作需要认证用户
- profiles 表通过触发器在用户注册时自动创建
