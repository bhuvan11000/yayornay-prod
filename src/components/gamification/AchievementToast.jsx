import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Target, Flame, Layers, TrendingDown, Fish, Sunrise, Sigma, Eye, Store, TrendingUp, BadgeCheck, Star, Calendar } from 'lucide-react';
import { formatCoins } from '../../lib/format';
import styles from './AchievementToast.module.css';

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
          className={styles.toast}
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          role="alert"
        >
          <div className={styles.accentBar} />
          <div className={styles.iconWrapper}>
            <IconComponent size={24} />
          </div>
          <div className={styles.body}>
            <span className={styles.header}>Achievement Unlocked!</span>
            <span className={styles.title}>{achievement.title}</span>
            <div className={styles.rewards}>
              <span className={styles.xpReward}>+{achievement.xp_reward} XP</span>
              <span className={styles.coinReward}>+{formatCoins(achievement.coin_reward)} coins</span>
            </div>
          </div>
          <button className={styles.dismiss} onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onDismiss, 300); }} aria-label="Dismiss">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
