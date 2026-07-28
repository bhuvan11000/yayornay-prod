import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCoins, formatDate } from '../lib/format';
import { getRankLabel } from '../lib/ranks';
import styles from './Leaderboard.module.css';

const TABS = [
  { id: 'coins', label: 'Coins' },
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'profit', label: 'Profit' },
  { id: 'streak', label: 'Streak' },
];

const TIMEFRAMES = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'This Month' },
  { id: 'week', label: 'This Week' },
];

const LIMIT = 50;

export default function Leaderboard() {
  const user = useAuthStore(s => s.user);
  const [activeTab, setActiveTab] = useState('coins');
  const [timeframe, setTimeframe] = useState('all');
  const [page, setPage] = useState(1);
  const listRef = useRef(null);
  const scrollToUserRef = useRef(false);

  const { data, isLoading, isError } = useLeaderboard({
    metric: activeTab,
    timeframe,
    page,
    limit: LIMIT,
  });

  const players = data?.players || [];
  const totalCount = data?.totalCount || 0;
  const userRank = data?.userRank ?? null;
  const totalPages = Math.ceil(totalCount / LIMIT);

  const userOnCurrentPage = players.some(p => p.id === user?.id);

  // After jumping to a page, scroll to the user's specific row once data loads
  useEffect(() => {
    if (scrollToUserRef.current && userOnCurrentPage) {
      scrollToUserRef.current = false;
      // Small timeout to let the DOM render
      requestAnimationFrame(() => {
        const userRow = document.querySelector('[data-current-user="true"]');
        if (userRow) {
          userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }, [userOnCurrentPage]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
    setPage(1);
  };

  const handleJumpToMyRank = () => {
    if (!userRank) return;
    const targetPage = Math.ceil(userRank / LIMIT);
    scrollToUserRef.current = true;
    setPage(targetPage);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-2xl font-heading">Global Leaderboard</h1>
          <p className={styles.seasonInfo}>
            Season <span id="season-number">1</span> — Compete to reach the top
          </p>
        </div>
      </div>

      {/* Current user rank summary */}
      {user && userRank && (
        <div className={styles.userSummary}>
          <div className={styles.summaryMain}>
            <span className={styles.summaryLabel}>Your Rank</span>
            <span className={styles.summaryRank}>#{userRank}</span>
          </div>
          <div className={styles.summaryMeta}>
            <span className={styles.summaryStat}>
              {getRankLabel(user.rank || 'Unranked')}
            </span>
            <span className={styles.summaryStat}>
              {formatCoins(user.coins || 0)} coins
            </span>
          </div>
          {!userOnCurrentPage && totalPages > 1 && (
            <button className={styles.jumpBtn} onClick={handleJumpToMyRank}>
              <ArrowUp size={14} />
              Jump to my rank
            </button>
          )}
        </div>
      )}

      {/* Tabs + Time filter */}
      <div className={styles.controls}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
        <select
          className={styles.timeSelect}
          value={timeframe}
          onChange={handleTimeframeChange}
        >
          {TIMEFRAMES.map(tf => (
            <option key={tf.id} value={tf.id}>{tf.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div ref={listRef}>
        {isLoading ? (
          <div className={styles.list}>
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} variant="rect" />
            ))}
          </div>
        ) : isError ? (
          <div className={styles.errorState}>
            <p className="text-muted">Failed to load leaderboard.</p>
            <button
              className="btn-primary btn-sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <LeaderboardTable
            players={players}
            metric={activeTab}
            currentUserId={user?.id}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}