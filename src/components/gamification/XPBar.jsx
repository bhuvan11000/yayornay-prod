import { xpProgress } from '../../lib/levels';
import { formatXP } from '../../lib/format';

export function XPBar({ xp, level, variant = 'full' }) {
  const progress = xpProgress(xp);
  const currentLevel = level || progress.currentLevel;
  const pct = Math.round(progress.progress * 100);

  return (
    <div className={`flex items-center gap-2 ${variant === 'full' ? 'flex-col items-stretch gap-1' : 'flex-row'}`}>
      {variant === 'full' && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Level {currentLevel}</span>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {formatXP(progress.xpInLevel)} / {formatXP(progress.xpRequiredForNext)} XP
          </span>
        </div>
      )}
      <div className={`h-1.5 w-full overflow-hidden rounded-[2px] bg-[var(--bg-tertiary)] ${variant === 'mini' ? 'h-1 w-[60px]' : ''}`}>
        <div
          className="h-full rounded-[2px] bg-[var(--accent-amber)] transition-[width] duration-[var(--transition-normal)] ease"
          style={{ width: `${pct}%` }}
        />
      </div>
      {variant === 'mini' && (
        <span className="text-xs font-semibold whitespace-nowrap text-[var(--text-muted)]">Lv.{currentLevel}</span>
      )}
    </div>
  );
}
