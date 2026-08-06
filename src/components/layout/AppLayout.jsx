import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Ticker } from './Ticker';
import { MobileDock } from './MobileDock';
import { ToastContainer } from './ToastContainer';
import { AchievementToastContainer } from './AchievementToastContainer';
import Noise from '../reactbits/Noise/Noise';

const LevelUpModal = lazy(() =>
  import('../gamification/LevelUpModal').then((m) => ({ default: m.LevelUpModal }))
);

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-[var(--z-sticky)]">
        <Ticker />
        <Header />
      </div>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-5 md:px-6 md:py-6 max-md:pb-28">
        <Outlet />
      </main>
      <MobileDock />
      <ToastContainer />
      <AchievementToastContainer />
      <Suspense fallback={null}>
        <LevelUpModal />
      </Suspense>
      <Noise patternAlpha={12} />
    </div>
  );
}
