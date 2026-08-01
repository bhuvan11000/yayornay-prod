import { PlayerRow } from './PlayerRow';
import { Podium } from './Podium';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from '../ui/table';

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
      <div className="flex items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-12">
        <p className="text-muted text-sm">No ranked players yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
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
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-[color,border-color] duration-150 enabled:hover:border-[var(--accent-blue)] enabled:hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40 max-sm:px-3 max-sm:text-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>

          <div className="flex gap-1">
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
                    className={`h-8 w-8 cursor-pointer rounded-[var(--radius-md)] border border-transparent bg-transparent text-sm font-medium text-[var(--text-secondary)] transition-[color,border-color,background-color] duration-150 hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)] ${p === page ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-muted)] font-semibold text-[var(--accent-blue)]' : ''}`}
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </button>
                );
              });
            })()}
          </div>

          <button
            className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-[color,border-color] duration-150 enabled:hover:border-[var(--accent-blue)] enabled:hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40 max-sm:px-3 max-sm:text-xs"
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
