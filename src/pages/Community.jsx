import { useAuthStore } from '../stores/authStore';
import { getUnlockedFeatures } from '../lib/levels';
import { Lock } from 'lucide-react';
import styles from './Community.module.css';

/**
 * Community — Browse community proposals and approved markets.
 * Has tabs for Live Markets and Pending Proposals.
 * Voting requires Level 3+.
 */
export default function Community() {
  const user = useAuthStore(s => s.user);
  const userLevel = user?.level || 1;
  const unlocked = getUnlockedFeatures(userLevel);
  const canVote = unlocked.some(f => f.includes('Vote'));

  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Community Markets</h1>

      {!canVote && (
        <div className={styles.locked}>
          <Lock size={20} />
          <div>
            <p className="text-sm font-heading">Voting Locked</p>
            <p className="text-xs text-muted">Unlock at Level 3 — Vote on community proposals</p>
          </div>
        </div>
      )}

      <p className="text-muted">Browse proposals and community markets — coming soon</p>
    </div>
  );
}
