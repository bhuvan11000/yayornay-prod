import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Target, Flame, Layers, TrendingDown, Fish, Sunrise, Sigma, Eye, Store, TrendingUp, BadgeCheck, Star, Calendar } from 'lucide-react';
import { formatCoins } from '../../lib/format';
import ShinyText from '../reactbits/ShinyText/ShinyText';
import StarBorder from '../reactbits/StarBorder/StarBorder';

const iconMap = {
  target: Target,
  flame: Flame,
  layers: Layers,
  'trend-down': TrendingDown,
  'fish-symbol': Fish,
  sunrise: Sunrise,
  sigma: Sigma,
  eye: Eye,
  store: Store,
  'trending-up': TrendingUp,
  'badge-check': BadgeCheck,
  star: Star,
  calendar: Calendar,
};

export function AchievementToast({ achievement, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const IconComponent = iconMap[achievement.icon] || Trophy;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          role="alert"
        >
          <StarBorder
            as="div"
            color="#22c55e"
            speed="5s"
            thickness={2}
            className="rounded-[var(--radius-lg)]"
            contentClassName="flex items-start gap-3 rounded-[calc(var(--radius-lg)-2px)] bg-[var(--bg-elevated)] p-4 shadow-lg"
          >
            <div className="flex min-w-[300px] items-start gap-3">
              <div className="achievement-icon-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.15)] text-[var(--color-yes)]">
                <IconComponent size={24} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <ShinyText
                  text="Achievement Unlocked!"
                  speed={2}
                  className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-yes)]"
                  color="#22c55e"
                  shineColor="#a7f3d0"
                />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {achievement.title}
                </span>
                <div className="mt-1 flex gap-2">
                  <span className="font-mono text-xs font-semibold text-[var(--rank-visionary)]">
                    +{achievement.xp_reward} XP
                  </span>
                  <span className="font-mono text-xs font-semibold text-[var(--color-warning)]">
                    +{formatCoins(achievement.coin_reward)} coins
                  </span>
                </div>
              </div>
              <button
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-all hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onDismiss, 300); }}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </StarBorder>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
