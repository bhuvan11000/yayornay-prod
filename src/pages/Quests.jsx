import { RefreshCw, CheckCircle } from 'lucide-react';
import { useQuests } from '../hooks/useQuests';
import { QuestCard } from '../components/gamification/QuestCard';
import { Skeleton } from '../components/ui/Skeleton';
import { formatTimeRemaining } from '../lib/format';
import styles from './Quests.module.css';

export default function Quests() {
  const { data, isLoading, isError } = useQuests();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton variant="rect" width="200px" height="32px" />
        <div className={styles.section}>
          <Skeleton variant="rect" width="160px" height="20px" />
          <Skeleton variant="rect" />
          <Skeleton variant="rect" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.page}>
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
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className="text-2xl font-heading">Quest Board</h1>
        <p className={styles.subtitle}>Complete quests to earn extra XP and coins</p>
      </div>

      {/* Daily Quests */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>Daily Quests</h2>
            {dailyReset && (
              <div className={styles.timeRemaining}>
                <RefreshCw size={12} />
                <span>resets in {formatTimeRemaining(dailyReset)}</span>
              </div>
            )}
          </div>
          {daily.length > 0 && (
            <span className={styles.activeCount}>
              {daily.filter(q => !q.completed).length} active
            </span>
          )}
        </div>

        {daily.length > 0 ? (
          <div className={styles.questList}>
            {daily.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <CheckCircle size={32} className={styles.emptyIcon} />
            <p className={styles.emptyText}>All daily quests completed!</p>
          </div>
        )}
      </section>

      {/* Weekly Quests */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>Weekly Quests</h2>
            {weeklyReset && (
              <div className={styles.timeRemaining}>
                <RefreshCw size={12} />
                <span>resets in {formatTimeRemaining(weeklyReset)}</span>
              </div>
            )}
          </div>
          {weekly.length > 0 && (
            <span className={styles.activeCount}>
              {weekly.filter(q => !q.completed).length} active
            </span>
          )}
        </div>

        {weekly.length > 0 ? (
          <div className={styles.questList}>
            {weekly.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <CheckCircle size={32} className={styles.emptyIcon} />
            <p className={styles.emptyText}>All weekly quests completed!</p>
          </div>
        )}
      </section>

      {/* Completed History */}
      {completed.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recently Completed</h2>
          </div>
          <div className={styles.questList}>
            {completed.slice(0, 5).map((q) => (
              <QuestCard key={`${q.id}-completed`} quest={q} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
