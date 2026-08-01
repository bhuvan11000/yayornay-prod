import { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { formatCoins, formatTimeRemaining } from '../../lib/format';
import { Progress } from '../ui/progress';
import SpotlightCard from '../reactbits/SpotlightCard/SpotlightCard';

export function QuestCard({ quest, onComplete }) {
  const { title, description, target, xp_reward, coin_reward, progress, completed, reset_at } = quest;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const pct = target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0;

  return (
    <SpotlightCard
      spotlightColor="rgba(245, 158, 11, 0.15)"
      className={`rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] p-5 transition-[border-color,box-shadow] duration-150 hover:shadow-[var(--shadow-sm)] ${completed ? 'border-[rgba(34,197,94,0.3)] opacity-60 hover:border-[rgba(34,197,94,0.5)]' : 'border-[var(--border-subtle)] hover:border-[var(--bg-tertiary)]'}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className={`text-base font-semibold ${completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
              {title}
            </h3>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{description}</p>
          </div>
          {completed && (
            <div className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[rgba(34,197,94,0.15)] px-2 py-1 text-xs font-semibold text-[var(--color-yes)]">
              <CheckCircle size={16} />
              <span>Claimed</span>
            </div>
          )}
        </div>

        <div className="progress-section flex items-center gap-3">
          <Progress
            value={mounted ? (completed ? 100 : pct) : 0}
            className="h-2 bg-[var(--bg-tertiary)]"
            data-slot-complete={completed ? 'true' : undefined}
          />
          <span className="min-w-12 whitespace-nowrap text-right font-mono text-sm text-[var(--text-muted)]">
            {Math.min(progress, target)}/{target}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <span className="font-mono text-sm font-semibold text-[var(--rank-visionary)]">+{xp_reward} XP</span>
            <span className="font-mono text-sm font-semibold text-[var(--color-warning)]">+{formatCoins(coin_reward)} coins</span>
          </div>
          {!completed && reset_at && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Clock size={12} />
              <span>{formatTimeRemaining(reset_at)}</span>
            </div>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}
