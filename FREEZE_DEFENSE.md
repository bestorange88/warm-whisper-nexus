# FREEZE_DEFENSE — 防御层冻结清单

本文件锁定 2026-04-24【安全防御门禁升级】交付的所有新增文件与挂载点。
任何 AI 在后续会话中：**只能新增不能删改**这些文件，除非用户明确解除冻结。

## 新增文件清单（防御层）
- `src/lib/defense/flags.ts`              — Feature flag 集中读取
- `src/lib/defense/sanitize.ts`           — 文本/URL 净化工具
- `src/lib/defense/rateLimit.ts`          — 内存级令牌桶/节流
- `src/lib/defense/observer.ts`           — 全局错误/拒绝/auth 异常旁路监听
- `src/lib/defense/index.ts`              — 统一入口，幂等初始化
- `src/components/defense/ErrorBoundary.tsx` — 顶层错误边界，降级 UI
- `src/components/defense/DefenseRoot.tsx`   — 包裹应用根，挂载所有防御能力
- `.devin/constraints.md`                 — 防御层硬约束
- `FREEZE_DEFENSE.md`                     — 本文件

## 业务挂载点（仅最小改动）
- `src/main.tsx`                          — 调用 `initDefense()` 一行
- `src/App.tsx`                           — 用 `<DefenseRoot>` 包裹根 `<QueryClientProvider>` 一处
- `codemagic.yaml`                        — 追加 secrets 扫描、依赖审计 pre-build 步骤

## Feature Flags（默认全开，可在 `.env` 关闭后等价回退）
| 变量 | 默认 | 作用 |
|------|------|------|
| `VITE_DEFENSE_RUNTIME` | `true` | ErrorBoundary + 全局未捕获异常上报 |
| `VITE_DEFENSE_INPUT`   | `true` | 输入 sanitize/校验工具的实际生效（关闭则透传） |
| `VITE_DEFENSE_AUTH`    | `true` | 登录/会话异常旁路监听 |
| `VITE_DEFENSE_BUILD`   | `true` | codemagic 构建守卫（在 yaml 内通过 grep 控制） |

## 可回滚步骤（人工，不得自动）
1. 在 Codemagic 环境变量中将对应 `VITE_DEFENSE_*` 设为 `false` → 行为等价回退。
2. 如需删除：按上方“新增文件清单”整体删除 + 还原 `main.tsx` / `App.tsx` 中的两个挂载点。
3. codemagic.yaml 中的守卫步骤可单独注释，不影响其他构建步骤。

## 验收标准
- 关闭所有 flag 后，`bun run build` 输出与冻结前等价（仅多出未执行的 import）。
- 登录、注册、消息收发、好友、通话流程在开/关防御下行为一致。
- 任何对清单内文件的“修改/删除”操作必须经用户书面同意。