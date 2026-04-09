import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HMSRoomProvider } from '@100mslive/react-sdk';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { CallProvider } from '@/features/calling/CallProvider';
import { IncomingCallModal } from '@/features/calling/components/IncomingCallModal';
import { ActiveCallScreen } from '@/features/calling/components/ActiveCallScreen';
import { lazy, Suspense } from 'react';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoading />;
  if (!user) return <Navigate to="/login" replace />;
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

function AuthenticatedApp() {
  return (
    <HMSRoomProvider>
      <CallProvider>
        <Outlet />
        <IncomingCallModal />
        <ActiveCallScreen />
      </CallProvider>
    </HMSRoomProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="mx-auto h-[100dvh] w-full max-w-md bg-white shadow-xl">
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<PageSuspense><Login /></PageSuspense>} />
              <Route path="/register" element={<PageSuspense><Register /></PageSuspense>} />
            </Route>

            <Route path="/terms" element={<PageSuspense><Terms /></PageSuspense>} />
            <Route path="/privacy" element={<PageSuspense><Privacy /></PageSuspense>} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AuthenticatedApp />}>
                <Route element={<MobileLayout />}>
                  <Route path="/conversations" element={<PageSuspense><Conversations /></PageSuspense>} />
                  <Route path="/contacts" element={<PageSuspense><Contacts /></PageSuspense>} />
                  <Route path="/settings" element={<PageSuspense><Settings /></PageSuspense>} />
                </Route>

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

            <Route path="/" element={<Navigate to="/conversations" replace />} />
            <Route path="*" element={<Navigate to="/conversations" replace />} />
          </Routes>
        </div>
        <Toaster position="top-center" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
