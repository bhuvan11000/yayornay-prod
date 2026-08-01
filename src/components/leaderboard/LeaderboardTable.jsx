import { PlayerRow } from './PlayerRow';
import { Podium } from './Podium';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from '../ui/table';
import styles from './LeaderboardTable.module.css';

const COLUMN_HEADERS = {
  coins: ['Coins'],
  accuracy: ['Accuracy', 'Bets'],
  profit: ['Net Profit'],
  streak: ['Streak', 'Longest'],
};

const PAGE_SIZE = 50;

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
      {page === 1 && <Podium players={players} metric={metric} />}
      <Table className="border-[var(--border-subtle)] text-[var(--text-primary)]">
        <TableHeader>
          <TableRow className="border-[var(--border-subtle)] hover:bg-transparent">
            <TableHead className="text-[var(--text-muted)]">#</TableHead>
            <TableHead className="text-[var(--text-muted)]">Player</TableHead>
            <TableHead className="text-[var(--text-muted)]">Rank</TableHead>
            {COLUMN_HEADERS[metric].map((h) => (
              <TableHead key={h} className="text-right text-[var(--text-muted)]">
                {h}
              </TableHead>
            ))}
            <TableHead className="text-right text-[var(--text-muted)]">Lv.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, i) => (
            <PlayerRow
              key={player.id}
              player={player}
              rank={(page - 1) * PAGE_SIZE + i + 1}
              metric={metric}
              isCurrentUser={player.id === currentUserId}
            />
          ))}
        </TableBody>
      </Table>

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
            {(() => {
              const maxVisible = Math.min(totalPages, 5);
              const half = Math.floor(maxVisible / 2);
              let start = page - half;
              if (start < 1) start = 1;
              if (start + maxVisible - 1 > totalPages) start = totalPages - maxVisible + 1;
              return Array.from({ length: maxVisible }, (_, i) => {
                const p = start + i;
                return (
                  <button
                    key={p}
                    className={`${styles.pageNum} ${p === page ? styles.activePage : ''}`}
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </button>
                );
              });
            })()}
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