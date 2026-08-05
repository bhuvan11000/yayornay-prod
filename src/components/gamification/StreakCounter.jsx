import { Flame } from 'lucide-react';

const TIER_CLASSES = {
  none: 'text-[var(--text-muted)]',
  low: 'text-[#f97316]',
  medium: 'text-[#eab308]',
  high: 'text-[#ea580c]',
  inferno: 'text-[#ef4444]',
};

const SIZE_GAP_CLASSES = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-2',
};

const SIZE_NUMBER_CLASSES = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

/**
 * StreakCounter — Displays a player's betting streak with color intensity.
 *
 * @param {object} props
 * @param {number} props.streak - Current betting streak
 * @param {number} [props.longest] - Longest betting streak
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
export function StreakCounter({ streak = 0, longest, size = 'md' }) {
  const tier = getStreakTier(streak);
  const showLabel = size === 'lg';
  const tierClass = TIER_CLASSES[tier];

  return (
    <div
      className={`inline-flex items-center ${SIZE_GAP_CLASSES[size]}`}
      title={`Betting streak: ${streak} day${streak !== 1 ? 's' : ''}${longest != null ? ` — Longest: ${longest}` : ''}`}
    >
      <div className="relative flex items-center justify-center leading-none">
        <Flame size={size === 'sm' ? 14 : size === 'lg' ? 22 : 18} className={tierClass} />
        {tier === 'inferno' && <div className="streak-flame-glow absolute size-[200%] rounded-[2px]" />}
      </div>
      <span className={`font-heading font-bold ${SIZE_NUMBER_CLASSES[size]} ${tierClass}`}>
        {streak}
      </span>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Day Streak</span>
          {longest != null && (
            <span className="text-[10px] text-[var(--text-muted)]">Longest: {longest}</span>
          )}
        </div>
      )}
    </div>
  );
}

function getStreakTier(streak) {
  if (streak === 0) return 'none';
  if (streak <= 2) return 'low';
  if (streak <= 6) return 'medium';
  if (streak <= 14) return 'high';
  return 'inferno';
}
