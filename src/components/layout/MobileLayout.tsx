import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME_ZH } from '@/lib/constants';

const navItems = [
  { path: '/conversations', icon: MessageCircle, label: '消息' },
  { path: '/contacts', icon: Users, label: '联系人' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export function MobileLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isMainRoute = navItems.some((item) => item.path === location.pathname);

  return (
    <div className="flex h-full flex-col bg-white">
      {isMainRoute && (
        <header className="safe-area-top flex h-12 shrink-0 items-center border-b border-stone-100 px-4">
          <h1 className="text-lg font-semibold text-stone-900">{APP_NAME_ZH}</h1>
        </header>
      )}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      {isMainRoute && (
        <nav className="safe-area-bottom flex shrink-0 border-t border-stone-100 bg-white">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                  isActive ? 'text-brand' : 'text-stone-400'
                )}
              >
                <Icon className="h-5 w-5" fill={isActive ? 'currentColor' : 'none'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
