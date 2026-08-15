import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Autoplay from 'embla-carousel-autoplay';
import { useAuthStore } from '../stores/authStore';
import { getRankColor } from '../lib/ranks';
import { useMarkets } from '../hooks/useMarkets';
import { useQuests } from '../hooks/useQuests';
import { useClaimReward } from '../hooks/useClaimReward';
import { MarketCard } from '../components/market/MarketCard';
import { Skeleton } from '../components/ui/Skeleton';
import { DailyRewardClaim } from '../components/gamification/DailyRewardClaim';
import { StreakCounter } from '../components/gamification/StreakCounter';
import { SeasonBanner } from '../components/gamification/SeasonBanner';
import { RankBadge } from '../components/gamification/RankBadge';
import { XPBar } from '../components/gamification/XPBar';
import Beams from '../components/reactbits/Beams/Beams';
import Counter from '../components/reactbits/Counter/Counter';
import DecryptedText from '../components/reactbits/DecryptedText/DecryptedText';
import RotatingText from '../components/reactbits/RotatingText/RotatingText';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '../components/ui/carousel';

const cellReveal = (i) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.08 * i, duration: 0.35, ease: 'easeOut' },
});

function SectionHeader({ eyebrow, title, to }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="mb-[3px] inline-block size-1.5 bg-[var(--accent-amber)]" />
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="font-heading text-xl font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
      </div>
      {to && (
        <Link
          to={to}
          className="group flex items-center gap-1 font-heading text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-amber)] transition-colors duration-150 hover:text-[var(--accent-amber-hover)]"
        >
          View All
          <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export default function Home() {  const user = useAuthStore((s) => s.user);
  const [reduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 4500,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
        playOnInit: !reduceMotion,
      }),
    [reduceMotion]
  );
  const { data: marketsData, isLoading: marketsLoading, isError: marketsError } = useMarkets({
    status: 'open',
    sort: 'volume',
    limit: 6,
    page: 1,
  });
  const { data: questsData } = useQuests();
  const { mutate: claimReward, isPending: claiming } = useClaimReward();

  const trendingMarkets = marketsData?.markets || [];
  const dailyQuests = questsData?.daily?.filter(q => !q.completed) || [];
  const weeklyQuests = questsData?.weekly?.filter(q => !q.completed) || [];

  const rankColor = user ? getRankColor(user.rank) : null;
  const beamColor = rankColor && !rankColor.startsWith('linear-gradient') ? rankColor : '#f5a524';

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      {/* ── Jumbotron: floodlights + season ticket ── */}
      <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-black">
        <div className="absolute inset-0 opacity-100">
          <Beams beamNumber={10} lightColor={beamColor} speed={1.6} noiseIntensity={1.2} scale={0.18} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.75)_100%)]" />
        <div className="relative flex min-h-[240px] flex-col justify-center gap-3 px-6 py-8 md:min-h-[280px] md:px-10">
          <div className="flex items-center gap-2">
            <span className="size-1.5 animate-pulse bg-[var(--accent-amber)]" />
            <p className="eyebrow">Season ticket</p>
          </div>
          <h1 className="font-heading text-[32px] font-bold uppercase leading-[1.02] tracking-[0.04em] text-[var(--text-primary)] md:text-[44px]">
            Welcome,{' '}
            <span className="text-[var(--accent-amber)]">
            {reduceMotion ? (
              user?.username || 'Player'
            ) : (
              <DecryptedText
                text={user?.username || 'Player'}
                animateOn="view"
                speed={80}
                maxIterations={8}
                sequential
                revealDirection="start"
                characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*0123456789"
              />
            )}
            </span>
          </h1>
          <p className="max-w-[420px] font-mono text-xs uppercase tracking-[0.14em]">
            <RotatingText
              texts={['Read the board.', 'Price the outcome.', 'Beat the odds.']}
              rotationInterval={2800}
              auto={!reduceMotion}
              mainClassName="text-[var(--accent-amber)]"
            />
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link to="/markets" className="btn-primary">Browse the Board</Link>
            <Link to="/leaderboard" className="btn-ghost">Standings</Link>
          </div>
        </div>
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent_10%,var(--accent-amber)_50%,transparent_90%)]" />
      </div>

      <SeasonBanner />

      {/* ── Player board strip ── */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] md:grid-cols-4">
        {[
          {
            label: 'Coins',
            content: (
              <Counter
                value={user?.coins || 0}
                fontSize={22}
                gap={3}
                textColor="var(--color-warning)"
                fontWeight={700}
                gradientHeight={10}
                gradientFrom="#121713"
                counterStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            ),
          },
          {
            label: 'Rank',
            content: user ? <RankBadge rank={user.rank} size="lg" showLabel /> : null,
          },
          {
            label: 'Streak',
            content: <StreakCounter streak={user?.betting_streak || 0} longest={user?.longest_streak} size="md" />,
          },
          {
            label: 'Level',
            content: <XPBar xp={user?.xp || 0} variant="mini" />,
          },
        ].map((cell, i) => (
          <motion.div
            key={cell.label}
            {...cellReveal(i)}
            className="flex flex-col items-start gap-1 border-[var(--border-subtle)] px-4 py-3.5 max-md:odd:border-r max-md:[&:nth-child(-n+2)]:border-b md:border-r md:last:border-r-0"
          >
            <span className="eyebrow">{cell.label}</span>
            <div className="flex min-h-7 items-center">{cell.content}</div>
          </motion.div>
        ))}
      </div>

      <DailyRewardClaim onClaim={() => claimReward()} claiming={claiming} />

      {/* ── Today's card ── */}
      <section className="flex flex-col gap-4">
        <SectionHeader eyebrow="Open for bets" title="Today's Card" to="/markets" />

        {marketsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shrink-0 basis-[320px] snap-start">
                <Skeleton variant="card" />
              </div>
            ))}
          </div>
        ) : marketsError ? (
          <p className="text-sm text-[var(--text-muted)]">
            Failed to load the board. <button className="btn-ghost btn-sm" onClick={() => window.location.reload()}>Retry</button>
          </p>
        ) : trendingMarkets.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Board is quiet right now. New markets drop at 08:00 UTC.</p>
        ) : (
          <div className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 p-4">
            <Carousel opts={{ align: 'start', loop: true }} plugins={[autoplay]} className="w-full">
              <CarouselContent className="-ml-3">
                {trendingMarkets.slice(0, 4).map((market) => (
                  <CarouselItem key={market.id} className="basis-full pl-3 md:basis-1/2 lg:basis-1/3">
                    <MarketCard market={market} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-3 size-8 rounded-[3px] border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)] max-md:hidden" />
              <CarouselNext className="-right-3 size-8 rounded-[3px] border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)] max-md:hidden" />
            </Carousel>
          </div>
        )}
      </section>

      {/* ── Active quests ── */}
      <section className="flex flex-col gap-4">
        <SectionHeader eyebrow="Earn while you play" title="Active Quests" to="/quests" />

        {dailyQuests.length > 0 || weeklyQuests.length > 0 ? (
          <div className="flex flex-col gap-2">
            {dailyQuests.slice(0, 2).map((q) => {
              const pct = q.target > 0 ? Math.min(Math.round((q.progress / q.target) * 100), 100) : 0;
              return (
                <div key={q.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{q.title}</span>
                    <span className="shrink-0 rounded-[3px] bg-[var(--accent-amber-muted)] px-1.5 py-[2px] font-heading text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-amber)]">Daily</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-[3px] w-20 overflow-hidden rounded-[2px] bg-[var(--bg-tertiary)]">
                      <div className="h-full rounded-[2px] bg-[var(--accent-amber)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="min-w-8 text-right font-mono text-xs text-[var(--text-muted)]">{q.progress}/{q.target}</span>
                  </div>
                </div>
              );
            })}
            {weeklyQuests.slice(0, 1).map((q) => {
              const pct = q.target > 0 ? Math.min(Math.round((q.progress / q.target) * 100), 100) : 0;
              return (
                <div key={q.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{q.title}</span>
                    <span className="shrink-0 rounded-[3px] bg-[var(--accent-amber-muted)] px-1.5 py-[2px] font-heading text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-amber)]">Weekly</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-[3px] w-20 overflow-hidden rounded-[2px] bg-[var(--bg-tertiary)]">
                      <div className="h-full rounded-[2px] bg-[var(--accent-amber)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="min-w-8 text-right font-mono text-xs text-[var(--text-muted)]">{q.progress}/{q.target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-dashed border-[var(--border-subtle)] px-4 py-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              No quests in progress. Check the <Link to="/quests" className="text-[var(--accent-amber)]">Quest Board</Link> to start one.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
