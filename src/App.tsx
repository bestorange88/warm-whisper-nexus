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

function PS({ children }: { children: React.ReactNode }) {
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
      <Suspense fallback={null}>
        <LazyCallOverlay />
      </Suspense>
      <GlobalNotificationListener />
    </CallProvider>
  );
}

/** 响应式布局壳：md+ 桌面双栏，否则直接透传 */
function ResponsiveShell() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  return isDesktop ? <DesktopLayout /> : <Outlet />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="mx-auto h-[100dvh] w-full max-w-lg bg-background shadow-xl md:max-w-none">
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<PS><Login /></PS>} />
              <Route path="/register" element={<PS><Register /></PS>} />
            </Route>

            <Route path="/terms" element={<PS><Terms /></PS>} />
            <Route path="/privacy" element={<PS><Privacy /></PS>} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AuthenticatedApp />}>
                <Route path="/terms-consent" element={<PS><TermsConsent /></PS>} />

                <Route element={<ResponsiveShell />}>
                  {/* 手机端列表页 — 桌面端由 DesktopLayout 侧边栏直接渲染 */}
                  <Route element={<MobileLayout />}>
                    <Route path="/conversations" element={<PS><Conversations /></PS>} />
                    <Route path="/contacts" element={<PS><Contacts /></PS>} />
                    <Route path="/settings" element={<PS><Settings /></PS>} />
                  </Route>

                  {/* 详情页 — 桌面端显示在右侧面板 */}
                  <Route path="/chat/:conversationId" element={<PS><ChatDetail /></PS>} />
                  <Route path="/chat/new" element={<PS><ChatDetail /></PS>} />
                  <Route path="/profile" element={<PS><Profile /></PS>} />
                  <Route path="/profile/edit" element={<PS><ProfileEdit /></PS>} />
                  <Route path="/profile/:userId" element={<PS><UserProfile /></PS>} />
                  <Route path="/search" element={<PS><Search /></PS>} />
                  <Route path="/friend-requests" element={<PS><FriendRequests /></PS>} />
                  <Route path="/add-friend" element={<PS><AddFriend /></PS>} />
                  <Route path="/create-group" element={<PS><CreateGroup /></PS>} />
                  <Route path="/group/:conversationId" element={<PS><GroupDetail /></PS>} />
                  <Route path="/report/user/:userId" element={<PS><ReportUser /></PS>} />
                  <Route path="/report/message/:messageId" element={<PS><ReportMessage /></PS>} />
                  <Route path="/settings/privacy" element={<PS><PrivacySettings /></PS>} />
                  <Route path="/settings/notifications" element={<PS><NotificationSettings /></PS>} />
                  <Route path="/settings/blocked" element={<PS><BlockedUsers /></PS>} />
                  <Route path="/settings/delete-account" element={<PS><DeleteAccount /></PS>} />
                  <Route path="/settings/help" element={<PS><Help /></PS>} />
                  <Route path="/settings/about" element={<PS><About /></PS>} />
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
