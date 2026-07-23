import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { PageSkeleton } from './components/ui/Skeleton';

// ── Lazy-loaded pages (code splitting) ──
const Auth = lazy(() => import('./pages/Auth'));
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

// ── Query Client ──
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

/**
 * Suspense wrapper with skeleton fallback for lazy-loaded route pages.
 */
function LazyPage({ Component }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
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
        <Routes>
          {/* ── Public Routes ── */}
          <Route
            path="/auth"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Auth />
              </Suspense>
            }
          />

          {/* ── Protected Routes (App Shell) ── */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<LazyPage Component={Home} />} />
            <Route path="markets" element={<LazyPage Component={Markets} />} />
            <Route path="markets/:id" element={<LazyPage Component={MarketDetail} />} />
            <Route path="community" element={<LazyPage Component={Community} />} />
            <Route path="community/propose" element={<LazyPage Component={CommunityPropose} />} />
            <Route path="leaderboard" element={<LazyPage Component={Leaderboard} />} />
            <Route path="profile/:username" element={<LazyPage Component={Profile} />} />
            <Route path="quests" element={<LazyPage Component={Quests} />} />
            <Route path="achievements" element={<LazyPage Component={Achievements} />} />
            <Route path="settings" element={<LazyPage Component={Settings} />} />

            {/* ── Admin Route (admin-only check) ── */}
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <LazyPage Component={Admin} />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ── Catch-all Redirect ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}