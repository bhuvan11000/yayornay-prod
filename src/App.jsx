import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { PageSkeleton } from './components/ui/Skeleton';
import { PageTransition } from './components/ui/PageTransition';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { useUserRealtime } from './hooks/useRealtime';

const Auth = lazy(() => import('./pages/Auth'));
const Home = lazy(() => import('./pages/Home'));
const Markets = lazy(() => import('./pages/Markets'));
const MarketDetail = lazy(() => import('./pages/MarketDetail'));
const Community = lazy(() => import('./pages/Community'));
const CommunityPropose = lazy(() => import('./pages/CommunityPropose'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Quests = lazy(() => import('./pages/Quests'));
const MyPredictions = lazy(() => import('./pages/MyPredictions'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

function LazyPage({ Component }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ErrorBoundary>
        <PageTransition>
          <Component />
        </PageTransition>
      </ErrorBoundary>
    </Suspense>
  );
}

function AppRoutes() {
  const location = useLocation();
  useUserRealtime();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/auth"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ErrorBoundary>
                <PageTransition>
                  <Auth />
                </PageTransition>
              </ErrorBoundary>
            </Suspense>
          }
        />

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
          <Route path="my-predictions" element={<LazyPage Component={MyPredictions} />} />
          <Route path="settings" element={<LazyPage Component={Settings} />} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
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
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
