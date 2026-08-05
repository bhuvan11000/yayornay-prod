import { formatPrice } from '../../lib/format';

/**
 * PriceBar — the tote-board tile. Two cells, YES and NO, lit in
 * green and red like a sportsbook board, prices in big mono digits.
 *
 * @param {object} props
 * @param {number} props.yesPrice
 * @param {number} props.noPrice
 * @param {'md'|'lg'} [props.size='md'] - 'lg' for the market detail board
 * @param {boolean} [props.static=false] - no hover treatment (embedded boards)
 */
export function PriceBar({ yesPrice, noPrice, size = 'md', static: isStatic = false }) {
  const tall = size === 'lg';

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-[4px] border border-[var(--border-subtle)]">
      <div
        className={`flex items-baseline justify-between gap-1 bg-[var(--color-yes-muted)] pl-3 pr-2 transition-colors duration-150 ${
          isStatic ? '' : 'group-hover:bg-[rgba(34,197,94,0.2)]'
        } ${tall ? 'py-3' : 'py-2'}`}
      >
        <span
          className={`font-heading font-bold uppercase tracking-[0.14em] text-[var(--color-yes)] ${
            tall ? 'text-sm' : 'text-[11px]'
          }`}
        >
          YES
        </span>
        <span
          className={`font-mono font-bold tabular-nums text-[var(--color-yes)] ${
            tall ? 'text-2xl md:text-3xl' : 'text-lg'
          }`}
        >
          {formatPrice(yesPrice)}
        </span>
      </div>
      <div
        className={`flex items-baseline justify-between gap-1 bg-[var(--color-no-muted)] pl-3 pr-2 transition-colors duration-150 ${
          isStatic ? '' : 'group-hover:bg-[rgba(239,68,68,0.2)]'
        } ${tall ? 'py-3' : 'py-2'}`}
      >
        <span
          className={`font-heading font-bold uppercase tracking-[0.14em] text-[var(--color-no)] ${
            tall ? 'text-sm' : 'text-[11px]'
          }`}
        >
          NO
        </span>
        <span
          className={`font-mono font-bold tabular-nums text-[var(--color-no)] ${
            tall ? 'text-2xl md:text-3xl' : 'text-lg'
          }`}
        >
          {formatPrice(noPrice)}
        </span>
      </div>
    </div>
  );
}
