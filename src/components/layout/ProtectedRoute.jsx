import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { PageSkeleton } from '../ui/Skeleton';

/**
 * ProtectedRoute — Auth guard wrapper.
 *
 * - If still loading auth state, renders a full-page skeleton.
 * - If not authenticated, redirects to /auth.
 * - If authenticated, renders children.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageSkeleton />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
