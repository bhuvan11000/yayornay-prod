import { Link } from 'react-router';
import { Coins, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useMarkets } from '../hooks/useMarkets';
import { useQuests } from '../hooks/useQuests';
import { useClaimReward } from '../hooks/useClaimReward';
import { MarketCard } from '../components/market/MarketCard';
import { Skeleton } from '../components/ui/Skeleton';
import { DailyRewardClaim } from '../components/gamification/DailyRewardClaim';
import { StreakCounter } from '../components/gamification/StreakCounter';
import { SeasonBanner } from '../components/gamification/SeasonBanner';
import { RankBadge } from '../components/gamification/RankBadge';
import { XPBar } from '../components/gamification/XPBar';
import CountUp from '../components/reactbits/CountUp/CountUp';
import { formatCoins } from '../lib/format';
import { useShouldAnimate } from '../lib/countUpSession';

const cellReveal = (i) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.08 * i, duration: 0.35, ease: 'easeOut' },
});

function SectionHeader({ eyebrow, title, to }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="mb-[3px] inline-block size-1.5 bg-[var(--accent-amber)]" />
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="font-heading text-xl font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
      </div>
      {to && (
        <Link
          to={to}
          className="group flex items-center gap-1 font-heading text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-amber)] transition-colors duration-150 hover:text-[var(--accent-amber-hover)]"
        >
          View All
          <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const { data: marketsData, isLoading: marketsLoading, isError: marketsError } = useMarkets({
    status: 'open',
    sort: 'volume',
    limit: 6,
    page: 1,
  });
  const { data: questsData } = useQuests();
  const { mutate: claimReward, isPending: claiming } = useClaimReward();
  const coinsAnimate = useShouldAnimate('home-coins', user?.coins ?? 0);

  const trendingMarkets = marketsData?.markets || [];
  const dailyQuests = questsData?.daily?.filter(q => !q.completed) || [];
  const weeklyQuests = questsData?.weekly?.filter(q => !q.completed) || [];

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      {/* ── Welcome ── */}
      <div>
        <p className="eyebrow">Season ticket</p>
        <h1 className="mt-1 font-heading text-[28px] font-bold uppercase leading-[1.05] tracking-[0.04em] text-[var(--text-primary)] md:text-[34px]">
          Welcome, <span className="text-[var(--accent-amber)]">{user?.username || 'Player'}</span>
        </h1>
      </div>

      <SeasonBanner />

      {/* ── Player board strip ── */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] md:grid-cols-4">
        {[
          {
            label: 'Coins',
            content: coinsAnimate ? (
              <CountUp to={user?.coins || 0} from={0} duration={0.8} separator="," className="font-mono text-xl font-bold tabular-nums text-[var(--color-warning)]" />
            ) : (
              <span className="font-mono text-xl font-bold tabular-nums text-[var(--color-warning)]">{formatCoins(user?.coins || 0)}</span>
            ),
          },
          {
            label: 'Rank',
            content: user ? <RankBadge rank={user.rank} size="lg" showLabel /> : null,
          },
          {
            label: 'Streak',
            content: <StreakCounter streak={user?.betting_streak || 0} longest={user?.longest_streak} size="md" />,
          },
          {
            label: 'Level',
            content: <XPBar xp={user?.xp || 0} variant="mini" />,
          },
        ].map((cell, i) => (
          <motion.div
            key={cell.label}
            {...cellReveal(i)}
            className="flex flex-col items-start gap-1 border-[var(--border-subtle)] px-4 py-3.5 max-md:odd:border-r max-md:[&:nth-child(-n+2)]:border-b md:border-r md:last:border-r-0"
          >
            <span className="eyebrow">{cell.label}</span>
            <div className="min-h-7">{cell.content}</div>
          </motion.div>
        ))}
      </div>

      <DailyRewardClaim onClaim={() => claimReward()} claiming={claiming} />

      {/* ── Today's card ── */}
      <section className="flex flex-col gap-4">
        <SectionHeader eyebrow="Open for bets" title="Today's Card" to="/markets" />

        {marketsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shrink-0 basis-[320px] snap-start">
                <Skeleton variant="card" />
              </div>
            ))}
          </div>
        ) : marketsError ? (
          <p className="text-sm text-[var(--text-muted)]">
            Failed to load the board. <button className="btn-ghost btn-sm" onClick={() => window.location.reload()}>Retry</button>
          </p>
        ) : trendingMarkets.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Board is quiet right now — new markets drop at 08:00 UTC.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            {trendingMarkets.map((market) => (
              <div key={market.id} className="w-[320px] shrink-0 snap-start">
                <MarketCard market={market} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Active quests ── */}
      <section className="flex flex-col gap-4">
        <SectionHeader eyebrow="Earn while you play" title="Active Quests" to="/quests" />

        {dailyQuests.length > 0 || weeklyQuests.length > 0 ? (
          <div className="flex flex-col gap-2">
            {dailyQuests.slice(0, 2).map((q) => {
              const pct = q.target > 0 ? Math.min(Math.round((q.progress / q.target) * 100), 100) : 0;
              return (
                <div key={q.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{q.title}</span>
                    <span className="shrink-0 rounded-[3px] bg-[var(--accent-amber-muted)] px-1.5 py-[2px] font-heading text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-amber)]">Daily</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-[3px] w-20 overflow-hidden rounded-[2px] bg-[var(--bg-tertiary)]">
                      <div className="h-full rounded-[2px] bg-[var(--accent-amber)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="min-w-8 text-right font-mono text-xs text-[var(--text-muted)]">{q.progress}/{q.target}</span>
                  </div>
                </div>
              );
            })}
            {weeklyQuests.slice(0, 1).map((q) => {
              const pct = q.target > 0 ? Math.min(Math.round((q.progress / q.target) * 100), 100) : 0;
              return (
                <div key={q.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{q.title}</span>
                    <span className="shrink-0 rounded-[3px] bg-[var(--accent-amber-muted)] px-1.5 py-[2px] font-heading text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-amber)]">Weekly</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-[3px] w-20 overflow-hidden rounded-[2px] bg-[var(--bg-tertiary)]">
                      <div className="h-full rounded-[2px] bg-[var(--accent-amber)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="min-w-8 text-right font-mono text-xs text-[var(--text-muted)]">{q.progress}/{q.target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-dashed border-[var(--border-subtle)] px-4 py-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              No quests in progress — check the <Link to="/quests" className="text-[var(--accent-amber)]">Quest Board</Link> to start one.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
