import { useNavigate } from 'react-router';
import { getRank } from '../../lib/ranks';
import { formatCoins, formatPercent } from '../../lib/format';

const MEDAL_STYLES = {
  1: {
    bg: 'var(--accent-amber)',
    color: '#0B0E0C',
    ring: 'rgba(245, 165, 36, 0.45)',
    glow: '0 0 28px rgba(245, 165, 36, 0.25)',
  },
  2: {
    bg: '#9CA3AF',
    color: '#0B0E0C',
    ring: 'rgba(156, 163, 175, 0.35)',
    glow: '0 0 18px rgba(156, 163, 175, 0.15)',
  },
  3: {
    bg: '#C2703E',
    color: '#0B0E0C',
    ring: 'rgba(194, 112, 62, 0.4)',
    glow: '0 0 18px rgba(194, 112, 62, 0.18)',
  },
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
    <div className="mb-6 flex items-end justify-center gap-3 sm:gap-5">
      {PODIUM_ORDER.map((rank) => {
        const player = top3[rank - 1];
        if (!player) return null;
        const medal = MEDAL_STYLES[rank];
        const playerRank = player.rank || getRank(player.coins);
        const isFirst = rank === 1;
        const isThird = rank === 3;

        return (
          <div
            key={rank}
            className="flex cursor-pointer flex-col items-center gap-2 transition-transform duration-200 hover:scale-[1.03]"
            onClick={() => navigate(`/profile/${player.username}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/profile/${player.username}`); }}
          >
            <div
              className={`flex flex-col items-center justify-end gap-2 rounded-[var(--radius-sm)] border bg-[var(--bg-secondary)] p-4 text-center ${
                isFirst ? 'w-[150px] pb-5 sm:w-[170px]' : isThird ? 'w-[115px] sm:w-[125px]' : 'w-[125px] sm:w-[135px]'
              }`}
              style={{
                borderColor: medal.ring,
                boxShadow: `${medal.glow}, inset 0 2px 0 ${medal.ring}`,
                paddingTop: isFirst ? '2rem' : isThird ? '1rem' : '1.25rem',
              }}
            >
              <div
                className={`flex items-center justify-center rounded-[3px] font-heading font-black ${isFirst ? 'h-16 w-16 text-xl' : isThird ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-base'}`}
                style={{ background: medal.bg, color: medal.color, boxShadow: `inset 0 -2px 0 rgba(0,0,0,0.25)` }}
              >
                {(player.username || '?').charAt(0).toUpperCase()}
              </div>

              <div className="w-full min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-[var(--text-primary)]">
                  {player.username}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {playerRank}
                </p>
                <p className="mt-1 font-mono text-sm font-bold" style={{ color: medal.ring }}>
                  {getMetricValue(player, metric)}
                </p>
              </div>
            </div>

            <div
              className={`flex items-center justify-center rounded-[3px] font-heading font-bold ${isFirst ? 'h-8 w-8 text-lg' : 'h-7 w-7 text-base'}`}
              style={{ background: medal.bg, color: medal.color, boxShadow: `inset 0 -2px 0 rgba(0,0,0,0.25)` }}
            >
              {rank}
            </div>
          </div>
        );
      })}
    </div>
  );
}
