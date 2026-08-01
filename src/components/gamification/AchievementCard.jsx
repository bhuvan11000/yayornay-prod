import { CheckCircle, Target, Flame, Layers, TrendingDown, Fish, Sunrise, Sigma, Eye, Store, TrendingUp, BadgeCheck, Star, Calendar, Lock } from 'lucide-react';
import { formatCoins, formatDate } from '../../lib/format';
import PixelCard from '../reactbits/PixelCard/PixelCard';

const iconMap = {
  target: Target,
  flame: Flame,
  layers: Layers,
  'trend-down': TrendingDown,
  'fish-symbol': Fish,
  sunrise: Sunrise,
  sigma: Sigma,
  eye: Eye,
  store: Store,
  'trending-up': TrendingUp,
  'badge-check': BadgeCheck,
  star: Star,
  calendar: Calendar,
};

export function AchievementCard({ achievement }) {
  const { title, description, icon, unlocked, unlocked_at, xp_reward, coin_reward, progress } = achievement;
  const IconComponent = iconMap[icon] || Target;

  if (!unlocked) {
    return (
      <div className="relative flex h-full min-h-[220px] flex-col items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-5 text-center opacity-50 backdrop-blur-[2px]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-tertiary)]/60">
          <Lock size={22} className="text-[var(--text-muted)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">{title}</h3>
        <p className="text-xs leading-snug text-[var(--text-muted)]">{description}</p>

        {progress && (
          <div className="mt-auto flex w-full items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
              <div
                className="h-full rounded-full bg-[var(--text-muted)] transition-[width] duration-500"
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
            <span className="whitespace-nowrap font-mono text-xs text-[var(--text-muted)]">
              {progress.current}/{progress.target}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <PixelCard
      variant="default"
      gap={8}
      speed={30}
      colors="#22c55e,#86efac,#16a34a"
      className="min-h-[220px] rounded-2xl border border-[rgba(34,197,94,0.3)] bg-[var(--bg-secondary)] shadow-[0_0_12px_rgba(34,197,94,0.1)]"
    >
      <div className="relative z-[1] flex h-full min-h-[220px] w-full flex-col items-center gap-2 p-5 text-center">
        <div className="relative mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(34,197,94,0.15)]">
          <IconComponent size={28} className="text-[var(--color-yes)]" />
          <div className="absolute -bottom-1 -right-1 rounded-full bg-[var(--bg-primary)] leading-none">
            <CheckCircle size={18} className="text-[var(--color-yes)]" />
          </div>
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-xs leading-snug text-[var(--text-secondary)]">{description}</p>

        <div className="mt-auto flex flex-wrap justify-center gap-2">
          <span className="font-mono text-xs font-semibold text-[var(--rank-visionary)]">
            +{xp_reward} XP
          </span>
          <span className="font-mono text-xs font-semibold text-[var(--color-warning)]">
            +{formatCoins(coin_reward)} coins
          </span>
        </div>

        {unlocked_at && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">Unlocked {formatDate(unlocked_at)}</p>
        )}
      </div>
    </PixelCard>
  );
}
