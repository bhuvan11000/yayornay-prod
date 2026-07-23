import styles from './Leaderboard.module.css';

/**
 * Leaderboard — Global player rankings.
 * Tabs: Coins, Accuracy, Profit, Streak. Time filters available.
 */
export default function Leaderboard() {
  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Leaderboard</h1>
      <p className="text-muted">Player rankings — coming soon</p>
    </div>
  );
}
