import { useState, useMemo, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { usePredict } from '../../hooks/usePredict';
import { calculateShares, getPrice } from '../../lib/amm';
import { formatCoins, formatPrice } from '../../lib/format';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Button } from '../ui/Button';

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
      <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
        <h3 className="font-heading text-lg font-semibold uppercase tracking-[0.04em]">Market Closed</h3>
        <p className="text-sm text-[var(--text-muted)]">This market is no longer accepting predictions.</p>
      </div>
    );
  }

  const positionButton = (pos) => {
    const yes = pos === 'yes';
    const selected = position === pos;
    const color = yes ? 'var(--color-yes)' : 'var(--color-no)';
    const border = yes ? 'var(--color-yes-border)' : 'var(--color-no-border)';
    const muted = yes ? 'var(--color-yes-muted)' : 'var(--color-no-muted)';
    const price = yes ? market.yes_price : market.no_price;

    return (
      <button
        type="button"
        className={`flex w-full cursor-pointer flex-col items-center gap-0.5 rounded-[3px] border px-4 py-2.5 font-heading font-bold uppercase tracking-[0.1em] transition-all duration-150 ${
          selected
            ? 'border-transparent text-white shadow-[var(--shadow-sm)]'
            : ''
        }`}
        style={{
          background: selected ? color : muted,
          borderColor: selected ? color : border,
          color: selected ? '#fff' : color,
        }}
        onClick={() => setPosition(pos)}
        aria-pressed={selected}
      >
        <span className="text-base leading-none">{yes ? 'Yes' : 'No'}</span>
        <span className="font-mono text-sm font-bold tabular-nums" style={{ color: selected ? '#fff' : color }}>
          {formatPrice(price)}
        </span>
      </button>
    );
  };

  return (
    <form className="flex flex-col gap-4 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold uppercase tracking-[0.06em]">Bet Slip</h3>
        <span className="eyebrow">Buy shares</span>
      </div>

      <div>
        <span className="eyebrow mb-1.5 block">Your position</span>
        <div className="flex gap-2">
          {positionButton('yes')}
          {positionButton('no')}
        </div>
      </div>

      <div>
        <span className="eyebrow mb-1.5 block">Amount (coins)</span>
        <div className="flex items-center gap-2 rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--border-focus)] focus-within:shadow-[0_0_0_3px_rgba(245,165,36,0.13)]">
          <Coins size={15} className="shrink-0 text-[var(--color-warning)]" />
          <input
            className="flex-1 bg-transparent py-2.5 font-mono text-base text-[var(--text-primary)] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            type="number"
            min={10}
            max={10000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10 – 10,000"
          />
        </div>
        {numAmount > 0 && numAmount < 10 && (
          <p className="mt-1 text-xs text-[var(--color-no)]">Minimum: 10 coins</p>
        )}
      </div>

      <div>
        <span className="eyebrow mb-1.5 block">Confidence</span>
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
              className="flex-1 rounded-[3px] bg-[var(--bg-input)] font-heading text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] data-[state=on]:bg-[var(--accent-amber)] data-[state=on]:text-[var(--primary-foreground)]"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="mt-1 text-right font-mono text-[11px] text-[var(--text-muted)]">Max spend: {formatCoins(totalCost)} coins</p>
      </div>

      {position && numAmount >= 10 && (
        <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-3">
          <div className="flex items-center justify-between">
            <span className="eyebrow">You receive</span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
              ~{Math.round(projectedShares)} shares
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="eyebrow">Total cost</span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
              {formatCoins(totalCost)} coins
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="eyebrow">Entry price</span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
              ~{formatPrice(currentPrice)}
            </span>
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

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending}
        disabled={!isValid || isPending}
        className="w-full"
      >
        {isPending
          ? 'Placing…'
          : position
            ? `Buy ${position.toUpperCase()} ${formatPrice(currentPrice)}`
            : 'Select a Position'}
      </Button>
    </form>
  );
}
