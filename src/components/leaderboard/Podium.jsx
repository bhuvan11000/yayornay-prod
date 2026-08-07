import { useNavigate } from 'react-router';
import { getRank } from '../../lib/ranks';
import { formatCoins, formatPercent } from '../../lib/format';
import BounceCards from '../reactbits/BounceCards/BounceCards';
import Particles from '../reactbits/Particles/Particles';

const MEDAL_STYLES = {
  1: {
    accent: 'var(--accent-amber)',
    accentMuted: 'var(--accent-amber-muted)',
    ring: 'rgba(245, 165, 36, 0.45)',
    glow: '0 0 24px rgba(245, 165, 36, 0.18)',
    label: 'Champion',
  },
  2: {
    accent: '#9CA3AF',
    accentMuted: 'rgba(156, 163, 175, 0.12)',
    ring: 'rgba(156, 163, 175, 0.35)',
    glow: '0 0 18px rgba(156, 163, 175, 0.12)',
    label: 'Runner-up',
  },
  3: {
    accent: '#C2703E',
    accentMuted: 'rgba(194, 112, 62, 0.12)',
    ring: 'rgba(194, 112, 62, 0.4)',
    glow: '0 0 18px rgba(194, 112, 62, 0.14)',
    label: 'Third place',
  },
};

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

  const cards = top3.map((player, i) => {
    const rank = i + 1;
    const medal = MEDAL_STYLES[rank];
    const playerRank = player.rank || getRank(player.coins);
    const isFirst = rank === 1;

    return {
      width: isFirst ? 190 : 160,
      content: (
        <div
          className="flex w-full cursor-pointer flex-col gap-2 rounded-[var(--radius-sm)] border bg-[var(--bg-secondary)] p-4 text-center"
          style={{
            borderColor: medal.ring,
            boxShadow: medal.glow,
          }}
          onClick={() => navigate(`/profile/${player.username}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/profile/${player.username}`); }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex size-6 items-center justify-center rounded-[3px] font-heading text-xs font-bold"
              style={{ background: medal.accent, color: '#0B0E0C', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.25)' }}
            >
              {rank}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {medal.label}
            </span>
          </div>

          <div
            className="mx-auto flex size-14 items-center justify-center rounded-[3px] font-heading text-xl font-bold"
            style={{ background: medal.accentMuted, color: medal.accent, border: `1px solid ${medal.ring}` }}
          >
            {(player.username || '?').charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold text-[var(--text-primary)]">
              {player.username}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {playerRank}
            </p>
            <p className="mt-1 font-mono text-base font-bold" style={{ color: medal.accent }}>
              {getMetricValue(player, metric)}
            </p>
          </div>
        </div>
      ),
    };
  });

  return (
    <div className="relative mb-4 flex origin-center justify-center max-md:scale-[0.62] md:scale-100">
      <div className="pointer-events-none absolute -inset-8 opacity-60">
        <Particles
          particleCount={140}
          particleSpread={16}
          speed={0.3}
          particleColors={['#f5a524', '#22c55e', '#e9f0ea']}
          alphaParticles
          particleBaseSize={70}
          sizeRandomness={1}
          cameraDistance={22}
          disableRotation
        />
      </div>
      <BounceCards
        cards={cards}
        containerWidth={560}
        containerHeight={240}
        animationDelay={0.3}
        animationStagger={0.12}
        enableHover
        transformStyles={['rotate(9deg) translate(-165px)', 'rotate(-2deg)', 'rotate(-9deg) translate(165px)']}
      />
    </div>
  );
}
