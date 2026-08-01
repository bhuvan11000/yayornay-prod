import { useState, useMemo } from 'react';
import { useSell } from '../../hooks/useSell';
import { calculateSellRevenue } from '../../lib/amm';
import { formatCoins } from '../../lib/format';

export function SellForm({ prediction, market }) {
  const { mutate, isPending } = useSell();
  const [isOpen, setIsOpen] = useState(false);
  const [sharesToSell, setSharesToSell] = useState(prediction.shares.toString());

  const numShares = parseFloat(sharesToSell) || 0;
  const b = market.b || 100;

  const revenue = useMemo(() => {
    if (numShares <= 0 || numShares > prediction.shares) return 0;
    return calculateSellRevenue(
      market.q_yes,
      market.q_no,
      b,
      prediction.position,
      numShares
    );
  }, [market.q_yes, market.q_no, b, prediction.position, prediction.shares, numShares]);

  const isValid = numShares > 0 && numShares <= prediction.shares && !isPending;

  const handleSell = (e) => {
    e.preventDefault();
    if (!isValid) return;

    mutate(
      { prediction_id: prediction.id, shares_to_sell: numShares },
      {
        onSuccess: () => {
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] p-[var(--space-3)]">
      <div className="flex flex-wrap items-center gap-[var(--space-3)]">
        <span className="rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-2 py-[2px] font-heading text-sm font-bold">
          {prediction.position.toUpperCase()}
        </span>
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {prediction.shares.toFixed(1)} shares @ {Math.round(prediction.entry_price * 100)}c
        </span>
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          Spent: {formatCoins(prediction.coins_spent)}
        </span>
      </div>

      {!isOpen ? (
        <button
          className={`btn-ghost btn-sm shrink-0`}
          onClick={() => setIsOpen(true)}
        >
          Sell
        </button>
      ) : (
        <form className="flex w-full flex-col gap-[var(--space-2)]" onSubmit={handleSell}>
          <div className="flex items-center gap-[var(--space-2)]">
            <input
              className="max-w-[120px] flex-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-[var(--space-3)] py-[var(--space-2)] font-mono text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)]"
              type="number"
              min={1}
              max={prediction.shares}
              step={0.1}
              value={sharesToSell}
              onChange={(e) => setSharesToSell(e.target.value)}
            />
            <span className="cursor-pointer rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1)] text-xs font-semibold text-[var(--accent-blue)] hover:bg-[var(--accent-blue-muted)]" onClick={() => setSharesToSell(prediction.shares.toString())}>
              Max
            </span>
          </div>
          {numShares > 0 && (
            <p className="font-mono text-xs font-semibold text-[var(--color-yes)]">
              You&apos;ll receive ~{Math.floor(revenue)} coins
            </p>
          )}
          <div className="flex gap-[var(--space-2)]">
            <button type="submit" className="btn-primary btn-sm" disabled={!isValid}>
              {isPending ? 'Selling...' : 'Confirm'}
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => { setIsOpen(false); setSharesToSell(prediction.shares.toString()); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
