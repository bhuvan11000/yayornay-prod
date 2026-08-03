import { useState, useEffect } from 'react';
import { formatPercent } from '../../lib/format';

export function PriceBar({ yesPrice = 0.5, noPrice = 0.5 }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const yesPct = Math.round(yesPrice * 100);
  const noPct = Math.round(noPrice * 100);

  return (
    <div className="flex items-center gap-1.5">
      {/* YES label - always outside on the left */}
      <span className="shrink-0 font-mono text-xs font-bold text-[var(--color-yes)] w-[52px]">
        YES {yesPct}%
      </span>
      {/* Bar */}
      <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
        <div
          className="rounded-l-full bg-[var(--color-yes)] transition-[width] duration-300"
          style={{ width: mounted ? `${yesPct}%` : '0%' }}
        />
        <div
          className="rounded-r-full bg-[var(--color-no)] transition-[width] duration-300"
          style={{ width: mounted ? `${noPct}%` : '0%' }}
        />
      </div>
      {/* NO label - always outside on the right */}
      <span className="shrink-0 font-mono text-xs font-bold text-[var(--color-no)] w-[44px] text-right">
        NO {noPct}%
      </span>
    </div>
  );
}
