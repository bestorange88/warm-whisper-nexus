import { type ReactNode } from 'react';
import { DefenseErrorBoundary } from './ErrorBoundary';

/**
 * 防御层根组件。
 * 业务侧仅需用 <DefenseRoot> 包裹应用根，无任何 props/状态注入。
 */
export function DefenseRoot({ children }: { children: ReactNode }) {
  return <DefenseErrorBoundary>{children}</DefenseErrorBoundary>;
}