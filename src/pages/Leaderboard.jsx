import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { RankBadge } from '../components/gamification/RankBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { Tabs } from '../components/ui/Tabs';
import { formatCoins, formatPercent } from '../lib/format';
import { getRank } from '../lib/ranks';
import styles from './Leaderboard.module.css';

const TABS = [
  { id: 'coins', label: 'Coins' },
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'profit', label: 'Profit' },
  { id: 'streak', label: 'Streak' },
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('coins');
  const navigate = useNavigate();
  const { data: rows, isLoading, isError } = useLeaderboard({ metric: activeTab });

  const getValue = (row) => {
    switch (activeTab) {
      case 'coins': return formatCoins(row.coins);
      case 'accuracy': return row.accuracy ? formatPercent(row.accuracy) : '—';
      case 'profit': return `${row.net_profit >= 0 ? '+' : ''}${formatCoins(row.net_profit || 0)}`;
      case 'streak': return `${row.betting_streak || 0}`;
      default: return '';
    }
  };

  const getValueClass = (row) => {
    if (activeTab === 'profit') {
      return row.net_profit >= 0 ? 'text-yes' : 'text-no';
    }
    if (activeTab === 'streak') {
      return row.betting_streak > 0 ? 'text-warning' : '';
    }
    return '';
  };

  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Leaderboard</h1>

      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {isLoading ? (
        <div className={styles.list}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} variant="rect" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-muted text-sm">Failed to load leaderboard.</p>
      ) : !rows || rows.length === 0 ? (
        <p className="text-muted text-sm">No players found for this category.</p>
      ) : (
        <div className={styles.list}>
          {rows.map((row, i) => {
            const rank = getRank(row.coins);
            return (
              <div
                key={row.id}
                className={styles.row}
                onClick={() => navigate(`/profile/${row.username}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/profile/${row.username}`); }}
              >
                <span className={styles.rankNum}>#{i + 1}</span>

                <div className={styles.avatar} style={{ background: 'var(--accent-blue)' }}>
                  {(row.username || '?').charAt(0).toUpperCase()}
                </div>

                <div className={styles.info}>
                  <span className={styles.name}>{row.username}</span>
                  {activeTab === 'coins' && (
                    <RankBadge rank={rank} size="sm" showLabel />
                  )}
                </div>

                <span className={`${styles.value} ${getValueClass(row)}`}>
                  {getValue(row)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}