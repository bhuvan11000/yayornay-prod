import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Coins } from 'lucide-react';

export function CoinAnimation({ amount, position }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const isGain = amount > 0;
  const prefix = isGain ? '+' : '\u2212';
  const absAmount = Math.abs(amount);

  return createPortal(
    <div
      className={`coin-float pointer-events-none fixed z-[var(--z-toast)] flex items-center gap-1 font-mono text-sm font-bold ${isGain ? 'text-[var(--color-yes)]' : 'text-[var(--color-no)]'}`}
      style={{
        left: position?.x ?? '50%',
        top: position?.y ?? '50%',
      }}
    >
      <Coins size={14} className="shrink-0" />
      <span>{prefix}{absAmount.toLocaleString()}</span>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
