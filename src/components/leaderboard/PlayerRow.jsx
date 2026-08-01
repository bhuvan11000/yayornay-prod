import { useNavigate } from 'react-router';
import { RankBadge } from '../gamification/RankBadge';
import { getRank } from '../../lib/ranks';
import { formatCoins, formatPercent } from '../../lib/format';
import { TableRow, TableCell } from '../ui/table';

const MEDAL_COLORS = {
  1: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', label: '#1', color: '#f59e0b' },
  2: { bg: 'linear-gradient(135deg, #9ca3af, #6b7280)', label: '#2', color: '#9ca3af' },
  3: { bg: 'linear-gradient(135deg, #d97706, #92400e)', label: '#3', color: '#d97706' },
};

export function PlayerRow({ player, rank, metric, isCurrentUser }) {
  const navigate = useNavigate();
  const isTop3 = rank <= 3;
  const medal = isTop3 ? MEDAL_COLORS[rank] : null;
  const playerRank = player.rank || getRank(player.coins);

  const getMetricValue = () => {
    switch (metric) {
      case 'accuracy':
        return player.accuracy != null ? formatPercent(player.accuracy) : '—';
      case 'profit':
        return `${player.net_profit >= 0 ? '+' : ''}${formatCoins(player.net_profit || 0)}`;
      case 'streak':
        return `${player.betting_streak || 0}`;
      case 'coins':
      default:
        return formatCoins(player.coins);
    }
  };

  const getMetricClass = () => {
    if (metric === 'profit') {
      return player.net_profit >= 0 ? 'text-yes' : 'text-no';
    }
    if (metric === 'streak') {
      return player.betting_streak > 0 ? 'text-warning' : '';
    }
    return '';
  };

  const getSecondaryValue = () => {
    if (metric === 'accuracy') {
      return `${player.total_predictions || 0} bets`;
    }
    if (metric === 'streak') {
      return `Best: ${player.longest_streak || 0}`;
    }
    return null;
  };

  const secondary = getSecondaryValue();

  return (
    <TableRow
      className={`cursor-pointer border-[var(--border-subtle)] ${
        isCurrentUser
          ? '!bg-[rgba(79,125,245,0.05)] hover:!bg-[rgba(79,125,245,0.08)] animate-[rankGlow_2s_ease-in-out_infinite]'
          : 'hover:!bg-[var(--bg-tertiary)]'
      }`}
      data-current-user={isCurrentUser ? 'true' : undefined}
      onClick={() => navigate(`/profile/${player.username}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/profile/${player.username}`); }}
    >
      <TableCell className="flex min-w-9 justify-center max-sm:min-w-7">
        {medal ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full font-heading text-xs font-bold text-white" style={{ background: medal.bg }}>
            {medal.label}
          </span>
        ) : (
          <span className="font-mono text-sm font-bold text-[var(--text-muted)]">#{rank}</span>
        )}
      </TableCell>

      <TableCell className="w-10">
        <span
          className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full font-heading text-xs font-bold uppercase text-[var(--text-secondary)]"
          style={{ background: isCurrentUser ? 'var(--accent-blue)' : 'var(--bg-tertiary)' }}
        >
          {(player.username || '?').charAt(0).toUpperCase()}
        </span>
      </TableCell>

      <TableCell className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold text-[var(--text-primary)]">{player.username}</span>
        <RankBadge rank={playerRank} size="sm" showLabel />
      </TableCell>

      <TableCell className="text-right">
        <span className={`whitespace-nowrap font-mono text-sm font-bold text-[var(--text-primary)] ${getMetricClass()}`}>
          {getMetricValue()}
        </span>
      </TableCell>

      {secondary && (
        <TableCell className="text-right text-[var(--text-muted)]">
          <span className="font-mono text-xs">{secondary}</span>
        </TableCell>
      )}

      <TableCell className="text-right">
        <span className="whitespace-nowrap rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--text-muted)] max-md:hidden">Lv.{player.level || 1}</span>
      </TableCell>
    </TableRow>
  );
}
