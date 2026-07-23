import styles from './Quests.module.css';

/**
 * Quests — Daily and weekly quest board with progress bars.
 */
export default function Quests() {
  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Quest Board</h1>
      <p className="text-muted">Daily and weekly quests with progress — coming soon</p>
    </div>
  );
}
