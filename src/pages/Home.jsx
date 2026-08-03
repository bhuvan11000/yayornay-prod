import { Link } from 'react-router';
import { Coins, TrendingUp } from 'lucide-react';
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
import BlurText from '../components/reactbits/BlurText/BlurText';
import { formatCoins } from '../lib/format';
import { useShouldAnimate } from '../lib/countUpSession';

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
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading">
          Welcome{user?.username ? `, ${user.username}` : ''}
        </h1>
      </div>

      <SeasonBanner />

      <DailyRewardClaim onClaim={() => claimReward()} claiming={claiming} />

      {user && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
            <Coins size={18} className="shrink-0 text-[var(--color-warning)]" />
            {coinsAnimate ? (
              <CountUp to={user.coins || 0} from={0} duration={0.8} separator="," className="font-mono text-lg font-bold text-[var(--text-primary)]" />
            ) : (
              <span className="font-mono text-lg font-bold text-[var(--text-primary)]">{formatCoins(user.coins || 0)}</span>
            )}
            <span className="text-xs uppercase tracking-[0.05em] text-[var(--text-muted)]">Coins</span>
          </div>
          <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
            <RankBadge rank={user.rank} size="md" showLabel />
          </div>
          <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
            <StreakCounter streak={user.betting_streak || 0} longest={user.longest_streak} size="md" />
          </div>
          <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
            <XPBar xp={user.xp} variant="mini" />
          </div>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-heading">Trending Markets</h2>
          <Link to="/markets" className="text-sm font-medium text-[var(--accent-blue)] transition-colors duration-150 hover:text-[var(--accent-blue-hover)]">
            View All &rarr;
          </Link>
        </div>

        {marketsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shrink-0 basis-[320px] snap-start">
                <Skeleton variant="card" />
              </div>
            ))}
          </div>
        ) : marketsError ? (
          <p className="text-muted text-sm">Failed to load trending markets.</p>
        ) : trendingMarkets.length === 0 ? (
          <BlurText
            text="No trending markets right now. Check back soon."
            delay={100}
            animateBy="words"
            direction="top"
            className="text-sm text-[var(--text-muted)]"
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            {trendingMarkets.map((market) => (
              <div key={market.id} className="shrink-0 basis-[320px] snap-start">
                <MarketCard market={market} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-heading">
            <TrendingUp size={18} />
            Active Quests
          </h2>
          <Link to="/quests" className="text-sm font-medium text-[var(--accent-blue)] transition-colors duration-150 hover:text-[var(--accent-blue-hover)]">
            View All &rarr;
          </Link>
        </div>
        {dailyQuests.length > 0 || weeklyQuests.length > 0 ? (
          <div className="flex flex-col gap-2">
            {dailyQuests.slice(0, 2).map((q) => {
              const pct = q.target > 0 ? Math.min(Math.round((q.progress / q.target) * 100), 100) : 0;
              return (
                <div key={q.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{q.title}</span>
                    <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--accent-blue-muted)] px-1 py-[1px] text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--accent-blue)]">Daily</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-1 w-20 overflow-hidden rounded-[var(--radius-full)] bg-[var(--bg-tertiary)]">
                      <div className="h-full rounded-[var(--radius-full)] bg-[var(--accent-blue)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="min-w-8 text-right font-mono text-xs text-[var(--text-muted)]">{q.progress}/{q.target}</span>
                  </div>
                </div>
              );
            })}
            {weeklyQuests.slice(0, 1).map((q) => {
              const pct = q.target > 0 ? Math.min(Math.round((q.progress / q.target) * 100), 100) : 0;
              return (
                <div key={q.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{q.title}</span>
                    <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--accent-blue-muted)] px-1 py-[1px] text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--accent-blue)]">Weekly</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-1 w-20 overflow-hidden rounded-[var(--radius-full)] bg-[var(--bg-tertiary)]">
                      <div className="h-full rounded-[var(--radius-full)] bg-[var(--accent-blue)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="min-w-8 text-right font-mono text-xs text-[var(--text-muted)]">{q.progress}/{q.target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <BlurText
            text="No active quests. Check the Quest Board to start."
            delay={100}
            animateBy="words"
            direction="top"
            className="text-sm text-[var(--text-muted)]"
          />
        )}
      </section>
    </div>
  );
}
