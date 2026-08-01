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
    <div className="flex h-[28px] w-full overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)]">
      <div className="flex min-w-0 items-center justify-start bg-[var(--color-yes)] pl-2 transition-[width] duration-300" style={{ width: mounted ? `${yesPct}%` : '0%' }}>
        <span className="font-mono text-xs font-bold leading-none whitespace-nowrap text-white">YES {yesPct}%</span>
      </div>
      <div className="flex min-w-0 items-center justify-end bg-[var(--color-no)] pr-2 transition-[width] duration-300" style={{ width: mounted ? `${noPct}%` : '0%' }}>
        <span className="font-mono text-xs font-bold leading-none whitespace-nowrap text-white">NO {noPct}%</span>
      </div>
    </div>
  );
}
