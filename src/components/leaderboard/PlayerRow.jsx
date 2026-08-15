import { useNavigate } from 'react-router';
import { RankBadge } from '../gamification/RankBadge';
import { getRank } from '../../lib/ranks';
import { formatCoins, formatPercent } from '../../lib/format';
import { TableRow, TableCell } from '../ui/table';

const MEDAL_COLORS = {
  1: { bg: 'var(--accent-amber)', color: '#0B0E0C' },
  2: { bg: '#9CA3AF', color: '#0B0E0C' },
  3: { bg: '#C2703E', color: '#0B0E0C' },
};

export function PlayerRow({ player, rank, metric, isCurrentUser }) {
  const navigate = useNavigate();
  const isTop3 = rank <= 3;
  const medal = isTop3 ? MEDAL_COLORS[rank] : null;
  const playerRank = player.rank || getRank(player.coins);

  const getMetricValue = () => {
    switch (metric) {
      case 'accuracy':
        return player.accuracy != null ? formatPercent(player.accuracy) : 'N/A';
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
          ? '!bg-[rgba(245,165,36,0.05)] hover:!bg-[rgba(245,165,36,0.09)] animate-[rankGlow_2s_ease-in-out_infinite]'
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
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[3px] font-heading text-xs font-bold"
            style={{ background: medal.bg, color: medal.color, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.25)' }}
          >
            {rank}
          </span>
        ) : (
          <span className="font-mono text-sm font-bold text-[var(--text-muted)]">#{rank}</span>
        )}
      </TableCell>

      <TableCell className="w-10">
        <span
          className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] font-heading text-xs font-bold uppercase text-[var(--text-secondary)]"
          style={isCurrentUser ? { borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' } : undefined}
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
        <span className="whitespace-nowrap rounded-[3px] bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--text-muted)] max-md:hidden">Lv.{player.level || 1}</span>
      </TableCell>
    </TableRow>
  );
}
