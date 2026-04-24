# Devin / AI 防御层约束（不可越界）

本文件记录【安全防御门禁升级模式】的硬性约束。任何 AI 会话在动手前都必须先读取本文件、`GUARDRAILS.md` 与 `FREEZE_DEFENSE.md`。

## 🚫 红线（不可触碰）
1. 严禁回滚已合并到生产分支的代码（包括 git reset / revert / checkout 旧 commit）。
2. 严禁重构以下核心业务模块的内部逻辑：
   - `src/hooks/useAuth.ts`
   - `src/hooks/useConversations.ts`
   - `src/hooks/useContacts.ts`
   - `src/pages/Login.tsx` / `src/pages/Register.tsx`
   - `src/pages/ChatDetail.tsx` 的消息发送/接收路径
   - `src/features/calling/**` 的状态机与信令
3. 严禁修改 `supabase/migrations/**` 已存在的迁移文件，新增请使用新 migration。
4. 严禁删除/重命名已发布的 Edge Function。
5. 严禁更改 `src/integrations/supabase/client.ts`、`types.ts`、`.env`。

## ✅ 防御层允许范围（仅新增）
1. 在 `src/lib/defense/**` 下新增工具：sanitize、节流、监听、日志旁路。
2. 在 `src/components/defense/**` 下新增组件：ErrorBoundary、降级 UI、确认对话框。
3. 在 `codemagic.yaml` 中追加 pre-build 守卫脚本（不得移除已有步骤）。
4. 在 `.devin/`、`FREEZE_*.md`、`GUARDRAILS.md` 中追加规则。

## 🔧 必须满足
- 最小侵入：业务文件改动 ≤ 5 行，且仅作为防御挂载点。
- 可开关：通过 `import.meta.env.VITE_DEFENSE_*` 控制，关闭后行为完全等价于改动前。
- 可回滚：每个新增文件可被单独删除而不破坏构建。
- 不引入新的运行时依赖（npm install）。

## 🔁 回滚指引（人工执行，禁止 AI 自动触发）
1. 关闭对应 `VITE_DEFENSE_*` 开关 → 行为立即恢复到改动前。
2. 如需彻底移除，按 `FREEZE_DEFENSE.md` 中 “可移除文件清单” 删除新增文件。
3. 业务代码挂载点（如 `main.tsx` 中的 `<DefenseRoot>` 包裹）可手动还原为改动前的两行。

## 📋 AI 行动检查表（每次会话开头）
- [ ] 已读 `.devin/constraints.md`
- [ ] 已读 `FREEZE_DEFENSE.md`
- [ ] 已读 `GUARDRAILS.md`
- [ ] 本次改动是否仅在 `src/lib/defense/**` 或 `src/components/defense/**` 或 `codemagic.yaml` 追加？
- [ ] 业务文件改动是否 ≤ 5 行且只是挂载防御组件？
- [ ] 是否提供了 feature flag？

任意一项为否，立即停止并向用户确认。