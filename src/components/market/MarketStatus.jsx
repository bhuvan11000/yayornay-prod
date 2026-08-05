import { useEffect, useState } from 'react';
import DecryptedText from '../reactbits/DecryptedText/DecryptedText';

const statusColors = {
  open: { bg: 'rgba(34, 197, 94, 0.13)', color: '#22c55e' },
  closed: { bg: 'rgba(126, 140, 129, 0.12)', color: '#7e8c81' },
  resolving: { bg: 'rgba(125, 162, 232, 0.13)', color: '#7da2e8' },
  resolved: { bg: 'rgba(125, 162, 232, 0.13)', color: '#7da2e8' },
  review: { bg: 'rgba(245, 165, 36, 0.13)', color: '#f5a524' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.13)', color: '#ef4444' },
  pending: { bg: 'rgba(245, 165, 36, 0.13)', color: '#f5a524' },
  rejected: { bg: 'rgba(126, 140, 129, 0.12)', color: '#7e8c81' },
};

const STATUS_LABELS = {
  open: 'open',
  closed: 'closed',
  resolving: 'resolving',
  resolved: 'resolved',
  review: 'under review',
  cancelled: 'cancelled',
  pending: 'pending',
  rejected: 'rejected',
};

export function MarketStatus({ status }) {
  const colors = statusColors[status] || statusColors.pending;
  const label = STATUS_LABELS[status] || status;

  const cls =
    'inline-flex items-center rounded-[3px] px-2 py-[3px] font-heading text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap';

  if (status === 'resolved') {
    return (
      <span className={cls} style={{ background: colors.bg, color: colors.color }}>
        <DecryptedText
          text={label}
          speed={60}
          animateOn="view"
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          encryptedClassName="text-[11px] font-semibold uppercase tracking-[0.08em]"
        />
      </span>
    );
  }

  return (
    <span className={cls} style={{ background: colors.bg, color: colors.color }}>
      {label}
    </span>
  );
}
