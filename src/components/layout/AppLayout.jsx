import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from './ToastContainer';
import { AchievementToastContainer } from './AchievementToastContainer';
import styles from './AppLayout.module.css';

const LevelUpModal = lazy(() =>
  import('../gamification/LevelUpModal').then((m) => ({ default: m.LevelUpModal }))
);

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
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
