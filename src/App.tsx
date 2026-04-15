import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { CallProvider } from '@/features/calling/CallProvider';
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { lazy, Suspense } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// 懒加载通话组件（包含 100ms SDK ~188KB）
const LazyCallOverlay = lazy(() => import('@/features/calling/components/LazyCallOverlay'));

const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Conversations = lazy(() => import('@/pages/Conversations'));
const ChatDetail = lazy(() => import('@/pages/ChatDetail'));
const Contacts = lazy(() => import('@/pages/Contacts'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/Profile'));
const ProfileEdit = lazy(() => import('@/pages/ProfileEdit'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const Search = lazy(() => import('@/pages/Search'));
const FriendRequests = lazy(() => import('@/pages/FriendRequests'));
const AddFriend = lazy(() => import('@/pages/AddFriend'));
const CreateGroup = lazy(() => import('@/pages/CreateGroup'));
const GroupDetail = lazy(() => import('@/pages/GroupDetail'));
const ReportUser = lazy(() => import('@/pages/ReportUser'));
const ReportMessage = lazy(() => import('@/pages/ReportMessage'));
const PrivacySettings = lazy(() => import('@/pages/PrivacySettings'));
const NotificationSettings = lazy(() => import('@/pages/NotificationSettings'));
const BlockedUsers = lazy(() => import('@/pages/BlockedUsers'));
const DeleteAccount = lazy(() => import('@/pages/DeleteAccount'));
const Help = lazy(() => import('@/pages/Help'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const About = lazy(() => import('@/pages/About'));
const TermsConsent = lazy(() => import('@/pages/TermsConsent'));

const TERMS_VERSION = '2026-04-15';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 10,
    },
  },
});

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoading />;
  if (!user) return <Navigate to="/login" replace />;

  const hasAcceptedTerms =
    user.user_metadata?.terms_version === TERMS_VERSION &&
    Boolean(user.user_metadata?.terms_accepted_at);

  if (!hasAcceptedTerms && location.pathname !== '/terms-consent') {
    return <Navigate to="/terms-consent" replace />;
  }

  if (hasAcceptedTerms && location.pathname === '/terms-consent') {
    return <Navigate to="/conversations" replace />;
  }

  return <Outlet />;
}

function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoading />;
  if (user) return <Navigate to="/conversations" replace />;
  return <Outlet />;
}

function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<FullPageLoading />}>{children}</Suspense>;
}

function GlobalNotificationListener() {
  useGlobalNotifications();
  usePushNotifications();
  return null;
}

function AuthenticatedApp() {
  return (
    <CallProvider>
      <Outlet />
      {/* 100ms SDK 仅在通话活跃时加载 */}
      <Suspense fallback={null}>
        <LazyCallOverlay />
      </Suspense>
      <GlobalNotificationListener />
    </CallProvider>
  );
}

/** 响应式布局选择器：md+ 使用双栏布局，否则使用手机底部标签栏 */
function ResponsiveShell() {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return <DesktopLayout />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="mx-auto h-[100dvh] w-full max-w-lg bg-background shadow-xl md:max-w-none">
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<PageSuspense><Login /></PageSuspense>} />
              <Route path="/register" element={<PageSuspense><Register /></PageSuspense>} />
            </Route>

            <Route path="/terms" element={<PageSuspense><Terms /></PageSuspense>} />
            <Route path="/privacy" element={<PageSuspense><Privacy /></PageSuspense>} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AuthenticatedApp />}>
                <Route path="/terms-consent" element={<PageSuspense><TermsConsent /></PageSuspense>} />
                <Route element={<ResponsiveShell />}>
                  {/* 手机端：MobileLayout 包裹列表页 */}
                  <Route element={<MobileLayout />}>
                    <Route path="/conversations" element={<PageSuspense><Conversations /></PageSuspense>} />
                    <Route path="/contacts" element={<PageSuspense><Contacts /></PageSuspense>} />
                    <Route path="/settings" element={<PageSuspense><Settings /></PageSuspense>} />
                  </Route>

                  {/* 详情页：手机端全屏，桌面端显示在右侧面板 */}
                  <Route path="/chat/:conversationId" element={<PageSuspense><ChatDetail /></PageSuspense>} />
                  <Route path="/chat/new" element={<PageSuspense><ChatDetail /></PageSuspense>} />
                  <Route path="/profile" element={<PageSuspense><Profile /></PageSuspense>} />
                  <Route path="/profile/edit" element={<PageSuspense><ProfileEdit /></PageSuspense>} />
                  <Route path="/profile/:userId" element={<PageSuspense><UserProfile /></PageSuspense>} />
                  <Route path="/search" element={<PageSuspense><Search /></PageSuspense>} />
                  <Route path="/friend-requests" element={<PageSuspense><FriendRequests /></PageSuspense>} />
                  <Route path="/add-friend" element={<PageSuspense><AddFriend /></PageSuspense>} />
                  <Route path="/create-group" element={<PageSuspense><CreateGroup /></PageSuspense>} />
                  <Route path="/group/:conversationId" element={<PageSuspense><GroupDetail /></PageSuspense>} />
                  <Route path="/report/user/:userId" element={<PageSuspense><ReportUser /></PageSuspense>} />
                  <Route path="/report/message/:messageId" element={<PageSuspense><ReportMessage /></PageSuspense>} />
                  <Route path="/settings/privacy" element={<PageSuspense><PrivacySettings /></PageSuspense>} />
                  <Route path="/settings/notifications" element={<PageSuspense><NotificationSettings /></PageSuspense>} />
                  <Route path="/settings/blocked" element={<PageSuspense><BlockedUsers /></PageSuspense>} />
                  <Route path="/settings/delete-account" element={<PageSuspense><DeleteAccount /></PageSuspense>} />
                  <Route path="/settings/help" element={<PageSuspense><Help /></PageSuspense>} />
                  <Route path="/settings/about" element={<PageSuspense><About /></PageSuspense>} />
                </Route>
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/conversations" replace />} />
            <Route path="*" element={<Navigate to="/conversations" replace />} />
          </Routes>
        </div>
        <Toaster position="top-center" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
