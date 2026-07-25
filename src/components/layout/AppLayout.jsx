import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from './ToastContainer';
import { LevelUpModal } from '../gamification/LevelUpModal';
import { AchievementToastContainer } from './AchievementToastContainer';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <ToastContainer />
      <AchievementToastContainer />
      <LevelUpModal />
    </div>
  );
}
