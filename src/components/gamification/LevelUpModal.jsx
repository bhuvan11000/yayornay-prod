import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { getUnlockedFeatures } from '../../lib/levels';
import { Button } from '../ui/Button';
import Particles from '../reactbits/Particles/Particles';
import DecryptedText from '../reactbits/DecryptedText/DecryptedText';
import CountUp from '../reactbits/CountUp/CountUp';

export function LevelUpModal() {
  const { showLevelUpModal, levelUpData, hideLevelUpModal } = useUIStore();

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
          className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center overflow-hidden bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleDismiss}
        >
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <Particles
              particleCount={30}
              particleSpread={12}
              speed={0.4}
              particleColors={['#f5a524', '#ef4444', '#22c55e', '#e9f0ea']}
              alphaParticles
              particleBaseSize={60}
              sizeRandomness={1}
              className="h-full w-full"
            />
          </div>

          <motion.div
            className="levelup-card relative flex max-h-[90vh] w-[90%] max-w-[420px] flex-col items-center gap-6 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onClick={e => e.stopPropagation()}
          >
            <DecryptedText
              text="LEVEL UP!"
              speed={80}
              animateOn="view"
              className="levelup-title"
              encryptedClassName="opacity-40"
              parentClassName="block"
            />

            <div className="relative z-10 flex items-center gap-4">
              <span className="levelup-old">Lv.{oldLevel}</span>
              <span className="levelup-arrow">&rarr;</span>
              <CountUp
                to={newLevel}
                from={oldLevel}
                duration={1.2}
                className="levelup-new"
              />
            </div>

            {newUnlocks.length > 0 && (
              <div className="relative z-10 flex w-full flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                  New Unlocks
                </p>
                {newUnlocks.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <CheckCircle size={16} className="shrink-0 text-[var(--color-yes)]" />
                    <span className="text-left">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            <Button variant="primary" onClick={handleDismiss} className="px-8">
              Continue
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.getElementById('modal-root') || document.body
  );
}
