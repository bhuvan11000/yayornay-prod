import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import CountUp from '../components/reactbits/CountUp/CountUp';
import { formatCoins, formatDate } from '../lib/format';
import { getRankLabel } from '../lib/ranks';

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
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading">Global Leaderboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Season <span id="season-number">1</span> — Compete to reach the top
          </p>
        </div>
      </div>

      {/* Current user rank summary */}
      {user && userRank && (
        <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-5 py-4 md:flex-nowrap">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-[var(--text-muted)]">Your Rank</span>
            <span className="font-heading text-2xl font-bold text-[var(--accent-blue)]">#{userRank}</span>
          </div>
          <div className="flex flex-col gap-[2px]">
            <span className="text-xs text-[var(--text-secondary)]">
              {getRankLabel(user.rank || 'Unranked')}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              <CountUp to={user.coins || 0} from={0} duration={0.8} separator="," /> coins
            </span>
          </div>
          {!userOnCurrentPage && totalPages > 1 && (
            <button className="flex w-full cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-[var(--radius-md)] border border-[rgba(79,125,245,0.3)] bg-[var(--accent-blue-muted)] px-3 py-2 text-xs font-medium text-[var(--accent-blue)] transition-colors duration-150 hover:border-[var(--accent-blue)] hover:bg-[rgba(79,125,245,0.25)] md:ml-auto md:w-auto" onClick={handleJumpToMyRank}>
              <ArrowUp size={14} />
              Jump to my rank
            </button>
          )}
        </div>
      )}

      {/* Tabs + Time filter */}
      <div className="flex flex-col items-stretch gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
        <select
          className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none"
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
          <div className="flex flex-col gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} variant="rect" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-12">
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
