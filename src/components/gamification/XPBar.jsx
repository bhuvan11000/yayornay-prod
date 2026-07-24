import { xpProgress } from '../../lib/levels';
import { formatXP } from '../../lib/format';
import styles from './XPBar.module.css';

export function XPBar({ xp, level, variant = 'full' }) {
  const progress = xpProgress(xp);
  const currentLevel = level || progress.currentLevel;
  const pct = Math.round(progress.progress * 100);

  return (
    <div className={`${styles.bar} ${styles[variant]}`}>
      {variant === 'full' && (
        <div className={styles.header}>
          <span className={styles.level}>Level {currentLevel}</span>
          <span className={styles.progressText}>
            {formatXP(progress.xpInLevel)} / {formatXP(progress.xpRequiredForNext)} XP
          </span>
        </div>
      )}
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${pct}%` }}
        />
      </div>
      {variant === 'mini' && (
        <span className={styles.miniLevel}>Lv.{currentLevel}</span>
      )}
    </div>
  );
}