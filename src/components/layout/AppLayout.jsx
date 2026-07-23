import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from './ToastContainer';
import styles from './AppLayout.module.css';

/**
 * AppLayout — Persistent app shell wrapping all protected routes.
 *
 * Renders:
 * - Header with navigation, coin balance, rank badge
 * - Main content area via React Router Outlet
 * - Toast notification container
 */
export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}