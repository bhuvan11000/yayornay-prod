import { PlayerRow } from './PlayerRow';
import styles from './LeaderboardTable.module.css';

const COLUMN_HEADERS = {
  coins: ['#', 'Player', 'Rank', 'Coins'],
  accuracy: ['#', 'Player', 'Rank', 'Accuracy', 'Bets'],
  profit: ['#', 'Player', 'Rank', 'Net Profit'],
  streak: ['#', 'Player', 'Rank', 'Streak', 'Longest'],
};

export function LeaderboardTable({ players, metric, currentUserId, page, totalPages, onPageChange }) {
  if (!players || players.length === 0) {
    return (
      <div className={styles.empty}>
        <p className="text-muted text-sm">No ranked players yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className={styles.table}>
      {players.map((player, i) => (
        <PlayerRow
          key={player.id}
          player={player}
          rank={page > 1 ? (page - 1) * players.length + i + 1 : i + 1}
          metric={metric}
          isCurrentUser={player.id === currentUserId}
        />
      ))}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>

          <div className={styles.pageInfo}>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  className={`${styles.pageNum} ${p === page ? styles.activePage : ''}`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}