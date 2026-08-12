import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePredict } from '../../hooks/usePredict';
import { useSell } from '../../hooks/useSell';
import { calculateShares, getPrice, calculateSellRevenue } from '../../lib/amm';
import { formatCoins, formatPrice } from '../../lib/format';
import ElasticSlider from '../reactbits/ElasticSlider/ElasticSlider';

const QUICK_ADD = [10, 50, 200];

function useDebounced(value, delay = 150) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Buy Tab ─────────────────────────────────────────────────── */
function BuyTab({ market, onSuccess, pendingPredictions = [] }) {
  const user = useAuthStore((s) => s.user);
  const { mutate, isPending, error: mutationError } = usePredict();

  const [position, setPosition] = useState(null);
  const [amount, setAmount] = useState(0);
  const confidence = 1;

  const debouncedAmount = useDebounced(amount, 150);
  const numAmount = parseInt(debouncedAmount, 10) || 0;
  const totalCost = numAmount * confidence;
  const b = market.b || 100;

  const currentPrice = position ? getPrice(market.q_yes, market.q_no, b, position) : null;

  const projectedShares = useMemo(() => {
    if (!position || numAmount < 10) return 0;
    return calculateShares(market.q_yes, market.q_no, b, position, totalCost);
  }, [market.q_yes, market.q_no, b, position, totalCost]);

  const hasEnoughCoins = user?.coins >= totalCost;
  const isValid = position && numAmount >= 10 && hasEnoughCoins;

  // Warn if user already holds the OPPOSITE side on this market
  const opposingHolding = position
    ? pendingPredictions.find((p) => p.position !== position && p.result === 'pending')
    : null;

  const handleAddAmount = (val) =>
    setAmount((prev) => (parseInt(prev, 10) || 0) + val);

  const handleSetMax = () => {
    if (user?.coins) setAmount(Math.min(user.coins, 10000));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid || isPending) return;
    mutate(
      { market_id: market.id, position, coins: numAmount, confidence },
      {
        onSuccess: () => {
          setPosition(null);
          setAmount(0);
          onSuccess?.();
        },
      }
    );
  };

  const potentialPayout = Math.round(projectedShares);
  const potentialProfit = potentialPayout - totalCost;

  const positionButton = (pos) => {
    const isYes = pos === 'yes';
    const selected = position === pos;
    const price = isYes ? market.yes_price : market.no_price;
    const priceDisplay = `${Math.round(price * 100)}¢`;

    const selectedBg = isYes
      ? 'linear-gradient(135deg, #16a34a, #22c55e)'
      : 'linear-gradient(135deg, #b91c1c, #ef4444)';
    const selectedShadow = isYes
      ? '0 4px 14px rgba(34,197,94,0.35)'
      : '0 4px 14px rgba(239,68,68,0.35)';

    return (
      <button
        key={pos}
        type="button"
        onClick={() => setPosition(pos)}
        aria-pressed={selected}
        className="bet-position-btn"
        style={{
          background: selected ? selectedBg : isYes ? 'var(--color-yes-muted)' : 'var(--color-no-muted)',
          border: selected ? 'none' : `1.5px solid ${isYes ? 'var(--color-yes-border)' : 'var(--color-no-border)'}`,
          color: selected ? '#fff' : isYes ? 'var(--color-yes)' : 'var(--color-no)',
          boxShadow: selected ? selectedShadow : 'none',
          transform: selected ? 'translateY(-1px)' : 'none',
        }}
      >
        <span className="bet-position-label">{isYes ? 'Yes' : 'No'}</span>
        <span className="bet-position-price">{priceDisplay}</span>
      </button>
    );
  };

  return (
    <form onSubmit={handleSubmit} id="bet-buy-form" style={{ display: 'contents' }}>
      {/* Yes / No */}
      <div className="bet-position-row" role="group" aria-label="Choose position">
        {positionButton('yes')}
        {positionButton('no')}
      </div>

      {/* Opposing-position warning */}
      {opposingHolding && (
        <div className="bet-hedge-warning" role="alert">
          <span className="bet-hedge-warning-icon">⚠</span>
          <div className="bet-hedge-warning-body">
            <p className="bet-hedge-warning-title">
              You already hold {opposingHolding.shares.toFixed(1)} {opposingHolding.position.toUpperCase()} shares here.
            </p>
            <p className="bet-hedge-warning-detail">
              Buying the opposite side costs extra in spread — you'll pay twice to move the market both ways. Consider selling your {opposingHolding.position.toUpperCase()} position first from the <strong>Sell</strong> tab instead.
            </p>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="bet-amount-section">
        <div className="bet-amount-row">
          <span className="bet-amount-label">Amount</span>
          <div className="bet-amount-display">
            <input
              id="bet-amount-input"
              type="number"
              min={0}
              max={10000}
              value={amount === 0 ? '' : amount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setAmount(isNaN(v) ? 0 : Math.min(v, 10000));
              }}
              placeholder="0"
              className="bet-amount-input"
              aria-label="Bet amount in coins"
            />
            <span className="bet-amount-unit">coins</span>
          </div>
        </div>
        <div className="bet-quick-row">
          {QUICK_ADD.map((val) => (
            <button key={val} type="button" className="bet-quick-btn" onClick={() => handleAddAmount(val)}>
              +{val}
            </button>
          ))}
          <button type="button" className="bet-quick-btn bet-quick-max" onClick={handleSetMax}>
            Max
          </button>
        </div>
        {numAmount > 0 && numAmount < 10 && (
          <p className="bet-error-msg">Minimum bet is 10 coins</p>
        )}
        {!hasEnoughCoins && numAmount > 0 && (
          <p className="bet-error-msg">Not enough coins — you have {formatCoins(user?.coins || 0)}</p>
        )}
      </div>

      {/* Order summary */}
      {position && numAmount >= 10 && (
        <div className="bet-summary">
          <div className="bet-summary-row">
            <span className="bet-summary-label">Avg price</span>
            <span className="bet-summary-value">~{formatPrice(currentPrice)}</span>
          </div>
          <div className="bet-summary-row">
            <span className="bet-summary-label">Shares</span>
            <span className="bet-summary-value">~{Math.round(projectedShares)}</span>
          </div>
          <div className="bet-summary-row">
            <span className="bet-summary-label">Potential payout</span>
            <span className="bet-summary-value" style={{ color: 'var(--color-yes)' }}>
              {formatCoins(potentialPayout)} coins
            </span>
          </div>
          {potentialProfit > 0 && (
            <div className="bet-summary-row">
              <span className="bet-summary-label">Potential profit</span>
              <span className="bet-summary-value" style={{ color: 'var(--color-yes)' }}>
                +{formatCoins(potentialProfit)} coins
              </span>
            </div>
          )}
        </div>
      )}

      {mutationError && <p className="bet-error-msg">{mutationError.message}</p>}

      <button
        id="bet-trade-btn"
        type="submit"
        disabled={!isValid || isPending}
        className="bet-trade-btn"
        style={{
          background: isValid
            ? position === 'yes'
              ? 'linear-gradient(135deg, #16a34a, #22c55e)'
              : 'linear-gradient(135deg, #b91c1c, #ef4444)'
            : undefined,
          boxShadow: isValid
            ? position === 'yes'
              ? '0 4px 18px rgba(34,197,94,0.3)'
              : '0 4px 18px rgba(239,68,68,0.3)'
            : undefined,
        }}
      >
        {isPending ? 'Placing bet…' : !position ? 'Select YES or NO' : numAmount < 10 ? 'Enter amount (min 10)' : !hasEnoughCoins ? 'Insufficient coins' : `Trade ${position.toUpperCase()}`}
      </button>
    </form>
  );
}

/* ─── Sell Tab ─────────────────────────────────────────────────── */
function SellTab({ market, predictions, onSuccess }) {
  const b = market.b || 100;
  const { mutate, isPending, error: sellError } = useSell();

  // Which prediction the user picked
  const [selectedId, setSelectedId] = useState(() => predictions[0]?.id ?? null);
  const [sharesToSell, setSharesToSell] = useState(0);

  const prediction = predictions.find((p) => p.id === selectedId) ?? predictions[0];

  // Reset shares when prediction changes
  useEffect(() => {
    setSharesToSell(0);
  }, [selectedId]);

  const numShares = parseFloat(sharesToSell) || 0;

  const revenue = useMemo(() => {
    if (!prediction || numShares <= 0 || numShares > prediction.shares) return 0;
    return calculateSellRevenue(market.q_yes, market.q_no, b, prediction.position, numShares);
  }, [market.q_yes, market.q_no, b, prediction, numShares]);

  const isValid = prediction && numShares > 0 && numShares <= prediction.shares && !isPending;

  const handleSellFraction = (fraction) => {
    if (!prediction) return;
    // Use the exact DB value for MAX (fraction === 1) to avoid floating-point
    // rounding causing the SQL check (p_shares_to_sell > v_prediction.shares) to fire.
    setSharesToSell(fraction === 1 ? prediction.shares : parseFloat((prediction.shares * fraction).toFixed(2)));
  };

  // Key to force ElasticSlider to re-sync when prediction changes
  const sliderKey = prediction?.id ?? 'no-prediction';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    mutate(
      { prediction_id: prediction.id, shares_to_sell: numShares },
      { onSuccess: () => { setSharesToSell(0); onSuccess?.(); } }
    );
  };

  if (!predictions || predictions.length === 0) {
    return (
      <div className="bet-empty-sell">
        <p>You have no open positions to sell on this market.</p>
      </div>
    );
  }

  const isYes = prediction?.position === 'yes';
  const positionColor = isYes ? 'var(--color-yes)' : 'var(--color-no)';

  return (
    <form onSubmit={handleSubmit} id="bet-sell-form" style={{ display: 'contents' }}>
      {/* Position selector — only show if multiple predictions */}
      {predictions.length > 1 && (
        <div className="bet-sell-position-select">
          <span className="bet-amount-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Your positions</span>
          <div className="bet-position-row">
            {predictions.map((p) => {
              const sel = p.id === selectedId;
              const pIsYes = p.position === 'yes';
              return (
                <button
                  key={p.id}
                  type="button"
                  className="bet-position-btn"
                  onClick={() => setSelectedId(p.id)}
                  aria-pressed={sel}
                  style={{
                    background: sel
                      ? pIsYes ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#b91c1c,#ef4444)'
                      : pIsYes ? 'var(--color-yes-muted)' : 'var(--color-no-muted)',
                    border: sel ? 'none' : `1.5px solid ${pIsYes ? 'var(--color-yes-border)' : 'var(--color-no-border)'}`,
                    color: sel ? '#fff' : pIsYes ? 'var(--color-yes)' : 'var(--color-no)',
                    boxShadow: sel ? (pIsYes ? '0 4px 14px rgba(34,197,94,0.35)' : '0 4px 14px rgba(239,68,68,0.35)') : 'none',
                  }}
                >
                  <span className="bet-position-label">{p.position.toUpperCase()}</span>
                  <span className="bet-position-price">{p.shares.toFixed(2)} sh</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Position summary chip */}
      {predictions.length === 1 && prediction && (
        <div className="bet-sell-chip" style={{ borderColor: isYes ? 'var(--color-yes-border)' : 'var(--color-no-border)', background: isYes ? 'var(--color-yes-muted)' : 'var(--color-no-muted)' }}>
          <span className="bet-sell-chip-label" style={{ color: positionColor }}>
            {prediction.position.toUpperCase()}
          </span>
          <span className="bet-sell-chip-detail">
            {prediction.shares.toFixed(2)} shares @ {Math.round(prediction.entry_price * 100)}¢
          </span>
        </div>
      )}

      {/* Shares to sell */}
      {prediction && (
        <>
          <div className="bet-amount-section">
            <div className="bet-amount-row">
              <span className="bet-amount-label">Shares to sell</span>
              <div className="bet-amount-display">
                <input
                  id="bet-sell-shares-input"
                  type="number"
                  min={0}
                  max={prediction.shares}
                  step={0.01}
                  value={sharesToSell === 0 ? '' : sharesToSell}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setSharesToSell(isNaN(v) ? 0 : Math.min(v, prediction.shares));
                  }}
                  placeholder="0"
                  className="bet-amount-input"
                  aria-label="Shares to sell"
                />
                <span className="bet-amount-unit">/ {prediction.shares.toFixed(2)}</span>
              </div>
            </div>

            {/* Elastic slider — same component as Your Positions */}
            <ElasticSlider
              key={sliderKey}
              className="w-full mt-1"
              defaultValue={typeof sharesToSell === 'number' ? sharesToSell : 0}
              startingValue={0}
              maxValue={prediction.shares}
              isStepped
              stepSize={0.01}
              onChange={(v) => setSharesToSell(v === 0 ? 0 : v)}
              leftIcon={
                <span
                  className="cursor-pointer font-heading text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  onClick={() => setSharesToSell(0)}
                >
                  Min
                </span>
              }
              rightIcon={
                <span
                  className="cursor-pointer font-heading text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-amber)] hover:text-[var(--accent-amber-hover)]"
                  onClick={() => setSharesToSell(prediction.shares)}
                >
                  Max
                </span>
              }
            />

            {numShares > prediction.shares && (
              <p className="bet-error-msg">You only hold {prediction.shares.toFixed(2)} shares</p>
            )}
          </div>

          {/* Revenue summary */}
          {numShares > 0 && numShares <= prediction.shares && (
            <div className="bet-summary">
              <div className="bet-summary-row">
                <span className="bet-summary-label">Shares selling</span>
                <span className="bet-summary-value">{numShares.toFixed(2)}</span>
              </div>
              <div className="bet-summary-row">
                <span className="bet-summary-label">Est. return</span>
                <span className="bet-summary-value" style={{ color: 'var(--color-yes)' }}>
                  ~{formatCoins(Math.floor(revenue))} coins
                </span>
              </div>
              <div className="bet-summary-row">
                <span className="bet-summary-label">Originally spent</span>
                <span className="bet-summary-value">{formatCoins(prediction.coins_spent)} coins</span>
              </div>
            </div>
          )}
        </>
      )}

      {sellError && <p className="bet-error-msg">{sellError.message}</p>}

      <button
        id="bet-sell-btn"
        type="submit"
        disabled={!isValid}
        className="bet-trade-btn"
        style={{
          background: isValid
            ? isYes
              ? 'linear-gradient(135deg, #16a34a, #22c55e)'
              : 'linear-gradient(135deg, #b91c1c, #ef4444)'
            : undefined,
          boxShadow: isValid
            ? isYes
              ? '0 4px 18px rgba(34,197,94,0.3)'
              : '0 4px 18px rgba(239,68,68,0.3)'
            : undefined,
        }}
      >
        {isPending
          ? 'Selling…'
          : numShares <= 0
            ? 'Enter shares to sell'
            : `Sell ${prediction?.position?.toUpperCase() ?? ''}`}
      </button>
    </form>
  );
}

/* ─── Main BetSlip (shell with tabs) ─────────────────────────── */
export function PredictionForm({ market, onSuccess, pendingPredictions = [] }) {
  const isExpired = market.closes_at && new Date(market.closes_at) <= new Date();
  const [tab, setTab] = useState('buy');

  if (isExpired) {
    return (
      <div className="bet-slip-card">
        <h3 className="font-heading text-lg font-semibold uppercase tracking-[0.04em]">Market Closed</h3>
        <p className="text-sm text-[var(--text-muted)]">This market is no longer accepting predictions.</p>
      </div>
    );
  }

  return (
    <div className="bet-slip-card">
      {/* Header: Buy | Sell tabs + Market badge */}
      <div className="bet-slip-header">
        <div className="bet-slip-tabs">
          <button
            type="button"
            className={tab === 'buy' ? 'bet-tab-active' : 'bet-tab-inactive'}
            onClick={() => setTab('buy')}
            id="bet-tab-buy"
          >
            Buy
          </button>
          <button
            type="button"
            className={tab === 'sell' ? 'bet-tab-active' : 'bet-tab-inactive'}
            onClick={() => setTab('sell')}
            id="bet-tab-sell"
          >
            Sell
          </button>
        </div>
        <span className="bet-market-badge">Market</span>
      </div>

      {tab === 'buy' ? (
        <BuyTab market={market} onSuccess={onSuccess} pendingPredictions={pendingPredictions} />
      ) : (
        <SellTab market={market} predictions={pendingPredictions} onSuccess={onSuccess} />
      )}
    </div>
  );
}
