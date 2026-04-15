import { Outlet, useNavigate, useLocation, useMatch } from 'react-router-dom';
import { MessageCircle, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useFriendRequests } from '@/hooks/useContacts';
import { useConversations } from '@/hooks/useConversations';
import { lazy, Suspense } from 'react';
import { FullPageLoading } from '@/components/common/LoadingSpinner';

const Conversations = lazy(() => import('@/pages/Conversations'));
const Contacts = lazy(() => import('@/pages/Contacts'));
const SettingsPage = lazy(() => import('@/pages/Settings'));

const tabs = [
  { key: 'conversations', path: '/conversations', icon: MessageCircle },
  { key: 'contacts', path: '/contacts', icon: Users },
  { key: 'settings', path: '/settings', icon: Settings },
] as const;

function SidebarContent({ activeTab }: { activeTab: string }) {
  return (
    <Suspense fallback={<FullPageLoading />}>
      {activeTab === 'conversations' && <Conversations />}
      {activeTab === 'contacts' && <Contacts />}
      {activeTab === 'settings' && <SettingsPage />}
    </Suspense>
  );
}

export function DesktopLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: pendingRequests } = useFriendRequests(user?.id);
  const pendingCount = pendingRequests?.length ?? 0;
  const { data: conversations } = useConversations(user?.id);
  const totalUnread = (conversations ?? []).reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  const activeTab = (() => {
    const p = location.pathname;
    if (p.startsWith('/chat') || p === '/conversations') return 'conversations';
    if (p.startsWith('/contacts') || p.startsWith('/add-friend') || p.startsWith('/friend-requests') || p.startsWith('/search')) return 'contacts';
    if (p.startsWith('/settings') || p.startsWith('/profile')) return 'settings';
    return 'conversations';
  })();

  const isListRoute = ['/conversations', '/contacts', '/settings'].includes(location.pathname);

  const navLabels: Record<string, string> = {
    conversations: t('nav.messages'),
    contacts: t('nav.contacts'),
    settings: t('nav.settings'),
  };

  return (
    <div className="flex h-full">
      {/* 左侧边栏 */}
      <div className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card">
        <header className="flex h-12 shrink-0 items-center border-b border-border px-4">
          <h1 className="text-lg font-semibold text-foreground">{t('app.name')}</h1>
        </header>

        <nav className="flex shrink-0 border-b border-border">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                  isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" fill={isActive ? 'currentColor' : 'none'} />
                  {tab.key === 'contacts' && pendingCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                  {tab.key === 'conversations' && totalUnread > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </span>
                <span>{navLabels[tab.key]}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-hidden">
          <SidebarContent activeTab={activeTab} />
        </div>
      </div>

      {/* 右侧内容面板 */}
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
        {isListRoute ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p className="text-sm">{t('chat.selectConversation')}</p>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}
