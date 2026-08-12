import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { getRankColor, RANK_THRESHOLDS } from '../../lib/ranks';
import { Button } from '../ui/Button';
import Particles from '../reactbits/Particles/Particles';
import DecryptedText from '../reactbits/DecryptedText/DecryptedText';

function RankName({ rank, gradient, className }) {
  if (gradient) {
    return (
      <span
        className={className}
        style={{
          background: gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className={className} style={{ color: getRankColor(rank) }}>
      {rank}
    </span>
  );
}

export function RankUpModal() {
  const { showRankUpModal, rankUpData, hideRankUpModal } = useUIStore();

  const handleDismiss = () => {
    hideRankUpModal();
  };

  const newRankColor = rankUpData ? getRankColor(rankUpData.newRank) : '';
  const newRankIsGradient = newRankColor.startsWith('linear-gradient');

  const rankIndex = rankUpData
    ? RANK_THRESHOLDS.findIndex(r => r.name === rankUpData.newRank)
    : -1;
  const nextRank = rankIndex >= 0 && rankIndex < RANK_THRESHOLDS.length - 1
    ? RANK_THRESHOLDS[rankIndex + 1]
    : null;

  return createPortal(
    <AnimatePresence>
      {showRankUpModal && rankUpData && (
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
              particleColors={['#f5a524', '#fbbf24', '#f59e0b', '#e9f0ea']}
              alphaParticles
              particleBaseSize={60}
              sizeRandomness={1}
              className="h-full w-full"
            />
          </div>

          <motion.div
            className="rankup-card relative flex max-h-[90vh] w-[90%] max-w-[420px] flex-col items-center gap-6 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onClick={e => e.stopPropagation()}
          >
            <DecryptedText
              text="RANK UP!"
              speed={80}
              animateOn="view"
              className="rankup-title"
              encryptedClassName="opacity-40"
              parentClassName="block"
            />

            <div className="relative z-10 flex w-full flex-col items-center gap-3">
              <span className="rankup-tag">
                <Trophy size={14} className="shrink-0" />
                New rank achieved
              </span>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <RankName
                  rank={rankUpData.oldRank}
                  className="rankup-old"
                />
                <span className="rankup-arrow">&rarr;</span>
                <RankName
                  rank={rankUpData.newRank}
                  gradient={newRankIsGradient ? newRankColor : null}
                  className="rankup-new"
                />
              </div>
            </div>

            {nextRank && (
              <div className="relative z-10 flex w-full flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                  Next Milestone
                </p>
                <p className="text-sm text-[var(--text-primary)]">
                  <span style={{ color: getRankColor(nextRank.name) }}>{nextRank.name}</span>
                  <span className="text-[var(--text-muted)]">
                    {' '}
                    at {nextRank.minCoins.toLocaleString()} coins
                  </span>
                </p>
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
