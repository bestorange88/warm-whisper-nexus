import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, showBack = true, rightAction, className }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn("pt-safe flex shrink-0 items-center border-b border-stone-100 px-4 py-2.5", className)}>
      {showBack && (
        <button onClick={() => navigate(-1)} className="mr-3 text-stone-600 hover:text-stone-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-semibold text-stone-900">{title}</h1>
      {rightAction && <div className="ml-2">{rightAction}</div>}
    </header>
  );
}
