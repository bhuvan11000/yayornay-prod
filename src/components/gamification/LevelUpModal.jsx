import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { getUnlockedFeatures } from '../../lib/levels';
import styles from './LevelUpModal.module.css';

export function LevelUpModal() {
  const { showLevelUpModal, levelUpData, hideLevelUpModal } = useUIStore();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (showLevelUpModal && levelUpData) {
      const p = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: 4 + Math.random() * 6,
        color: ['#f59e0b', '#4f7df5', '#22c55e', '#a855f7', '#ef4444'][i % 5],
      }));
      setParticles(p);
    }
  }, [showLevelUpModal, levelUpData]);

  if (!showLevelUpModal || !levelUpData) return null;

  const { oldLevel, newLevel, unlocks } = levelUpData;
  const newUnlocks = getUnlockedFeatures(newLevel).filter(
    f => !getUnlockedFeatures(oldLevel).includes(f)
  );

  const handleDismiss = () => {
    hideLevelUpModal();
  };

  return createPortal(
    <AnimatePresence>
      {showLevelUpModal && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleDismiss}
        >
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.particles}>
              {particles.map(p => (
                <span
                  key={p.id}
                  className={styles.particle}
                  style={{
                    left: `${p.x}%`,
                    animationDelay: `${p.delay}s`,
                    width: p.size,
                    height: p.size,
                    background: p.color,
                    '--drift': `${(Math.random() - 0.5) * 80}px`,
                  }}
                />
              ))}
            </div>

            <h1 className={styles.title}>LEVEL UP!</h1>

            <div className={styles.levelRow}>
              <span className={styles.oldLevel}>Lv.{oldLevel}</span>
              <span className={styles.arrow}>&rarr;</span>
              <span className={styles.newLevel}>Lv.{newLevel}</span>
            </div>

            {newUnlocks.length > 0 && (
              <div className={styles.unlocks}>
                <p className={styles.unlockTitle}>New Unlocks</p>
                {newUnlocks.map((feature, i) => (
                  <div key={i} className={styles.unlockItem}>
                    <CheckCircle size={16} className={styles.unlockIcon} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}

            <button className={styles.continue} onClick={handleDismiss}>
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.getElementById('modal-root') || document.body
  );
}
