import { useEffect, useState } from 'react';
import { useMarkets } from '../../hooks/useMarkets';
import { formatPrice } from '../../lib/format';
import ScrollVelocity from '../reactbits/ScrollVelocity/ScrollVelocity';

/**
 * Ticker — the arena's live board tape.
 * A continuous marquee of the most active markets and their YES/NO
 * prices, like the ticker running around a stadium. The tape's
 * direction reacts to page scroll velocity.
 */

function MarketEntry({ market }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5">
      <span className="font-heading text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
        {market.title}
      </span>
      <span className="font-mono text-[13px] font-semibold text-[var(--color-yes)]">
        YES {formatPrice(market.yes_price)}
      </span>
      <span className="font-mono text-[13px] font-semibold text-[var(--color-no)]">
        NO {formatPrice(market.no_price)}
      </span>
      <span className="ml-1 inline-block size-1 rotate-45 bg-[var(--accent-amber)] opacity-50" />
    </span>
  );
}

export function Ticker() {
  const { data, isLoading } = useMarkets({ status: 'open', sort: 'volume', limit: 12, page: 1 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const markets = data?.markets || [];

  return (
    <div className="relative flex h-8 items-stretch overflow-hidden border-b border-[var(--border-subtle)] bg-[#0d110f]">
      {/* Tape */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        {markets.length > 0 ? (
          reduceMotion ? (
            <div className="flex h-full items-center overflow-x-auto">
              {markets.map((m) => (
                <MarketEntry key={m.id} market={m} />
              ))}
            </div>
          ) : (
            <ScrollVelocity
              velocity={70}
              numCopies={3}
              scrollerClassName="!text-[13px] !tracking-normal !drop-shadow-none"
              scrollerStyle={{ lineHeight: '32px', fontSize: 13 }}
            >
              <span className="flex items-center">
                {markets.map((m) => (
                  <MarketEntry key={m.id} market={m} />
                ))}
              </span>
            </ScrollVelocity>
          )
        ) : isLoading ? null : (
          <span className="flex h-full items-center px-4 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Board quiet — new markets drop at 08:00 UTC
          </span>
        )}

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0d110f] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0d110f] to-transparent" />
      </div>
    </div>
  );
}
