import { useEffect, useState } from 'react';
import DecryptedText from '../reactbits/DecryptedText/DecryptedText';

const statusColors = {
  open: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
  closed: { bg: 'rgba(92, 99, 112, 0.15)', color: '#5c6370' },
  resolving: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  resolved: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  review: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  pending: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  rejected: { bg: 'rgba(92, 99, 112, 0.15)', color: '#5c6370' },
};

export function MarketStatus({ status }) {
  const colors = statusColors[status] || statusColors.pending;

  if (status === 'resolved') {
    return (
      <span
        className="inline-flex items-center rounded-[var(--radius-full)] px-[10px] py-[3px] text-xs font-semibold capitalize whitespace-nowrap"
        style={{ background: colors.bg, color: colors.color }}
      >
        <DecryptedText
          text="resolved"
          speed={60}
          animateOn="view"
          className="text-xs font-semibold capitalize"
          encryptedClassName="text-xs font-semibold capitalize"
        />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-[var(--radius-full)] px-[10px] py-[3px] text-xs font-semibold capitalize whitespace-nowrap"
      style={{ background: colors.bg, color: colors.color }}
    >
      {status}
    </span>
  );
}
