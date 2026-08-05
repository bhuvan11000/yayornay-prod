import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trophy, TrendingUp } from 'lucide-react';
import { useSeasons } from '../../hooks/useSeasons';
import { getRankColor } from '../../lib/ranks';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../config/supabase';
import ShinyText from '../reactbits/ShinyText/ShinyText';

const BANNER_CLASSES = {
  normal: 'border-[var(--border-subtle)] bg-[var(--bg-secondary)]',
  warning: 'season-banner-warning',
  critical: 'season-banner-critical',
};

const COUNTDOWN_CLASSES = {
  normal: 'text-[var(--text-muted)]',
  warning: 'text-[var(--color-warning)]',
  critical: 'text-[var(--color-no)]',
};

const FILL_CLASSES = {
  normal: 'bg-[var(--accent-amber)]',
  warning: 'bg-[var(--color-warning)]',
  critical: 'bg-[var(--color-no)]',
};

export function SeasonBanner() {
  const { data: season, isLoading, isError } = useSeasons();
  const user = useAuthStore((s) => s.user);
  const [topPlayers, setTopPlayers] = useState([]);
  const [showNewSeason, setShowNewSeason] = useState(false);

  useEffect(() => {
    if (!season) return;
    const isNew = Date.now() - new Date(season.starts_at).getTime() < 60000;
    if (isNew) {
      setShowNewSeason(true);
      const timer = setTimeout(() => setShowNewSeason(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [season]);

  useEffect(() => {
    if (!season) return;
    supabase
      .from('users')
      .select('username, coins, rank')
      .gte('coins', 2500)
      .order('coins', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setTopPlayers(data);
      });
  }, [season]);

  if (isLoading || isError || !season) return null;

  const now = new Date();
  const start = new Date(season.starts_at);
  const end = new Date(season.ends_at);
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const pct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  const urgency = remainingDays <= 1 ? 'critical' : remainingDays <= 7 ? 'warning' : 'normal';

  return (
    <AnimatePresence>
      {showNewSeason ? (
        <motion.div
          className="season-banner-new flex items-center justify-center gap-3 rounded-[var(--radius-sm)] border border-[var(--accent-amber)] px-4 py-4 text-sm font-semibold"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          key="new-season"
        >
          <TrendingUp size={18} className="text-[var(--accent-amber)]" />
          <span className="text-[var(--text-primary)]">
            Season {season.season_number} has begun!
          </span>
        </motion.div>
      ) : (
        <motion.div
          className={`flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-sm max-md:flex-col max-md:items-start max-md:gap-2 ${BANNER_CLASSES[urgency]}`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          key="season-banner"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Calendar size={14} className="shrink-0 text-[var(--accent-amber)]" />
            <ShinyText
              text={`Season ${season.season_number}`}
              speed={3}
              className="font-semibold whitespace-nowrap text-[var(--text-primary)]"
              color="#9aa0b0"
              shineColor="#ffffff"
            />
            <span className={`whitespace-nowrap ${COUNTDOWN_CLASSES[urgency]}`}>
              {remainingDays > 0
                ? `${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`
                : 'Final day!'}
            </span>
            {remainingDays <= 7 && (
              <span className="whitespace-nowrap rounded-[3px] bg-[rgba(239,68,68,0.15)] px-2 py-[1px] font-heading text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-no)]">
                Ending Soon
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 max-md:w-full max-md:justify-between">
            {topPlayers.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                <Trophy size={12} className="shrink-0 text-[var(--color-warning)]" />
                {topPlayers.map((p, i) => (
                  <span key={p.id} className="flex items-center gap-0.5">
                    {i === 0 && <span className="inline-block size-1.5 rounded-[2px] bg-[var(--color-warning)]" />}
                    {p.username}
                  </span>
                ))}
              </div>
            )}
            <div className="h-1 w-20 max-md:w-[60px] overflow-hidden rounded-[2px] bg-[var(--bg-tertiary)]">
              <div
                className={`h-full rounded-[2px] transition-[width] duration-500 ease ${FILL_CLASSES[urgency]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
