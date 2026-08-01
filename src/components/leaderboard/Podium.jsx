import { useNavigate } from 'react-router';
import { getRank } from '../../lib/ranks';
import { formatCoins, formatPercent } from '../../lib/format';
import TiltedCard from '../reactbits/TiltedCard/TiltedCard';

const MEDAL_STYLES = {
  1: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', label: '#1', color: '#f59e0b' },
  2: { bg: 'linear-gradient(135deg, #9ca3af, #6b7280)', label: '#2', color: '#9ca3af' },
  3: { bg: 'linear-gradient(135deg, #d97706, #92400e)', label: '#3', color: '#d97706' },
};

const PODIUM_ORDER = [2, 1, 3];
const PODIUM_HEIGHT = { 1: 230, 2: 185, 3: 150 };

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
    <div className="mb-6 flex items-end justify-center gap-3 sm:gap-6">
      {PODIUM_ORDER.map((rank) => {
        const player = top3[rank - 1];
        if (!player) return null;
        const medal = MEDAL_STYLES[rank];
        const playerRank = player.rank || getRank(player.coins);
        const avatarColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#9ca3af' : '#d97706';

        return (
          <div key={rank} className="flex flex-col items-center">
            <div className="flex h-[52px] items-end">
              <TiltedCard
                imageSrc={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='${PODIUM_HEIGHT[rank]}'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='${avatarColor}' stop-opacity='0.25'/%3E%3Cstop offset='1' stop-color='${avatarColor}' stop-opacity='0.08'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='150' height='${PODIUM_HEIGHT[rank]}' rx='18' fill='url(%23g)'/%3E%3C/svg%3E`}
                altText={`${player.username} — rank ${rank}`}
                containerHeight={`${PODIUM_HEIGHT[rank]}px`}
                containerWidth={rank === 1 ? '190px' : '150px'}
                imageHeight={`${PODIUM_HEIGHT[rank]}px`}
                imageWidth={rank === 1 ? '190px' : '150px'}
                rotateAmplitude={6}
                scaleOnHover={1.04}
                showMobileWarning={false}
                showTooltip={false}
                displayOverlayContent
                overlayContent={
                  <div
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-end gap-2 p-3 text-center"
                    onClick={() => navigate(`/profile/${player.username}`)}
                  >
                    <div
                      className={`flex items-center justify-center rounded-full font-heading font-black text-white shadow-lg ${rank === 1 ? 'h-16 w-16 text-xl' : 'h-12 w-12 text-base'}`}
                      style={{ background: medal.bg }}
                    >
                      {(player.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="w-full">
                      <p className="truncate font-heading text-sm font-semibold text-[var(--text-primary)]">
                        {player.username}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        {playerRank}
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold" style={{ color: medal.color }}>
                        {getMetricValue(player, metric)}
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
            <div
              className={`mt-2 flex items-center justify-center rounded-lg font-heading text-lg font-bold text-white ${rank === 1 ? 'h-8 w-8' : 'h-7 w-7 text-base'}`}
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
