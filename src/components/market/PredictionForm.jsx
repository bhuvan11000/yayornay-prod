import { useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePredict } from '../../hooks/usePredict';
import { calculateShares, getPrice } from '../../lib/amm';
import { formatCoins } from '../../lib/format';
import styles from './PredictionForm.module.css';

const CONFIDENCE_OPTIONS = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 5, label: '5x' },
];

export function PredictionForm({ market, onSuccess }) {
  const user = useAuthStore((s) => s.user);
  const { mutate, isPending, error: mutationError } = usePredict();

  const [position, setPosition] = useState(null);
  const [amount, setAmount] = useState('');
  const [confidence, setConfidence] = useState(1);

  const numAmount = parseInt(amount, 10) || 0;
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
      <div className={`${styles.card} card`}>
        <h3 className={styles.title}>Market Closed</h3>
        <p className="text-muted text-sm">This market is no longer accepting predictions.</p>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Place Prediction</h3>

      <label className={styles.label}>Your Position</label>
      <div className={styles.positionRow}>
        <button
          type="button"
          className={`${styles.posBtn} ${position === 'yes' ? styles.posYesActive : styles.posYes}`}
          onClick={() => setPosition('yes')}
        >
          YES {market.yes_price != null && `${Math.round(market.yes_price * 100)}c`}
        </button>
        <button
          type="button"
          className={`${styles.posBtn} ${position === 'no' ? styles.posNoActive : styles.posNo}`}
          onClick={() => setPosition('no')}
        >
          NO {market.no_price != null && `${Math.round(market.no_price * 100)}c`}
        </button>
      </div>

      <label className={styles.label}>Amount (coins)</label>
      <div className={styles.inputWrap}>
        <span className={styles.inputPrefix}>🪙</span>
        <input
          className={styles.input}
          type="number"
          min={10}
          max={10000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10 – 10,000"
        />
      </div>
      {numAmount > 0 && numAmount < 10 && (
        <p className={styles.error}>Minimum: 10 coins</p>
      )}

      <label className={styles.label}>Confidence</label>
      <div className={styles.confidenceRow}>
        {CONFIDENCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`${styles.confBtn} ${confidence === opt.value ? styles.confActive : ''}`}
            onClick={() => setConfidence(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className={styles.hint}>Max spend: {formatCoins(totalCost)} coins</p>

      {position && numAmount >= 10 && (
        <div className={styles.preview}>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>You receive</span>
            <span className={styles.previewValue}>~{projectedShares.toFixed(1)} shares</span>
          </div>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>Total cost</span>
            <span className={styles.previewValue}>{formatCoins(totalCost)} coins</span>
          </div>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>Entry price</span>
            <span className={styles.previewValue}>~{Math.round(currentPrice * 100)}c</span>
          </div>
        </div>
      )}

      {!hasEnoughCoins && numAmount > 0 && (
        <p className={styles.error}>
          Insufficient coins. You have {formatCoins(user?.coins || 0)}.
        </p>
      )}

      {mutationError && (
        <p className={styles.error}>{mutationError.message}</p>
      )}

      <button
        type="submit"
        className={`btn-primary ${styles.submitBtn}`}
        disabled={!isValid || isPending}
      >
        {isPending
          ? 'Placing...'
          : position
            ? `Predict ${position.toUpperCase()}`
            : 'Select a Position'}
      </button>
    </form>
  );
}