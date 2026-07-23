import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { PageSkeleton } from '../ui/Skeleton';
import styles from './ProtectedRoute.module.css';

/**
 * ProtectedRoute — Auth guard wrapper.
 *
 * - If still loading auth state, renders a full-page skeleton.
 * - If not authenticated, redirects to /auth.
 * - If authenticated, renders children.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.adminOnly=false] - If true, checks admin email
 */
export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <PageSkeleton />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (adminOnly && user.email !== import.meta.env.VITE_ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  return children;
}
