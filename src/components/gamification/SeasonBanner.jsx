import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trophy, TrendingUp } from 'lucide-react';
import { useSeasons } from '../../hooks/useSeasons';
import { getRankColor } from '../../lib/ranks';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../config/supabase';
import ShinyText from '../reactbits/ShinyText/ShinyText';
import styles from './SeasonBanner.module.css';

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
          className={styles.newSeasonBanner}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          key="new-season"
        >
          <TrendingUp size={18} className={styles.newSeasonIcon} />
          <span className={styles.newSeasonText}>
            Season {season.season_number} has begun!
          </span>
        </motion.div>
      ) : (
        <motion.div
          className={`${styles.banner} ${styles[urgency]}`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          key="season-banner"
        >
          <div className={styles.left}>
            <Calendar size={14} className={styles.icon} />
            <ShinyText
              text={`Season ${season.season_number}`}
              speed={3}
              className={styles.title}
              color="#9aa0b0"
              shineColor="#ffffff"
            />
            <span className={styles.countdown}>
              {remainingDays > 0
                ? `${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`
                : 'Final day!'}
            </span>
            {remainingDays <= 7 && (
              <span className={styles.endingBadge}>
                Ending Soon
              </span>
            )}
          </div>
          <div className={styles.right}>
            {topPlayers.length > 0 && (
              <div className={styles.topPlayers}>
                <Trophy size={12} className={styles.trophyIcon} />
                {topPlayers.map((p, i) => (
                  <span key={p.id} className={styles.topPlayerName}>
                    {i === 0 && <span className={styles.goldDot} />}
                    {p.username}
                  </span>
                ))}
              </div>
            )}
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${styles[urgency]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
