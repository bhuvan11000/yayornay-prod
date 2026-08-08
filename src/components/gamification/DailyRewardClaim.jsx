import { useEffect, useState } from 'react';
import { Gift, Lock, Sun, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getRankColor, getRankLabel } from '../../lib/ranks';
import { formatCoins } from '../../lib/format';
import StarBorder from '../reactbits/StarBorder/StarBorder';
import ShinyText from '../reactbits/ShinyText/ShinyText';
import CountUp from '../reactbits/CountUp/CountUp';

const ICON_WRAPPER_CLASSES = {
  locked: 'text-[var(--color-no)] opacity-60',
  claimed: 'bg-[rgba(34,197,94,0.12)] text-[var(--color-yes)]',
  claimable: 'bg-[rgba(34,197,94,0.15)] text-[var(--color-yes)]',
};

const ICON_WRAPPER_BASE =
  'flex size-12 shrink-0 items-center justify-center rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]';

const RANK_BADGE_CLASS =
  'inline-flex items-center rounded-[3px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] text-white';

const SUNDAY_BADGE_CLASS =
  'inline-flex items-center gap-1 rounded-[3px] border border-[rgba(245,165,36,0.35)] bg-[rgba(245,165,36,0.15)] px-2 py-0.5 text-xs font-semibold text-[var(--color-warning)]';

const CLAIM_BUTTON_CLASS =
  'daily-reward-claim-button inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-[var(--radius-sm)] border-none bg-[var(--accent-amber)] px-6 py-3 font-heading text-sm font-bold uppercase tracking-[0.08em] text-[#0B0E0C] transition-[background,transform] duration-150 ease hover:bg-[var(--accent-amber-hover)] hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60';

export function DailyRewardClaim({ onClaim, claiming }) {
  const rewardStatus = useAuthStore((s) => s.rewardStatus);

  if (!rewardStatus) return null;

  const { can_claim, is_active, rank, coins, xp, is_sunday, last_claim } = rewardStatus;
  const rankColor = getRankColor(rank);
  const rankLabel = getRankLabel(rank);
  const isUnranked = rankColor === '#ffffff';
  const rankBadgeStyle = { background: rankColor, color: isUnranked ? '#0B0E0C' : undefined };
  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyClaimed = Boolean(last_claim) && last_claim === todayStr;

  if (!is_active) {
    return (
      <div className="daily-reward-locked relative flex items-center gap-5 overflow-hidden rounded-[var(--radius-sm)] border px-6 py-5">
        <div className={`${ICON_WRAPPER_BASE} ${ICON_WRAPPER_CLASSES.locked}`}>
          <Lock size={24} />
        </div>
        <div className="relative z-[1] flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-heading text-lg font-bold text-[var(--text-primary)]">Daily Rewards Locked</span>
          <p className="text-sm text-[var(--text-muted)]">
            Place a prediction to reactivate daily rewards
          </p>
        </div>
      </div>
    );
  }

  if (alreadyClaimed || (!can_claim && is_active)) {
    return (
      <div className="relative flex items-center gap-5 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-5">
        <div className={`${ICON_WRAPPER_BASE} ${ICON_WRAPPER_CLASSES.claimed}`}>
          <CheckCircle2 size={24} />
        </div>
        <div className="relative z-[1] flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg font-bold text-[var(--text-muted)]">Daily Reward Claimed</span>
            {is_sunday && (
              <span className={SUNDAY_BADGE_CLASS}>
                <Sun size={12} />
                3x Sunday Bonus
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={RANK_BADGE_CLASS} style={rankBadgeStyle}>
              {rankLabel}
            </span>
            <span className="font-mono text-lg font-bold text-[var(--color-warning)]">
              +<CountUp key={coins || 0} to={coins || 0} from={0} duration={0.8} separator="," />
            </span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="font-mono text-lg font-bold text-[var(--rank-visionary)]">+{xp || 0} XP</span>
          </div>
          <ShinyText
            text="Come back tomorrow for another reward!"
            speed={3}
            className="mt-0.5 text-xs"
            color="#5c6370"
            shineColor="#9aa0b0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="daily-reward-claimable relative flex items-center gap-5 overflow-hidden rounded-[var(--radius-sm)] border px-6 py-5">
      <div className="daily-reward-glow pointer-events-none absolute top-[-50%] left-[-50%] size-[200%]" />
      <div className={`${ICON_WRAPPER_BASE} ${ICON_WRAPPER_CLASSES.claimable}`}>
        <Gift size={24} />
      </div>
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold text-[var(--text-primary)]">Daily Reward Available</span>
          {is_sunday && (
            <span className={SUNDAY_BADGE_CLASS}>
              <Sun size={12} />
              3x Sunday Bonus
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={RANK_BADGE_CLASS} style={rankBadgeStyle}>
            {rankLabel}
          </span>
          <span className="font-mono text-lg font-bold text-[var(--color-warning)]">+{formatCoins(coins)}</span>
          <span className="text-[var(--text-muted)]">•</span>
          <span className="font-mono text-lg font-bold text-[var(--rank-visionary)]">+{xp} XP</span>
        </div>
        <StarBorder
          as="button"
          color="#f5a524"
          speed="5s"
          className="rounded-[var(--radius-sm)]"
          contentClassName={CLAIM_BUTTON_CLASS}
          onClick={onClaim}
          disabled={claiming}
        >
          {claiming ? 'Claiming...' : 'Claim Daily Reward'}
        </StarBorder>
      </div>
      <div className="pointer-events-none absolute top-0 right-0 h-full w-[120px] overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="daily-reward-sparkle" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      </div>
    </div>
  );
}
