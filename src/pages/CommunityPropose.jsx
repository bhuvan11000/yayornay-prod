import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { ProposeForm } from '../components/community/ProposeForm';

export default function CommunityPropose() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userLevel = user?.level || 1;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        onClick={() => navigate('/community')}
      >
        <ArrowLeft size={16} />
        Back to Community
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-heading">Propose a Market</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Create a new prediction market for the community to vote on.
          {userLevel < 3 && (
            <span className="ml-1 text-[var(--color-warning)]">
              You need Level 3 to propose (currently Level {userLevel})
            </span>
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <ProposeForm onSuccess={() => navigate('/community')} />
      </div>
    </div>
  );
}
