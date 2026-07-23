import { useState, useMemo } from 'react';
import { useSell } from '../../hooks/useSell';
import { calculateSellRevenue } from '../../lib/amm';
import { formatCoins } from '../../lib/format';
import styles from './SellForm.module.css';

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
    <div className={styles.wrapper}>
      <div className={styles.info}>
        <span className={styles.position}>
          {prediction.position.toUpperCase()}
        </span>
        <span className={styles.detail}>
          {prediction.shares.toFixed(1)} shares @ {Math.round(prediction.entry_price * 100)}c
        </span>
        <span className={styles.detail}>
          Spent: {formatCoins(prediction.coins_spent)}
        </span>
      </div>

      {!isOpen ? (
        <button
          className={`btn-ghost btn-sm ${styles.sellBtn}`}
          onClick={() => setIsOpen(true)}
        >
          Sell
        </button>
      ) : (
        <form className={styles.sellForm} onSubmit={handleSell}>
          <div className={styles.sellInputWrap}>
            <input
              className={styles.sellInput}
              type="number"
              min={1}
              max={prediction.shares}
              step={0.1}
              value={sharesToSell}
              onChange={(e) => setSharesToSell(e.target.value)}
            />
            <span className={styles.sellMax} onClick={() => setSharesToSell(prediction.shares.toString())}>
              Max
            </span>
          </div>
          {numShares > 0 && (
            <p className={styles.revenue}>
              You&apos;ll receive ~{Math.floor(revenue)} coins
            </p>
          )}
          <div className={styles.sellActions}>
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