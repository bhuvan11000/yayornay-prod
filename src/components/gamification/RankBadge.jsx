import { getRankColor, getRankLabel, RANK_THRESHOLDS } from '../../lib/ranks';
import ShinyText from '../reactbits/ShinyText/ShinyText';

export function RankBadge({ rank, size = 'md', showLabel = true }) {
  const color = getRankColor(rank);
  const label = getRankLabel(rank);
  const threshold = RANK_THRESHOLDS.find(r => r.name === rank);
  const isOmniscient = rank === 'Omniscient';

  const sizeMap = { sm: 16, md: 24, lg: 32 };
  const dotSize = sizeMap[size] || 24;

  const labelClass = [
    'font-semibold uppercase tracking-[0.05em]',
    size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs',
    isOmniscient ? 'font-bold' : 'text-[var(--text-secondary)]',
  ].join(' ');

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap ${isOmniscient ? 'omniscient-badge' : ''}`}
      title={`${label}${threshold ? ` — ${threshold.minCoins.toLocaleString()} coins required` : ''}`}
    >
      <span
        className={`rounded-full flex-shrink-0 ${isOmniscient ? 'omniscient-dot' : ''}`}
        style={{
          width: dotSize,
          height: dotSize,
          background: isOmniscient ? undefined : color,
        }}
      />
      {showLabel &&
        (isOmniscient ? (
          <ShinyText
            text={label}
            speed={3}
            color="#f59e0b"
            shineColor="#a855f7"
            className={labelClass}
          />
        ) : (
          <span className={labelClass}>{label}</span>
        ))}
    </span>
  );
}
