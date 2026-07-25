import { useUIStore } from '../../stores/uiStore';
import { AchievementToast } from '../gamification/AchievementToast';
import styles from './AchievementToastContainer.module.css';

export function AchievementToastContainer() {
  const { pendingAchievements, dismissAchievement } = useUIStore();

  if (pendingAchievements.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite" aria-label="Achievement notifications">
      {pendingAchievements.map((ach) => (
        <AchievementToast
          key={ach._toastId}
          achievement={ach}
          onDismiss={() => dismissAchievement(ach._toastId)}
        />
      ))}
    </div>
  );
}
