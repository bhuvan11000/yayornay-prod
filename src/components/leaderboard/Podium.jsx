import { useNavigate } from 'react-router';
import { getRank } from '../../lib/ranks';
import { formatCoins, formatPercent } from '../../lib/format';

const MEDAL_STYLES = {
  1: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', label: '#1', color: '#f59e0b', ring: 'rgba(245, 158, 11, 0.3)' },
  2: { bg: 'linear-gradient(135deg, #9ca3af, #6b7280)', label: '#2', color: '#9ca3af', ring: 'rgba(156, 163, 175, 0.3)' },
  3: { bg: 'linear-gradient(135deg, #d97706, #92400e)', label: '#3', color: '#d97706', ring: 'rgba(217, 119, 6, 0.3)' },
};

/** Display order: 2nd on left, 1st (tallest) in center, 3rd on right */
const PODIUM_ORDER = [2, 1, 3];

function getMetricValue(player, metric) {
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
}

export function Podium({ players, metric }) {
  const navigate = useNavigate();
  const top3 = players.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="mb-6 flex items-end justify-center gap-4 sm:gap-6">
      {PODIUM_ORDER.map((rank) => {
        const player = top3[rank - 1];
        if (!player) return null;
        const medal = MEDAL_STYLES[rank];
        const playerRank = player.rank || getRank(player.coins);
        const isFirst = rank === 1;

        return (
          <div
            key={rank}
            className="flex flex-col items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
            onClick={() => navigate(`/profile/${player.username}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/profile/${player.username}`); }}
          >
            {/* Card */}
            <div
              className={`flex flex-col items-center justify-end gap-2 rounded-xl border bg-[var(--bg-secondary)] p-4 text-center ${isFirst ? 'w-[160px] pb-5 sm:w-[180px]' : 'w-[130px] sm:w-[140px]'}`}
              style={{
                borderColor: medal.ring,
                boxShadow: `0 0 20px ${medal.ring}, inset 0 1px 0 ${medal.ring}`,
                paddingTop: isFirst ? '2rem' : '1.25rem',
              }}
            >
              {/* Avatar circle */}
              <div
                className={`flex items-center justify-center rounded-full font-heading font-black text-white shadow-lg ${isFirst ? 'h-16 w-16 text-xl' : 'h-12 w-12 text-base'}`}
                style={{ background: medal.bg }}
              >
                {(player.username || '?').charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="w-full min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-[var(--text-primary)]">
                  {player.username}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {playerRank}
                </p>
                <p className="mt-1 font-mono text-sm font-bold" style={{ color: medal.color }}>
                  {getMetricValue(player, metric)}
                </p>
              </div>
            </div>

            {/* Rank badge */}
            <div
              className={`flex items-center justify-center rounded-lg font-heading font-bold text-white ${isFirst ? 'h-8 w-8 text-lg' : 'h-7 w-7 text-base'}`}
              style={{ background: medal.bg }}
            >
              {medal.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
