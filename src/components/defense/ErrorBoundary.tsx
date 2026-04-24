import { Component, type ErrorInfo, type ReactNode } from 'react';
import { DEFENSE_FLAGS } from '@/lib/defense/flags';
import { recordDefenseEvent } from '@/lib/defense/observer';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * 顶层错误边界。
 * - 关闭 RUNTIME flag 时透传 children，等价于不存在。
 * - 不触碰业务状态，仅显示降级 UI 并允许刷新。
 */
export class DefenseErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    recordDefenseEvent('error', error.message, { stack: error.stack, component: info.componentStack });
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      /* noop */
    }
  };

  render() {
    if (!DEFENSE_FLAGS.RUNTIME) return this.props.children;
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 bg-background px-6 text-center"
      >
        <p className="text-base font-semibold text-foreground">应用出现异常</p>
        <p className="text-sm text-muted-foreground">已为你保留登录状态，请刷新重试。</p>
        <button
          type="button"
          onClick={this.handleReload}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          刷新页面
        </button>
      </div>
    );
  }
}