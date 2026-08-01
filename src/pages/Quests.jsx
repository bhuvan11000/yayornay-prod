import { RefreshCw, CheckCircle } from 'lucide-react';
import { useQuests } from '../hooks/useQuests';
import { QuestCard } from '../components/gamification/QuestCard';
import { Skeleton } from '../components/ui/Skeleton';
import { formatTimeRemaining } from '../lib/format';

export default function Quests() {
  const { data, isLoading, isError } = useQuests();

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 p-4 md:p-6">
        <Skeleton variant="rect" width="200px" height="32px" />
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" width="160px" height="20px" />
          <Skeleton variant="rect" />
          <Skeleton variant="rect" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 p-4 md:p-6">
        <h1 className="text-2xl font-heading">Quest Board</h1>
        <p className="text-muted">Failed to load quests.</p>
      </div>
    );
  }

  const daily = data?.daily || [];
  const weekly = data?.weekly || [];
  const completed = data?.completed || [];

  // Calculate next daily/weekly reset times from active quests
  const dailyReset = daily.length > 0 ? daily[0].reset_at : null;
  const weeklyReset = weekly.length > 0 ? weekly[0].reset_at : null;

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-heading">Quest Board</h1>
        <p className="text-sm text-[var(--text-muted)]">Complete quests to earn extra XP and coins</p>
      </div>

      {/* Daily Quests */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Daily Quests</h2>
            {dailyReset && (
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <RefreshCw size={12} />
                <span>resets in {formatTimeRemaining(dailyReset)}</span>
              </div>
            )}
          </div>
          {daily.length > 0 && (
            <span className="rounded-full bg-[var(--accent-blue-muted)] px-2 py-1 text-xs font-medium text-[var(--accent-blue)]">
              {daily.filter(q => !q.completed).length} active
            </span>
          )}
        </div>

        {daily.length > 0 ? (
          <div className="flex flex-col gap-3">
            {daily.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-10">
            <CheckCircle size={32} className="text-[var(--color-yes)]" />
            <p className="text-sm text-[var(--text-muted)]">All daily quests completed!</p>
          </div>
        )}
      </section>

      {/* Weekly Quests */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Weekly Quests</h2>
            {weeklyReset && (
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <RefreshCw size={12} />
                <span>resets in {formatTimeRemaining(weeklyReset)}</span>
              </div>
            )}
          </div>
          {weekly.length > 0 && (
            <span className="rounded-full bg-[var(--accent-blue-muted)] px-2 py-1 text-xs font-medium text-[var(--accent-blue)]">
              {weekly.filter(q => !q.completed).length} active
            </span>
          )}
        </div>

        {weekly.length > 0 ? (
          <div className="flex flex-col gap-3">
            {weekly.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-10">
            <CheckCircle size={32} className="text-[var(--color-yes)]" />
            <p className="text-sm text-[var(--text-muted)]">All weekly quests completed!</p>
          </div>
        )}
      </section>

      {/* Completed History */}
      {completed.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recently Completed</h2>
          </div>
          <div className="flex flex-col gap-3">
            {completed.slice(0, 5).map((q) => (
              <QuestCard key={`${q.id}-completed`} quest={q} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
