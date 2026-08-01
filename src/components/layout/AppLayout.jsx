import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from './ToastContainer';
import { AchievementToastContainer } from './AchievementToastContainer';

const LevelUpModal = lazy(() =>
  import('../gamification/LevelUpModal').then((m) => ({ default: m.LevelUpModal }))
);

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 animate-[fadeIn_0.2s_ease] px-6 py-6 max-md:px-4 max-md:py-4 md:py-5 lg:py-6">
        <Outlet />
      </main>
      <ToastContainer />
      <AchievementToastContainer />
      <Suspense fallback={null}>
        <LevelUpModal />
      </Suspense>
    </div>
  );
}
