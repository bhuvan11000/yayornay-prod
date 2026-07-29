import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/uiStore';

export function LevelUpModal() {
  const showLevelUpModal = useUIStore((s) => s.showLevelUpModal);
  const levelUpData = useUIStore((s) => s.levelUpData);
  const hideLevelUpModal = useUIStore((s) => s.hideLevelUpModal);

  console.log('[LevelUpModal] render', { showLevelUpModal, levelUpData });

  if (!showLevelUpModal || !levelUpData) return null;

  console.log('[LevelUpModal] RENDERING PORTAL');

  const { oldLevel, newLevel } = levelUpData;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={hideLevelUpModal}
    >
      <div
        style={{
          background: '#1a1a2e',
          border: '2px solid #f59e0b',
          borderRadius: 16,
          padding: 48,
          maxWidth: 420,
          width: '90%',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h1 style={{ color: '#f59e0b', fontSize: 32, fontWeight: 800, margin: 0 }}>
          LEVEL UP!
        </h1>
        <p style={{ color: '#fff', fontSize: 24, margin: '16px 0' }}>
          Lv.{oldLevel} → Lv.{newLevel}
        </p>
        <button
          onClick={hideLevelUpModal}
          style={{
            background: '#4f7df5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          Continue
        </button>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
