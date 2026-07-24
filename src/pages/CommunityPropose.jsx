import { useAuthStore } from '../stores/authStore';
import { getUnlockedFeatures } from '../lib/levels';
import { Lock } from 'lucide-react';
import styles from './CommunityPropose.module.css';

/**
 * CommunityPropose — Form to submit a new community market proposal.
 * Requires minimum level 5 to access.
 */
export default function CommunityPropose() {
  const user = useAuthStore(s => s.user);
  const userLevel = user?.level || 1;
  const unlocked = getUnlockedFeatures(userLevel);
  const canPropose = unlocked.some(f => f.includes('Submit') || f.includes('Proposal'));

  if (!canPropose) {
    return (
      <div className={styles.page}>
        <div className={styles.locked}>
          <Lock size={24} />
          <div>
            <p className="text-lg font-heading">Proposals Locked</p>
            <p className="text-sm text-muted">Unlock at Level 5 — Submit community market proposals</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Propose a Market</h1>
      <p className="text-muted">Submit a new community prediction market — coming soon</p>
    </div>
  );
}
