# Archimi Chat 开发门禁规范

## 🚫 禁止操作（红线）
1. **不得修改** `src/integrations/supabase/client.ts` 和 `types.ts`（自动生成）
2. **不得修改** `.env` 文件（自动管理）
3. **不得回滚** 以下已确认的配置：
   - 密码策略：仅需大于6位，无HIBP检测
   - 邮箱自动确认：auto_confirm_email = true
   - 注册流程：用户名+邮箱+密码
4. **不得使用** 匿名注册（Anonymous Sign Up）
5. **不得在代码中** 硬编码私钥或敏感信息
6. **不得将角色存储在** profiles 表中（需单独 user_roles 表）

## ✅ 必须遵守
1. 所有新表必须启用 RLS 并添加策略
2. 使用语义化 Tailwind token，不直接使用颜色值
3. 数据库变更必须通过 migration 工具
4. 组件保持小而专注，避免大文件
5. 每次重大变更需更新 DEVELOPMENT_LOG.md

## 🔧 技术约定
- 导入 Supabase 客户端: `import { supabase } from "@/integrations/supabase/client"`
- 主色使用 CSS 变量而非硬编码
- 中文为主要界面语言，英文作为备选
