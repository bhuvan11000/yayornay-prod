import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePredict } from '../../hooks/usePredict';
import { calculateShares, getPrice } from '../../lib/amm';
import { formatCoins } from '../../lib/format';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import ClickSpark from '../reactbits/ClickSpark/ClickSpark';
import StarBorder from '../reactbits/StarBorder/StarBorder';
import CountUp from '../reactbits/CountUp/CountUp';

const CONFIDENCE_OPTIONS = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 5, label: '5x' },
];

function useDebounced(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function PredictionForm({ market, onSuccess }) {
  const user = useAuthStore((s) => s.user);
  const { mutate, isPending, error: mutationError } = usePredict();

  const [position, setPosition] = useState(null);
  const [amount, setAmount] = useState('');
  const [confidence, setConfidence] = useState(1);

  const debouncedAmount = useDebounced(amount, 200);
  const numAmount = parseInt(debouncedAmount, 10) || 0;
  const totalCost = numAmount * confidence;
  const b = market.b || 100;
  const currentPrice = position
    ? getPrice(market.q_yes, market.q_no, b, position)
    : 0.5;

  const projectedShares = useMemo(() => {
    if (!position || numAmount < 10) return 0;
    return calculateShares(market.q_yes, market.q_no, b, position, totalCost);
  }, [market.q_yes, market.q_no, b, position, totalCost]);

  const isExpired = market.closes_at && new Date(market.closes_at) <= new Date();
  const hasEnoughCoins = user?.coins >= totalCost;
  const isValid = position && numAmount >= 10 && hasEnoughCoins && !isExpired;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid || isPending) return;

    mutate(
      {
        market_id: market.id,
        position,
        coins: numAmount,
        confidence,
      },
      {
        onSuccess: () => {
          setPosition(null);
          setAmount('');
          setConfidence(1);
          onSuccess?.();
        },
      }
    );
  };

  if (isExpired) {
    return (
      <div className="card flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-[var(--space-5)]">
        <h3 className="font-heading text-lg font-semibold">Market Closed</h3>
        <p className="text-muted text-sm">This market is no longer accepting predictions.</p>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-[var(--space-5)]" onSubmit={handleSubmit}>
      <h3 className="font-heading text-lg font-semibold">Place Prediction</h3>

      <label className="text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-muted)]">Your Position</label>
      <div className="flex gap-[var(--space-2)]">
        <ClickSpark sparkColor="#22c55e" className="relative flex-1">
          <button
            type="button"
            className={`flex w-full flex-1 cursor-pointer items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-3)] font-heading text-base font-bold transition-all duration-[var(--transition-fast)] hover:bg-[rgba(34,197,94,0.25)] ${
              position === 'yes'
                ? 'border border-[var(--color-yes)] bg-[var(--color-yes)] text-white'
                : 'border border-[var(--color-yes-border)] bg-[var(--color-yes-muted)] text-[var(--color-yes)]'
            }`}
            onClick={() => setPosition('yes')}
          >
            YES {market.yes_price != null && `${Math.round(market.yes_price * 100)}c`}
          </button>
        </ClickSpark>
        <ClickSpark sparkColor="#ef4444" className="relative flex-1">
          <button
            type="button"
            className={`flex w-full flex-1 cursor-pointer items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-3)] font-heading text-base font-bold transition-all duration-[var(--transition-fast)] hover:bg-[rgba(239,68,68,0.25)] ${
              position === 'no'
                ? 'border border-[var(--color-no)] bg-[var(--color-no)] text-white'
                : 'border border-[var(--color-no-border)] bg-[var(--color-no-muted)] text-[var(--color-no)]'
            }`}
            onClick={() => setPosition('no')}
          >
            NO {market.no_price != null && `${Math.round(market.no_price * 100)}c`}
          </button>
        </ClickSpark>
      </div>

      <label className="text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-muted)]">Amount (coins)</label>
      <div className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-[var(--space-3)] focus-within:border-[var(--border-focus)] focus-within:shadow-[0_0_0_3px_rgba(79,125,245,0.15)]">
        <span className="text-sm leading-none">🪙</span>
        <input
          className="flex-1 bg-transparent py-[var(--space-3)] font-mono text-base text-[var(--text-primary)] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          type="number"
          min={10}
          max={10000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10 – 10,000"
        />
      </div>
      {numAmount > 0 && numAmount < 10 && (
        <p className="text-xs text-[var(--color-no)]">Minimum: 10 coins</p>
      )}

      <label className="text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-muted)]">Confidence</label>
      <ToggleGroup
        type="single"
        value={String(confidence)}
        onValueChange={(v) => v && setConfidence(Number(v))}
        className="w-full"
      >
        {CONFIDENCE_OPTIONS.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={String(opt.value)}
            variant="outline"
            className="flex-1 bg-[var(--bg-input)] text-[var(--text-secondary)] data-[state=on]:bg-[var(--accent-blue)] data-[state=on]:text-white"
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-right font-mono text-xs text-[var(--text-muted)]">Max spend: {formatCoins(totalCost)} coins</p>

      {position && numAmount >= 10 && (
        <div className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] p-[var(--space-3)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">You receive</span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
              ~<CountUp to={projectedShares} from={0} duration={0.4} /> shares
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Total cost</span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
              <CountUp to={totalCost} from={0} duration={0.4} /> coins
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Entry price</span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">~{Math.round(currentPrice * 100)}c</span>
          </div>
        </div>
      )}

      {!hasEnoughCoins && numAmount > 0 && (
        <p className="text-xs text-[var(--color-no)]">
          Insufficient coins. You have {formatCoins(user?.coins || 0)}.
        </p>
      )}

      {mutationError && (
        <p className="text-xs text-[var(--color-no)]">{mutationError.message}</p>
      )}

      <ClickSpark
        sparkColor="#4f7df5"
        className="relative w-full"
      >
        <StarBorder
          as="button"
          type="submit"
          color="#4f7df5"
          speed="6s"
          className="w-full rounded-[var(--radius-md)]"
          contentClassName={`w-full justify-center mt-[var(--space-1)] ${isValid && !isPending ? 'btn-primary' : ''}`}
          disabled={!isValid || isPending}
        >
          {isPending
            ? 'Placing...'
            : position
              ? `Predict ${position.toUpperCase()}`
              : 'Select a Position'}
        </StarBorder>
      </ClickSpark>
    </form>
  );
}
