import { useUIStore } from '../../stores/uiStore';
import { AchievementToast } from '../gamification/AchievementToast';

export function AchievementToastContainer() {
  const { pendingAchievements, dismissAchievement } = useUIStore();

  if (pendingAchievements.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 right-0 z-[var(--z-toast)] flex max-w-[400px] flex-col gap-3 p-4 [&>*]:pointer-events-auto"
      aria-live="polite"
      aria-label="Achievement notifications"
    >
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
