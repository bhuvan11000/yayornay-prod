/**
 * ParticipantActivity
 *
 * Displays the latest 3 bets placed on a market.
 * Receives `activities` array from useMarket's recentActivity field.
 */

/**
 * Returns a compact relative time string (e.g. "2h ago", "just now").
 * @param {string} isoDate
 * @returns {string}
 */
function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ParticipantActivity({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">No activity yet. Be the first to predict!</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {activities.map((item) => {
        const isYes = item.position === 'yes';
        const name = item.user?.username || 'Anonymous';
        const shares = Math.round(item.shares);

        return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-[var(--radius-xs)] bg-[var(--bg-tertiary)] px-3 py-2.5"
          >
            {/* Position badge */}
            <span
              className="shrink-0 rounded-[var(--radius-xs)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
              style={{
                background: isYes
                  ? 'color-mix(in srgb, var(--color-yes) 15%, transparent)'
                  : 'color-mix(in srgb, var(--color-no) 15%, transparent)',
                color: isYes ? 'var(--color-yes)' : 'var(--color-no)',
              }}
            >
              {isYes ? 'YES' : 'NO'}
            </span>

            {/* Name + shares */}
            <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">
              <span className="font-medium">{name}</span>
              <span className="text-[var(--text-muted)]"> · {shares} {shares === 1 ? 'share' : 'shares'}</span>
            </span>

            {/* Timestamp */}
            <span className="shrink-0 text-xs text-[var(--text-muted)]">{timeAgo(item.created_at)}</span>
          </li>
        );
      })}
    </ul>
  );
}
