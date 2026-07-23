import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './stores/authStore';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Markets = lazy(() => import('./pages/Markets'));
const MarketDetail = lazy(() => import('./pages/MarketDetail'));
const Community = lazy(() => import('./pages/Community'));
const CommunityPropose = lazy(() => import('./pages/CommunityPropose'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Quests = lazy(() => import('./pages/Quests'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const Auth = lazy(() => import('./pages/Auth'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      color: 'var(--text-muted)',
    }}>
      Loading...
    </div>
  );
}

/**
 * Protected route wrapper.
 * Redirects to /auth if not logged in.
 */
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (adminOnly && user.email !== import.meta.env.VITE_ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * App layout wrapper with header.
 * TODO: Add Header component with nav, coin balance, rank badge, avatar.
 */
function AppLayout({ children }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      {/* TODO: Add Header component */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-6)',
        background: 'var(--bg-secondary)',
      }}>
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-6)',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Predict Arena</span>
          <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
            Header nav links coming soon
          </span>
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes with app layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Home />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/markets/:id" element={<MarketDetail />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/propose" element={<CommunityPropose />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Admin-only route */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AppLayout><Admin /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
