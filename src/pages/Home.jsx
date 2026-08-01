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
import styles from './Home.module.css';

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

  const trendingMarkets = marketsData?.markets || [];
  const dailyQuests = questsData?.daily?.filter(q => !q.completed) || [];
  const weeklyQuests = questsData?.weekly?.filter(q => !q.completed) || [];

  return (
    <div className={styles.home}>
      <div className={styles.header}>
        <h1 className="text-2xl font-heading">
          Welcome{user?.username ? `, ${user.username}` : ''}
        </h1>
      </div>

      <SeasonBanner />

      <DailyRewardClaim onClaim={() => claimReward()} claiming={claiming} />

      {user && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <Coins size={18} className={styles.coinIcon} />
            <CountUp to={user.coins || 0} from={0} duration={0.8} separator="," className={styles.statValue} />
            <span className={styles.statLabel}>Coins</span>
          </div>
          <div className={styles.statCard}>
            <RankBadge rank={user.rank} size="md" showLabel />
          </div>
          <div className={styles.statCard}>
            <StreakCounter streak={user.betting_streak || 0} longest={user.longest_streak} size="md" />
          </div>
          <div className={styles.statCard}>
            <XPBar xp={user.xp} variant="mini" />
          </div>
        </div>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-xl font-heading">Trending Markets</h2>
          <Link to="/markets" className={styles.viewAll}>
            View All &rarr;
          </Link>
        </div>

        {marketsLoading ? (
          <div className={styles.trendingRow}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.trendingCard}>
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
          <div className={styles.trendingRow}>
            {trendingMarkets.map((market) => (
              <div key={market.id} className={styles.trendingCard}>
                <MarketCard market={market} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-xl font-heading">
            <TrendingUp size={18} />
            Active Quests
          </h2>
          <Link to="/quests" className={styles.viewAll}>
            View All &rarr;
          </Link>
        </div>
        {dailyQuests.length > 0 || weeklyQuests.length > 0 ? (
          <div className={styles.questMiniList}>
            {dailyQuests.slice(0, 2).map((q) => {
              const pct = q.target > 0 ? Math.min(Math.round((q.progress / q.target) * 100), 100) : 0;
              return (
                <div key={q.id} className={styles.questMiniRow}>
                  <div className={styles.questMiniInfo}>
                    <span className={styles.questMiniTitle}>{q.title}</span>
                    <span className={styles.questMiniType}>Daily</span>
                  </div>
                  <div className={styles.questMiniProgress}>
                    <div className={styles.questMiniTrack}>
                      <div className={styles.questMiniFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.questMiniCount}>{q.progress}/{q.target}</span>
                  </div>
                </div>
              );
            })}
            {weeklyQuests.slice(0, 1).map((q) => {
              const pct = q.target > 0 ? Math.min(Math.round((q.progress / q.target) * 100), 100) : 0;
              return (
                <div key={q.id} className={styles.questMiniRow}>
                  <div className={styles.questMiniInfo}>
                    <span className={styles.questMiniTitle}>{q.title}</span>
                    <span className={styles.questMiniType}>Weekly</span>
                  </div>
                  <div className={styles.questMiniProgress}>
                    <div className={styles.questMiniTrack}>
                      <div className={styles.questMiniFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.questMiniCount}>{q.progress}/{q.target}</span>
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
