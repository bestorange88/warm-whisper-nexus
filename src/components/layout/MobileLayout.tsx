import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME_ZH } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useFriendRequests } from '@/hooks/useContacts';
import { useConversations } from '@/hooks/useConversations';

export function MobileLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: pendingRequests } = useFriendRequests(user?.id);
  const pendingCount = pendingRequests?.length ?? 0;
  const { data: conversations } = useConversations(user?.id);
  const totalUnread = (conversations ?? []).reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  const navItems = [
    { path: '/conversations', icon: MessageCircle, label: t('nav.messages') },
    { path: '/contacts', icon: Users, label: t('nav.contacts') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ];

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
                <span className="relative">
                  <Icon className="h-5 w-5" fill={isActive ? 'currentColor' : 'none'} />
                  {item.path === '/contacts' && pendingCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                  {item.path === '/conversations' && totalUnread > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
